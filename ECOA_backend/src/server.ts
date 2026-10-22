import { createApp } from "./app";
import { initUsers } from "./db/userStore";
import { startUploadsCleanup } from "./media";

// Hosts como Render atribuem a porta por env var — sem isso, o serviço
// nunca fica "healthy" (continua escutando numa porta que ninguém acessa).
const PORT = Number(process.env.PORT) || 3000;

async function main() {
    // Cria/atualiza o admin a partir de ADMIN_PASSWORD antes de aceitar tráfego.
    await initUsers();
    startUploadsCleanup();

    createApp().listen(PORT, "0.0.0.0", () => {
        console.log(`API rodando em http://localhost:${PORT}`);
    });
}

main().catch((error) => {
    console.error("Falha ao iniciar:", error);
    process.exit(1);
});
