import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import {
    Camera as VisionCamera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
} from "react-native-vision-camera";

import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
    AppSettings,
    DEFAULT_SETTINGS,
    getSettings,
} from "../services/settingsStorage";

type Landmark = {
    x: number;
    y: number;
    z?: number;
};

export default function Camera() {
    const isFocused = useIsFocused();
    const frontDevice = useCameraDevice("front");
    const backDevice = useCameraDevice("back");

    const photoOutput = usePhotoOutput({});

    const { hasPermission, requestPermission } = useCameraPermission();

    const wsRef = useRef<WebSocket | null>(null);
    const isSendingFrameRef = useRef(false);

    const [feedback, setFeedback] = useState("Posicione o rosto na câmera");
    const [landmarks, setLandmarks] = useState<Landmark[]>([]);
    const [cameraSize, setCameraSize] = useState({ width: 0, height: 0 });

    const [frameInfo, setFrameInfo] = useState({
        imageWidth: 0,
        imageHeight: 0,
    });

    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    const device =
        settings.preferredCamera === "front"
            ? frontDevice ?? backDevice
            : backDevice ?? frontDevice;

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            async function loadSettings() {
                const storedSettings = await getSettings();

                if (isActive) {
                    setSettings(storedSettings);
                }
            }

            loadSettings();

            return () => {
                isActive = false;
            };
        }, [])
    );

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    useEffect(() => {
        if (!isFocused || !hasPermission || !device) {
            return;
        }

        let isScreenActive = true;

        const ws = new WebSocket("ws://10.0.2.2:3000/exercise");

        wsRef.current = ws;

        ws.onopen = () => {
            if (isScreenActive) {
                setFeedback("WebSocket conectado");
            }
        };

        ws.onmessage = (event) => {
            if (!isScreenActive) {
                return;
            }

            const data = JSON.parse(event.data);

            if (data.type === "exercise_feedback") {
                setFeedback(data.feedback);
                setLandmarks(data.landmarks ?? []);

                if (data.imageWidth && data.imageHeight) {
                    setFrameInfo({
                        imageWidth: data.imageWidth,
                        imageHeight: data.imageHeight,
                    });
                }
            }
        };

        ws.onerror = () => {
            if (isScreenActive) {
                setFeedback("Erro na conexão com o servidor");
            }
        };

        ws.onclose = () => {
            if (isScreenActive) {
                setFeedback("Conexão encerrada");
            }
        };

        return () => {
            isScreenActive = false;

            ws.close();

            if (wsRef.current === ws) {
                wsRef.current = null;
            }
        };
    }, [isFocused, hasPermission, device]);

    useEffect(() => {
        if (!isFocused || !hasPermission || !device) {
            return;
        }

        let isScreenActive = true;

        const interval = setInterval(async () => {
            if (!isScreenActive) {
                return;
            }

            const ws = wsRef.current;

            if (!ws || ws.readyState !== WebSocket.OPEN) {
                return;
            }

            if (isSendingFrameRef.current) {
                return;
            }

            isSendingFrameRef.current = true;

            let uri: string | null = null;

            try {
                console.log("Capturando foto...");

                const photo = await photoOutput.capturePhotoToFile(
                    {
                        enableShutterSound: false,
                    },
                    {}
                );

                if (!isScreenActive) {
                    return;
                }

                console.log("Foto capturada:", photo.filePath);

                uri = photo.filePath.startsWith("file://")
                    ? photo.filePath
                    : `file://${photo.filePath}`;

                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                if (!isScreenActive) {
                    return;
                }

                const currentWs = wsRef.current;

                if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
                    return;
                }

                console.log("Enviando frame para o backend...");

                currentWs.send(
                    JSON.stringify({
                        type: "frame",
                        image: base64,
                    })
                );
            } catch (error) {
                console.log("Erro ao capturar/enviar frame:", error);

                if (isScreenActive) {
                    setFeedback("Erro ao capturar frame da câmera");
                }
            } finally {
                if (uri) {
                    await FileSystem.deleteAsync(uri, {
                        idempotent: true,
                    });
                }

                isSendingFrameRef.current = false;
            }
        }, settings.captureInterval);

        return () => {
            isScreenActive = false;
            clearInterval(interval);
            isSendingFrameRef.current = false;
        };
    }, [isFocused, hasPermission, device, photoOutput, settings.captureInterval]);

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text>Permissão da câmera necessária</Text>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.container}>
                <Text>Nenhuma câmera encontrada no dispositivo</Text>
            </View>
        );
    }

    function mapPointToPreviewContain(
        point: Landmark,
        imageWidth: number,
        imageHeight: number,
        viewWidth: number,
        viewHeight: number,
        mirrorX: boolean
    ) {
        let x = point.x;
        let y = point.y;

        if (mirrorX) {
            x = 1 - x;
        }

        const scale = Math.min(viewWidth / imageWidth, viewHeight / imageHeight);

        const ZOOM = 1.35;

        const renderedWidth = imageWidth * scale * ZOOM;
        const renderedHeight = imageHeight * scale * ZOOM;

        const offsetX = (viewWidth - renderedWidth) / 2;
        const offsetY = (viewHeight - renderedHeight) / 2;

        return {
            x: offsetX + x * renderedWidth,
            y: offsetY + y * renderedHeight,
        };
    }

    function rotatePoint(point: Landmark) {
        return {
            ...point,
            x: 1 - point.y,
            y: point.x,
        };
    }

    function getFeedbackStyle() {
        const normalizedFeedback = feedback.toLowerCase();

        if (!settings.visualFeedback) {
            return styles.feedbackDefault;
        }

        if (normalizedFeedback.includes("muito bom")) {
            return styles.feedbackSuccess;
        }

        if (normalizedFeedback.includes("abra")) {
            return styles.feedbackWarning;
        }

        if (normalizedFeedback.includes("feche")) {
            return styles.feedbackAttention;
        }

        if (
            normalizedFeedback.includes("erro") ||
            normalizedFeedback.includes("nenhum") ||
            normalizedFeedback.includes("encerrada")
        ) {
            return styles.feedbackError;
        }

        return styles.feedbackDefault;
    }

    return (
        <View style={styles.container}>
            <View
                style={styles.cameraArea}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setCameraSize({ width, height });
                }}
            >
                <VisionCamera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isFocused}
                    outputs={[photoOutput]}
                />

                <View style={styles.overlay} pointerEvents="none">
                    {settings.showLandmarks && landmarks.map((point, index) => {
                        const rotatedPoint = rotatePoint(point);

                        const mappedPoint = mapPointToPreviewContain(
                            rotatedPoint,
                            frameInfo.imageHeight || cameraSize.width,
                            frameInfo.imageWidth || cameraSize.height,
                            cameraSize.width,
                            cameraSize.height,
                            device.position === "front"
                        );

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.facePoint,
                                    {
                                        left: mappedPoint.x - 2,
                                        top: mappedPoint.y - 2,
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
            </View>

            <View style={[styles.feedbackBox, getFeedbackStyle()]}>
                <Text style={styles.feedbackText}>{feedback}</Text>
            </View>

            <View style={styles.bottomSpace} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 20,
    },

    cameraArea: {
        width: "78%",
        height: "65%",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#000",
        borderWidth: 3,
        borderColor: "#284A7D",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 6,
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
    },

    facePoint: {
        position: "absolute",
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: "#00ff88",
    },

    feedbackBox: {
        marginTop: 20,
        backgroundColor: "#284A7D",
        width: "60%",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 5,
        alignItems: "center",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },

    feedbackText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },

    bottomSpace: {
        height: 40,
    },

    feedbackDefault: {
        backgroundColor: "#284A7D",
    },

    feedbackSuccess: {
        backgroundColor: "#2E7D32",
    },

    feedbackWarning: {
        backgroundColor: "#F9A825",
    },

    feedbackAttention: {
        backgroundColor: "#EF6C00",
    },

    feedbackError: {
        backgroundColor: "#C62828",
    },
});