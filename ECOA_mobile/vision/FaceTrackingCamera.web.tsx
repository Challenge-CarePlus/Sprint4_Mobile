import { useEffect } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors } from "../theme/tokens";

export type FaceTrackingStatus = "initializing" | "ready" | "error";

type Props = {
    isActive: boolean;
    cameraStyle?: StyleProp<ViewStyle>;
    onReading?: (blendshapes: unknown, timestamp: number) => void;
    onStatusChange?: (status: FaceTrackingStatus) => void;
    onError?: (message: string) => void;
};

/**
 * Variante .web.tsx: o Metro/Expo escolhe este arquivo automaticamente ao
 * buildar para web, em vez de FaceTrackingCamera.tsx. Existe só para que o
 * app não quebre inteiro no navegador — react-native-vision-camera e
 * react-native-webview (usados na versão nativa) não têm suporte a web, e
 * importá-los incondicionalmente faz o bundle inteiro falhar ao carregar,
 * não só a tela de câmera. A detecção facial continua exclusiva do app
 * nativo (ver CLAUDE.md).
 */
export default function FaceTrackingCamera({ cameraStyle, onStatusChange, onError }: Props) {
    useEffect(() => {
        onStatusChange?.("error");
        onError?.("A câmera e a detecção facial só funcionam no app nativo (Android/iOS), não no navegador.");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={[styles.placeholder, cameraStyle]}>
            <Text style={styles.text}>
                A câmera e a detecção facial só funcionam no app nativo (Android/iOS). Esta
                tela é só para teste de navegação no navegador.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    placeholder: {
        width: "100%",
        height: 280,
        borderRadius: 12,
        backgroundColor: colors.neutral100,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    text: {
        color: colors.neutral900,
        textAlign: "center",
        fontWeight: "600",
    },
});
