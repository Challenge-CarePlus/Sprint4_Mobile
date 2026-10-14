import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import GradientButton from "../../components/GradientButton";
import { getExerciseById } from "../../data/exercises";
import { TRACKS } from "../../data/tracks";
import { Exercise, Track } from "../../data/types";
import FaceTrackingCamera from "../../vision/FaceTrackingCamera";
import type { Blendshape } from "../../vision/FaceLandmarkerBridge";
import { DetectorFeedback, MovementDetector } from "../../vision/MovementDetector";
import { getCalibration, hasCalibration } from "../../vision/calibrationStore";
import { recordExerciseOutcome } from "../../services/sessionProgressStore";
import { resetSpeechDedup, speak } from "../../services/speech";
import { colors, radii, shadow } from "../../theme/tokens";
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

const SESSION_CONTENT_PADDING = 40; // paddingHorizontal: 20 dos dois lados (styles.content)

/**
 * Câmera como elemento principal da tela (estilo "espelho" de apps de
 * fisioterapia/fitness por câmera — Kaia Health, True Pose), não uma caixa
 * pequena entre textos. `ratio` é a fração da altura da janela; min/max
 * evitam que fique grande demais num monitor ou pequena demais num celular
 * baixo.
 *
 * `aspect` é a proporção real do stream da webcam (largura/altura), lida do
 * próprio vídeo assim que carrega — sem isso, uma caixa larga de desktop
 * (ex. 1800x450) forçada sobre uma webcam 4:3 sobrava tarja preta nas
 * laterais com `contentFit: "contain"`. Calculando a largura da caixa a
 * partir da proporção real da câmera, a caixa já nasce do tamanho certo e a
 * tarja preta não aparece — sem precisar de `"cover"`, que cortaria o rosto
 * (o mesmo problema já corrigido antes no vídeo de demonstração).
 */
function getCameraBoxSize(
    ratio: number,
    min: number,
    max: number,
    aspect: number | null
): { width: number; height: number } {
    const window = Dimensions.get("window");
    const maxWidth = window.width - SESSION_CONTENT_PADDING;
    const height = Math.min(max, Math.max(min, window.height * ratio));

    if (!aspect) {
        return { width: maxWidth, height };
    }

    const width = height * aspect;
    if (width <= maxWidth) {
        return { width, height };
    }

    // A altura "ideal" (baseada na janela) faria a caixa ficar mais larga do
    // que a tela permite — encolhe os dois lados juntos pra manter a
    // proporção real da câmera (senão a largura ficaria presa na tela mas a
    // altura não, voltando a sobrar tarja preta, só que em cima/embaixo).
    return { width: maxWidth, height: maxWidth / aspect };
}

