import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getExerciseById } from "../../data/exercises";
import { TRACKS } from "../../data/tracks";
import { Exercise, Track } from "../../data/types";
import FaceTrackingCamera from "../../vision/FaceTrackingCamera";
import { Blendshape } from "../../vision/FaceLandmarkerBridge";
import { DetectorFeedback, MovementDetector } from "../../vision/MovementDetector";
import { getCalibration } from "../../vision/calibrationStore";
import { recordExerciseOutcome } from "../../services/sessionProgressStore";
import { resetSpeechDedup, speak } from "../../services/speech";
import { colors } from "../../theme/tokens";
import { getPresentation } from "../../theme/ageGroupThemes";

type RouteParams = {
    trackId: string;
    exerciseIndex: number;
};

type SessionProps = {
    track: Track;
    exercise: Exercise;
    trackId: string;
    exerciseIndex: number;
};

export default function ExerciseSessionScreen() {
    const route = useRoute();
    const { trackId, exerciseIndex } = route.params as RouteParams;

    const track = TRACKS.find((t) => t.id === trackId);
    const exerciseId = track?.exerciseIds[exerciseIndex];
    const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;

    if (!track || !exercise) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Exercício não encontrado.</Text>
            </View>
        );
    }

    const props: SessionProps = { track, exercise, trackId, exerciseIndex };

    return exercise.validationType === "validado" ? (
        <ValidatedExerciseSession {...props} />
    ) : (
        <GuidedExerciseSession {...props} />
    );
}

function goToNextStep(navigation: any, track: Track, trackId: string, exerciseIndex: number) {
    const isLastExercise = exerciseIndex >= track.exerciseIds.length - 1;

    if (isLastExercise) {
        navigation.navigate("CYCLE_SUMMARY", { trackId });
    } else {
        navigation.navigate("EXERCISE_PREVIEW", { trackId, exerciseIndex: exerciseIndex + 1 });
    }
}

function RepetitionProgress({
    done,
    total,
    gamified,
}: {
    done: number;
    total: number;
    gamified: boolean;
}) {
    const icon = gamified ? "star" : "radio-button-checked";
    const iconOutline = gamified ? "star-border" : "radio-button-unchecked";

    return (
        <View style={styles.progressRow}>
            {Array.from({ length: total }).map((_, index) => (
                <MaterialIcons
                    key={index}
                    name={index < done ? icon : iconOutline}
                    size={gamified ? 28 : 20}
                    color={index < done ? colors.secondary500 : colors.neutral300}
                />
            ))}
        </View>
    );
}

