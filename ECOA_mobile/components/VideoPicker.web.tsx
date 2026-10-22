import { MaterialIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ExerciseVideo } from "../data/training";
import { apiErrorMessage } from "../services/trainingsApi";
import { uploadVideo } from "../services/videoUpload";
import { guessVideoMime, validateVideo } from "../services/videoRules";
import { fonts, radii, Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";
import { Alert } from "./ds";
import { IconCircle, Note } from "./admin";
import VideoPreview from "./VideoPreview";

type Props = {
    value: ExerciseVideo | null;
    onChange: (video: ExerciseVideo | null) => void;
};

/** Duração (s) lida do próprio arquivo, sem enviar nada. `null` se o navegador não conseguir. */
function readDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const probe = document.createElement("video");
        const done = (value: number | null) => {
            URL.revokeObjectURL(url);
            resolve(value);
        };
        probe.preload = "metadata";
        probe.onloadedmetadata = () => done(Number.isFinite(probe.duration) ? probe.duration : null);
        probe.onerror = () => done(null);
        probe.src = url;
    });
}

/**
 * Web (celular ou computador): "Gravar agora" abre a câmera do aparelho (`capture`) e "Escolher do celular"
 * abre a galeria. Valida tipo, tamanho e duração antes de enviar e mostra "enviando".
 */
export default function VideoPicker({ value, onChange }: Props) {
    const styles = useThemedStyles(makeStyles);
    const { colors, shadow } = useTheme();
    const recordRef = useRef<HTMLInputElement | null>(null);
    const galleryRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setError("");
        const mime = guessVideoMime(file.name, file.type);
        const problem = validateVideo({ size: file.size, mime, durationSeconds: await readDuration(file) });
        if (problem) {
            setError(problem);
            return;
        }

        setUploading(true);
        try {
            onChange(await uploadVideo({ kind: "web", file }));
        } catch (e) {
            setError(apiErrorMessage(e, "Não foi possível enviar o vídeo. Confira a conexão e tente de novo."));
        } finally {
            setUploading(false);
        }
    }

    const hidden = { position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" } as const;

    return (
        <View style={styles.wrap}>
            {React.createElement("input", {
                ref: recordRef,
                type: "file",
                accept: "video/*",
                capture: "user",
                style: hidden,
                tabIndex: -1,
                "aria-hidden": true,
                "data-testid": "video-record",
                onChange: handleFile,
            })}
            {React.createElement("input", {
                ref: galleryRef,
                type: "file",
                accept: "video/mp4,video/webm,video/quicktime,video/*",
                style: hidden,
                tabIndex: -1,
                "aria-hidden": true,
                "data-testid": "video-gallery",
                onChange: handleFile,
            })}

            {error !== "" && <Alert tone="danger">{error}</Alert>}

            {uploading ? (
                <View style={[styles.uploading, shadow.card]} accessibilityRole="progressbar" accessibilityLabel="Enviando vídeo">
                    <ActivityIndicator color={colors.brand} />
                    <Text style={styles.uploadingText}>Enviando vídeo…</Text>
                </View>
            ) : value ? (
                <View style={styles.wrap}>
                    <VideoPreview url={value.url} />
                    <View style={styles.row}>
                        <View style={styles.name}>
                            <MaterialIcons name="videocam" size={18} color={colors.inkMuted} />
                            <Text style={styles.nameText} numberOfLines={1}>
                                {value.name}
                            </Text>
                        </View>
                        <Pressable onPress={() => galleryRef.current?.click()} accessibilityRole="button" style={styles.link}>
                            <Text style={styles.linkText}>Trocar</Text>
                        </Pressable>
                        <Pressable onPress={() => onChange(null)} accessibilityRole="button" style={styles.link}>
                            <Text style={[styles.linkText, { color: colors.danger }]}>Remover</Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <>
                    <View style={styles.pick}>
                        <Pressable
                            onPress={() => recordRef.current?.click()}
                            accessibilityRole="button"
                            accessibilityLabel="Gravar agora. Abre a câmera do celular"
                            style={[styles.pickBtn, shadow.card]}
                        >
                            <IconCircle icon="videocam" size={52} />
                            <Text style={styles.pickTitle}>Gravar agora</Text>
                            <Text style={styles.pickSub}>Abre a câmera do celular</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => galleryRef.current?.click()}
                            accessibilityRole="button"
                            accessibilityLabel="Escolher do celular. Um vídeo da galeria"
                            style={[styles.pickBtn, shadow.card]}
                        >
                            <View style={styles.softIcon}>
                                <MaterialIcons name="file-upload" size={24} color={colors.brandInk} />
                            </View>
                            <Text style={styles.pickTitle}>Escolher do celular</Text>
                            <Text style={styles.pickSub}>Um vídeo da galeria</Text>
                        </Pressable>
                    </View>
                    <Note>
                        Sem vídeo, o paciente vê só o passo a passo. Grave de frente, com o rosto todo visível (até 60 s e 30 MB).
                    </Note>
                </>
            )}
        </View>
    );
}

const makeStyles = ({ colors }: Theme) =>
    StyleSheet.create({
        wrap: { gap: 10 },
        pick: { flexDirection: "row", gap: 10 },
        pickBtn: {
            flex: 1,
            alignItems: "center",
            gap: 6,
            paddingVertical: 18,
            paddingHorizontal: 10,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceRaised,
            minHeight: 48,
        },
        pickTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink, textAlign: "center" },
        pickSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, textAlign: "center" },
        softIcon: {
            width: 52,
            height: 52,
            borderRadius: radii.pill,
            backgroundColor: colors.brandSoft,
            alignItems: "center",
            justifyContent: "center",
        },
        uploading: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceRaised,
        },
        uploadingText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
        row: { flexDirection: "row", alignItems: "center", gap: 8 },
        name: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
        nameText: { flexShrink: 1, fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
        link: { minHeight: 48, justifyContent: "center", paddingHorizontal: 6 },
        linkText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.brandInk },
    });
