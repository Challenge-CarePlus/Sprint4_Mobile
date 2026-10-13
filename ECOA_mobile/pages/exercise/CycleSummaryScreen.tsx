import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import GradientButton from "../../components/GradientButton";
import { TRACKS } from "../../data/tracks";
import { saveCycleResult } from "../../services/progressStorage";
import { clearSessionOutcomes, getSessionOutcomes } from "../../services/sessionProgressStore";
import { clearCalibration } from "../../vision/calibrationStore";
import { colors, gradients, radii, shadow } from "../../theme/tokens";

type RouteParams = {
    trackId: string;
};

function StatTile({
    icon,
    label,
    value,
}: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value: string | number;
}) {
    return (
        <View style={styles.statTile}>
            <MaterialIcons name={icon} size={20} color={colors.primary700} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

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
            <LinearGradient
                colors={gradients.success}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, shadow.md]}
            >
                <View style={styles.trophyBadge}>
                    <MaterialIcons name="emoji-events" size={44} color={colors.secondary500} />
                </View>

                <Text style={styles.title}>Ciclo concluído!</Text>
                <Text style={styles.subtitle}>{track.name}</Text>
            </LinearGradient>

            <View style={styles.statsGrid}>
                <StatTile
                    icon="check-circle"
                    label="Exercícios concluídos"
                    value={`${outcomes.length}/${track.exerciseIds.length}`}
                />
                <StatTile icon="videocam" label="Validados pela câmera" value={validatedCount} />
                <StatTile icon="visibility" label="Guiados (autoavaliação)" value={guidedCount} />
                <StatTile
                    icon="military-tech"
                    label="Ciclos concluídos"
                    value={previousCycles > 0 ? previousCycles : "—"}
                />
            </View>

            <View style={styles.buttonSpacer}>
                <GradientButton title="Voltar ao início" onPress={handleBackToHome} icon="home" />
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
        paddingHorizontal: 24,
        paddingVertical: 32,
        gap: 20,
        alignItems: "center",
    },
    hero: {
        width: "100%",
        borderRadius: radii.xxl,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: "center",
        gap: 6,
    },
    trophyBadge: {
        width: 88,
        height: 88,
        borderRadius: radii.pill,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
        ...shadow.md,
    },
    title: {
        fontFamily: "Righteous_400Regular",
        fontSize: 26,
        color: colors.white,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: "rgba(255,255,255,0.9)",
        fontWeight: "600",
        textAlign: "center",
    },
    statsGrid: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    statTile: {
        width: "47%",
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: 16,
        gap: 6,
        ...shadow.sm,
    },
    statValue: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.primary900,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: "600",
    },
    buttonSpacer: {
        width: "100%",
        marginTop: 8,
    },
    paragraph: {
        padding: 24,
        color: colors.text,
    },
});
