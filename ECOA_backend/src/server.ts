import { createApp } from "./app";

// Hosts como Render atribuem a porta por env var — sem isso, o serviço
// nunca fica "healthy" (continua escutando numa porta que ninguém acessa).
const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, "0.0.0.0", () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
