import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Alert, Button, CameraLoading, CountdownRing, PageIntro } from "../../components/ds";
import { CustomExercise } from "../../data/training";
import { speak } from "../../services/speech";
import { useTheme, useThemedStyles } from "../../theme/ThemeContext";
import { fonts, radii, Theme } from "../../theme/tokens";
import { getCameraBoxSize } from "../../vision/cameraBoxSize";
import { CALIBRATION_DURATION_MS, CalibrationCollector } from "../../vision/calibration";
import { customToValidationRule, defaultPrompt, movementLabel } from "../../vision/customExercise";
import { createDetector } from "../../vision/createDetector";
import type { Blendshape } from "../../vision/FaceLandmarkerBridge";
import FaceTrackingCamera, { FaceTrackingStatus } from "../../vision/FaceTrackingCamera";
import type { Detector } from "../../vision/SequenceDetectors";
import type { DetectorFeedback } from "../../vision/MovementDetector";
import { padStyles } from "./common";

const MIN_SAMPLES = 5;
const TEST_CONTENT_PADDING = 32;

type Phase = "calibrating" | "testing" | "done";

/**
 * "Testar agora": abre a câmera e roda a regra montada no formulário (calibração rápida + detector),
 * para o admin ver se a câmera enxerga o movimento antes de salvar. Não grava nada.
 */
