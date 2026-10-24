import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";

import { Columns, MenuCard, PageIntro } from "../../components/ds";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { TRACKS } from "../../data/tracks";
import { Track } from "../../data/types";
import { listCustomTracks, setCustomTrainings } from "../../services/trackStore";
import { trainingsApi } from "../../services/trainingsApi";
import { AgeGroup } from "../../data/types";
import { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/ThemeContext";
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
    const styles = useThemedStyles(makeStyles);
    const navigation = useNavigation();
    const { role } = useAuth();
    const [custom, setCustom] = useState<Track[]>([]);

    // Treinos personalizados que este usuário pode ver (o servidor filtra por papel/paciente).
    // O admin vê só as 3 trilhas padrão aqui, como no protótipo; sem rede, ficam as padrão.
    useFocusEffect(
        useCallback(() => {
            let alive = true;
            if (role === "admin") {
                setCustom([]);
                return;
            }
            trainingsApi
                .listTrainings()
                .then((list) => {
                    setCustomTrainings(list);
                    if (alive) setCustom(listCustomTracks());
                })
                .catch(() => {
                    if (alive) setCustom([]);
                });
            return () => {
                alive = false;
            };
        }, [role])
    );

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
                <Columns>
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

                {custom.map((track) => (
                    <MenuCard
                        key={track.id}
                        icon="favorite"
                        title={track.name}
                        subtitle={track.description}
                        meta={`Personalizado · ${track.exerciseIds.length} ${track.exerciseIds.length === 1 ? "exercício" : "exercícios"}`}
                        onPress={() => handleSelectTrack(track.id)}
                    />
                ))}
                </Columns>
            </View>
        </ScrollView>
    );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
    list: { gap: 12 },
});
