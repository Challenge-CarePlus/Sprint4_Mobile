import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import GradientButton from "../../components/GradientButton";
import { getExerciseById } from "../../data/exercises";
import { TRACKS } from "../../data/tracks";
import { colors, gradients, radii, shadow } from "../../theme/tokens";
import { getPresentation } from "../../theme/ageGroupThemes";
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
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.progressPill}>
                <Text style={styles.progress}>
                    Exercício {exerciseIndex + 1} de {track.exerciseIds.length} · {track.name}
                </Text>
            </View>

            <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.videoPlaceholder, shadow.md]}
                accessibilityLabel="Vídeo de demonstração"
            >
                <View style={styles.playButton}>
                    <MaterialIcons name="play-arrow" size={34} color={colors.primary900} />
                </View>
                <Text style={styles.videoPlaceholderText}>Vídeo de demonstração</Text>
            </LinearGradient>

            <Text style={[styles.title, { fontSize: 26 * presentation.fontScale }]}>
                {exercise.name}
            </Text>

            <Text
                style={[
                    styles.goal,
                    {
                        fontSize: 15 * presentation.fontScale,
                        color: presentation.highContrast ? colors.text : colors.textMuted,
                    },
                ]}
            >
                {exercise.therapeuticGoal}
            </Text>

            {exercise.professionalGuidanceRecommended && (
                <View style={styles.guidanceBanner}>
                    <MaterialIcons name="info" size={20} color={colors.attention} />
                    <Text style={styles.guidanceText}>
                        Recomendado com orientação do(a) fonoaudiólogo(a).
                    </Text>
                </View>
            )}

            <View style={styles.instructionsBox}>
                {exercise.instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionRow}>
                        <LinearGradient
                            colors={gradients.accent}
                            style={styles.instructionNumber}
                        >
                            <Text style={styles.instructionNumberText}>{index + 1}</Text>
                        </LinearGradient>
                        <Text style={[styles.instructionText, { fontSize: 15 * presentation.fontScale }]}>
                            {instruction}
                        </Text>
                    </View>
                ))}
            </View>

            {repetitionLabel ? (
                <View style={styles.repetitionPill}>
                    <MaterialIcons name="repeat" size={16} color={colors.primary700} />
                    <Text style={styles.repetitionLabel}>{repetitionLabel}</Text>
                </View>
            ) : null}

            <View style={styles.buttonSpacer}>
                <GradientButton
                    title={calibrated ? "Iniciar exercício" : "Começar calibração"}
                    onPress={handleStart}
                    icon="arrow-forward"
                    minHeight={presentation.minTouchTarget}
                    fontSize={16 * presentation.fontScale}
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
        paddingVertical: 32,
        gap: 16,
    },
    progressPill: {
        alignSelf: "center",
        backgroundColor: colors.primary100,
        borderRadius: radii.pill,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    progress: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.primary900,
        textAlign: "center",
    },
    videoPlaceholder: {
        width: "100%",
        height: 180,
        borderRadius: radii.xl,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: radii.pill,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        ...shadow.sm,
    },
    videoPlaceholderText: {
        color: colors.white,
        fontWeight: "700",
    },
    title: {
        fontFamily: "Righteous_400Regular",
        color: colors.primary900,
        textAlign: "center",
    },
    goal: {
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
    guidanceBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFF4E5",
        borderRadius: radii.lg,
        padding: 12,
    },
    guidanceText: {
        flex: 1,
        color: colors.attention,
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
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    instructionText: {
        flex: 1,
        color: colors.neutral900,
        lineHeight: 20,
        marginTop: 3,
    },
    repetitionPill: {
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.primary100,
        borderRadius: radii.pill,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    repetitionLabel: {
        fontWeight: "700",
        color: colors.primary700,
        fontSize: 13,
    },
    buttonSpacer: {
        marginTop: 8,
    },
    paragraph: {
        padding: 24,
        color: colors.text,
    },
});
