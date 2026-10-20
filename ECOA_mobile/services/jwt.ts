/** Lê o `exp` (segundos) do payload do JWT sem verificar assinatura — só para descartar tokens vencidos/malformados no cliente. */
export function isTokenExpired(token: string): boolean {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return true;
        }

        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const json = JSON.parse(globalThis.atob(padded));

        return typeof json.exp === "number" && json.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}
