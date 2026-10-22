import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";

import { resolveMediaUrl } from "../services/trainingsApi";
import { radii } from "../theme/tokens";

/** Prévia do vídeo no formulário (app): 16:9, com controles nativos. */
export default function VideoPreview({ url }: { url: string }) {
    const player = useVideoPlayer({ uri: resolveMediaUrl(url) }, (p) => {
        p.loop = false;
        p.muted = true;
    });

    return (
        <View style={styles.box} accessibilityLabel="Prévia do vídeo de demonstração">
            <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
        </View>
    );
}

const styles = StyleSheet.create({
    box: { width: "100%", aspectRatio: 16 / 9, borderRadius: radii.lg, overflow: "hidden", backgroundColor: "#061B38" },
    video: { width: "100%", height: "100%" },
});
