import { useEffect } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";

type Props = {
    source: VideoSource;
    style?: StyleProp<ViewStyle>;
};

/**
 * Toca o vídeo de demonstração do exercício — silencioso, em loop, sem
 * controles, como um clipe curto que só mostra o movimento. Funciona com
 * asset local (`require(...)`) ou `{ uri }` remoto, então trocar por
 * hospedagem de verdade depois é só trocar a fonte, não o componente.
 */
export default function ExerciseVideo({ source, style }: Props) {
    const player = useVideoPlayer(source, (p) => {
        p.loop = true;
        p.muted = true;
    });

    useEffect(() => {
        // play() age sobre os <video> já montados (na web); chamado aqui, não
        // no setup do useVideoPlayer, porque nesse ponto o VideoView ainda não
        // montou o elemento — chamar play() cedo demais não tinha efeito nenhum.
        player.play();
    }, [player]);

    return (
        <VideoView
            player={player}
            style={[styles.video, style]}
            nativeControls={false}
            contentFit="cover"
        />
    );
}

const styles = StyleSheet.create({
    video: {
        width: "100%",
        height: "100%",
    },
});