export default function ExerciseSessionScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { trackId, exerciseIndex } = route.params as RouteParams;

    const track = TRACKS.find((t) => t.id === trackId);
    const exerciseId = track?.exerciseIds[exerciseIndex];
    const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;

    // Normalmente inalcançável: ExercisePreviewScreen só manda pra cá depois de
    // calibrar. Mas essa tela também é alcançável por nome de rota sozinha (ex.:
    // restauração de estado de navegação), então reforça o convite aqui em vez
    // de rodar o detector com uma calibração vazia/sem sentido.
    const needsCalibration = exercise?.validationType === "validado" && !hasCalibration(trackId);

    useEffect(() => {
        if (needsCalibration) {
            (navigation as any).replace("CALIBRATION", { trackId, exerciseIndex });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsCalibration, trackId, exerciseIndex]);

    if (!track || !exercise) {
        return (
            <View style={styles.notFound}>
                <Text style={styles.message}>Exercício não encontrado.</Text>
            </View>
        );
    }

    if (needsCalibration) {
        return null;
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
        navigation.replace("CYCLE_SUMMARY", { trackId });
    } else {
        navigation.replace("EXERCISE_PREVIEW", { trackId, exerciseIndex: exerciseIndex + 1 });
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
    // exercise é tipado como Exercise (a union completa) aqui porque é passado
    // via props — a narrowing do pai não atravessa a fronteira do componente,
    // então reconfirma em runtime em vez de usar `!`. Com data/types.ts como
    // union discriminada, isso só falha se os dados de exercises.ts estiverem
    // errados, não por um exercício "validado" legítimo sem regra.
    const rule = exercise.validationType === "validado" ? exercise.validationRule : undefined;
    const targetReps = rule?.repetitions ?? 1;

    const detectorRef = useRef<MovementDetector | null>(null);
    const hasAnnouncedHoldRef = useRef(false);
    const hasFinishedRef = useRef(false);
    const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [repsDone, setRepsDone] = useState(0);
    const [message, setMessage] = useState("Posicione o rosto na câmera");
    const [feedbackKind, setFeedbackKind] = useState<DetectorFeedback["kind"] | null>(null);
    const [sessionActive, setSessionActive] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cameraAspect, setCameraAspect] = useState<number | null>(null);

    useEffect(() => {
        resetSpeechDedup();

        if (!rule) {
            setErrorMessage("Este exercício não está configurado para validação por câmera.");
            return;
        }

        const baseline = getCalibration(trackId) ?? {};
        detectorRef.current = new MovementDetector(rule, baseline);
    }, [trackId, rule]);

    useEffect(() => {
        return () => {
            if (finishTimeoutRef.current) {
                clearTimeout(finishTimeoutRef.current);
            }
        };
    }, []);

    const finishExercise = useCallback(() => {
        if (hasFinishedRef.current) return;
        hasFinishedRef.current = true;

        recordExerciseOutcome(trackId, {
            exerciseId: exercise.id,
            validationType: "validado",
            success: true,
        });

        setSessionActive(false);
        finishTimeoutRef.current = setTimeout(
            () => goToNextStep(navigation, track, trackId, exerciseIndex),
            1200
        );
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

    const cameraBox = getCameraBoxSize(0.52, 340, 520, cameraAspect);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={styles.progressPill}>
                    <Text style={[styles.progressLabel, { fontSize: 13 * presentation.fontScale }]}>
                        Exercício {exerciseIndex + 1} de {track.exerciseIds.length}
                    </Text>
                </View>

                <Text style={[styles.exerciseName, { fontSize: 22 * presentation.fontScale }]}>
                    {exercise.name}
                </Text>
            </View>

            <View style={[styles.cameraWrapper, shadow.md, cameraBox]}>
                <FaceTrackingCamera
                    isActive={sessionActive}
                    onReading={handleReading}
                    onError={setErrorMessage}
                    onAspectRatioChange={setCameraAspect}
                    cameraStyle={styles.cameraFill}
                    borderColor={getFeedbackColor(feedbackKind)}
                />

                <LinearGradient
                    colors={["transparent", "rgba(10,16,26,0.85)"]}
                    style={styles.cameraScrim}
                    pointerEvents="none"
                />

                <View style={styles.cameraOverlay} pointerEvents="none">
                    <Text style={[styles.overlayMessage, { fontSize: 15 * presentation.fontScale }]}>
                        {message}
                    </Text>

                    <RepetitionProgress
                        done={repsDone}
                        total={targetReps}
                        gamified={presentation.gamified}
                    />

                    {presentation.metricsFocused && (
                        <Text style={styles.overlayMetrics}>
                            {repsDone}/{targetReps} repetições
                        </Text>
                    )}
                </View>
            </View>

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        </ScrollView>
    );
}

function GuidedExerciseSession({ track, exercise, trackId, exerciseIndex }: SessionProps) {
    const navigation = useNavigation();
    const presentation = getPresentation(track.ageGroup);
    const targetReps = exercise.repetitions ?? 1;

    const hasFinishedRef = useRef(false);
    const [repsDone, setRepsDone] = useState(0);
    const [showSelfAssessment, setShowSelfAssessment] = useState(false);
    const [cameraAspect, setCameraAspect] = useState<number | null>(null);

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

    const cameraBox = getCameraBoxSize(0.38, 260, 400, cameraAspect);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={styles.progressPill}>
                    <Text style={[styles.progressLabel, { fontSize: 13 * presentation.fontScale }]}>
                        Exercício {exerciseIndex + 1} de {track.exerciseIds.length}
                    </Text>
                </View>

                <Text style={[styles.exerciseName, { fontSize: 22 * presentation.fontScale }]}>
                    {exercise.name}
                </Text>
            </View>

            <View style={[styles.cameraWrapper, shadow.md, cameraBox]}>
                <FaceTrackingCamera
                    isActive
                    onAspectRatioChange={setCameraAspect}
                    cameraStyle={styles.cameraFill}
                />
            </View>

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

                    <GradientButton
                        title="Concluí uma repetição"
                        onPress={handleCompleteRepetition}
                        icon="check"
                        iconPosition="left"
                        minHeight={presentation.minTouchTarget}
                        fontSize={16 * presentation.fontScale}
                    />
                </>
            ) : (
                <View style={styles.assessmentBox}>
                    <Text style={styles.assessmentTitle}>Você conseguiu realizar o exercício?</Text>

                    <View style={styles.assessmentRow}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.assessmentButton,
                                styles.assessmentYes,
                                pressed && styles.assessmentPressed,
                            ]}
                            onPress={() => handleSelfAssessment("yes")}
                        >
                            <MaterialIcons name="check-circle" size={20} color="#fff" />
                            <Text style={styles.assessmentButtonText}>Sim</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.assessmentButton,
                                styles.assessmentPartial,
                                pressed && styles.assessmentPressed,
                            ]}
                            onPress={() => handleSelfAssessment("partial")}
                        >
                            <MaterialIcons name="adjust" size={20} color="#fff" />
                            <Text style={styles.assessmentButtonText}>Em parte</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.assessmentButton,
                                styles.assessmentNo,
                                pressed && styles.assessmentPressed,
                            ]}
                            onPress={() => handleSelfAssessment("no")}
                        >
                            <MaterialIcons name="cancel" size={20} color="#fff" />
                            <Text style={styles.assessmentButtonText}>Não</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

