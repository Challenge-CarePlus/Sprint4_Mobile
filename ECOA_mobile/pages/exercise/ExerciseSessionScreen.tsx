import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../../components/ds";
import GradientButton from "../../components/GradientButton";
import { findExercise, findTrack } from "../../services/trackStore";
import { Exercise, Track } from "../../data/types";
import FaceTrackingCamera from "../../vision/FaceTrackingCamera";
import { getCameraBoxSize } from "../../vision/cameraBoxSize";
import type { Blendshape } from "../../vision/FaceLandmarkerBridge";
import { DetectorFeedback } from "../../vision/MovementDetector";
import { createDetector } from "../../vision/createDetector";
import type { Detector } from "../../vision/SequenceDetectors";
import { getCalibration, hasCalibration } from "../../vision/calibrationStore";
import { recordExerciseOutcome } from "../../services/sessionProgressStore";
import VoicePrompt from "../../components/VoicePrompt";
import { resetSpeechDedup, speak } from "../../services/speech";
import { say } from "../../services/speechPhrases";
import { fonts, radii, Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/ThemeContext";
import { getPresentation } from "../../theme/ageGroupThemes";
import { useTrailTheme, TrailTheme } from "../../theme/trailThemes";

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

export default function ExerciseSessionScreen() {
    const styles = useThemedStyles(makeStyles);
    const navigation = useNavigation();
    const route = useRoute();
    const { trackId, exerciseIndex } = route.params as RouteParams;

    const track = findTrack(trackId);
    const exerciseId = track?.exerciseIds[exerciseIndex];
    const exercise = exerciseId ? findExercise(exerciseId) : undefined;

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
    filledColor,
    emptyColor,
}: {
    done: number;
    total: number;
    gamified: boolean;
    filledColor: string;
    emptyColor: string;
}) {
    const styles = useThemedStyles(makeStyles);
    const icon = gamified ? "star" : "radio-button-checked";
    const iconOutline = gamified ? "star-border" : "radio-button-unchecked";

    return (
        <View style={styles.progressRow}>
            {Array.from({ length: total }).map((_, index) => (
                <MaterialIcons
                    key={index}
                    name={index < done ? icon : iconOutline}
                    size={gamified ? 28 : 20}
                    color={index < done ? filledColor : emptyColor}
                />
            ))}
        </View>
    );
}

