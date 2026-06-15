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