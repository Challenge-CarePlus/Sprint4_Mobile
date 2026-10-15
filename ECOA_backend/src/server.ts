import express from "express";
import cors from "cors";

import authRouter from "./routes/authRouter";

const app = express();

// Sem CORS_ORIGIN definido, aceita qualquer origem (como antes). Em
// produção, configura com as URLs do front-end hospedado — aceita mais de
// uma separada por vírgula, porque a Vercel gera várias (o domínio fixo do
// projeto, a URL por branch, a URL específica de cada deployment).
const allowedOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "5mb" }));

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

// Hosts como Render atribuem a porta por env var — sem isso, o serviço
// nunca fica "healthy" (continua escutando numa porta que ninguém acessa).
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