function ValidatedExerciseSession({ track, exercise, trackId, exerciseIndex }: SessionProps) {
    const { colors, shadow } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const navigation = useNavigation();
    const presentation = getPresentation(track.ageGroup);
    const ageGroup = track.ageGroup;
    const trail = useTrailTheme(track.ageGroup);
    // exercise é tipado como Exercise (a union completa) aqui porque é passado
    // via props — a narrowing do pai não atravessa a fronteira do componente,
    // então reconfirma em runtime em vez de usar `!`. Com data/types.ts como
    // union discriminada, isso só falha se os dados de exercises.ts estiverem
    // errados, não por um exercício "validado" legítimo sem regra.
    const rule = exercise.validationType === "validado" ? exercise.validationRule : undefined;
    const targetReps = rule?.repetitions ?? 1;

    const detectorRef = useRef<Detector | null>(null);
    const hasAnnouncedHoldRef = useRef(false);
    const hasAnnouncedRelaxRef = useRef(false);
    const hasFinishedRef = useRef(false);
    const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [repsDone, setRepsDone] = useState(0);
    const [message, setMessage] = useState("Posicione o rosto na câmera");
    const [feedbackKind, setFeedbackKind] = useState<DetectorFeedback["kind"] | null>(null);
    const [sessionActive, setSessionActive] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [stuck, setStuck] = useState(false);
    const [cameraAspect, setCameraAspect] = useState<number | null>(null);
    const [faceVisible, setFaceVisible] = useState(true);
    const faceVisibleRef = useRef(true);

    const handleFaceVisibilityChange = useCallback((visible: boolean) => {
        faceVisibleRef.current = visible;
        setFaceVisible(visible);
    }, []);

    useEffect(() => {
        resetSpeechDedup();

        if (!rule) {
            setErrorMessage("Este exercício não está configurado para validação por câmera.");
            return;
        }

        const baseline = getCalibration(trackId) ?? {};
        detectorRef.current = createDetector(rule, baseline);
    }, [trackId, rule]);

    useEffect(() => {
        return () => {
            if (finishTimeoutRef.current) {
                clearTimeout(finishTimeoutRef.current);
            }
        };
    }, []);

    // Sem progresso por 25 s (limiar ainda sem calibração com todos os rostos): oferece
    // seguir a jornada em vez de deixar a pessoa presa. O exercício fica registrado como não validado.
    useEffect(() => {
        setStuck(false);
        const id = setTimeout(() => setStuck(true), 25000);
        return () => clearTimeout(id);
    }, [repsDone]);

    function handleSkip() {
        if (hasFinishedRef.current) return;
        hasFinishedRef.current = true;
        recordExerciseOutcome(trackId, {
            exerciseId: exercise.id,
            validationType: "validado",
            success: false,
        });
        setSessionActive(false);
        goToNextStep(navigation, track, trackId, exerciseIndex);
    }

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

            // Sem rosto o aviso da câmera é a única orientação; evita "Abra mais a boca" junto.
            if (!faceVisibleRef.current) {
                return;
            }

            const feedback = detectorRef.current.processReading(blendshapes, timestamp);
            setFeedbackKind(feedback.kind);

            // "Relaxe" é falado uma vez por repetição: só rearma num novo ciclo (prompt/holding),
            // não quando o rosto oscila em torno do limiar entre relaxing e waiting-release.
            if (feedback.kind === "prompt" || feedback.kind === "holding") {
                hasAnnouncedRelaxRef.current = false;
            }

            if (feedback.kind === "relaxing") {
                // O relaxamento entre repetições também é contado e mostrado.
                hasAnnouncedHoldRef.current = false;
                setMessage(`Relaxe... ${Math.ceil(feedback.remainingMs / 1000)}s`);
                if (!hasAnnouncedRelaxRef.current) {
                    hasAnnouncedRelaxRef.current = true;
                    say("relax", ageGroup);
                }
            } else if (feedback.kind === "prompt") {
                hasAnnouncedHoldRef.current = false;
                setMessage(feedback.message);
                say("prompt", ageGroup, feedback.message);
            } else if (feedback.kind === "holding") {
                // remainingMs 0 = detector sequencial (sem tempo de segurar): mostra a própria mensagem.
                if (feedback.remainingMs > 0) {
                    setMessage(`Continue segurando... ${Math.ceil(feedback.remainingMs / 1000)}s`);
                    if (!hasAnnouncedHoldRef.current) {
                        hasAnnouncedHoldRef.current = true;
                        say("holding", ageGroup);
                    }
                } else {
                    setMessage(feedback.message);
                }
            } else if (feedback.kind === "waiting-release") {
                hasAnnouncedHoldRef.current = false;
                setMessage(feedback.message);
                say("release", ageGroup);
            } else if (feedback.kind === "repetition-complete") {
                hasAnnouncedHoldRef.current = false;
                setRepsDone(feedback.repetitionsDone);
                setMessage("Ótimo! Próxima repetição.");
                say("release", ageGroup);
            } else if (feedback.kind === "exercise-complete") {
                setRepsDone(feedback.repetitionsDone);
                setMessage("Exercício concluído!");
                say("complete", ageGroup);
                finishExercise();
            }
        },
        [finishExercise, ageGroup]
    );

    const cameraBox = getCameraBoxSize(0.52, 340, 520, cameraAspect, SESSION_CONTENT_PADDING);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: trail.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={[styles.progressPill, { backgroundColor: trail.chipBackground }]}>
                    <Text
                        style={[
                            styles.progressLabel,
                            { fontSize: 13 * presentation.fontScale, color: trail.chipText },
                        ]}
                    >
                        Exercício {exerciseIndex + 1} de {track.exerciseIds.length}
                    </Text>
                </View>

                <Text
                    style={[
                        styles.exerciseName,
                        {
                            fontFamily: trail.titleFont,
                            fontWeight: "400",
                            color: trail.title,
                            fontSize: (trail.titleSize - 4) * presentation.fontScale,
                            lineHeight: (trail.titleSize - 4) * 1.25 * presentation.fontScale,
                        },
                    ]}
                >
                    {exercise.name}
                </Text>
            </View>

            <View style={[styles.cameraWrapper, shadow.md, cameraBox]}>
                <FaceTrackingCamera
                    isActive={sessionActive}
                    onReading={handleReading}
                    onError={setErrorMessage}
                    onAspectRatioChange={setCameraAspect}
                    onFaceVisibilityChange={handleFaceVisibilityChange}
                    cameraStyle={styles.cameraFill}
                    borderColor={getFeedbackColor(feedbackKind, trail, colors.success)}
                />

                <LinearGradient
                    colors={["transparent", "rgba(10,16,26,0.85)"]}
                    style={styles.cameraScrim}
                    pointerEvents="none"
                />

                <View style={styles.cameraOverlay} pointerEvents="none">
                    <Text style={[styles.overlayMessage, { fontSize: 15 * presentation.fontScale }]}>
                        {faceVisible ? message : ""}
                    </Text>

                    <RepetitionProgress
                        done={repsDone}
                        total={targetReps}
                        gamified={presentation.gamified}
                        filledColor={colors.white}
                        emptyColor="rgba(255,255,255,0.5)"
                    />

                    {presentation.metricsFocused && (
                        <Text style={styles.overlayMetrics}>
                            {repsDone}/{targetReps} repetições
                        </Text>
                    )}
                </View>
            </View>

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

            <VoicePrompt />

            {stuck && !errorMessage && (
                <View style={styles.skip}>
                    <Button
                        variant="secondary"
                        title="Não está validando? Pular este exercício"
                        minHeight={presentation.minTouchTarget + (presentation.highContrast ? 0 : 4)}
                        fontSize={presentation.highContrast ? 18 : undefined}
                        onPress={handleSkip}
                    />
                </View>
            )}
        </ScrollView>
    );
}

