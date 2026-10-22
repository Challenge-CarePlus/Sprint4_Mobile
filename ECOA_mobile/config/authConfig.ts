/**
 * Liga/desliga o login do app. TEMPORÁRIO: com `false` (padrão) o app abre
 * direto na Home, sem Login/Cadastro e sem chamar o back-end; Login, Register,
 * AuthContext e o back-end continuam no código, dormentes. Para voltar a exigir
 * login, defina EXPO_PUBLIC_AUTH_REQUIRED=true no build (Vercel / .env).
 */
export function parseAuthRequired(value: string | undefined): boolean {
    return value?.trim().toLowerCase() === "true";
}

// O acesso literal a process.env.EXPO_PUBLIC_* é o que o Expo substitui no build.
export const AUTH_REQUIRED = parseAuthRequired(process.env.EXPO_PUBLIC_AUTH_REQUIRED);
