import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/ThemeContext";

/**
 * Variante .web.tsx — o spike usa react-native-vision-camera e a WebView do
 * MediaPipe diretamente, nenhum dos dois com suporte a web. Ver
 * vision/FaceTrackingCamera.web.tsx para a explicação completa.
 */
export default function VisionSpike() {
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                O spike técnico só roda no app nativo (Android/iOS) — depende de
                react-native-vision-camera e de uma WebView local, sem suporte no navegador.
            </Text>
        </View>
    );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    text: {
        color: colors.ink,
        textAlign: "center",
        fontWeight: "600",
    },
});
