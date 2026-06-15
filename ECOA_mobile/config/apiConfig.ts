const API_IP = process.env.EXPO_PUBLIC_API_IP ?? "10.0.2.2";
const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? "3000";

export const API_BASE_URL = `http://${API_IP}:${API_PORT}`;

export const WS_EXERCISE_URL = `ws://${API_IP}:${API_PORT}/exercise`;