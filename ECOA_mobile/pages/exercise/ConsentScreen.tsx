import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { saveConsent } from "../../services/consentStorage";
import { colors } from "../../theme/tokens";

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
            <View style={styles.iconContainer}>
                <MaterialIcons name="shield" size={38} color="#fff" />
            </View>

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

            <TouchableOpacity
                style={[styles.option, selected === "patient" && styles.optionSelected]}
                onPress={() => setSelected("patient")}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === "patient" }}
            >
                <Text style={styles.optionText}>Sou o(a) paciente e tenho 18 anos ou mais</Text>
                {selected === "patient" && (
                    <MaterialIcons name="check-circle" size={22} color={colors.primary700} />
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.option, selected === "guardian" && styles.optionSelected]}
                onPress={() => setSelected("guardian")}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === "guardian" }}
            >
                <Text style={styles.optionText}>
                    Sou responsável legal por um(a) paciente menor de 18 anos
                </Text>
                {selected === "guardian" && (
                    <MaterialIcons name="check-circle" size={22} color={colors.primary700} />
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
                onPress={handleContinue}
                disabled={!selected}
                activeOpacity={0.85}
                accessibilityRole="button"
            >
                <Text style={styles.continueButtonText}>Aceito e quero continuar</Text>
            </TouchableOpacity>
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
    iconContainer: {
        alignSelf: "center",
        width: 72,
        height: 72,
        borderRadius: 999,
        backgroundColor: colors.primary700,
        alignItems: "center",
        justifyContent: "center",
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
        lineHeight: 21,
        color: colors.text,
    },
    sectionLabel: {
        fontFamily: "Righteous_400Regular",
        fontSize: 18,
        color: colors.primary900,
        marginTop: 8,
    },
    option: {
        borderWidth: 2,
        borderColor: colors.primary700,
        borderRadius: 8,
        padding: 16,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    optionSelected: {
        backgroundColor: colors.primary100,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: colors.neutral900,
    },
    continueButton: {
        marginTop: 16,
        backgroundColor: colors.primary700,
        borderRadius: 5,
        paddingVertical: 16,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    continueButtonDisabled: {
        backgroundColor: colors.neutral300,
    },
    continueButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "700",
    },
});
