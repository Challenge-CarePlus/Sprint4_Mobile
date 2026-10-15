// Em produção (Vercel), o back-end mora num host com HTTPS e sem porta
// custom (ex.: Render) — não dá pra representar isso com IP+porta. Quando
// EXPO_PUBLIC_API_BASE_URL existir, ele tem prioridade; sem ele, cai no
// esquema antigo (emulador Android / LAN em dev local).
const API_BASE_URL_OVERRIDE = process.env.EXPO_PUBLIC_API_BASE_URL;

const API_IP = process.env.EXPO_PUBLIC_API_IP ?? "10.0.2.2";
const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? "3000";

export const API_BASE_URL = API_BASE_URL_OVERRIDE ?? `http://${API_IP}:${API_PORT}`;