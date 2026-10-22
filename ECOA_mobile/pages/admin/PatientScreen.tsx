import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, Bars, MetricPanel, Note, SectionTitle } from "../../components/admin";
import { MenuCard } from "../../components/ds";
import { useDraft } from "../../context/DraftContext";
import { exerciseCountLabel } from "../../data/training";
import { useLoad } from "../../hooks/useLoad";
import { trainingsApi } from "../../services/trainingsApi";
import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/tokens";
import { LoadGate, padStyles } from "./common";

/** Um paciente: métricas, barras dos 7 dias e os treinos personalizados que ele vê. */
export default function PatientScreen() {
    const navigation = useNavigation();
    const { id } = useRoute().params as { id: string };
    const { colors, shadow } = useTheme();
    const { startEdit } = useDraft();

    const state = useLoad(async () => {
        const [patient, trainings] = await Promise.all([trainingsApi.getPatient(id), trainingsApi.listTrainings()]);
        return { patient, trainings };
    });

    const patient = state.data?.patient;
    const total = patient ? patient.week.reduce((a, b) => a + b, 0) : 0;
    const mine = state.data
        ? state.data.trainings.filter((t) => t.audience.all || t.audience.ids.includes(id))
        : [];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.surface }]}
            contentContainerStyle={padStyles.pad}
            showsVerticalScrollIndicator={false}
        >
            <LoadGate state={state} />

            {patient && (
                <>
                    <View style={styles.head}>
                        <Avatar name={patient.name} size={56} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.name, { color: colors.ink }]} accessibilityRole="header">
                                {patient.name}
                            </Text>
                            <Text style={[styles.sub, { color: colors.inkMuted }]}>
                                {`${patient.trail} · última sessão: ${patient.lastSession.toLowerCase()}`}
                            </Text>
                        </View>
                    </View>

                    <MetricPanel
                        title="Esta semana"
                        metrics={[
                            { label: "Exercícios", value: String(total), unit: "feitos", icon: "fitness-center" },
                            { label: "Adesão", value: String(patient.adherence), unit: "%", icon: "insights" },
                            { label: "Sessões", value: String(patient.sessions), unit: "no total", icon: "event" },
                        ]}
                    />

                    <View style={[styles.card, { backgroundColor: colors.surfaceRaised }, shadow.card]}>
                        <Bars values={patient.week} caption="Exercícios por dia" />
                    </View>

                    <Note>Dados de exemplo — a evolução real será ligada quando houver registro das sessões.</Note>

                    <SectionTitle>Treinos personalizados</SectionTitle>
                    {mine.length ? (
                        mine.map((training) => (
                            <MenuCard
                                key={training.id}
                                icon="favorite"
                                title={training.name}
                                subtitle={exerciseCountLabel(training.exercises.length)}
                                onPress={() => {
                                    startEdit(training);
                                    navigation.navigate("EDIT_TRAINING" as never);
                                }}
                            />
                        ))
                    ) : (
                        <Note>Nenhum treino personalizado para este paciente ainda.</Note>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    head: { flexDirection: "row", alignItems: "center", gap: 14 },
    name: { fontFamily: fonts.displaySemiBold, fontSize: 22, lineHeight: 28 },
    sub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
    card: { borderRadius: 20, padding: 16 },
});