function GuidedExerciseSession({ track, exercise, trackId, exerciseIndex }: SessionProps) {
    const { colors, shadow } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const navigation = useNavigation();
    const presentation = getPresentation(track.ageGroup);
    const trail = useTrailTheme(track.ageGroup);
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

    const cameraBox = getCameraBoxSize(0.38, 260, 400, cameraAspect, SESSION_CONTENT_PADDING);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: trail.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={[styles.progressPill, { backgroundColor: trail.chipBackground }]}>
                    <Text
                        style={[
                            styles.progressLabel,
                            { fontSize: 13 * presentation.fontScale, color: trail.chipText },
                        ]}
                    >
                        Exercício {exerciseIndex + 1} de {track.exerciseIds.length}
                    </Text>
                </View>

                <Text
                    style={[
                        styles.exerciseName,
                        {
                            fontFamily: trail.titleFont,
                            fontWeight: "400",
                            color: trail.title,
                            fontSize: (trail.titleSize - 4) * presentation.fontScale,
                            lineHeight: (trail.titleSize - 4) * 1.25 * presentation.fontScale,
                        },
                    ]}
                >
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
                    <MaterialIcons name="info" size={18} color={colors.warning} />
                    <Text style={styles.guidanceText}>
                        Recomendado com orientação do(a) fonoaudiólogo(a).
                    </Text>
                </View>
            )}

            {!showSelfAssessment ? (
                <>
                    <View style={[styles.instructionsBox, { backgroundColor: trail.card }]}>
                        {exercise.instructions.map((instruction, index) => (
                            <Text
                                key={index}
                                style={[
                                    styles.guidedInstruction,
                                    {
                                        color: trail.cardText,
                                        fontSize: 14 * presentation.fontScale,
                                        lineHeight: 19 * presentation.fontScale,
                                    },
                                ]}
                            >
                                {index + 1}. {instruction}
                            </Text>
                        ))}
                    </View>

                    <RepetitionProgress
                        done={repsDone}
                        total={targetReps}
                        gamified={presentation.gamified}
                        filledColor={trail.cta}
                        emptyColor={trail.progressTrack}
                    />

                    <GradientButton
                        title="Concluí uma repetição"
                        onPress={handleCompleteRepetition}
                        icon="check"
                        iconPosition="left"
                        minHeight={presentation.minTouchTarget}
                        fontSize={trail.ctaSize * presentation.fontScale}
                        fillGradient={trail.ctaGradient}
                        textColor={trail.onCta}
                        fontFamily={trail.ctaFont}
                    />
                </>
            ) : (
                <View style={styles.assessmentBox}>
                    <Text style={[styles.assessmentTitle, { color: trail.text }]}>Você conseguiu realizar o exercício?</Text>

                    <View style={styles.assessmentRow}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.assessmentButton,
                                styles.assessmentYes,
                                pressed && styles.assessmentPressed,
                            ]}
                            onPress={() => handleSelfAssessment("yes")}
                        >
                            <MaterialIcons name="check-circle" size={20} color={colors.white} />
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
                            <MaterialIcons name="adjust" size={20} color={colors.white} />
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
                            <MaterialIcons name="cancel" size={20} color={colors.white} />
                            <Text style={styles.assessmentButtonText}>Não</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

