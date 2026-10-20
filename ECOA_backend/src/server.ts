import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRouter from "./routes/authRouter";

const app = express();

app.disable("x-powered-by");
// Atrás do proxy do Render, sem isso todo cliente aparece com o mesmo IP.
app.set("trust proxy", 1);

// Sem CORS_ORIGIN definido, aceita qualquer origem (como antes). Em
// produção, configura com as URLs do front-end hospedado — aceita mais de
// uma separada por vírgula, porque a Vercel gera várias (o domínio fixo do
// projeto, a URL por branch, a URL específica de cada deployment).
const allowedOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
// Cada deploy da Vercel tem uma URL própria (care-plus-<hash>-<time>.vercel.app),
// impossível de listar em CORS_ORIGIN. Além da lista, aceita as URLs de deploy
// do nosso projeto na Vercel (https, ancoradas no slug do time); outro
// padrão pode ser definido em CORS_ORIGIN_REGEX.
const vercelDeployPattern = new RegExp(
    process.env.CORS_ORIGIN_REGEX ??
        "^https://care-plus[a-z0-9-]*-isabelabarcellos0812-6004s-projects\.vercel\.app$"
);

app.use(
    cors(
        allowedOrigins?.length
            ? {
                  origin: (origin, callback) =>
                      // Sem Origin = chamada fora do navegador (curl, health check).
                      callback(
                          null,
                          !origin || allowedOrigins.includes(origin) || vercelDeployPattern.test(origin)
                      ),
              }
            : undefined
    )
);
// Só auth trafega aqui: 5mb era folga de quando o backend recebia frames.
app.use(express.json({ limit: "10kb" }));

// Limita tentativas por IP em login/cadastro (força bruta e spam de contas).
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Muitas tentativas. Tente novamente em alguns minutos." },
});
app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);

app.use("/auth", authRouter);

app.get("/", (_req, res) => {
    res.json({
        message: "ECOA Backend rodando",
    });
});

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

// Rota inexistente: JSON em vez do HTML padrão do Express.
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Rota não encontrada" });
});

// Último middleware: JSON malformado, payload grande etc. viram resposta JSON
// limpa em vez da página HTML do Express com stack trace.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    if (status === 500) {
        console.error(err);
    }
    res.status(status).json({
        success: false,
        message: status === 500 ? "Erro interno" : "Requisição inválida"
    });
});

// Hosts como Render atribuem a porta por env var — sem isso, o serviço
// nunca fica "healthy" (continua escutando numa porta que ninguém acessa).
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
