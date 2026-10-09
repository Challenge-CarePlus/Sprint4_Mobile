import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getExerciseById } from "../../data/exercises";
import { TRACKS } from "../../data/tracks";
import { colors } from "../../theme/tokens";
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

    function handleStart() {
        if (hasCalibration(trackId)) {
            (navigation as any).navigate("EXERCISE_SESSION", { trackId, exerciseIndex });
        } else {
            (navigation as any).navigate("CALIBRATION", { trackId, exerciseIndex });
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
            <Text style={styles.progress}>
                Exercício {exerciseIndex + 1} de {track.exerciseIds.length} — {track.name}
            </Text>

            <View style={styles.videoPlaceholder} accessibilityLabel="Vídeo de demonstração">
                <MaterialIcons name="play-circle-filled" size={48} color="#fff" />
                <Text style={styles.videoPlaceholderText}>Vídeo de demonstração</Text>
            </View>

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
                        <Text style={styles.instructionNumber}>{index + 1}</Text>
                        <Text style={[styles.instructionText, { fontSize: 15 * presentation.fontScale }]}>
                            {instruction}
                        </Text>
                    </View>
                ))}
            </View>

            {repetitionLabel ? <Text style={styles.repetitionLabel}>{repetitionLabel}</Text> : null}

            <TouchableOpacity
                style={[styles.startButton, { minHeight: presentation.minTouchTarget }]}
                onPress={handleStart}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={hasCalibration(trackId) ? "Iniciar exercício" : "Começar calibração"}
            >
                <Text style={[styles.startButtonText, { fontSize: 16 * presentation.fontScale }]}>
                    {hasCalibration(trackId) ? "Iniciar exercício" : "Começar calibração"}
                </Text>
                <MaterialIcons name="arrow-forward" size={24} color="#fff" />
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
        paddingVertical: 32,
        gap: 16,
    },
    progress: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.textMuted,
        textAlign: "center",
    },
    videoPlaceholder: {
        width: "100%",
        height: 180,
        borderRadius: 12,
        backgroundColor: colors.primary700,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    videoPlaceholderText: {
        color: colors.white,
        fontWeight: "600",
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
        borderRadius: 8,
        padding: 12,
    },
    guidanceText: {
        flex: 1,
        color: colors.attention,
        fontWeight: "700",
        fontSize: 13,
    },
    instructionsBox: {
        gap: 12,
    },
    instructionRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
    },
    instructionNumber: {
        width: 24,
        height: 24,
        borderRadius: 999,
        backgroundColor: colors.primary100,
        color: colors.primary900,
        textAlign: "center",
        lineHeight: 24,
        fontWeight: "700",
        fontSize: 13,
        overflow: "hidden",
    },
    instructionText: {
        flex: 1,
        color: colors.neutral900,
        lineHeight: 20,
    },
    repetitionLabel: {
        textAlign: "center",
        fontWeight: "700",
        color: colors.primary700,
    },
    startButton: {
        backgroundColor: colors.primary700,
        borderRadius: 5,
        paddingVertical: 16,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 8,
    },
    startButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "700",
    },
    paragraph: {
        padding: 24,
        color: colors.text,
    },
});
