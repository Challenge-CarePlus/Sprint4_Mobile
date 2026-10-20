import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import GradientButton from "../../components/GradientButton";
import ExerciseVideo from "../../components/ExerciseVideo";
import { getExerciseById } from "../../data/exercises";
import { TRACKS } from "../../data/tracks";
import { colors, fonts, gradients, radii, shadow } from "../../theme/tokens";
import { getPresentation } from "../../theme/ageGroupThemes";
import { getTrailTheme, trailFont } from "../../theme/trailThemes";
import { hasCalibration } from "../../vision/calibrationStore";

type RouteParams = {
    trackId: string;
    exerciseIndex: number;
};

export default function ExercisePreviewScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { trackId, exerciseIndex } = route.params as RouteParams;

    const track = TRACKS.find((t) => t.id === trackId);
    const exerciseId = track?.exerciseIds[exerciseIndex];
    const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;

    if (!track || !exercise) {
        return (
            <View style={styles.container}>
                <Text style={styles.paragraph}>Exercício não encontrado.</Text>
            </View>
        );
    }

    const presentation = getPresentation(track.ageGroup);
    const trail = getTrailTheme(track.ageGroup);
    const calibrated = hasCalibration(trackId);

    function handleStart() {
        if (calibrated) {
            (navigation as any).replace("EXERCISE_SESSION", { trackId, exerciseIndex });
        } else {
            (navigation as any).replace("CALIBRATION", { trackId, exerciseIndex });
        }
    }

    const repetitionLabel = [
        exercise.repetitions ? `${exercise.repetitions}x` : null,
        exercise.durationSeconds ? `${exercise.durationSeconds}s por repetição` : null,
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: trail.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={[styles.progressPill, { backgroundColor: trail.chipBackground }]}>
                <Text style={[styles.progress, { color: trail.chipText }]}>
                    Exercício {exerciseIndex + 1} de {track.exerciseIds.length} · {track.name}
                </Text>
            </View>

            {exercise.demoVideoAsset ? (
                <View style={[styles.videoPlaceholder, shadow.md]} accessibilityLabel="Vídeo de demonstração">
                    <ExerciseVideo source={exercise.demoVideoAsset} style={styles.videoPlayer} />
                </View>
            ) : (
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.videoPlaceholder, shadow.md]}
                    accessibilityLabel="Vídeo de demonstração"
                >
                    <View style={styles.playButton}>
                        <MaterialIcons name="play-arrow" size={34} color={colors.ink} />
                    </View>
                    <Text style={styles.videoPlaceholderText}>Vídeo de demonstração</Text>
                </LinearGradient>
            )}

            <Text
                style={[
                    styles.title,
                    {
                        fontFamily: trailFont,
                        fontWeight: "400",
                        textTransform: "uppercase",
                        color: trail.title,
                        fontSize: 34 * presentation.fontScale,
                        lineHeight: 36 * presentation.fontScale,
                    },
                ]}
            >
                {exercise.name}
            </Text>

            <Text
                style={[
                    styles.goal,
                    { fontSize: 15 * presentation.fontScale, color: trail.textMuted },
                ]}
            >
                {exercise.therapeuticGoal}
            </Text>

            {exercise.professionalGuidanceRecommended && (
                <View style={styles.guidanceBanner}>
                    <MaterialIcons name="info" size={20} color={colors.warning} />
                    <Text style={styles.guidanceText}>
                        Recomendado com orientação do(a) fonoaudiólogo(a).
                    </Text>
                </View>
            )}

            <View style={styles.instructionsBox}>
                {exercise.instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionRow}>
                        <View style={[styles.instructionNumber, { backgroundColor: trail.accent }]}>
                            <Text style={[styles.instructionNumberText, { color: trail.onAccent }]}>
                                {index + 1}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.instructionText,
                                { fontSize: 15 * presentation.fontScale, color: trail.text },
                            ]}
                        >
                            {instruction}
                        </Text>
                    </View>
                ))}
            </View>

            {repetitionLabel ? (
                <View style={[styles.repetitionPill, { backgroundColor: trail.chipBackground }]}>
                    <MaterialIcons name="repeat" size={16} color={trail.chipText} />
                    <Text style={[styles.repetitionLabel, { color: trail.chipText }]}>{repetitionLabel}</Text>
                </View>
            ) : null}

            <View style={styles.buttonSpacer}>
                <GradientButton
                    title={calibrated ? "Iniciar exercício" : "Começar calibração"}
                    onPress={handleStart}
                    icon="arrow-forward"
                    minHeight={presentation.minTouchTarget}
                    fontSize={20 * presentation.fontScale}
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
        paddingHorizontal: 28,
        paddingVertical: 32,
        gap: 16,
    },
    progressPill: {
        alignSelf: "center",
        backgroundColor: colors.brandSoft,
        borderRadius: radii.pill,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    progress: {
        fontSize: 12,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
        color: colors.ink,
        textAlign: "center",
    },
    videoPlaceholder: {
        width: "100%",
        maxWidth: 560,
        aspectRatio: 16 / 9,
        alignSelf: "center",
        borderRadius: radii.lg,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        overflow: "hidden",
        backgroundColor: "#000",
    },
    videoPlayer: {
        borderRadius: radii.lg,
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: radii.pill,
        backgroundColor: colors.surfaceRaised,
        alignItems: "center",
        justifyContent: "center",
        ...shadow.sm,
    },
    videoPlaceholderText: {
        color: colors.white,
        fontWeight: "700",
    },
    title: {
        fontFamily: "Montserrat_700Bold",
        color: colors.ink,
        textAlign: "center",
    },
    goal: {
        color: colors.inkMuted,
        fontFamily: fonts.body,
        textAlign: "center",
        lineHeight: 20,
    },
    guidanceBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.warningSoft,
        borderRadius: radii.md,
        padding: 12,
    },
    guidanceText: {
        flex: 1,
        color: colors.warning,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
        fontSize: 13,
    },
    instructionsBox: {
        gap: 14,
    },
    instructionRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
    },
    instructionNumber: {
        width: 26,
        height: 26,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    instructionNumberText: {
        color: colors.white,
        fontWeight: "700",
        fontSize: 13,
    },
    instructionText: {
        flex: 1,
        color: colors.ink,
        fontFamily: fonts.body,
        lineHeight: 20,
        marginTop: 3,
    },
    repetitionPill: {
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.brandSoft,
        borderRadius: radii.pill,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    repetitionLabel: {
        fontWeight: "700",
        fontFamily: fonts.bodySemiBold,
        color: colors.brandInk,
        fontSize: 13,
    },
    buttonSpacer: {
        marginTop: 8,
    },
    paragraph: {
        padding: 24,
        color: colors.ink,
        fontFamily: fonts.body,
    },
});
