// A senha do administrador NUNCA fica no repositório: vem de ADMIN_PASSWORD
// (no Render, definida pela usuária no painel — sync:false no render.yaml).
// Mesmo padrão do JWT_SECRET: em produção sem a variável o servidor não sobe.
//
// Fora de produção, sem a variável, vale um valor de desenvolvimento — diferente
// da senha dos pacientes mockados (que é pública e sem privilégio) e que NÃO
// serve pra nada além do dev local.
//
// A senha informada também é recusada se for fraca ou pública (weakPasswordReason).
// As mensagens explicam o motivo e nunca imprimem o valor.
const DEV_ONLY = "ecoa-admin-dev";
const PATIENT_PASSWORD = "ecoa2026"; // pública (README, docs): jamais pode abrir o admin

const MIN_LENGTH_PRODUCTION = 12;
const MIN_LENGTH_DEV = 8;

// Senhas fracas óbvias (comparação sem diferenciar maiúsculas de minúsculas).
const WEAK = new Set(
    [
        "senha123",
        "senha1234",
        "admin123",
        "administrador",
        "password",
        "password123",
        "12345678",
        "qwerty123",
        "abc12345",
        "mudar123",
        "ecoafono",
        "ecoafono123",
        "ecoa1234",
        "careplus",
        "careplus123",
    ].map((s) => s.toLowerCase())
);

/** Motivo (sem o valor) pelo qual a senha não serve como ADMIN_PASSWORD; null se serve. */
export function weakPasswordReason(password: string, production: boolean): string | null {
    const lower = password.toLowerCase();

    if (lower === PATIENT_PASSWORD) return "é igual à senha dos pacientes mockados, que é pública";
    if (lower === DEV_ONLY) return "é igual ao valor de desenvolvimento, que está no código";
    if (WEAK.has(lower)) return "está na lista de senhas fracas óbvias";
    if (lower.includes(PATIENT_PASSWORD)) return "contém a senha dos pacientes mockados, que é pública";
    if (/^\d+$/.test(password)) return "tem só números";
    if (new Set(password).size === 1) return "repete um único caractere";

    const min = production ? MIN_LENGTH_PRODUCTION : MIN_LENGTH_DEV;
    if (password.length < min) {
        return `tem menos de ${min} caracteres (mínimo ${production ? "em produção" : "fora de produção"})`;
    }
    return null;
}

const production = process.env.NODE_ENV === "production";
const fromEnv = process.env.ADMIN_PASSWORD;

// MODO DEMONSTRAÇÃO (protótipo apresentado em evento): só o valor exato "true" liga. Aceita senha
// fraca/pública (inclusive ecoa2026), mantendo o mínimo de 8 caracteres. Desligado por padrão.
// O estado só aparece no log de boot (nunca em /health, pra não anunciar a quem ataca que a senha pode ser fraca).
export const DEMO_MODE = process.env.ALLOW_WEAK_ADMIN_PASSWORD === "true";

if (production && !fromEnv) {
    throw new Error("ADMIN_PASSWORD não definida (obrigatória em produção)");
}
if (fromEnv !== undefined) {
    const reason = DEMO_MODE
        ? fromEnv.length < MIN_LENGTH_DEV ? `tem menos de ${MIN_LENGTH_DEV} caracteres` : null
        : weakPasswordReason(fromEnv, production);
    if (reason) {
        throw new Error(`ADMIN_PASSWORD recusada: ${reason}. Defina uma senha forte (veja docs/v3/INFRA.md).`);
    }
}

if (DEMO_MODE) {
    console.warn(
        "[AVISO] MODO DEMONSTRACAO: senha de administrador fraca/publica permitida — nao use com dados reais. " +
            "Desligue ALLOW_WEAK_ADMIN_PASSWORD e troque ADMIN_PASSWORD depois do evento."
    );
}

export const ADMIN_PASSWORD = fromEnv ?? DEV_ONLY;
