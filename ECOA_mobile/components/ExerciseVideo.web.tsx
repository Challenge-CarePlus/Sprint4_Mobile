import { MaterialIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import type { VideoSource } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, kidsColors, radii, shadow } from "../theme/tokens";

type Props = {
    source: VideoSource;
    style?: StyleProp<ViewStyle>;
    /** Trilha infantil: botão de play e véu em índigo, como o resto do kit. */
    kids?: boolean;
};

/**
 * Versão WEB do vídeo de demonstração: um <video> direto, criado já com os
 * atributos que os celulares exigem (`playsinline`, `muted`, `autoplay`, `loop`).
 *
 * O componente do expo-video gerava o <video> sem `playsinline` e reaproveitava
 * um player por tela; no celular (e depois de a câmera ter sido usada num
 * exercício anterior) os vídeos dos exercícios seguintes não apareciam. Aqui cada
 * exercício monta um elemento novo (`key` = endereço do vídeo) e, se o navegador
 * bloquear o início automático, aparece um botão de play. No app nativo continua
 * valendo `ExerciseVideo.tsx` (expo-video).
 */
export default function ExerciseVideo({ source, style, kids = false }: Props) {
    const uri = resolveUri(source);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [needsTap, setNeedsTap] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Sem video.load(): o elemento já nasce com src e autoplay (e é recriado por `key`
        // a cada exercício); load() reiniciava o download e abortava o play() em curso.
        let playing = false;
        setNeedsTap(false);
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.play().catch((error: Error) => {
            // AbortError = trocado/desmontado no meio; só NotAllowedError é bloqueio de autoplay.
            if (error?.name === "NotAllowedError") setNeedsTap(true);
        });

        // `video.paused` vira false assim que play() é chamado, mesmo com o arquivo ainda
        // baixando — em rede lenta a caixa ficava preta sem aviso. O que vale é o evento "playing".
        const id = setTimeout(() => {
            if (!playing) setNeedsTap(true);
        }, 2000);
        const onPlaying = () => {
            playing = true;
            setNeedsTap(false);
        };
        video.addEventListener("playing", onPlaying);

        return () => {
            clearTimeout(id);
            video.removeEventListener("playing", onPlaying);
        };
    }, [uri]);

    function handleTap() {
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        video.play().then(() => setNeedsTap(false)).catch(() => {});
    }

    return (
        <View style={[styles.container, style]}>
            {React.createElement("video", {
                key: uri,
                ref: videoRef,
                src: uri,
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true,
                preload: "auto",
                controls: false,
                disablePictureInPicture: true,
                style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#000",
                    display: "block",
                },
            })}

            {needsTap && (
                <Pressable
                    onPress={handleTap}
                    accessibilityRole="button"
                    accessibilityLabel="Tocar vídeo de demonstração"
                    style={[styles.tapOverlay, kids && { backgroundColor: "rgba(42,40,103,0.35)" }]}
                >
                    <View style={[styles.playButton, shadow.float]}>
                        <MaterialIcons
                            name="play-arrow"
                            size={34}
                            color={kids ? kidsColors.indigo : colors.brandDeep}
                        />
                    </View>
                </Pressable>
            )}
        </View>
    );
}

/** `require(...)` vira número (asset do Metro); `{ uri }` já é o endereço. */
function resolveUri(source: VideoSource): string {
    if (typeof source === "number") {
        return Asset.fromModule(source).uri;
    }
    if (typeof source === "string") {
        return source;
    }
    return (source && (source as { uri?: string }).uri) || "";
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
    },
    tapOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(6,27,56,0.35)",
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: radii.pill,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
});