function getFeedbackColor(kind: DetectorFeedback["kind"] | null): string {
    if (kind === "waiting-release" || kind === "repetition-complete" || kind === "exercise-complete") {
        return colors.success;
    }
    if (kind === "holding") {
        return colors.primary500;
    }
    return colors.primary700;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    notFound: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 32,
        gap: 16,
        alignItems: "center",
    },
    message: {
        padding: 24,
        color: colors.text,
    },
    header: {
        gap: 8,
        alignItems: "center",
    },
    progressPill: {
        backgroundColor: colors.primary100,
        borderRadius: radii.pill,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    progressLabel: {
        color: colors.primary900,
        fontWeight: "700",
    },
    exerciseName: {
        fontFamily: "Righteous_400Regular",
        color: colors.primary900,
        textAlign: "center",
    },
    cameraWrapper: {
        alignSelf: "center",
        borderRadius: radii.xl,
        overflow: "hidden",
        position: "relative",
    },
    cameraFill: {
        width: "100%",
        height: "100%",
        borderRadius: radii.xl,
        borderWidth: 4,
    },
    cameraScrim: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "48%",
    },
    cameraOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingBottom: 18,
        gap: 10,
        alignItems: "center",
    },
    overlayMessage: {
        color: colors.white,
        fontWeight: "700",
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.45)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    overlayMetrics: {
        color: "rgba(255,255,255,0.85)",
        fontWeight: "600",
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
        borderRadius: radii.lg,
        padding: 12,
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
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: 16,
        ...shadow.sm,
    },
    guidedInstruction: {
        color: colors.neutral900,
        fontSize: 14,
        lineHeight: 19,
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
        minHeight: 56,
        borderRadius: radii.lg,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 12,
        ...shadow.sm,
    },
    assessmentPressed: {
        transform: [{ scale: 0.96 }],
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
        fontSize: 13,
    },
});
