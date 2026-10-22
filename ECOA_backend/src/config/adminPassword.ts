// A senha do administrador NUNCA fica no repositório: vem de ADMIN_PASSWORD
// (no Render, definida pela usuária no painel — sync:false no render.yaml).
// Mesmo padrão do JWT_SECRET: em produção sem a variável o servidor não sobe.
//
// Fora de produção, sem a variável, vale um valor de desenvolvimento — diferente
// da senha dos pacientes mockados (que é pública e sem privilégio) e que NÃO
// serve pra nada além do dev local.
const MIN_LENGTH = 8;
const DEV_ONLY = "ecoa-admin-dev";

const fromEnv = process.env.ADMIN_PASSWORD;

if (process.env.NODE_ENV === "production" && !fromEnv) {
    throw new Error("ADMIN_PASSWORD não definida (obrigatória em produção)");
}
if (fromEnv !== undefined && fromEnv.length < MIN_LENGTH) {
    throw new Error(`ADMIN_PASSWORD deve ter pelo menos ${MIN_LENGTH} caracteres`);
}

export const ADMIN_PASSWORD = fromEnv ?? DEV_ONLY;
