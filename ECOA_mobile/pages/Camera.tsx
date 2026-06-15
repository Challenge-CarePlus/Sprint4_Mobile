import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import {
    Camera as VisionCamera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
} from "react-native-vision-camera";

type Landmark = {
    x: number;
    y: number;
    z?: number;
};

export default function Camera() {
    const frontDevice = useCameraDevice("front");
    const backDevice = useCameraDevice("back");
    const device = frontDevice ?? backDevice;

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

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    useEffect(() => {
        if (!hasPermission || !device) {
            return;
        }

        const ws = new WebSocket("ws://10.0.2.2:3000/exercise");

        wsRef.current = ws;

        ws.onopen = () => {
            setFeedback("WebSocket conectado");
        };

        ws.onmessage = (event) => {
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
            setFeedback("Erro na conexão com o servidor");
        };

        ws.onclose = () => {
            setFeedback("Conexão encerrada");
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [hasPermission, device]);

    useEffect(() => {
        if (!hasPermission || !device) {
            return;
        }

        const interval = setInterval(async () => {
            const ws = wsRef.current;

            if (!ws || ws.readyState !== WebSocket.OPEN) {
                return;
            }

            if (isSendingFrameRef.current) {
                return;
            }

            isSendingFrameRef.current = true;

            try {
                console.log("Capturando foto...");

                const photo = await photoOutput.capturePhotoToFile(
                    {
                        enableShutterSound: false,
                    },
                    {}
                );

                console.log("Foto capturada:", photo.filePath);

                const uri = photo.filePath.startsWith("file://")
                    ? photo.filePath
                    : `file://${photo.filePath}`;

                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                console.log("Enviando frame para o backend...");

                ws.send(
                    JSON.stringify({
                        type: "frame",
                        image: base64,
                    })
                );

                await FileSystem.deleteAsync(uri, {
                    idempotent: true,
                });
            } catch (error) {
                console.log("Erro ao capturar/enviar frame:", error);
                setFeedback("Erro ao capturar frame da câmera");
            } finally {
                isSendingFrameRef.current = false;
            }
        }, 500);

        return () => {
            clearInterval(interval);
        };
    }, [hasPermission, device, photoOutput]);

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
                    isActive={true}
                    outputs={[photoOutput]}
                />

                <View style={styles.overlay} pointerEvents="none">
                    {landmarks.map((point, index) => {
                        const isFrontCamera = device.position === "front";

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

            <View style={styles.feedbackBox}>
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
});