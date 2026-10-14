import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Asset } from "expo-asset";
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";

import { colors } from "../theme/tokens";
import { getSettings } from "../services/settingsStorage";

export type FaceTrackingStatus = "initializing" | "ready" | "error";

type Blendshape = { name: string; score: number };

type Props = {
    isActive: boolean;
    cameraStyle?: StyleProp<ViewStyle>;
    onReading?: (blendshapes: Blendshape[], timestamp: number) => void;
    onStatusChange?: (status: FaceTrackingStatus) => void;
    onError?: (message: string) => void;
};

const NO_FACE_WARNING_FRAMES = 20;

/**
 * Variante .web.tsx (Metro escolhe automaticamente ao buildar para web).
 *
 * Diferente da versão nativa (câmera do celular via react-native-vision-camera
 * + WebView oculta), no navegador o @mediapipe/tasks-vision roda direto no
 * mesmo contexto JS da página — não precisa de ponte nenhuma. Usa a câmera do
 * próprio computador/tablet via getUserMedia e processa o <video> ao vivo com
 * runningMode "VIDEO" (bem mais rápido que o round-trip de fotos do app
 * nativo). Serve só para teste no navegador: o app de produção é o nativo.
 *
 * O runtime wasm do MediaPipe vem do CDN oficial aqui (não do bundle local
 * usado no app nativo) — é só código de biblioteca, não imagem de rosto, e
 * simplifica bastante rodar no navegador. O modelo .task continua sendo o
 * mesmo arquivo bundlado localmente usado pelo app nativo.
 */
export default function FaceTrackingCamera({
    isActive,
    cameraStyle,
    onReading,
    onStatusChange,
    onError,
}: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const landmarkerRef = useRef<FaceLandmarkerType | null>(null);
    const noFaceStreakRef = useRef(0);
    const isActiveRef = useRef(isActive);

    const [status, setStatus] = useState<FaceTrackingStatus>("initializing");
    const [noFaceWarning, setNoFaceWarning] = useState(false);
    const [preferredFacing, setPreferredFacing] = useState<"user" | "environment">("user");

    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    useEffect(() => {
        getSettings().then((settings) => {
            setPreferredFacing(settings.preferredCamera === "front" ? "user" : "environment");
        });
    }, []);

    useEffect(() => {
        if (!isActive) {
            return;
        }

        let cancelled = false;

        async function start() {
            try {
                const landmarker = await getSharedFaceLandmarker();
                if (cancelled) return;
                landmarkerRef.current = landmarker;

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: preferredFacing },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setStatus("ready");
                onStatusChange?.("ready");
                loop();
            } catch (error) {
                if (cancelled) return;
                setStatus("error");
                onStatusChange?.("error");
                onError?.(`Não foi possível acessar a câmera do computador: ${String(error)}`);
            }
        }

        function loop() {
            if (cancelled || !isActiveRef.current) {
                return;
            }

            const video = videoRef.current;
            const landmarker = landmarkerRef.current;

            if (video && landmarker && video.readyState >= 2) {
                const timestamp = performance.now();
                const result = landmarker.detectForVideo(video, timestamp);

                const blendshapes: Blendshape[] = (
                    result.faceBlendshapes[0]?.categories ?? []
                ).map((category) => ({ name: category.categoryName, score: category.score }));

                const faceDetected = result.faceLandmarks.length > 0;

                if (faceDetected) {
                    noFaceStreakRef.current = 0;
                    setNoFaceWarning(false);
                } else {
                    noFaceStreakRef.current += 1;
                    if (noFaceStreakRef.current >= NO_FACE_WARNING_FRAMES) {
                        setNoFaceWarning(true);
                    }
                }

                onReading?.(blendshapes, timestamp);
            }

            rafRef.current = requestAnimationFrame(loop);
        }

        start();

        return () => {
            cancelled = true;
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, preferredFacing]);

    return (
        <View style={[styles.cameraArea, cameraStyle]}>
            {React.createElement("video", {
                ref: videoRef,
                autoPlay: true,
                playsInline: true,
                muted: true,
                style: {
                    width: "100%",
                    height: "100%",
                    // "contain" (não "cover"): garante que o rosto inteiro apareça, mesmo
                    // que a proporção da webcam não bata com a da caixa — "cover" cortava
                    // as bordas do vídeo pra preencher o quadro, e cortava parte do rosto.
                    objectFit: "contain",
                    backgroundColor: "#000",
                    transform: "scaleX(-1)",
                },
            })}

            {status !== "ready" && (
                <View style={styles.overlay}>
                    {status === "initializing" && <ActivityIndicator color={colors.white} />}
                    <Text style={styles.overlayText}>
                        {status === "error"
                            ? "Câmera indisponível. Verifique a permissão do navegador."
                            : "Preparando câmera e MediaPipe..."}
                    </Text>
                </View>
            )}

            {status === "ready" && noFaceWarning && (
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

let sharedLandmarkerPromise: Promise<FaceLandmarkerType> | null = null;

function getSharedFaceLandmarker(): Promise<FaceLandmarkerType> {
    if (!sharedLandmarkerPromise) {
        sharedLandmarkerPromise = createFaceLandmarker();
    }

    return sharedLandmarkerPromise;
}

// Metro tenta analisar estaticamente qualquer import()/require() do pacote
// @mediapipe/tasks-vision e falha, porque o próprio vision_bundle.mjs da
// biblioteca faz um import() dinâmico internamente (carrega o loader do wasm
// por URL calculada em runtime) — algo que bundlers como o Metro não
// suportam de forma estática. O truque de `new Function("return import(...)")`
// força um import() de verdade, resolvido pelo motor JS do navegador em
// runtime (não pelo Metro), exatamente como uma tag <script type="module">
// carregaria. Por isso o runtime do MediaPipe na web vem do CDN oficial, não
// do bundle local usado pelo app nativo.
const dynamicImport = new Function(
    "specifier",
    "return import(/* webpackIgnore: true */ specifier)"
) as (specifier: string) => Promise<typeof import("@mediapipe/tasks-vision")>;

async function createFaceLandmarker(): Promise<FaceLandmarkerType> {
    const { FilesetResolver, FaceLandmarker } = await dynamicImport(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/vision_bundle.mjs"
    );

    const modelAsset = Asset.fromModule(require("../assets/mediapipe/face_landmarker.task"));
    await modelAsset.downloadAsync();

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );

    return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: modelAsset.uri ?? modelAsset.localUri ?? "",
            delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
    });
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
});
