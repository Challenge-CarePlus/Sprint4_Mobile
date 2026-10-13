import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import IconBadge from "../../components/IconBadge";
import { TRACKS } from "../../data/tracks";
import { AgeGroup } from "../../data/types";
import { colors, radii, shadow } from "../../theme/tokens";
import { clearSessionOutcomes } from "../../services/sessionProgressStore";
import { clearCalibration } from "../../vision/calibrationStore";

const AGE_GROUP_ICON: Record<AgeGroup, keyof typeof MaterialIcons.glyphMap> = {
    children: "child-care",
    adults: "record-voice-over",
    elderly: "elderly",
};

const AGE_GROUP_GRADIENT: Record<AgeGroup, "accent" | "primary" | "calm"> = {
    children: "accent",
    adults: "primary",
    elderly: "calm",
};

export default function TrackSelectScreen() {
    const navigation = useNavigation();

    function handleSelectTrack(trackId: string) {
        // Garante um início limpo: se uma tentativa anterior dessa trilha foi
        // abandonada no meio, os resultados antigos não devem vazar para o
        // resumo do ciclo que vai ser salvo desta vez.
        clearSessionOutcomes(trackId);
        clearCalibration(trackId);
        (navigation as any).navigate("EXERCISE_PREVIEW", { trackId, exerciseIndex: 0 });
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Escolha sua trilha</Text>
            <Text style={styles.subtitle}>
                Cada trilha tem 5 exercícios pensados para a sua faixa etária.
            </Text>

            {TRACKS.map((track) => (
                <Pressable
                    key={track.id}
                    style={({ pressed }) => [styles.trackCard, pressed && styles.trackCardPressed]}
                    onPress={() => handleSelectTrack(track.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Iniciar trilha: ${track.name}`}
                >
                    <IconBadge
                        name={AGE_GROUP_ICON[track.ageGroup]}
                        gradient={AGE_GROUP_GRADIENT[track.ageGroup]}
                        size={56}
                    />

                    <View style={styles.trackTextContainer}>
                        <Text style={styles.trackTitle}>{track.name}</Text>
                        <Text style={styles.trackDescription}>{track.description}</Text>
                    </View>

                    <MaterialIcons name="arrow-forward" size={22} color={colors.neutral300} />
                </Pressable>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 32,
        gap: 18,
    },
    title: {
        fontFamily: "Righteous_400Regular",
        fontSize: 28,
        color: colors.primary900,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: colors.textMuted,
        textAlign: "center",
        marginBottom: 8,
    },
    trackCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: 16,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        ...shadow.sm,
    },
    trackCardPressed: {
        transform: [{ scale: 0.98 }],
    },
    trackTextContainer: {
        flex: 1,
        gap: 4,
    },
    trackTitle: {
        fontFamily: "Righteous_400Regular",
        fontSize: 18,
        color: colors.neutral900,
    },
    trackDescription: {
        fontSize: 13,
        lineHeight: 18,
        color: colors.textMuted,
    },
});