function ValidatedExerciseSession({ track, exercise, trackId, exerciseIndex }: SessionProps) {
    const navigation = useNavigation();
    const presentation = getPresentation(track.ageGroup);
    const rule = exercise.validationRule!;
    const targetReps = rule.repetitions ?? 1;

    const detectorRef = useRef<MovementDetector | null>(null);
    const hasAnnouncedHoldRef = useRef(false);
    const hasFinishedRef = useRef(false);

    const [repsDone, setRepsDone] = useState(0);
    const [message, setMessage] = useState("Posicione o rosto na câmera");
    const [feedbackKind, setFeedbackKind] = useState<DetectorFeedback["kind"] | null>(null);
    const [sessionActive, setSessionActive] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        resetSpeechDedup();
        const baseline = getCalibration(trackId) ?? {};
        detectorRef.current = new MovementDetector(rule, baseline);
    }, [trackId, rule]);

    const finishExercise = useCallback(() => {
        if (hasFinishedRef.current) return;
        hasFinishedRef.current = true;

        recordExerciseOutcome(trackId, {
            exerciseId: exercise.id,
            validationType: "validado",
            success: true,
        });

        setSessionActive(false);
        setTimeout(() => goToNextStep(navigation, track, trackId, exerciseIndex), 1200);
    }, [navigation, track, trackId, exerciseIndex, exercise.id]);

    const handleReading = useCallback(
        (blendshapes: Blendshape[], timestamp: number) => {
            if (!detectorRef.current || hasFinishedRef.current) {
                return;
            }

            const feedback = detectorRef.current.processReading(blendshapes, timestamp);
            setFeedbackKind(feedback.kind);

            if (feedback.kind === "prompt") {
                hasAnnouncedHoldRef.current = false;
                setMessage(feedback.message);
                speak(feedback.message);
            } else if (feedback.kind === "holding") {
                setMessage(`Continue segurando... ${Math.ceil(feedback.remainingMs / 1000)}s`);
                if (!hasAnnouncedHoldRef.current) {
                    hasAnnouncedHoldRef.current = true;
                    speak("Continue segurando");
                }
            } else if (feedback.kind === "waiting-release") {
                hasAnnouncedHoldRef.current = false;
                setMessage(feedback.message);
                speak("Ótimo!");
            } else if (feedback.kind === "repetition-complete") {
                hasAnnouncedHoldRef.current = false;
                setRepsDone(feedback.repetitionsDone);
                setMessage("Ótimo! Próxima repetição.");
                speak("Ótimo!");
            } else if (feedback.kind === "exercise-complete") {
                setRepsDone(feedback.repetitionsDone);
                setMessage("Exercício concluído!");
                speak("Muito bem! Exercício concluído.");
                finishExercise();
            }
        },
        [finishExercise]
    );

    return (
        <View style={styles.container}>
            <Text style={[styles.progressLabel, { fontSize: 13 * presentation.fontScale }]}>
                Exercício {exerciseIndex + 1} de {track.exerciseIds.length}
            </Text>

            <Text style={[styles.exerciseName, { fontSize: 22 * presentation.fontScale }]}>
                {exercise.name}
            </Text>

            <FaceTrackingCamera
                isActive={sessionActive}
                onReading={handleReading}
                onError={setErrorMessage}
            />

            <View style={[styles.messageBox, getMessageBoxStyle(feedbackKind)]}>
                <Text style={[styles.messageText, { fontSize: 15 * presentation.fontScale }]}>
                    {message}
                </Text>
            </View>

            <RepetitionProgress done={repsDone} total={targetReps} gamified={presentation.gamified} />

            {presentation.metricsFocused && (
                <Text style={styles.metrics}>
                    {repsDone}/{targetReps} repetições
                </Text>
            )}

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        </View>
    );
}

function GuidedExerciseSession({ track, exercise, trackId, exerciseIndex }: SessionProps) {
    const navigation = useNavigation();
    const presentation = getPresentation(track.ageGroup);
    const targetReps = exercise.repetitions ?? 1;

    const hasFinishedRef = useRef(false);
    const [repsDone, setRepsDone] = useState(0);
    const [showSelfAssessment, setShowSelfAssessment] = useState(false);

    useEffect(() => {
        resetSpeechDedup();
        speak(`Use a câmera como espelho. ${exercise.instructions[0] ?? ""}`);
    }, [exercise.instructions]);

    function handleCompleteRepetition() {
        if (hasFinishedRef.current) return;

        const next = repsDone + 1;
        setRepsDone(next);

        if (next >= targetReps) {
            setShowSelfAssessment(true);
            speak("Terminou as repetições. Como você avalia o exercício?");
        } else {
            speak(`Mais uma! Faltam ${targetReps - next}.`);
        }
    }

    function handleSelfAssessment(result: "yes" | "partial" | "no") {
        if (hasFinishedRef.current) return;
        hasFinishedRef.current = true;

        recordExerciseOutcome(trackId, {
            exerciseId: exercise.id,
            validationType: "guiado",
            success: result !== "no",
            selfAssessment: result,
        });

        goToNextStep(navigation, track, trackId, exerciseIndex);
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.progressLabel, { fontSize: 13 * presentation.fontScale }]}>
                Exercício {exerciseIndex + 1} de {track.exerciseIds.length}
            </Text>

            <Text style={[styles.exerciseName, { fontSize: 22 * presentation.fontScale }]}>
                {exercise.name}
            </Text>

            <FaceTrackingCamera isActive />

            {exercise.professionalGuidanceRecommended && (
                <View style={styles.guidanceBanner}>
                    <MaterialIcons name="info" size={18} color={colors.attention} />
                    <Text style={styles.guidanceText}>
                        Recomendado com orientação do(a) fonoaudiólogo(a).
                    </Text>
                </View>
            )}

            {!showSelfAssessment ? (
                <>
                    <View style={styles.instructionsBox}>
                        {exercise.instructions.map((instruction, index) => (
                            <Text key={index} style={styles.guidedInstruction}>
                                {index + 1}. {instruction}
                            </Text>
                        ))}
                    </View>

                    <RepetitionProgress
                        done={repsDone}
                        total={targetReps}
                        gamified={presentation.gamified}
                    />

                    <TouchableOpacity
                        style={[styles.repButton, { minHeight: presentation.minTouchTarget }]}
                        onPress={handleCompleteRepetition}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.repButtonText, { fontSize: 16 * presentation.fontScale }]}>
                            Concluí uma repetição
                        </Text>
                    </TouchableOpacity>
                </>
            ) : (
                <View style={styles.assessmentBox}>
                    <Text style={styles.assessmentTitle}>Você conseguiu realizar o exercício?</Text>

                    <View style={styles.assessmentRow}>
                        <TouchableOpacity
                            style={[styles.assessmentButton, styles.assessmentYes]}
                            onPress={() => handleSelfAssessment("yes")}
                        >
                            <Text style={styles.assessmentButtonText}>Sim</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.assessmentButton, styles.assessmentPartial]}
                            onPress={() => handleSelfAssessment("partial")}
                        >
                            <Text style={styles.assessmentButtonText}>Em parte</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.assessmentButton, styles.assessmentNo]}
                            onPress={() => handleSelfAssessment("no")}
                        >
                            <Text style={styles.assessmentButtonText}>Não</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

