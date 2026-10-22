import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRouter from "./routes/authRouter";
import trainingsRouter from "./routes/trainingsRouter";
import patientsRouter from "./routes/patientsRouter";
import { mediaRouter, uploadsRouter } from "./routes/mediaRouter";

export function createApp(options: { authRateLimit?: number } = {}) {
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
    // Cada deploy da Vercel tem uma URL própria (care-plus-<hash>-<time>.vercel.app,
    // care-plus-git-<branch>-<time>.vercel.app), impossível de listar em
    // CORS_ORIGIN. Além da lista, aceita as URLs de deploy do nosso projeto na
    // Vercel (https, ancoradas no slug do time); outro padrão pode ser definido
    // em CORS_ORIGIN_REGEX. Os pontos precisam ir escapados (\\.): sem isso o
    // "." casa qualquer caractere e um domínio de terceiros passaria no padrão.
    const vercelDeployPattern = new RegExp(
        process.env.CORS_ORIGIN_REGEX ??
            "^https://care-plus[a-z0-9-]*-isabelabarcellos0812-6004s-projects\\.vercel\\.app$"
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

    // Limita tentativas por IP em login/cadastro (força bruta e spam de contas).
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: options.authRateLimit ?? 30,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: "Muitas tentativas. Tente novamente em alguns minutos." },
    });
    app.use("/auth/login", authLimiter);
    app.use("/auth/register", authLimiter);

    // Limite de corpo por rota: auth é minúsculo; treinos carregam textos de vários
    // exercícios; o upload de vídeo não passa pelo express.json (multer tem o seu, 30 MB).
    app.use("/auth", express.json({ limit: "10kb" }), authRouter);
    app.use("/trainings", express.json({ limit: "256kb" }), trainingsRouter);
    app.use("/patients", patientsRouter);
    app.use("/uploads", uploadsRouter);
    app.use("/media", mediaRouter);

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
            message:
                status === 500 ? "Erro interno"
                : status === 413 ? "Requisição grande demais"
                : "Requisição inválida"
        });
    });

    return app;
}
