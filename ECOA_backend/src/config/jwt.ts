// Antes duplicado como uma string fixa em authRouter.ts e middleware/auth.ts
// — qualquer um com acesso ao repo conseguia forjar um token válido. Agora
// vem de env var (JWT_SECRET, configurado no painel do Render em produção);
// o valor antigo continua como fallback só pra não quebrar quem já rodava
// localmente sem configurar nada.
export const JWT_SECRET = process.env.JWT_SECRET ?? "ecoafono_secret";
