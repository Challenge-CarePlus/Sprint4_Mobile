import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import {
    Camera as VisionCamera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
} from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";

import FaceLandmarkerBridge, {
    FaceLandmarkerBridgeHandle,
    FaceLandmarkerResultMessage,
} from "../../vision/FaceLandmarkerBridge";
import { colors } from "../../theme/tokens";

const CAPTURE_INTERVAL_MS = 400;
const TRACKED_BLENDSHAPES = [
    "jawOpen",
    "mouthPucker",
    "mouthSmileLeft",
    "mouthSmileRight",
    "cheekPuff",
    "tongueOut",
];

/**
 * Tela de diagnóstico isolada (Fase 0 — spike técnico), não faz parte do
 * fluxo final do app. Mede a latência real do caminho câmera -> WebView ->
 * MediaPipe -> resultado, para validar se a ponte é rápida o bastante num
 * device físico antes de construir os detectores de exercício em cima dela.
 */
export default function VisionSpike() {
    const isFocused = useIsFocused();
    const device = useCameraDevice("front");
    const photoOutput = usePhotoOutput({});
    const { hasPermission, requestPermission } = useCameraPermission();

    const bridgeRef = useRef<FaceLandmarkerBridgeHandle>(null);
    const isSendingRef = useRef(false);
    const pendingSinceRef = useRef<Map<string, number>>(new Map());
    const latenciesRef = useRef<number[]>([]);

    const [status, setStatus] = useState("Inicializando câmera e MediaPipe...");
    const [bridgeReady, setBridgeReady] = useState(false);
    const [lastResult, setLastResult] = useState<FaceLandmarkerResultMessage | null>(null);
    const [stats, setStats] = useState({ frames: 0, avgLatencyMs: 0, lastLatencyMs: 0 });
    const [errorLog, setErrorLog] = useState<string[]>([]);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    const handleReady = useCallback(() => {
        setBridgeReady(true);
        setStatus("MediaPipe pronto — iniciando captura");
    }, []);

    const handleError = useCallback((message: string) => {
        setErrorLog((prev) => [...prev.slice(-9), message]);
        setStatus("Erro — ver log abaixo");
    }, []);

    const handleResult = useCallback((result: FaceLandmarkerResultMessage) => {
        const capturedAt = pendingSinceRef.current.get(result.requestId);
        pendingSinceRef.current.delete(result.requestId);

        const totalLatencyMs = capturedAt
            ? Date.now() - capturedAt
            : result.completedAt - result.sentAt;

        latenciesRef.current.push(totalLatencyMs);
        if (latenciesRef.current.length > 20) {
            latenciesRef.current.shift();
        }

        const avg =
            latenciesRef.current.reduce((sum, value) => sum + value, 0) /
            latenciesRef.current.length;

        setLastResult(result);
        setStats((prev) => ({
            frames: prev.frames + 1,
            avgLatencyMs: Math.round(avg),
            lastLatencyMs: totalLatencyMs,
        }));
        setStatus(result.faceDetected ? "Rosto detectado" : "Nenhum rosto detectado no frame");
    }, []);

    useEffect(() => {
        if (!isFocused || !hasPermission || !device || !bridgeReady) {
            return;
        }

        let isActive = true;

        const interval = setInterval(async () => {
            if (!isActive || isSendingRef.current) {
                return;
            }

            isSendingRef.current = true;
            let uri: string | null = null;

            try {
                const photo = await photoOutput.capturePhotoToFile(
                    { enableShutterSound: false },
                    {}
                );

                if (!isActive) {
                    return;
                }

                uri = photo.filePath.startsWith("file://")
                    ? photo.filePath
                    : `file://${photo.filePath}`;

                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                if (!isActive) {
                    return;
                }

                const capturedAt = Date.now();
                const requestId = bridgeRef.current?.detectFrame(base64);

                if (requestId) {
                    pendingSinceRef.current.set(requestId, capturedAt);
                }
            } catch (error) {
                handleError(`Captura de frame: ${String(error)}`);
            } finally {
                if (uri) {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                }

                isSendingRef.current = false;
            }
        }, CAPTURE_INTERVAL_MS);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [isFocused, hasPermission, device, bridgeReady, photoOutput, handleError]);

    const topBlendshapes = (lastResult?.blendshapes ?? [])
        .filter((blendshape) => TRACKED_BLENDSHAPES.includes(blendshape.name))
        .sort((a, b) => b.score - a.score);

    const approxFps =
        stats.avgLatencyMs > 0
            ? (1000 / Math.max(stats.avgLatencyMs, CAPTURE_INTERVAL_MS)).toFixed(1)
            : "-";

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text style={styles.status}>Permissão da câmera necessária</Text>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.container}>
                <Text style={styles.status}>Nenhuma câmera frontal encontrada</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Spike — MediaPipe via WebView</Text>
            <Text style={styles.status}>{status}</Text>

            <View style={styles.cameraArea}>
                <VisionCamera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isFocused}
                    outputs={[photoOutput]}
                />
            </View>

            <FaceLandmarkerBridge
                ref={bridgeRef}
                onReady={handleReady}
                onResult={handleResult}
                onError={handleError}
            />

            <View style={styles.statsBox}>
                <Text style={styles.statLine}>Frames processados: {stats.frames}</Text>
                <Text style={styles.statLine}>Latência última: {stats.lastLatencyMs} ms</Text>
                <Text style={styles.statLine}>Latência média (20 últimas): {stats.avgLatencyMs} ms</Text>
                <Text style={styles.statLine}>FPS efetivo aprox.: {approxFps}</Text>
            </View>

            {topBlendshapes.length > 0 && (
                <View style={styles.blendshapeBox}>
                    <Text style={styles.sectionLabel}>Blendshapes relevantes</Text>
                    {topBlendshapes.map((blendshape) => (
                        <Text key={blendshape.name} style={styles.statLine}>
                            {blendshape.name}: {blendshape.score.toFixed(2)}
                        </Text>
                    ))}
                </View>
            )}

            {errorLog.length > 0 && (
                <View style={styles.errorBox}>
                    <Text style={styles.sectionLabel}>Log de erros</Text>
                    {errorLog.map((message, index) => (
                        <Text key={index} style={styles.errorLine}>
                            {message}
                        </Text>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        gap: 16,
    },
    title: {
        fontFamily: "Montserrat_700Bold",
        fontSize: 20,
        color: colors.ink,
    },
    status: {
        fontSize: 14,
        color: colors.ink,
        fontWeight: "600",
    },
    cameraArea: {
        width: "100%",
        height: 260,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#000",
    },
    statsBox: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 14,
        gap: 4,
    },
    blendshapeBox: {
        backgroundColor: colors.brandSoft,
        borderRadius: 8,
        padding: 14,
        gap: 4,
    },
    errorBox: {
        backgroundColor: colors.dangerSoft,
        borderRadius: 8,
        padding: 14,
        gap: 4,
    },
    sectionLabel: {
        fontWeight: "700",
        color: colors.ink,
        marginBottom: 4,
    },
    statLine: {
        fontSize: 13,
        color: colors.ink,
    },
    errorLine: {
        fontSize: 12,
        color: colors.danger,
    },
});
