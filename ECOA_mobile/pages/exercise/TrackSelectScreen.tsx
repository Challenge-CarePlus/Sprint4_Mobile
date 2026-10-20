import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";

import { MenuCard, PageIntro } from "../../components/ds";
import { TRACKS } from "../../data/tracks";
import { AgeGroup } from "../../data/types";
import { colors } from "../../theme/tokens";
import { clearSessionOutcomes } from "../../services/sessionProgressStore";
import { clearCalibration } from "../../vision/calibrationStore";

const AGE_GROUP_ICON: Record<AgeGroup, keyof typeof MaterialIcons.glyphMap> = {
    children: "face",
    adults: "record-voice-over",
    elderly: "sentiment-satisfied-alt",
};

const AGE_GROUP_TITLE: Record<AgeGroup, string> = {
    children: "Trilha infantil",
    adults: "Dicção e oratória",
    elderly: "Fortalecimento orofacial",
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
            <PageIntro
                title="Escolha sua trilha"
                subtitle="Cada trilha tem 5 exercícios pensados para a sua faixa etária."
            />

            <View style={styles.list}>
                {TRACKS.map((track) => (
                    <MenuCard
                        key={track.id}
                        icon={AGE_GROUP_ICON[track.ageGroup]}
                        title={AGE_GROUP_TITLE[track.ageGroup]}
                        subtitle={track.description}
                        meta={
                            track.ageGroup === "elderly"
                                ? `${track.exerciseIds.length} exercícios · letra ampliada`
                                : `${track.exerciseIds.length} exercícios`
                        }
                        kids={track.ageGroup === "children"}
                        onPress={() => handleSelectTrack(track.id)}
                    />
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
    list: { gap: 12 },
});
