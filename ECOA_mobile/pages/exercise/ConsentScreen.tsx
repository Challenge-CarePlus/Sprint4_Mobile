import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import IconBadge from "../../components/IconBadge";
import GradientButton from "../../components/GradientButton";
import { saveConsent } from "../../services/consentStorage";
import { fonts, radii, Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/ThemeContext";

type ConsentOption = "patient" | "guardian";

export default function ConsentScreen() {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const navigation = useNavigation();
    const [selected, setSelected] = useState<ConsentOption | null>(null);

    async function handleContinue() {
        if (!selected) {
            return;
        }

        await saveConsent(selected === "guardian");
        navigation.navigate("TRACK_SELECT" as never);
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            accessibilityLabel="Tela de consentimento"
        >
            <IconBadge name="shield" size={76} iconSize={38} gradient="primary" style={styles.icon} />

            <Text style={styles.title}>Antes de começar</Text>

            <Text style={styles.paragraph}>
                Os exercícios usam a câmera para acompanhar os movimentos do seu rosto. Todo o
                processamento acontece aqui mesmo no seu aparelho — nenhum vídeo ou imagem do
                seu rosto é enviado para a internet ou armazenado.
            </Text>

            <Text style={styles.paragraph}>
                Este app complementa, mas não substitui, o acompanhamento com seu(sua)
                fonoaudiólogo(a).
            </Text>

            <Text style={styles.sectionLabel}>Quem está aceitando?</Text>

            <Pressable
                style={({ pressed }) => [
                    styles.option,
                    selected === "patient" && styles.optionSelected,
                    pressed && styles.optionPressed,
                ]}
                onPress={() => setSelected("patient")}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === "patient" }}
            >
                <Text style={styles.optionText}>Sou o(a) paciente e tenho 18 anos ou mais</Text>
                {selected === "patient" && (
                    <MaterialIcons name="check-circle" size={22} color={colors.brand} />
                )}
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                    styles.option,
                    selected === "guardian" && styles.optionSelected,
                    pressed && styles.optionPressed,
                ]}
                onPress={() => setSelected("guardian")}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === "guardian" }}
            >
                <Text style={styles.optionText}>
                    Sou responsável legal por um(a) paciente menor de 18 anos
                </Text>
                {selected === "guardian" && (
                    <MaterialIcons name="check-circle" size={22} color={colors.brand} />
                )}
            </Pressable>

            <View style={styles.buttonSpacer}>
                <GradientButton
                    title="Aceito e quero continuar"
                    onPress={handleContinue}
                    disabled={!selected}
                    icon="arrow-forward"
                />
            </View>
        </ScrollView>
    );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        paddingHorizontal: 28,
        paddingVertical: 40,
        gap: 16,
    },
    icon: {
        alignSelf: "center",
        marginBottom: 8,
    },
    title: {
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 28,
        color: colors.ink,
        textAlign: "center",
    },
    paragraph: {
        fontSize: 15,
        fontFamily: fonts.body,
        lineHeight: 22,
        color: colors.ink,
    },
    sectionLabel: {
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 18,
        color: colors.ink,
        marginTop: 8,
    },
    option: {
        backgroundColor: colors.surfaceRaised,
        borderRadius: radii.md,
        borderWidth: 2,
        borderColor: "transparent",
        padding: 16,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        ...shadow.sm,
    },
    optionPressed: {
        transform: [{ scale: 0.99 }],
    },
    optionSelected: {
        backgroundColor: colors.brandSoft,
        borderColor: colors.brand,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "600",
        color: colors.ink,
    },
    buttonSpacer: {
        marginTop: 16,
    },
});
