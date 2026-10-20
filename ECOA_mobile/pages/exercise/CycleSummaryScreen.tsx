import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import GradientButton from "../../components/GradientButton";
import { TRACKS } from "../../data/tracks";
import { saveCycleResult } from "../../services/progressStorage";
import { clearSessionOutcomes, getSessionOutcomes } from "../../services/sessionProgressStore";
import { clearCalibration } from "../../vision/calibrationStore";
import { colors, fonts, radii, shadow } from "../../theme/tokens";
import { getTrailTheme, trailFont } from "../../theme/trailThemes";

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
            <MaterialIcons name={icon} size={20} color={colors.brand} />
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

    const trail = getTrailTheme(track.ageGroup);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: trail.background }]}
            contentContainerStyle={styles.content}
        >
            <View style={[styles.hero, shadow.md, { backgroundColor: trail.hero }]}>
                <View style={styles.trophyBadge}>
                    <MaterialIcons name="emoji-events" size={44} color={trail.accent} />
                </View>

                <Text style={[styles.title, { color: trail.onHero }]}>Ciclo concluído!</Text>
                <Text style={[styles.subtitle, { color: trail.onHero }]}>{track.name}</Text>
            </View>

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
                <GradientButton
                    title="Voltar ao início"
                    onPress={handleBackToHome}
                    icon="home"
                    fontSize={20}
                    fill={trail.cta}
                    textColor={trail.onCta}
                    fontFamily={trailFont}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
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
        fontFamily: trailFont,
        fontWeight: "400",
        textTransform: "uppercase",
        fontSize: 36,
        color: colors.onBrand,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        fontFamily: fonts.bodySemiBold,
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
        backgroundColor: colors.surfaceRaised,
        borderRadius: radii.md,
        padding: 16,
        gap: 6,
        ...shadow.sm,
    },
    statValue: {
        fontSize: 22,
        fontFamily: fonts.display,
        fontWeight: "800",
        color: colors.ink,
    },
    statLabel: {
        fontSize: 12,
        color: colors.inkMuted,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "600",
    },
    buttonSpacer: {
        width: "100%",
        marginTop: 8,
    },
    paragraph: {
        padding: 24,
        color: colors.ink,
        fontFamily: fonts.body,
    },
});
