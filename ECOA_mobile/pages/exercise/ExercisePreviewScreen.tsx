import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { ActionBar, Alert, RepChip, StepBadge } from "../../components/ds";
import ExerciseVideo from "../../components/ExerciseVideo";
import { getExerciseById } from "../../data/exercises";
import { TRACKS } from "../../data/tracks";
import { colors, fonts, gradients, kidsColors, kidsFonts, radii, shadow } from "../../theme/tokens";
import { getPresentation } from "../../theme/ageGroupThemes";
import { getTrailTheme } from "../../theme/trailThemes";
import { hasCalibration } from "../../vision/calibrationStore";

type RouteParams = {
    trackId: string;
    exerciseIndex: number;
};

export default function ExercisePreviewScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { trackId, exerciseIndex } = route.params as RouteParams;

    const track = TRACKS.find((t) => t.id === trackId);
    const exerciseId = track?.exerciseIds[exerciseIndex];
    const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;

    if (!track || !exercise) {
        return (
            <View style={styles.container}>
                <Text style={styles.paragraph}>Exercício não encontrado.</Text>
            </View>
        );
    }

    const presentation = getPresentation(track.ageGroup);
    const trail = getTrailTheme(track.ageGroup);
    const kids = track.ageGroup === "children";
    const senior = track.ageGroup === "elderly";
    const calibrated = hasCalibration(trackId);

    function handleStart() {
        if (calibrated) {
            (navigation as any).replace("EXERCISE_SESSION", { trackId, exerciseIndex });
        } else {
            (navigation as any).replace("CALIBRATION", { trackId, exerciseIndex });
        }
    }

    const repetitionLabel = [
        exercise.repetitions ? `${exercise.repetitions}×` : null,
        exercise.durationSeconds ? `${exercise.durationSeconds} s cada` : null,
    ]
        .filter(Boolean)
        .join(" · ");

    // Protótipo (.cp-ex-title): 24/30 em todas as trilhas; Idosos 28/34 e texto 18px.
    const titleSize = senior ? 28 : 24;
    const titleLine = senior ? 34 : 30;

    return (
        <View style={[styles.container, { backgroundColor: trail.background }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <StepBadge kids={kids}>
                    Exercício {exerciseIndex + 1} de {track.exerciseIds.length} · {track.name}
                </StepBadge>

                {exercise.demoVideoAsset ? (
                    <View style={[styles.video, shadow.hero]} accessibilityLabel="Vídeo de demonstração">
                        <ExerciseVideo source={exercise.demoVideoAsset} style={styles.videoPlayer} />
                    </View>
                ) : (
                    <LinearGradient
                        colors={kids ? [kidsColors.indigo, kidsColors.indigo] : gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.video,
                            styles.videoPlaceholder,
                            kids ? [{ borderRadius: radii.md }, shadow.kids] : shadow.hero,
                        ]}
                        accessibilityLabel="Vídeo de demonstração"
                    >
                        {kids && (
                            <Svg width={170} height={170} style={styles.kidsRings} pointerEvents="none">
                                <Circle cx={85} cy={85} r={41} stroke={kidsColors.green} strokeWidth={10} fill="none" />
                                <Circle cx={85} cy={85} r={57} stroke={kidsColors.yellow} strokeWidth={10} fill="none" />
                                <Circle cx={85} cy={85} r={73} stroke={kidsColors.orange} strokeWidth={10} fill="none" />
                            </Svg>
                        )}
                        <View style={styles.playButton}>
                            <MaterialIcons
                                name="play-arrow"
                                size={34}
                                color={kids ? kidsColors.indigo : colors.brandDeep}
                            />
                        </View>
                        <Text style={[styles.videoLabel, { color: kids ? kidsColors.indigo : colors.onHero }]}>
                            Vídeo de demonstração
                        </Text>
                    </LinearGradient>
                )}

                <Text
                    style={[
                        styles.title,
                        {
                            fontFamily: trail.titleFont,
                            color: trail.title,
                            fontSize: titleSize,
                            lineHeight: titleLine,
                        },
                    ]}
                    accessibilityRole="header"
                >
                    {exercise.name}
                </Text>

                <Text
                    style={[
                        styles.subtitle,
                        { color: trail.textMuted, fontSize: senior ? 17 : 14, lineHeight: senior ? 24 : 20 },
                    ]}
                >
                    {exercise.therapeuticGoal}
                </Text>

                {exercise.professionalGuidanceRecommended && (
                    <View style={styles.guidanceBanner}>
                        <MaterialIcons name="info" size={20} color={colors.warning} />
                        <Text style={styles.guidanceText}>
                            Recomendado com orientação do(a) fonoaudiólogo(a).
                        </Text>
                    </View>
                )}

                <View style={[styles.steps, kids ? shadow.kids : shadow.card, { backgroundColor: trail.card }]}>
                    {exercise.instructions.map((instruction, index) => (
                        <View key={index} style={styles.stepRow}>
                            <View
                                style={[
                                    styles.stepNumber,
                                    senior && styles.stepNumberLarge,
                                    { backgroundColor: trail.accent },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.stepNumberText,
                                        { color: trail.onAccent, fontSize: senior ? 16 : 13 },
                                        kids && { fontFamily: kidsFonts.display },
                                    ]}
                                >
                                    {index + 1}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.stepText,
                                    { color: trail.cardText, fontSize: senior ? 18 : 15, lineHeight: senior ? 27 : 22 },
                                    kids && { fontFamily: kidsFonts.body },
                                ]}
                            >
                                {instruction}
                            </Text>
                        </View>
                    ))}
                </View>

                {repetitionLabel ? <RepChip kids={kids}>{repetitionLabel}</RepChip> : null}

                {exercise.validationNote ? (
                    <View style={styles.note}>
                        <Alert tone="info">{exercise.validationNote}</Alert>
                    </View>
                ) : null}
            </ScrollView>

            <LinearGradient
                colors={[`${trail.background}00`, trail.background]}
                locations={[0, 0.45]}
                style={styles.dock}
                pointerEvents="box-none"
            >
                <ActionBar
                    title={calibrated ? "Iniciar exercício" : "Começar calibração"}
                    subtitle={calibrated ? "Tudo pronto para começar" : "Próximo passo: ajustar a câmera"}
                    onPress={handleStart}
                    kids={kids}
                    large={senior}
                />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 112,
        gap: 16,
        alignItems: "stretch",
    },
    video: {
        width: "100%",
        maxWidth: 560,
        aspectRatio: 16 / 9,
        alignSelf: "center",
        borderRadius: radii.lg,
        overflow: "hidden",
        backgroundColor: colors.brandDeep,
    },
    kidsRings: { position: "absolute", right: -50, top: -50 },
    videoPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    videoPlayer: {
        borderRadius: radii.lg,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: radii.pill,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        ...shadow.float,
    },
    videoLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 13,
    },
    title: {
        textAlign: "center",
    },
    subtitle: {
        fontFamily: fonts.body,
        textAlign: "center",
        marginTop: -12,
    },
    guidanceBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.warningSoft,
        borderRadius: radii.md,
        padding: 12,
    },
    guidanceText: {
        flex: 1,
        color: colors.warning,
        fontFamily: fonts.bodySemiBold,
        fontSize: 13,
    },
    steps: {
        width: "100%",
        maxWidth: 560,
        alignSelf: "center",
        borderRadius: radii.md,
        padding: 16,
        gap: 12,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    stepNumber: {
        width: 26,
        height: 26,
        marginTop: -2,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberLarge: {
        width: 32,
        height: 32,
    },
    stepNumberText: {
        fontFamily: fonts.bodySemiBold,
    },
    stepText: {
        flex: 1,
        fontFamily: fonts.body,
    },
    note: {
        width: "100%",
        maxWidth: 560,
        alignSelf: "center",
    },
    // Ação fixa no rodapé do container.
    dock: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 32,
    },
    paragraph: {
        padding: 24,
        color: colors.ink,
        fontFamily: fonts.body,
    },
});
