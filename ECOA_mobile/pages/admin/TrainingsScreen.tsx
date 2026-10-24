import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { EmptyState, IconAction, IconCircle, RowCard } from "../../components/admin";
import { useConfirm } from "../../components/ConfirmDialog";
import { Alert, Badge, Button, Columns, PageIntro } from "../../components/ds";
import { useToast } from "../../components/Toast";
import { useDraft } from "../../context/DraftContext";
import { Training, audienceLabel, exerciseCountLabel } from "../../data/training";
import { useLoad } from "../../hooks/useLoad";
import { apiErrorMessage, trainingsApi } from "../../services/trainingsApi";
import { useTheme } from "../../theme/ThemeContext";
import { LoadGate, padStyles, ReloadError } from "./common";

/** Lista dos treinos personalizados + "Criar novo treino". */
export default function TrainingsScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const toast = useToast();
    const confirm = useConfirm();
    const { startNew, startEdit } = useDraft();
    const state = useLoad(() => trainingsApi.listTrainings());
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState("");

    // Enquanto a lista recarrega ela ainda mostra o resultado anterior: não dá para abrir ou excluir dele.
    const locked = busy || state.loading;

    async function open(training: Training) {
        if (locked) return;
        setBusy(true);
        setActionError("");
        try {
            // Sempre o treino do servidor, não a cópia da lista (que pode estar desatualizada).
            startEdit(await trainingsApi.getTraining(training.id));
            navigation.navigate("EDIT_TRAINING" as never);
        } catch (e) {
            setActionError(apiErrorMessage(e, "Não foi possível abrir o treino. Tente de novo."));
            state.reload();
        } finally {
            setBusy(false);
        }
    }

    async function remove(training: Training) {
        if (locked) return;
        const yes = await confirm({
            title: "Excluir treino?",
            message: `"${training.name || "Sem nome"}" some para todos os pacientes. Isso não pode ser desfeito.`,
        });
        if (!yes) return;

        setBusy(true);
        setActionError("");
        try {
            await trainingsApi.deleteTraining(training.id);
            toast("Treino excluído.");
        } catch (e) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            setActionError(
                status === 403
                    ? "Treinos padrão não podem ser excluídos. Você pode editar o nome e quem vai ver."
                    : apiErrorMessage(e, "Não foi possível excluir o treino.")
            );
        } finally {
            setBusy(false);
            state.reload();
        }
    }

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

            {actionError !== "" && <Alert tone="danger">{actionError}</Alert>}
            <LoadGate state={state} />
            <ReloadError state={state} />

            {state.data !== null &&
                (state.data.length ? (
                    <Columns>
                        {state.data.map((training) => {
                            const standard = training.protected === true || training.example === true;
                            return (
                                <View key={training.id} style={styles.item}>
                                    <RowCard
                                        style={styles.itemMain}
                                        disabled={locked}
                                        leading={<IconCircle icon="fitness-center" />}
                                        title={training.name}
                                        subtitle={`${exerciseCountLabel(training.exercises.length)} · ${audienceLabel(training.audience)}`}
                                        onPress={() => open(training)}
                                    >
                                        {standard ? <Badge tone="neutral">Padrão</Badge> : null}
                                    </RowCard>
                                    {standard ? null : (
                                        <IconAction
                                            icon="delete-outline"
                                            label={`Excluir treino ${training.name || "sem nome"}`}
                                            onPress={() => remove(training)}
                                        />
                                    )}
                                </View>
                            );
                        })}
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    item: { flexDirection: "row", alignItems: "center", gap: 4 },
    itemMain: { flex: 1, minWidth: 0 },
});
