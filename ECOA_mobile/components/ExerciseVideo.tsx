import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";

import { colors, kidsColors, radii, shadow } from "../theme/tokens";

type Props = {
    source: VideoSource;
    style?: StyleProp<ViewStyle>;
    /** Trilha infantil: botão de play e véu em índigo, como o resto do kit. */
    kids?: boolean;
};

/**
 * Toca o vídeo de demonstração do exercício — silencioso, em loop, sem
 * controles, como um clipe curto que só mostra o movimento. Funciona com
 * asset local (`require(...)`) ou `{ uri }` remoto, então trocar por
 * hospedagem de verdade depois é só trocar a fonte, não o componente.
 *
 * Celular (web): o <video> gerado não vinha com `playsinline` — no iPhone isso
 * impede a reprodução embutida — e navegadores móveis bloqueiam o início
 * automático (economia de bateria, dados). Então o atributo é forçado no
 * elemento e, se o vídeo não começar sozinho, aparece um botão de play para
 * tocar com um toque.
 */
export default function ExerciseVideo({ source, style, kids = false }: Props) {
    const player = useVideoPlayer(source, (p) => {
        p.loop = true;
        p.muted = true;
    });
    const containerRef = useRef<View>(null);
    const [needsTap, setNeedsTap] = useState(false);

    useEffect(() => {
        // play() age sobre os <video> já montados (na web); chamado aqui, não
        // no setup do useVideoPlayer, porque nesse ponto o VideoView ainda não
        // montou o elemento — chamar play() cedo demais não tinha efeito nenhum.
        player.play();

        if (Platform.OS !== "web") {
            return;
        }

        // Atributos que o iOS/Android exigem para tocar embutido e sem som.
        const node = containerRef.current as unknown as HTMLElement | null;
        node?.querySelectorAll("video").forEach((video) => {
            video.setAttribute("playsinline", "");
            video.setAttribute("webkit-playsinline", "");
            video.setAttribute("muted", "");
            video.muted = true;
            video.playsInline = true;
            video.play().catch(() => {});
        });

        // Se ainda não começou sozinho, oferece o toque (bloqueio de autoplay).
        const id = setTimeout(() => {
            if (!player.playing) {
                setNeedsTap(true);
            }
        }, 1800);

        // Se o vídeo começar depois do prazo (conexão lenta), o botão some sozinho.
        const subscription = player.addListener("playingChange", ({ isPlaying }) => {
            if (isPlaying) {
                setNeedsTap(false);
            }
        });

        return () => {
            clearTimeout(id);
            subscription.remove();
        };
    }, [player]);

    function handleTap() {
        setNeedsTap(false);
        const node = containerRef.current as unknown as HTMLElement | null;
        node?.querySelectorAll("video").forEach((video) => {
            video.muted = true;
            video.play().catch(() => {});
        });
        player.play();
    }

    return (
        <View ref={containerRef} style={[styles.container, style]}>
            <VideoView
                player={player}
                style={styles.video}
                nativeControls={false}
                contentFit="contain"
            />

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

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
    },
    video: {
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
