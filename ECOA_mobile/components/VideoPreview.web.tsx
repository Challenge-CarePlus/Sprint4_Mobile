import React from "react";
import { StyleSheet, View } from "react-native";

import { resolveMediaUrl } from "../services/trainingsApi";
import { radii } from "../theme/tokens";

/** Prévia do vídeo no formulário (px-video): 16:9, com controles. */
export default function VideoPreview({ url }: { url: string }) {
    return (
        <View style={styles.box} accessibilityLabel="Prévia do vídeo de demonstração">
            {React.createElement("video", {
                key: url,
                src: resolveMediaUrl(url),
                controls: true,
                playsInline: true,
                preload: "metadata",
                style: { width: "100%", height: "100%", objectFit: "cover", display: "block", backgroundColor: "#061B38" },
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    box: { width: "100%", aspectRatio: 16 / 9, borderRadius: radii.lg, overflow: "hidden", backgroundColor: "#061B38" },
});
