import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import {
    Camera as VisionCamera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
} from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";

import FaceLandmarkerBridge, {
    Blendshape,
    FaceLandmarkerBridgeHandle,
    FaceLandmarkerResultMessage,
} from "./FaceLandmarkerBridge";
import { colors } from "../theme/tokens";
import { DEFAULT_SETTINGS, getSettings } from "../services/settingsStorage";

export type FaceTrackingStatus = "initializing" | "ready" | "error";

const BASE_INTERVAL_MS = 400;
const MAX_INTERVAL_MS = 1500;
const SLOW_LATENCY_RATIO = 1.5;
const NO_FACE_WARNING_FRAMES = 6;

type Props = {
    isActive: boolean;
    cameraStyle?: StyleProp<ViewStyle>;
    onReading?: (blendshapes: Blendshape[], timestamp: number) => void;
    onStatusChange?: (status: FaceTrackingStatus) => void;
    onError?: (message: string) => void;
};

/**
 * Encapsula câmera nativa + ponte MediaPipe (WebView) + laço de captura.
 * Reduz a taxa de captura automaticamente se os frames estiverem demorando
 * demais (dispositivo lento) e avisa quando nenhum rosto é detectado por
 * vários frames seguidos (rosto fora do quadro ou pouca luz).
 */
export default function FaceTrackingCamera({
    isActive,
    cameraStyle,
    onReading,
    onStatusChange,
    onError,
}: Props) {
    const isFocused = useIsFocused();
    const frontDevice = useCameraDevice("front");
    const backDevice = useCameraDevice("back");
    const photoOutput = usePhotoOutput({});
    const { hasPermission, requestPermission } = useCameraPermission();

    const bridgeRef = useRef<FaceLandmarkerBridgeHandle>(null);
    const isSendingRef = useRef(false);
    const intervalMsRef = useRef(BASE_INTERVAL_MS);
    const noFaceStreakRef = useRef(0);

    const [bridgeReady, setBridgeReady] = useState(false);
    const [noFaceWarning, setNoFaceWarning] = useState(false);
    const [preferredCamera, setPreferredCamera] = useState(DEFAULT_SETTINGS.preferredCamera);

    const device = preferredCamera === "front" ? frontDevice ?? backDevice : backDevice ?? frontDevice;

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    useEffect(() => {
        getSettings().then((settings) => {
            setPreferredCamera(settings.preferredCamera);
            intervalMsRef.current = settings.captureInterval;
        });
    }, []);

    const handleReady = useCallback(() => {
        setBridgeReady(true);
        onStatusChange?.("ready");
    }, [onStatusChange]);

    const handleBridgeError = useCallback(
        (message: string) => {
            onError?.(message);
            onStatusChange?.("error");
        },
        [onError, onStatusChange]
    );

    const handleResult = useCallback(
        (result: FaceLandmarkerResultMessage) => {
            const roundTripMs = result.completedAt - result.sentAt;

            if (roundTripMs > intervalMsRef.current * SLOW_LATENCY_RATIO) {
                intervalMsRef.current = Math.min(intervalMsRef.current * 1.5, MAX_INTERVAL_MS);
            }

            if (result.faceDetected) {
                noFaceStreakRef.current = 0;
                setNoFaceWarning(false);
            } else {
                noFaceStreakRef.current += 1;
                if (noFaceStreakRef.current >= NO_FACE_WARNING_FRAMES) {
                    setNoFaceWarning(true);
                }
            }

            onReading?.(result.blendshapes, result.completedAt);
        },
        [onReading]
    );

    useEffect(() => {
        if (!isActive || !isFocused || !hasPermission || !device || !bridgeReady) {
            return;
        }

        let isAlive = true;
        let timeoutId: ReturnType<typeof setTimeout>;

        async function captureAndSend() {
            if (!isAlive) {
                return;
            }

            if (isSendingRef.current) {
                scheduleNext();
                return;
            }

            isSendingRef.current = true;
            let uri: string | null = null;

            try {
                const photo = await photoOutput.capturePhotoToFile({ enableShutterSound: false }, {});
                if (!isAlive) return;

                uri = photo.filePath.startsWith("file://") ? photo.filePath : `file://${photo.filePath}`;

                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                if (!isAlive) return;

                bridgeRef.current?.detectFrame(base64);
            } catch (error) {
                onError?.(`Captura de frame: ${String(error)}`);
            } finally {
                if (uri) {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                }
                isSendingRef.current = false;
                scheduleNext();
            }
        }

        function scheduleNext() {
            if (!isAlive) return;
            timeoutId = setTimeout(captureAndSend, intervalMsRef.current);
        }

        scheduleNext();

        return () => {
            isAlive = false;
            clearTimeout(timeoutId);
        };
    }, [isActive, isFocused, hasPermission, device, bridgeReady, photoOutput, onError]);

    if (!hasPermission) {
        return (
            <View style={[styles.placeholder, cameraStyle]}>
                <Text style={styles.placeholderText}>
                    Precisamos da sua permissão de câmera para continuar.
                </Text>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={[styles.placeholder, cameraStyle]}>
                <Text style={styles.placeholderText}>Nenhuma câmera frontal encontrada.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.cameraArea, cameraStyle]}>
            <VisionCamera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isFocused && isActive}
                outputs={[photoOutput]}
            />

            <FaceLandmarkerBridge
                ref={bridgeRef}
                onReady={handleReady}
                onResult={handleResult}
                onError={handleBridgeError}
            />

            {!bridgeReady && (
                <View style={styles.overlay}>
                    <ActivityIndicator color={colors.white} />
                    <Text style={styles.overlayText}>Preparando câmera...</Text>
                </View>
            )}

            {bridgeReady && noFaceWarning && (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>
                        Não conseguimos ver seu rosto. Aproxime-se e procure um ambiente bem
                        iluminado.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    cameraArea: {
        width: "100%",
        height: 280,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#000",
        borderWidth: 3,
        borderColor: colors.primary700,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 8,
    },
    overlayText: {
        color: colors.white,
        textAlign: "center",
        fontWeight: "600",
    },
    placeholder: {
        width: "100%",
        height: 280,
        borderRadius: 12,
        backgroundColor: colors.neutral100,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    placeholderText: {
        color: colors.neutral900,
        textAlign: "center",
        fontWeight: "600",
    },
});
