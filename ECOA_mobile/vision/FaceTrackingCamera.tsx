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
import { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";
import { DEFAULT_SETTINGS, getSettings } from "../services/settingsStorage";

export type FaceTrackingStatus = "initializing" | "ready" | "error";

const BASE_INTERVAL_MS = 400;
const MAX_INTERVAL_MS = 1500;
const SLOW_LATENCY_RATIO = 1.5;
const FAST_LATENCY_RATIO = 0.6;
const FAST_RECOVERY_STREAK = 5;
const NO_FACE_WARNING_FRAMES = 6;

type Props = {
    isActive: boolean;
    cameraStyle?: StyleProp<ViewStyle>;
    /** Cor do contorno da câmera — usada pra refletir o feedback do exercício (aguardando/segurando/sucesso) sem precisar de uma caixa de texto separada. */
    borderColor?: string;
    /**
     * Só tem efeito na variante web (`.web.tsx`) — a câmera nativa já ocupa a
     * caixa inteira sem tarja preta, então essa tela não precisa ajustar nada
     * aqui. Mantido na assinatura só pra bater com a variante web (o
     * typecheck resolve pra este arquivo, não pro `.web.tsx`).
     */
    onAspectRatioChange?: (ratio: number) => void;
    onReading?: (blendshapes: Blendshape[], timestamp: number) => void;
    onStatusChange?: (status: FaceTrackingStatus) => void;
    onError?: (message: string) => void;
    /** `false` quando o aviso de "rosto não detectado" está ativo. */
    onFaceVisibilityChange?: (visible: boolean) => void;
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
    borderColor,
    onReading,
    onStatusChange,
    onError,
    onFaceVisibilityChange,
}: Props) {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const isFocused = useIsFocused();
    const frontDevice = useCameraDevice("front");
    const backDevice = useCameraDevice("back");
    const photoOutput = usePhotoOutput({});
    const { hasPermission, requestPermission } = useCameraPermission();

    const bridgeRef = useRef<FaceLandmarkerBridgeHandle>(null);
    const isSendingRef = useRef(false);
    const baseIntervalRef = useRef(BASE_INTERVAL_MS);
    const intervalMsRef = useRef(BASE_INTERVAL_MS);
    const fastStreakRef = useRef(0);
    const noFaceStreakRef = useRef(0);

    const [bridgeReady, setBridgeReady] = useState(false);
    const [noFaceWarning, setNoFaceWarning] = useState(false);

    useEffect(() => {
        onFaceVisibilityChange?.(!noFaceWarning);
    }, [noFaceWarning, onFaceVisibilityChange]);
    const [preferredCamera, setPreferredCamera] = useState(DEFAULT_SETTINGS.preferredCamera);

    const device = preferredCamera === "front" ? frontDevice ?? backDevice : backDevice ?? frontDevice;
    const usingFallbackCamera =
        (preferredCamera === "front" && !frontDevice && Boolean(backDevice)) ||
        (preferredCamera === "back" && !backDevice && Boolean(frontDevice));

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    useEffect(() => {
        getSettings().then((settings) => {
            setPreferredCamera(settings.preferredCamera);
            baseIntervalRef.current = settings.captureInterval;
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
                // Frame lento: reduz a taxa de captura imediatamente.
                intervalMsRef.current = Math.min(intervalMsRef.current * 1.5, MAX_INTERVAL_MS);
                fastStreakRef.current = 0;
            } else if (roundTripMs < intervalMsRef.current * FAST_LATENCY_RATIO) {
                // Vários frames rápidos seguidos: recupera a taxa aos poucos,
                // nunca abaixo do intervalo configurado nas Configurações. Sem
                // isso, um único soluço no aquecimento do MediaPipe deixava o
                // device travado na taxa mais lenta pelo resto da sessão.
                fastStreakRef.current += 1;

                if (
                    fastStreakRef.current >= FAST_RECOVERY_STREAK &&
                    intervalMsRef.current > baseIntervalRef.current
                ) {
                    intervalMsRef.current = Math.max(
                        intervalMsRef.current / 1.3,
                        baseIntervalRef.current
                    );
                    fastStreakRef.current = 0;
                }
            } else {
                fastStreakRef.current = 0;
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
        <View style={[styles.cameraArea, cameraStyle, borderColor ? { borderColor } : null]}>
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

            {usingFallbackCamera && (
                <View style={styles.fallbackBadge}>
                    <Text style={styles.fallbackBadgeText}>
                        Câmera {preferredCamera === "front" ? "frontal" : "traseira"} indisponível —
                        usando a {preferredCamera === "front" ? "traseira" : "frontal"}
                    </Text>
                </View>
            )}
        </View>
    );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    cameraArea: {
        width: "100%",
        height: 280,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#000",
        borderWidth: 3,
        borderColor: colors.brand,
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
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    placeholderText: {
        color: colors.ink,
        textAlign: "center",
        fontWeight: "600",
    },
    fallbackBadge: {
        position: "absolute",
        top: 8,
        left: 8,
        right: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    fallbackBadgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "600",
        textAlign: "center",
    },
});
