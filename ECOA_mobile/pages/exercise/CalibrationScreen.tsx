import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Alert, Button, CameraLoading, CountdownRing, PageIntro } from "../../components/ds";
import FaceTrackingCamera, { FaceTrackingStatus } from "../../vision/FaceTrackingCamera";
import { getCameraBoxSize } from "../../vision/cameraBoxSize";
import type { Blendshape } from "../../vision/FaceLandmarkerBridge";
import { CALIBRATION_DURATION_MS, CalibrationCollector } from "../../vision/calibration";
import { setCalibration } from "../../vision/calibrationStore";
import { speak } from "../../services/speech";
import { TRACKS } from "../../data/tracks";
import { fonts, kidsColors, radii, Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/ThemeContext";
import { useTrailTheme } from "../../theme/trailThemes";

type RouteParams = {
    trackId: string;
    exerciseIndex: number;
};

const CALIBRATION_CONTENT_PADDING = 32; // paddingHorizontal: 16 dos dois lados
const MIN_CALIBRATION_SAMPLES = 5;

export default function CalibrationScreen() {
    const { colors, shadow } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const navigation = useNavigation();
    const route = useRoute();
    const { trackId, exerciseIndex } = route.params as RouteParams;

    const track = TRACKS.find((t) => t.id === trackId);
    const trail = useTrailTheme(track?.ageGroup ?? "adults");

    const collectorRef = useRef(new CalibrationCollector());
    const hasStartedRef = useRef(false);
    const hasFinishedRef = useRef(false);

    const [status, setStatus] = useState<FaceTrackingStatus>("initializing");
    const [secondsRemaining, setSecondsRemaining] = useState(
        Math.ceil(CALIBRATION_DURATION_MS / 1000)
    );
    const [progress, setProgress] = useState(0);
    const [collecting, setCollecting] = useState(false);
    const collectingRef = useRef(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cameraAspect, setCameraAspect] = useState<number | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [noFace, setNoFace] = useState(false);
    // Diagnóstico visível: quadros analisados e quadros com rosto (refs, pra não re-renderizar a 60fps).
    const framesRef = useRef(0);
    const faceFramesRef = useRef(0);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [diagnostics, setDiagnostics] = useState({ frames: 0, faceFrames: 0 });

    useEffect(() => {
        const id = setInterval(
            () => setDiagnostics({ frames: framesRef.current, faceFrames: faceFramesRef.current }),
            500
        );
        return () => {
            clearInterval(id);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, []);

    const finishCalibration = useCallback(() => {
        if (hasFinishedRef.current) {
            return;
        }

        if (collectorRef.current.sampleCount < MIN_CALIBRATION_SAMPLES) {
            // Sem rosto detectado: baseline vazio deixaria a detecção sem referência.
            collectorRef.current = new CalibrationCollector();
            setNoFace(true);
            setProgress(0);
            setSecondsRemaining(Math.ceil(CALIBRATION_DURATION_MS / 1000));
            speak("Não vimos seu rosto. Fique de frente para a câmera.");
            // Pausa antes de tentar de novo: sem ela a mensagem piscava e sumia.
            retryTimeoutRef.current = setTimeout(() => {
                hasStartedRef.current = false;
                setAttempt((n) => n + 1);
            }, 3000);
            return;
        }

        hasFinishedRef.current = true;
        const baseline = collectorRef.current.buildBaseline();
        setCalibration(trackId, baseline);

        (navigation as any).replace("EXERCISE_SESSION", { trackId, exerciseIndex });
    }, [navigation, trackId, exerciseIndex]);

    useEffect(() => {
        if (status !== "ready" || hasStartedRef.current) {
            return;
        }

        hasStartedRef.current = true;
        if (attempt === 0) {
            speak("Relaxe o rosto. Vamos calibrar por 3 segundos.");
        }
        collectingRef.current = true;
        setCollecting(true);

        const startedAt = Date.now();
        const tickInterval = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, CALIBRATION_DURATION_MS - elapsed);
            setSecondsRemaining(Math.ceil(remaining / 1000));
            setProgress(Math.min(1, elapsed / CALIBRATION_DURATION_MS));
        }, 100);

        const finishTimeout = setTimeout(() => {
            collectingRef.current = false;
            setCollecting(false);
            setProgress(1);
            clearInterval(tickInterval);
            finishCalibration();
        }, CALIBRATION_DURATION_MS);

        return () => {
            clearInterval(tickInterval);
            clearTimeout(finishTimeout);
        };
    }, [status, attempt, finishCalibration]);

    const handleReading = useCallback(
        (blendshapes: Blendshape[]) => {
            framesRef.current += 1;
            if (blendshapes.length > 0) {
                faceFramesRef.current += 1;
            }
            if (collectingRef.current && blendshapes.length > 0) {
                setNoFace(false);
                collectorRef.current.addSample(blendshapes);
            }
        },
        []
    );

    const faceFound = diagnostics.faceFrames > 0 && !noFace;
    const kids = track?.ageGroup === "children";
    const senior = track?.ageGroup === "elderly";
    const cameraLoading = status !== "ready" && !errorMessage;
    const remainingSeconds = (1 - progress) * (CALIBRATION_DURATION_MS / 1000);

    const cameraBox = getCameraBoxSize(0.42, 280, 440, cameraAspect ?? 4 / 3, CALIBRATION_CONTENT_PADDING);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: trail.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <PageIntro
                title="Calibração"
                subtitle="Relaxe o rosto e olhe para a câmera. Isso ajusta a detecção ao seu rosto."
            />

            <View
                style={[
                    styles.cameraWrapper,
                    cameraBox,
                    { borderColor: kids ? kidsColors.green : colors.brand },
                    kids ? shadow.kids : shadow.hero,
                ]}
            >
                <FaceTrackingCamera
                    isActive
                    onReading={handleReading}
                    onStatusChange={setStatus}
                    onError={setErrorMessage}
                    onAspectRatioChange={setCameraAspect}
                    cameraStyle={styles.cameraFill}
                />

                {status === "ready" && (
                    <>
                        <View style={styles.guide} pointerEvents="none" />
                        <View style={styles.statusChip} pointerEvents="none">
                            <MaterialIcons
                                name={faceFound ? "check-circle" : "face"}
                                size={16}
                                color={faceFound ? colors.success : colors.ink}
                            />
                            <Text style={[styles.statusText, { color: faceFound ? colors.success : colors.ink }]}>
                                {faceFound ? "Rosto encontrado" : "Procurando seu rosto…"}
                            </Text>
                        </View>
                    </>
                )}

                {cameraLoading && <CameraLoading kids={kids} />}
            </View>

            {status === "ready" && (
                <CountdownRing
                    value={remainingSeconds}
                    total={CALIBRATION_DURATION_MS / 1000}
                    label="Fique parado, falta pouco"
                    kids={kids}
                    large={senior}
                />
            )}

            {cameraLoading && (
                <Alert tone="info">Dica: fique num lugar bem iluminado, com o rosto inteiro na tela.</Alert>
            )}

            {noFace && (
                <Alert tone="danger">
                    Não vimos seu rosto. Fique de frente para a câmera, com boa luz — vamos tentar de novo.
                </Alert>
            )}

            {__DEV__ && status === "ready" && (
                <Text style={[styles.diagnostics, { color: trail.textMuted }]}>
                    Quadros analisados: {diagnostics.frames} · com rosto: {diagnostics.faceFrames}
                </Text>
            )}

            {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

            <Button
                variant="ghost"
                title="Cancelar"
                minHeight={senior ? 56 : undefined}
                onPress={() => navigation.goBack()}
            />
        </ScrollView>
    );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    // Protótipo (.cp-phone-pad-sm): 16 / 16 / 24, gap 16.
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        gap: 16,
        alignItems: "center",
    },
    // Anel de 3px em volta da câmera (box-shadow 0 0 0 3px brand do protótipo).
    cameraWrapper: {
        alignSelf: "center",
        borderRadius: radii.lg,
        borderWidth: 3,
        overflow: "hidden",
        backgroundColor: colors.brandDeep,
    },
    cameraFill: {
        width: "100%",
        height: "100%",
    },
    guide: {
        position: "absolute",
        left: "27%",
        top: "14%",
        width: "46%",
        height: "72%",
        borderRadius: 999,
        borderWidth: 2.5,
        borderStyle: "dashed",
        borderColor: "rgba(255,255,255,0.75)",
    },
    statusChip: {
        position: "absolute",
        left: 12,
        top: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: colors.surfaceRaised,
        ...shadow.float,
    },
    statusText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
    },
    diagnostics: {
        fontSize: 12,
        textAlign: "center",
    },
});
