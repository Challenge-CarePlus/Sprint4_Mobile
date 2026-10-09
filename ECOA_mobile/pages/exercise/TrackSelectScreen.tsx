import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TRACKS } from "../../data/tracks";
import { AgeGroup } from "../../data/types";
import { colors } from "../../theme/tokens";

const AGE_GROUP_ICON: Record<AgeGroup, keyof typeof MaterialIcons.glyphMap> = {
    children: "child-care",
    adults: "record-voice-over",
    elderly: "elderly",
};

export default function TrackSelectScreen() {
    const navigation = useNavigation();

    function handleSelectTrack(trackId: string) {
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
                <TouchableOpacity
                    key={track.id}
                    style={styles.trackCard}
                    onPress={() => handleSelectTrack(track.id)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Iniciar trilha: ${track.name}`}
                >
                    <View style={styles.trackIconContainer}>
                        <MaterialIcons
                            name={AGE_GROUP_ICON[track.ageGroup]}
                            size={32}
                            color="#fff"
                        />
                    </View>

                    <View style={styles.trackTextContainer}>
                        <Text style={styles.trackTitle}>{track.name}</Text>
                        <Text style={styles.trackDescription}>{track.description}</Text>
                    </View>

                    <MaterialIcons name="arrow-forward" size={24} color={colors.primary700} />
                </TouchableOpacity>
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
        borderWidth: 2,
        borderColor: colors.primary700,
        borderRadius: 8,
        padding: 16,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    trackIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 999,
        backgroundColor: colors.primary700,
        alignItems: "center",
        justifyContent: "center",
    },
    trackTextContainer: {
        flex: 1,
        gap: 4,
    },
    trackTitle: {
        fontFamily: "Righteous_400Regular",
        fontSize: 19,
        color: colors.neutral900,
    },
    trackDescription: {
        fontSize: 13,
        lineHeight: 18,
        color: colors.textMuted,
    },
});
