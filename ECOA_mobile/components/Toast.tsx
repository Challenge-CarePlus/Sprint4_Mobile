import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts, radii, Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/ThemeContext";

const SHOW_MS = 2800;

const ToastContext = createContext<(message: string) => void>(() => {});

/** Aviso rápido no pé da tela (px-toast do protótipo): ink sobre surface, some sozinho. */
export function ToastProvider({ children }: { children: ReactNode }) {
    const styles = useThemedStyles(makeStyles);
    const [message, setMessage] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback((next: string) => {
        setMessage(next);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setMessage(null), SHOW_MS);
    }, []);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const value = useMemo(() => show, [show]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {message ? (
                <View style={styles.toast} pointerEvents="none" accessibilityRole="alert" accessibilityLiveRegion="polite">
                    <Text style={styles.text}>{message}</Text>
                </View>
            ) : null}
        </ToastContext.Provider>
    );
}

export function useToast(): (message: string) => void {
    return useContext(ToastContext);
}

const makeStyles = ({ colors, shadow }: Theme) =>
    StyleSheet.create({
        toast: {
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 24,
            zIndex: 10,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: radii.md,
            backgroundColor: colors.ink,
            ...shadow.float,
        },
        text: { fontFamily: fonts.medium, fontSize: 14, color: colors.surface },
    });