function getMessageBoxStyle(kind: DetectorFeedback["kind"] | null) {
    if (kind === "waiting-release" || kind === "repetition-complete" || kind === "exercise-complete") {
        return { backgroundColor: colors.success };
    }
    if (kind === "holding") {
        return { backgroundColor: colors.primary500 };
    }
    return { backgroundColor: colors.primary700 };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 14,
        alignItems: "center",
    },
    message: {
        padding: 24,
        color: colors.text,
    },
    progressLabel: {
        color: colors.textMuted,
        fontWeight: "700",
    },
    exerciseName: {
        fontFamily: "Righteous_400Regular",
        color: colors.primary900,
        textAlign: "center",
    },
    messageBox: {
        width: "100%",
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    messageText: {
        color: colors.white,
        fontWeight: "700",
        textAlign: "center",
    },
    progressRow: {
        flexDirection: "row",
        gap: 6,
    },
    metrics: {
        color: colors.neutral500,
        fontWeight: "600",
    },
    error: {
        color: colors.error,
        textAlign: "center",
    },
    guidanceBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFF4E5",
        borderRadius: 8,
        padding: 10,
        width: "100%",
    },
    guidanceText: {
        flex: 1,
        color: colors.attention,
        fontWeight: "700",
        fontSize: 12,
    },
    instructionsBox: {
        width: "100%",
        gap: 6,
    },
    guidedInstruction: {
        color: colors.neutral900,
        fontSize: 14,
        lineHeight: 19,
    },
    repButton: {
        backgroundColor: colors.primary700,
        borderRadius: 5,
        paddingVertical: 16,
        minHeight: 44,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    repButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "700",
    },
    assessmentBox: {
        width: "100%",
        gap: 14,
        alignItems: "center",
    },
    assessmentTitle: {
        fontFamily: "Righteous_400Regular",
        fontSize: 18,
        color: colors.primary900,
        textAlign: "center",
    },
    assessmentRow: {
        flexDirection: "row",
        gap: 10,
        width: "100%",
    },
    assessmentButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
    },
    assessmentYes: {
        backgroundColor: colors.success,
    },
    assessmentPartial: {
        backgroundColor: colors.attention,
    },
    assessmentNo: {
        backgroundColor: colors.error,
    },
    assessmentButtonText: {
        color: colors.white,
        fontWeight: "700",
    },
});
