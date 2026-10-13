import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import IconBadge from "../../components/IconBadge";
import GradientButton from "../../components/GradientButton";
import { saveConsent } from "../../services/consentStorage";
import { colors, radii, shadow } from "../../theme/tokens";

type ConsentOption = "patient" | "guardian";

export default function ConsentScreen() {
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
                accessibilityState={{ selected: selected === "patient" }}
            >
                <Text style={styles.optionText}>Sou o(a) paciente e tenho 18 anos ou mais</Text>
                {selected === "patient" && (
                    <MaterialIcons name="check-circle" size={22} color={colors.primary700} />
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
                accessibilityState={{ selected: selected === "guardian" }}
            >
                <Text style={styles.optionText}>
                    Sou responsável legal por um(a) paciente menor de 18 anos
                </Text>
                {selected === "guardian" && (
                    <MaterialIcons name="check-circle" size={22} color={colors.primary700} />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
        fontFamily: "Righteous_400Regular",
        fontSize: 28,
        color: colors.primary900,
        textAlign: "center",
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 22,
        color: colors.text,
    },
    sectionLabel: {
        fontFamily: "Righteous_400Regular",
        fontSize: 18,
        color: colors.primary900,
        marginTop: 8,
    },
    option: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
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
        backgroundColor: colors.primary100,
        borderColor: colors.primary700,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: colors.neutral900,
    },
    buttonSpacer: {
        marginTop: 16,
    },
});