export default function TestExerciseScreen() {
    const navigation = useNavigation();
    const { exercise } = useRoute().params as { exercise: CustomExercise };
    const { colors, shadow } = useTheme();
    const styles = useThemedStyles(makeStyles);

    const rule = useMemo(() => customToValidationRule(exercise), [exercise]);
    const label = movementLabel(exercise.validation.movement);
    const total = exercise.repetitions;

    const [status, setStatus] = useState<FaceTrackingStatus>("initializing");
    const [cameraAspect, setCameraAspect] = useState<number | null>(null);
    const [phase, setPhase] = useState<Phase>("calibrating");
    const [round, setRound] = useState(0);
    const [progress, setProgress] = useState(0);
    const [faceVisible, setFaceVisible] = useState(false);
    const [feedback, setFeedback] = useState<DetectorFeedback | null>(null);
    const [repetitions, setRepetitions] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const phaseRef = useRef<Phase>("calibrating");
    const collectorRef = useRef(new CalibrationCollector());
    const detectorRef = useRef<Detector | null>(null);
    const faceRef = useRef(false);

    const setPhaseBoth = useCallback((next: Phase) => {
        phaseRef.current = next;
        setPhase(next);
    }, []);

    // Calibração rápida (3 s) assim que a câmera fica pronta; sem rosto, recomeça.
    useEffect(() => {
        if (status !== "ready" || phase !== "calibrating") return;

        collectorRef.current = new CalibrationCollector();
        const startedAt = Date.now();
        setProgress(0);

        const tick = setInterval(() => setProgress(Math.min(1, (Date.now() - startedAt) / CALIBRATION_DURATION_MS)), 100);
        const finish = setTimeout(() => {
            clearInterval(tick);

            if (collectorRef.current.sampleCount < MIN_SAMPLES) {
                setRound((r) => r + 1); // sem rosto: tenta de novo
                return;
            }

            detectorRef.current = createDetector(rule, collectorRef.current.buildBaseline());
            setRepetitions(0);
            setFeedback(null);
            setPhaseBoth("testing");
            speak("Agora faça o exercício.");
        }, CALIBRATION_DURATION_MS);

        return () => {
            clearInterval(tick);
            clearTimeout(finish);
        };
    }, [status, phase, round, rule, setPhaseBoth]);

    const handleReading = useCallback(
        (blendshapes: Blendshape[], timestamp: number) => {
            if (phaseRef.current === "calibrating") {
                if (blendshapes.length > 0) collectorRef.current.addSample(blendshapes);
                return;
            }

            if (phaseRef.current !== "testing" || !detectorRef.current || !faceRef.current) return;

            const next = detectorRef.current.processReading(blendshapes, timestamp);
            setFeedback(next);
            setRepetitions(detectorRef.current.repetitionsCompleted);

            if (next.kind === "exercise-complete") {
                setPhaseBoth("done");
                speak("Muito bem! A câmera reconheceu o exercício.");
            }
        },
        [setPhaseBoth]
    );

    const handleFaceVisibility = useCallback((visible: boolean) => {
        faceRef.current = visible;
        setFaceVisible(visible);
    }, []);

    function retest() {
        detectorRef.current = null;
        setFeedback(null);
        setRepetitions(0);
        setPhaseBoth("calibrating");
        setRound((r) => r + 1);
    }

    const detected =
        feedback?.kind === "holding" ||
        feedback?.kind === "waiting-release" ||
        feedback?.kind === "repetition-complete" ||
        feedback?.kind === "exercise-complete" ||
        phase === "done";

    const cameraBox = getCameraBoxSize(0.42, 280, 440, cameraAspect ?? 4 / 3, TEST_CONTENT_PADDING);
    const cameraLoading = status !== "ready" && !errorMessage;
    const prompt = exercise.validation.promptMessage?.trim() || defaultPrompt(exercise.validation.movement);

    return (
        <ScrollView style={styles.container} contentContainerStyle={[padStyles.pad, { alignItems: "center" }]} showsVerticalScrollIndicator={false}>
            <PageIntro
                title="Testar agora"
                subtitle={`Faça o exercício "${exercise.name || "sem nome"}" diante da câmera. Nada é gravado.`}
            />

            <View style={[styles.cameraWrapper, cameraBox, shadow.hero]}>
                <FaceTrackingCamera
                    isActive
                    onReading={handleReading}
                    onStatusChange={setStatus}
                    onError={setErrorMessage}
                    onAspectRatioChange={setCameraAspect}
                    onFaceVisibilityChange={handleFaceVisibility}
                    cameraStyle={styles.cameraFill}
                />

                {status === "ready" && (
                    <View style={styles.chip} pointerEvents="none">
                        <MaterialIcons
                            name={faceVisible && phase !== "calibrating" ? "check-circle" : "face"}
                            size={16}
                            color={faceVisible && phase !== "calibrating" ? colors.success : colors.ink}
                        />
                        <Text style={[styles.chipText, { color: faceVisible && phase !== "calibrating" ? colors.success : colors.ink }]}>
                            {phase === "calibrating" ? "Calibrando…" : faceVisible ? "Rosto encontrado" : "Procurando seu rosto…"}
                        </Text>
                    </View>
                )}

                {cameraLoading && <CameraLoading />}
            </View>

            {phase === "calibrating" && status === "ready" && (
                <CountdownRing
                    value={(1 - progress) * (CALIBRATION_DURATION_MS / 1000)}
                    total={CALIBRATION_DURATION_MS / 1000}
                    label="Relaxe o rosto, olhando para a câmera"
                />
            )}

            {phase === "testing" && (
                <View style={[styles.card, shadow.card]} accessibilityLiveRegion="polite">
                    <View style={styles.line}>
                        <MaterialIcons name={faceVisible ? "check-circle" : "radio-button-unchecked"} size={20} color={faceVisible ? colors.success : colors.inkMuted} />
                        <Text style={styles.lineText}>{faceVisible ? "Rosto encontrado" : "Não vimos seu rosto — aproxime-se e procure luz"}</Text>
                    </View>
                    <View style={styles.line}>
                        <MaterialIcons name={detected ? "check-circle" : "radio-button-unchecked"} size={20} color={detected ? colors.success : colors.inkMuted} />
                        <Text style={styles.lineText}>
                            {detected
                                ? `${label} detectado ✓`
                                : feedback?.kind === "relaxing"
                                  ? "Relaxe…"
                                  : faceVisible
                                    ? prompt
                                    : `${label}: aguardando o rosto`}
                        </Text>
                    </View>
                    <Text style={styles.reps}>{`${Math.min(repetitions, total)} de ${total} repetições`}</Text>
                </View>
            )}

            {phase === "done" && (
                <View style={styles.full}>
                    <Alert tone="success">Tudo certo! A câmera reconhece este exercício como você configurou.</Alert>
                </View>
            )}

            {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

            <View style={styles.full}>
                {phase !== "calibrating" && (
                    <Button variant="secondary" icon="refresh" title="Testar de novo" onPress={retest} />
                )}
                <Button variant={phase === "done" ? "primary" : "ghost"} title="Concluir teste" onPress={() => navigation.goBack()} />
            </View>
        </ScrollView>
    );
}

const makeStyles = ({ colors }: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.surface },
        cameraWrapper: {
            alignSelf: "center",
            borderRadius: radii.lg,
            borderWidth: 3,
            borderColor: colors.brand,
            overflow: "hidden",
            backgroundColor: colors.brandDeep,
        },
        cameraFill: { width: "100%", height: "100%" },
        chip: {
            position: "absolute",
            left: 12,
            top: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            height: 30,
            paddingHorizontal: 12,
            borderRadius: radii.pill,
            backgroundColor: colors.surfaceRaised,
        },
        chipText: { fontFamily: fonts.bodySemiBold, fontSize: 12 },
        card: { alignSelf: "stretch", gap: 10, padding: 16, borderRadius: radii.md, backgroundColor: colors.surfaceRaised },
        line: { flexDirection: "row", alignItems: "center", gap: 10 },
        lineText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, color: colors.ink },
        reps: { fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
        full: { alignSelf: "stretch", gap: 8 },
    });
