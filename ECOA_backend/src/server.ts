import express from "express";
import cors from "cors";

import authRouter from "./routes/authRouter";

const app = express();

// Sem CORS_ORIGIN definido, aceita qualquer origem (como antes) — em
// produção, configurar com a URL do front-end hospedado (ex. no painel da
// Vercel) restringe a quem pode de fato chamar a API.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
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
