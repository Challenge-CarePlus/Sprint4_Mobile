import path from "path";

// Resolvidos a cada chamada (e não no import) pra os testes poderem apontar
// cada suíte pra uma pasta temporária mudando só a env var.
// Relativos a este arquivo: "../.." sobe de src/config ou dist/config até a
// raiz do ECOA_backend, então dev (ts-node) e build (dist) usam as mesmas pastas.
const ROOT = path.resolve(__dirname, "../..");

/** Pasta dos JSON de dados (usuários, treinos). Fora do git. */
export const dataDir = () => process.env.DATA_DIR ?? path.join(ROOT, "data");

/** Arquivo de usuários; USERS_DB_PATH existe só por compatibilidade com scripts antigos. */
export const usersFile = () => process.env.USERS_DB_PATH ?? path.join(dataDir(), "users.json");

export const trainingsFile = () => path.join(dataDir(), "trainings.json");

/** Pasta dos vídeos enviados pelo admin. Fora do git. */
export const uploadsDir = () => process.env.UPLOADS_DIR ?? path.join(ROOT, "uploads");
