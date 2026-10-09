import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/tokens";

/**
 * Variante .web.tsx — o spike usa react-native-vision-camera e a WebView do
 * MediaPipe diretamente, nenhum dos dois com suporte a web. Ver
 * vision/FaceTrackingCamera.web.tsx para a explicação completa.
 */
export default function VisionSpike() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                O spike técnico só roda no app nativo (Android/iOS) — depende de
                react-native-vision-camera e de uma WebView local, sem suporte no navegador.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    text: {
        color: colors.neutral900,
        textAlign: "center",
        fontWeight: "600",
    },
});
