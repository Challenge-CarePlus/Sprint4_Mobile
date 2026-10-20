// Vem de env var (JWT_SECRET; o Render gera um valor aleatório via
// render.yaml). O fallback fixo só existe fora de produção, para rodar
// localmente sem configurar nada — em produção sem a variável o servidor
// não sobe, em vez de aceitar tokens forjáveis por quem lê o repositório.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não definido (obrigatório em produção)");
}

export const JWT_SECRET = process.env.JWT_SECRET ?? "ecoafono_secret_dev_only";