function getFeedbackColor(kind: DetectorFeedback["kind"] | null, trail: TrailTheme, success: string): string {
    if (kind === "relaxing" || kind === "waiting-release" || kind === "repetition-complete" || kind === "exercise-complete") {
        return success;
    }
    if (kind === "holding") {
        return trail.ringHolding;
    }
    return trail.ringIdle;
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    notFound: {
        flex: 1,
        backgroundColor: colors.surface,
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
        color: colors.ink,
        fontFamily: fonts.body,
    },
    header: {
        gap: 8,
        alignItems: "center",
    },
    progressPill: {
        backgroundColor: colors.brandSoft,
        borderRadius: radii.pill,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    progressLabel: {
        color: colors.ink,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
    },
    exerciseName: {
        fontFamily: "PlusJakartaSans_600SemiBold",
        color: colors.ink,
        textAlign: "center",
    },
    cameraWrapper: {
        alignSelf: "center",
        borderRadius: radii.lg,
        overflow: "hidden",
        position: "relative",
    },
    cameraFill: {
        width: "100%",
        height: "100%",
        borderRadius: radii.lg,
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
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.45)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    overlayMetrics: {
        color: "rgba(255,255,255,0.85)",
        fontFamily: fonts.bodySemiBold,
        fontWeight: "600",
    },
    progressRow: {
        flexDirection: "row",
        gap: 6,
    },
    skip: {
        width: "100%",
    },
    error: {
        color: colors.danger,
        textAlign: "center",
    },
    guidanceBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.warningSoft,
        borderRadius: radii.md,
        padding: 12,
        width: "100%",
    },
    guidanceText: {
        flex: 1,
        color: colors.warning,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
        fontSize: 12,
    },
    instructionsBox: {
        width: "100%",
        gap: 6,
        backgroundColor: colors.surfaceRaised,
        borderRadius: radii.md,
        padding: 16,
        ...shadow.sm,
    },
    guidedInstruction: {
        color: colors.ink,
        fontFamily: fonts.body,
        fontSize: 14,
        lineHeight: 19,
    },
    assessmentBox: {
        width: "100%",
        gap: 14,
        alignItems: "center",
    },
    assessmentTitle: {
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 18,
        color: colors.ink,
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
        borderRadius: radii.md,
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
        backgroundColor: colors.warning,
    },
    assessmentNo: {
        backgroundColor: colors.danger,
    },
    assessmentButtonText: {
        color: colors.white,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
        fontSize: 13,
    },
});
