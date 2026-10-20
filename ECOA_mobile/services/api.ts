import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const api = axios.create({
    baseURL: API_BASE_URL,
});

export default api;

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("@token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

let onUnauthorized: (() => void) | null = null;

/** Registrado pelo AuthContext: chamado quando o backend rejeita o token (401). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? "";
    const isAuthAttempt = url.includes("/auth/login") || url.includes("/auth/register");

    // Login com senha errada também é 401, mas não é sessão expirada.
    if (error?.response?.status === 401 && !isAuthAttempt) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  }
);
