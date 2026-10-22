import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { AUTH_REQUIRED } from "../config/authConfig";
import api, { setUnauthorizedHandler } from "../services/api";
import { INVALID_CREDENTIALS_MESSAGE, isKnownEmail, planEntry } from "../services/entryPlan";
import { isTokenExpired } from "../services/jwt";

const SESSION_KEY = "@ecoa_session";

/** guest = paciente anônimo (acesso livre); patient/admin = identificado pelo back-end. */
export type Role = "guest" | "patient" | "admin";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "patient";
};

type Session = { role: Role; user: AuthUser | null };

type LoginResponse = {
    success: boolean;
    message?: string;
    /** Papel com que a pessoa entrou (só em `enter`). */
    role?: Role;
};

type RegisterResponse = {
    success: boolean;
    message?: string;
};

type AuthContextData = {
    token: string | null;
    loading: boolean;

    /** null = ainda não passou pela tela de entrada. */
    role: Role | null;
    user: AuthUser | null;

    /** Tela de entrada do evento: vazio → anônimo; e-mail da equipe/paciente + senha → login. */
    enter: (email: string, password: string) => Promise<LoginResponse>;

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
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        loadStorage();
        setUnauthorizedHandler(() => {
            logout();
        });

        return () => setUnauthorizedHandler(null);
    }, []);

    async function loadStorage() {
        const tokenStorage =
            await AsyncStorage.getItem("@token");

        const validToken = tokenStorage && !isTokenExpired(tokenStorage) ? tokenStorage : null;

        if (validToken) {
            setToken(validToken);
        } else if (tokenStorage) {
            await AsyncStorage.removeItem("@token");
        }

        // Sessão da tela de entrada: anônimo não tem token; identificado exige token válido.
        if (!AUTH_REQUIRED) {
            try {
                const stored = JSON.parse((await AsyncStorage.getItem(SESSION_KEY)) ?? "null") as Session | null;

                if (stored && (stored.role === "guest" || (validToken && stored.user))) {
                    setSession(stored);
                } else if (stored) {
                    await AsyncStorage.removeItem(SESSION_KEY);
                }
            } catch {
                await AsyncStorage.removeItem(SESSION_KEY);
            }
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

    async function startSession(next: Session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
        setSession(next);
    }

    async function enter(email: string, password: string): Promise<LoginResponse> {
        const plan = planEntry(email, password);

        if (plan.kind === "error") {
            return { success: false, message: plan.message };
        }

        if (plan.kind === "guest") {
            await startSession({ role: "guest", user: null });
            return { success: true, role: "guest" };
        }

        try {
            const response = await api.post("/auth/login", { email: plan.email, password: plan.password });
            const user = response.data.user as AuthUser;

            await AsyncStorage.setItem("@token", response.data.token);
            setToken(response.data.token);
            await startSession({ role: user.role, user });

            return { success: true, role: user.role };
        } catch (error: any) {
            const status = error?.response?.status;

            if (status === 401 || status === 400) {
                // Usuário conhecido com senha errada: erro claro. Desconhecido: segue anônimo (protótipo).
                if (isKnownEmail(plan.email)) {
                    return { success: false, message: INVALID_CREDENTIALS_MESSAGE };
                }

                await startSession({ role: "guest", user: null });
                return { success: true, role: "guest" };
            }

            return {
                success: false,
                message: error?.response?.data?.message || "Não foi possível conectar ao servidor. Tente de novo.",
            };
        }
    }

    async function logout() {
        await AsyncStorage.multiRemove(["@token", SESSION_KEY]);
        setToken(null);
        setSession(null);
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                loading,
                role: session?.role ?? null,
                user: session?.user ?? null,
                enter,
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