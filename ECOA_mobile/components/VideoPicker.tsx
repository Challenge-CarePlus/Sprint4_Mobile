import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ExerciseVideo } from "../data/training";
import { apiErrorMessage } from "../services/trainingsApi";
import { uploadVideo } from "../services/videoUpload";
import { guessVideoMime, MAX_VIDEO_SECONDS, validateVideo } from "../services/videoRules";
import { fonts, radii, Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";
import { Alert } from "./ds";
import { IconCircle, Note } from "./admin";
import VideoPreview from "./VideoPreview";

type Props = {
    value: ExerciseVideo | null;
    onChange: (video: ExerciseVideo | null) => void;
};

/**
 * App (Android/iOS): "Gravar agora" abre a câmera e "Escolher do celular" a galeria, via
 * expo-image-picker. Valida tipo, tamanho e duração antes de enviar e mostra "enviando".
 */
export default function VideoPicker({ value, onChange }: Props) {
    const styles = useThemedStyles(makeStyles);
    const { colors, shadow } = useTheme();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function pick(source: "camera" | "library") {
        setError("");

        const permission =
            source === "camera"
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            setError(
                source === "camera"
                    ? "Sem permissão para usar a câmera. Libere nas configurações do aparelho."
                    : "Sem permissão para abrir a galeria. Libere nas configurações do aparelho."
            );
            return;
        }

        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ["videos"],
            videoMaxDuration: MAX_VIDEO_SECONDS,
            allowsEditing: false,
        };
        const result =
            source === "camera"
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

        const asset = result.canceled ? null : result.assets[0];
        if (!asset) return;

        const name = asset.fileName ?? `video-${Date.now()}.mp4`;
        const mime = guessVideoMime(name, asset.mimeType);
        const problem = validateVideo({
            size: asset.fileSize ?? 0,
            mime,
            durationSeconds: asset.duration != null ? asset.duration / 1000 : null,
        });
        if (problem) {
            setError(problem);
            return;
        }

        setUploading(true);
        try {
            onChange(await uploadVideo({ kind: "native", uri: asset.uri, name, mime }));
        } catch (e) {
            setError(apiErrorMessage(e, "Não foi possível enviar o vídeo. Confira a conexão e tente de novo."));
        } finally {
            setUploading(false);
        }
    }

    return (
        <View style={styles.wrap}>
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
                        <Pressable onPress={() => pick("library")} accessibilityRole="button" style={styles.link}>
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
                            onPress={() => pick("camera")}
                            accessibilityRole="button"
                            accessibilityLabel="Gravar agora. Abre a câmera do celular"
                            style={[styles.pickBtn, shadow.card]}
                        >
                            <IconCircle icon="videocam" size={52} />
                            <Text style={styles.pickTitle}>Gravar agora</Text>
                            <Text style={styles.pickSub}>Abre a câmera do celular</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => pick("library")}
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
