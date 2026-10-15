import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import CircularProgress from "../../components/CircularProgress";
import FaceTrackingCamera, { FaceTrackingStatus } from "../../vision/FaceTrackingCamera";
import { getCameraBoxSize } from "../../vision/cameraBoxSize";
import type { Blendshape } from "../../vision/FaceLandmarkerBridge";
import { CALIBRATION_DURATION_MS, CalibrationCollector } from "../../vision/calibration";
import { setCalibration } from "../../vision/calibrationStore";
import { speak } from "../../services/speech";
import { colors, fonts, radii } from "../../theme/tokens";

type RouteParams = {
    trackId: string;
    exerciseIndex: number;
};

const CALIBRATION_CONTENT_PADDING = 56; // paddingHorizontal: 28 dos dois lados

export default function CalibrationScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { trackId, exerciseIndex } = route.params as RouteParams;

    const collectorRef = useRef(new CalibrationCollector());
    const hasStartedRef = useRef(false);
    const hasFinishedRef = useRef(false);

    const [status, setStatus] = useState<FaceTrackingStatus>("initializing");
    const [secondsRemaining, setSecondsRemaining] = useState(
        Math.ceil(CALIBRATION_DURATION_MS / 1000)
    );
    const [progress, setProgress] = useState(0);
    const [collecting, setCollecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cameraAspect, setCameraAspect] = useState<number | null>(null);

    const finishCalibration = useCallback(() => {
        if (hasFinishedRef.current) {
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
        speak("Relaxe o rosto. Vamos calibrar por 3 segundos.");
        setCollecting(true);

        const startedAt = Date.now();
        const tickInterval = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, CALIBRATION_DURATION_MS - elapsed);
            setSecondsRemaining(Math.ceil(remaining / 1000));
            setProgress(Math.min(1, elapsed / CALIBRATION_DURATION_MS));
        }, 100);

        const finishTimeout = setTimeout(() => {
            setCollecting(false);
            setProgress(1);
            clearInterval(tickInterval);
            finishCalibration();
        }, CALIBRATION_DURATION_MS);

        return () => {
            clearInterval(tickInterval);
            clearTimeout(finishTimeout);
        };
    }, [status, finishCalibration]);

    const handleReading = useCallback(
        (blendshapes: Blendshape[]) => {
            if (collecting) {
                collectorRef.current.addSample(blendshapes);
            }
        },
        [collecting]
    );

    const cameraBox = getCameraBoxSize(0.42, 280, 440, cameraAspect, CALIBRATION_CONTENT_PADDING);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Calibração</Text>
            <Text style={styles.subtitle}>
                Relaxe o rosto e olhe para a câmera. Isso ajusta a detecção ao seu rosto.
            </Text>

            <View style={[styles.cameraWrapper, cameraBox]}>
                <FaceTrackingCamera
                    isActive
                    onReading={handleReading}
                    onStatusChange={setStatus}
                    onError={setErrorMessage}
                    onAspectRatioChange={setCameraAspect}
                    cameraStyle={styles.cameraFill}
                />
            </View>

            {status === "ready" && (
                <CircularProgress
                    progress={progress}
                    label={collecting ? `${secondsRemaining}s` : "Pronto!"}
                />
            )}

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
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
        paddingTop: 40,
        paddingBottom: 40,
        gap: 20,
        alignItems: "center",
    },
    cameraWrapper: {
        alignSelf: "center",
        borderRadius: radii.lg,
        overflow: "hidden",
    },
    cameraFill: {
        width: "100%",
        height: "100%",
        borderRadius: radii.lg,
    },
    title: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 26,
        color: colors.ink,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: fonts.body,
        color: colors.inkMuted,
        textAlign: "center",
        lineHeight: 20,
    },
    error: {
        color: colors.danger,
        textAlign: "center",
    },
});
