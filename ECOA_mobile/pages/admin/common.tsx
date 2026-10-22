import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Alert, Button } from "../../components/ds";
import { LoadState } from "../../hooks/useLoad";
import { useTheme } from "../../theme/ThemeContext";

/** Padrão das telas do painel: PageIntro + conteúdo com 16 / 16 / 32 e gap 16 (px-pad). */
export const padStyles = StyleSheet.create({
    pad: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 16 },
    padDock: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 128, gap: 16 },
});

/** Mostra carregando / erro com "Tentar de novo" enquanto não há dados. Devolve true se já pode desenhar. */
export function LoadGate({ state }: { state: LoadState<unknown> }) {
    const { colors } = useTheme();

    if (state.data !== null) return null;

    if (state.error) {
        return (
            <View style={{ gap: 12 }}>
                <Alert tone="danger">{state.error}</Alert>
                <Button variant="secondary" title="Tentar de novo" icon="refresh" onPress={state.reload} />
            </View>
        );
    }

    return (
        <View style={{ paddingVertical: 32 }} accessibilityRole="progressbar" accessibilityLabel="Carregando">
            <ActivityIndicator color={colors.brand} />
        </View>
    );
}

/** Se o recarregamento (com dados antigos na tela) falhar, avisa sem esconder a lista. */
export function ReloadError({ state }: { state: LoadState<unknown> }) {
    if (!state.error || state.data === null) return null;
    return <Alert tone="danger">{state.error}</Alert>;
}
