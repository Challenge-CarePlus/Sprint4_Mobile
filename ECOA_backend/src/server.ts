import express from "express";
import cors from "cors";

import authRouter from "./routes/authRouter";

const app = express();

app.use(cors());
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

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
