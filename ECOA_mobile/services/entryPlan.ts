/** E-mails conhecidos (seed do backend, SPEC v3): decidem se "senha errada" é erro ou segue como anônimo. */
export const ADMIN_EMAIL = "ecoafono@email.com";

export const MOCK_PATIENT_EMAILS = [
    "ana.lima@ecoa.test",
    "pedro.souza@ecoa.test",
    "mariana.costa@ecoa.test",
    "lucas.almeida@ecoa.test",
    "juliana.rocha@ecoa.test",
    "antonio.ferreira@ecoa.test",
    "helena.martins@ecoa.test",
    "jose.pereira@ecoa.test",
];

export const ADMIN_PASSWORD_REQUIRED_MESSAGE = "Digite a senha de administrador para entrar no painel.";
export const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos";

export type EntryPlan =
    | { kind: "guest" }
    | { kind: "error"; message: string }
    | { kind: "login"; email: string; password: string };

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function isKnownEmail(email: string): boolean {
    const normalized = normalizeEmail(email);
    return normalized === ADMIN_EMAIL || MOCK_PATIENT_EMAILS.includes(normalized);
}

/**
 * O que a tela de entrada faz com o que foi digitado (comportamento do protótipo):
 * vazio → paciente anônimo; e-mail do admin sem senha → erro; sem senha → anônimo;
 * com e-mail e senha → tenta o login no back-end.
 */
export function planEntry(email: string, password: string): EntryPlan {
    const normalized = normalizeEmail(email);

    if (!normalized) {
        return { kind: "guest" };
    }

    if (normalized === ADMIN_EMAIL && !password) {
        return { kind: "error", message: ADMIN_PASSWORD_REQUIRED_MESSAGE };
    }

    if (!password) {
        return { kind: "guest" };
    }

    return { kind: "login", email: normalized, password };
}
