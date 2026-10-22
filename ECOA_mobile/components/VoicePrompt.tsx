import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { useSpeechStatus } from "../hooks/useSpeechStatus";
import { getVoiceConfig, unlockSpeech } from "../services/speech";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";
import { fonts, radii, Theme } from "../theme/tokens";

/**
 * Aviso discreto e tocável quando a voz está ligada mas o navegador a bloqueou (falta um toque da pessoa
 * na página): "Toque para ativar a voz" destrava e confirma falando. Não aparece com a voz desligada nem
 * quando tudo funciona, e fica fora da câmera.
 */
export default function VoicePrompt() {
    const status = useSpeechStatus();
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);

    if (!getVoiceConfig().enabled || status === "ok") return null;

    if (status === "unavailable") {
        return (
            <Text style={styles.note} accessibilityRole="text">
                Sem voz neste aparelho — as instruções continuam aparecendo na tela.
            </Text>
        );
    }

    return (
        <Pressable
            onPress={unlockSpeech}
            accessibilityRole="button"
            accessibilityLabel="Toque para ativar a voz"
            style={({ pressed }) => [styles.pill, pressed && { opacity: 0.85 }]}
        >
            <MaterialIcons name="volume-up" size={18} color={colors.brandInk} />
            <Text style={styles.pillText}>Toque para ativar a voz</Text>
        </Pressable>
    );
}

const makeStyles = ({ colors }: Theme) =>
    StyleSheet.create({
        pill: {
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            minHeight: 48,
            paddingHorizontal: 18,
            borderRadius: radii.pill,
            backgroundColor: colors.brandSoft,
        },
        pillText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.brandInk },
        note: { alignSelf: "center", textAlign: "center", fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
    });
