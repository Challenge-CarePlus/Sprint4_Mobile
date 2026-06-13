import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "../services/api";

type AuthContextData = {
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorage();
  }, []);

  async function loadStorage() {
    const tokenStorage =
      await AsyncStorage.getItem("@token");

    if (tokenStorage) {
      setToken(tokenStorage);
    }

    setLoading(false);
  }

  async function login(
    email: string,
    password: string
  ) {
    try {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      const token = response.data.token;

      await AsyncStorage.setItem(
        "@token",
        token
      );

      setToken(token);

      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    await AsyncStorage.removeItem("@token");
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);