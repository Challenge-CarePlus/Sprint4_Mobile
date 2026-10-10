import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TRACKS } from "../../data/tracks";
import { saveCycleResult } from "../../services/progressStorage";
import { clearSessionOutcomes, getSessionOutcomes } from "../../services/sessionProgressStore";
import { clearCalibration } from "../../vision/calibrationStore";
import { colors } from "../../theme/tokens";

type RouteParams = {
    trackId: string;
};

export default function CycleSummaryScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { trackId } = route.params as RouteParams;

    const track = TRACKS.find((t) => t.id === trackId);
    const [previousCycles, setPreviousCycles] = useState(0);

    const outcomes = getSessionOutcomes(trackId);
    const validatedCount = outcomes.filter((o) => o.validationType === "validado").length;
    const guidedCount = outcomes.filter((o) => o.validationType === "guiado").length;

    useEffect(() => {
        if (!track) return;

        saveCycleResult({
            trackId,
            ageGroup: track.ageGroup,
            completedAt: new Date().toISOString(),
            exercisesTotal: track.exerciseIds.length,
            exercisesCompleted: outcomes.length,
            validatedCompleted: validatedCount,
            guidedCompleted: guidedCount,
        }).then((history) => {
            // Deriva a contagem do próprio retorno em vez de uma segunda leitura
            // do AsyncStorage — evita uma corrida entre leitura e escrita que
            // deixava "ciclos concluídos" não determinístico.
            const cyclesForTrack = history.filter((result) => result.trackId === trackId).length;
            setPreviousCycles(cyclesForTrack);

            clearSessionOutcomes(trackId);
            clearCalibration(trackId);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackId]);

    function handleBackToHome() {
        navigation.reset({ index: 0, routes: [{ name: "MAIN" as never }] });
    }

    if (!track) {
        return (
            <View style={styles.container}>
                <Text style={styles.paragraph}>Trilha não encontrada.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
                <MaterialIcons name="emoji-events" size={44} color="#fff" />
            </View>

            <Text style={styles.title}>Ciclo concluído!</Text>
            <Text style={styles.subtitle}>{track.name}</Text>

            <View style={styles.statsBox}>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Exercícios concluídos</Text>
                    <Text style={styles.statValue}>
                        {outcomes.length}/{track.exerciseIds.length}
                    </Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Validados pela câmera</Text>
                    <Text style={styles.statValue}>{validatedCount}</Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Guiados (autoavaliação)</Text>
                    <Text style={styles.statValue}>{guidedCount}</Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Ciclos concluídos nesta trilha</Text>
                    <Text style={styles.statValue}>{previousCycles > 0 ? previousCycles : "—"}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.homeButton}
                onPress={handleBackToHome}
                activeOpacity={0.85}
                accessibilityRole="button"
            >
                <Text style={styles.homeButtonText}>Voltar ao início</Text>
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
        alignItems: "center",
    },
    iconContainer: {
        width: 84,
        height: 84,
        borderRadius: 999,
        backgroundColor: colors.secondary700,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontFamily: "Righteous_400Regular",
        fontSize: 28,
        color: colors.primary900,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: "center",
    },
    statsBox: {
        width: "100%",
        backgroundColor: colors.neutral100,
        borderRadius: 8,
        padding: 16,
        gap: 12,
        marginTop: 8,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statLabel: {
        color: colors.neutral900,
        fontSize: 14,
    },
    statValue: {
        color: colors.primary700,
        fontSize: 14,
        fontWeight: "700",
    },
    homeButton: {
        marginTop: 16,
        backgroundColor: colors.primary700,
        borderRadius: 5,
        paddingVertical: 16,
        minHeight: 44,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    homeButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "700",
    },
    paragraph: {
        padding: 24,
        color: colors.text,
    },
});
