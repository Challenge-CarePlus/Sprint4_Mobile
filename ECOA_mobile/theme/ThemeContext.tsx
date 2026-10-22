import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";

import { darkTheme, lightTheme, Theme } from "./tokens";

/** Escolha da pessoa: `auto` segue o aparelho. */
export type ThemePreference = "auto" | "light" | "dark";

const STORAGE_KEY = "@ecoa_theme";

type ThemeContextValue = Theme & {
    preference: ThemePreference;
    setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
    ...lightTheme,
    preference: "auto",
    setPreference: () => {},
});

export function isThemePreference(value: unknown): value is ThemePreference {
    return value === "auto" || value === "light" || value === "dark";
}

/** Resolve a preferência para claro/escuro, dado o esquema do aparelho. */
export function resolveTheme(preference: ThemePreference, system: string | null | undefined): Theme {
    if (preference === "light") return lightTheme;
    if (preference === "dark") return darkTheme;
    return system === "dark" ? darkTheme : lightTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const system = useColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>("auto");

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((stored) => {
                if (isThemePreference(stored)) setPreferenceState(stored);
            })
            .catch(() => {});
    }, []);

    const theme = resolveTheme(preference, system);

    // Na web, o fundo do <body> aparece em rolagens elásticas e atrás da coluna de 768px.
    useEffect(() => {
        if (Platform.OS !== "web" || typeof document === "undefined") return;
        document.body.style.backgroundColor = theme.colors.line;
        document.documentElement.style.colorScheme = theme.mode;
    }, [theme]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            ...theme,
            preference,
            setPreference: (next) => {
                setPreferenceState(next);
                AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
            },
        }),
        [theme, preference]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}

/** Estilos dependentes do tema: recalculados só quando o tema muda. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
    make: (theme: Theme) => T
): T {
    const { mode, colors, shadow, gradients } = useTheme();
    return useMemo(() => make({ mode, colors, shadow, gradients }), [make, mode, colors, shadow, gradients]);
}

/**
 * Força um tema para a subárvore (a Trilha Infantil fica sempre clara, regra do DS),
 * sem mexer na preferência salva.
 */
export function ThemeScope({ force, children }: { force?: "light" | "dark"; children: ReactNode }) {
    const parent = useTheme();
    const value = useMemo<ThemeContextValue>(
        () => (force ? { ...(force === "dark" ? darkTheme : lightTheme), preference: parent.preference, setPreference: parent.setPreference } : parent),
        [force, parent]
    );
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
