import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet } from "react-native";

import { EmptyState, IconCircle, RowCard } from "../../components/admin";
import { Badge, Button, Columns, PageIntro } from "../../components/ds";
import { useDraft } from "../../context/DraftContext";
import { audienceLabel, exerciseCountLabel } from "../../data/training";
import { useLoad } from "../../hooks/useLoad";
import { trainingsApi } from "../../services/trainingsApi";
import { useTheme } from "../../theme/ThemeContext";
import { LoadGate, padStyles, ReloadError } from "./common";

/** Lista dos treinos personalizados + "Criar novo treino". */
export default function TrainingsScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { startNew, startEdit } = useDraft();
    const state = useLoad(() => trainingsApi.listTrainings());

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.surface }]}
            contentContainerStyle={padStyles.pad}
            showsVerticalScrollIndicator={false}
        >
            <PageIntro
                align="left"
                title="Treinos personalizados"
                subtitle="Monte uma trilha com seus exercícios e escolha quem vai ver."
            />

            <Button
                icon="add"
                title="Criar novo treino"
                onPress={() => {
                    startNew();
                    navigation.navigate("EDIT_TRAINING" as never);
                }}
            />

            <LoadGate state={state} />
            <ReloadError state={state} />

            {state.data !== null &&
                (state.data.length ? (
                    <Columns>
                    {state.data.map((training) => (
                        <RowCard
                            key={training.id}
                            leading={<IconCircle icon="fitness-center" />}
                            title={training.name}
                            subtitle={`${exerciseCountLabel(training.exercises.length)} · ${audienceLabel(training.audience)}`}
                            onPress={() => {
                                startEdit(training);
                                navigation.navigate("EDIT_TRAINING" as never);
                            }}
                        >
                            {training.protected || training.example ? <Badge tone="neutral">Padrão</Badge> : null}
                        </RowCard>
                    ))}
                    </Columns>
                ) : (
                    <EmptyState
                        icon="star-border"
                        title="Nenhum treino ainda"
                        text="Crie o primeiro e escolha para quais pacientes ele aparece."
                    />
                ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
