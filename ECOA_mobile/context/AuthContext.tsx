import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../services/api";

type LoginResponse = {
    success: boolean;
    message?: string;
};

type RegisterResponse = {
    success: boolean;
    message?: string;
};

type AuthContextData = {
    token: string | null;
    loading: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<LoginResponse>;

    register: (
        name: string,
        email: string,
        password: string
    ) => Promise<RegisterResponse>;

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

    async function register(
        name: string,
        email: string,
        password: string
    ) {
        try {
            await api.post("/auth/register", {
                name,
                email,
                password,
            });

            return {
                success: true,
            };
        } catch (error: any) {
            return {
                success: false,
                message:
                    error?.response?.data?.message ||
                    "Erro ao conectar com o servidor",
            };
        }
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

            return {
                success: true,
            };
        } catch (error: any) {
            return {
                success: false,
                message:
                    error?.response?.data?.message ||
                    "Erro ao conectar com o servidor",
            };
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
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () =>
    useContext(AuthContext);