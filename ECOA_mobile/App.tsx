import { Figtree_500Medium, Figtree_700Bold, Figtree_800ExtraBold, useFonts } from "@expo-google-fonts/figtree";
import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter";
import { MAX_APP_WIDTH } from "./theme/layout";
import { ToastProvider } from "./components/Toast";
import { DraftProvider } from "./context/DraftContext";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

// Foco visível do teclado em `brand` (DS), no lugar do contorno preto padrão do navegador.
function useWebFocusRing() {
    const { colors } = useTheme();

    useEffect(() => {
        if (Platform.OS !== "web" || typeof document === "undefined") return;

        const style = document.createElement("style");
        style.textContent =
            `:focus-visible{outline:2px solid ${colors.focus} !important;outline-offset:2px}` +
            `input:focus-visible{outline:none !important}`;
        document.head.appendChild(style);

        return () => {
            style.remove();
        };
    }, [colors.focus]);
}

export default function App() {
    return (
        <ThemeProvider>
            <Root />
        </ThemeProvider>
    );
}

function Root() {
    const { colors } = useTheme();
    useWebFocusRing();

    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        Figtree_500Medium,
        Figtree_700Bold,
        Figtree_800ExtraBold,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
                <ActivityIndicator color={colors.brand} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, alignItems: "center", backgroundColor: colors.line }}>
            <View style={{ flex: 1, width: "100%", maxWidth: MAX_APP_WIDTH, backgroundColor: colors.surface }}>
                <AuthProvider>
                    <ToastProvider>
                        <DraftProvider>
                            <AppRouter />
                        </DraftProvider>
                    </ToastProvider>
                </AuthProvider>
            </View>
        </View>
    );
}
