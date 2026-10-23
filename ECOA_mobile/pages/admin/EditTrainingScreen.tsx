import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import {
    AddButton,
    CountPill,
    DangerLink,
    Dock,
    Field,
    IconAction,
    IconCircle,
    InlineStatus,
    Note,
    SectionTitle,
} from "../../components/admin";
import { ActionBar, Alert, PageIntro } from "../../components/ds";
import { useConfirm } from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";
import { useDraft } from "../../context/DraftContext";
import { audienceLabel, exerciseCountLabel, inputFromDraft, repsLabel } from "../../data/training";
import { trainingsApi, apiErrorMessage } from "../../services/trainingsApi";
import { DraftErrors, pruneErrors, validateDraft } from "../../services/trainingValidation";
import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/tokens";
import { padStyles } from "./common";

/** Novo/Editar treino: nome, exercícios, "Quem vai ver", excluir. */
export default function EditTrainingScreen() {
    const navigation = useNavigation();
    const { colors, shadow } = useTheme();
    const toast = useToast();
    const confirm = useConfirm();
    const { draft, setName, editExercise, removeExercise } = useDraft();

    const [shown, setShown] = useState<DraftErrors>({});
    // Só vale o que ainda está inválido: o aviso some assim que o campo é corrigido.
    const errors = pruneErrors(shown, validateDraft(draft));
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const everyone = draft.audience.all;
    const audienceDetail = everyone
        ? "Inclusive quem entrar depois"
        : draft.audience.ids.length
          ? "Toque para ver quem"
          : "Toque para escolher";

    async function save() {
        const found = validateDraft(draft);
        setShown(found);
        setApiError("");
        if (Object.keys(found).length) return;

        setSaving(true);
        try {
            const input = inputFromDraft(draft);
            if (draft.isNew) await trainingsApi.createTraining(input);
            else await trainingsApi.updateTraining(draft.id, input);

            toast(`Treino salvo e liberado para ${audienceLabel(draft.audience).toLowerCase()}.`);
            navigation.goBack();
        } catch (e) {
            setApiError(apiErrorMessage(e, "Não foi possível salvar o treino. Tente de novo."));
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        const yes = await confirm({
            title: "Excluir treino?",
            message: `"${draft.name || "Sem nome"}" some para todos os pacientes. Isso não pode ser desfeito.`,
        });
        if (!yes) return;

        try {
            await trainingsApi.deleteTraining(draft.id);
            toast("Treino excluído.");
            navigation.goBack();
        } catch (e) {
            setApiError(apiErrorMessage(e, "Não foi possível excluir o treino."));
        }
    }

    async function askRemoveExercise(index: number, name: string) {
        const yes = await confirm({
            title: "Excluir exercício?",
            message: `"${name || "Sem nome"}" sai deste treino. Isso não pode ser desfeito.`,
        });
        if (yes) removeExercise(index);
    }

    const failed = Object.keys(errors).length > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <ScrollView contentContainerStyle={padStyles.padDock} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <PageIntro
                    align="left"
                    title={draft.isNew ? "Novo treino" : "Editar treino"}
                    subtitle="Os pacientes escolhidos veem este treino na lista de trilhas."
                />

                {failed && <Alert tone="danger">Faltam alguns dados para salvar. Veja os campos marcados.</Alert>}
                {apiError !== "" && <Alert tone="danger">{apiError}</Alert>}

                <Field
                    label="Nome da trilha"
                    value={draft.name}
                    onChangeText={setName}
                    placeholder="Ex.: Aquecimento para apresentações"
                    error={errors.name}
                    maxLength={120}
                />

                <SectionTitle aside={<CountPill value={draft.exercises.length} />}>Exercícios</SectionTitle>

                {draft.exercises.map((exercise, index) => {
                    const steps = exercise.steps.filter((s) => s.trim()).length;
                    return (
                        <View key={exercise.id} style={[styles.exRow, { backgroundColor: colors.surfaceRaised }, shadow.card]}>
                            <View style={[styles.exN, { backgroundColor: colors.brandDeep }]}>
                                <Text style={[styles.exNText, { color: colors.onHero }]}>{index + 1}</Text>
                            </View>
                            <Pressable
                                onPress={() => {
                                    editExercise(index);
                                    navigation.navigate("EDIT_EXERCISE" as never);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Editar ${exercise.name || "exercício sem nome"}`}
                                style={styles.exMain}
                            >
                                <Text style={[styles.exTitle, { color: colors.ink }]}>{exercise.name || "Sem nome"}</Text>
                                <Text style={[styles.exSub, { color: colors.inkMuted }]}>
                                    {`${steps} ${steps === 1 ? "passo" : "passos"} · ${repsLabel(exercise)} · `}
                                    <InlineStatus ok={Boolean(exercise.video)}>
                                        {exercise.video ? "com vídeo" : "sem vídeo"}
                                    </InlineStatus>
                                </Text>
                            </Pressable>
                            <IconAction
                                icon="delete-outline"
                                label={`Remover ${exercise.name || "exercício"}`}
                                onPress={() => askRemoveExercise(index, exercise.name)}
                            />
                        </View>
                    );
                })}

                <AddButton
                    title={draft.exercises.length ? "Adicionar outro exercício" : "Adicionar exercício"}
                    onPress={() => {
                        editExercise(-1);
                        navigation.navigate("EDIT_EXERCISE" as never);
                    }}
                />
                {errors.exercises ? <Note tone="error">{errors.exercises}</Note> : null}

                <SectionTitle>Quem vai ver</SectionTitle>
                <Pressable
                    onPress={() => navigation.navigate("PICK_PATIENTS" as never)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quem vai ver: ${audienceLabel(draft.audience)}. Alterar`}
                    style={[
                        styles.aud,
                        { backgroundColor: colors.surfaceRaised },
                        shadow.card,
                        errors.audience ? { borderWidth: 2, borderColor: colors.danger } : null,
                    ]}
                >
                    <IconCircle icon="groups" />
                    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                        <Text style={[styles.exTitle, { color: colors.ink }]}>{audienceLabel(draft.audience)}</Text>
                        <Text style={[styles.exSub, { color: colors.inkMuted }]}>{audienceDetail}</Text>
                    </View>
                    <Text style={[styles.link, { color: colors.brandInk }]}>Alterar</Text>
                </Pressable>
                {errors.audience ? <Note tone="error">{errors.audience}</Note> : null}

                {!draft.isNew && <DangerLink icon="delete-outline" title="Excluir treino" onPress={remove} />}
            </ScrollView>

            <Dock>
                <ActionBar
                    title={saving ? "Salvando…" : "Salvar treino"}
                    subtitle={`${exerciseCountLabel(draft.exercises.length)} · ${audienceLabel(draft.audience)}`}
                    onPress={() => {
                        if (!saving) save();
                    }}
                />
            </Dock>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    exRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingLeft: 12,
        paddingRight: 4,
        borderRadius: 20,
    },
    exN: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    exNText: { fontFamily: fonts.bodySemiBold, fontSize: 13 },
    exMain: { flex: 1, minWidth: 0, gap: 2, paddingVertical: 4, minHeight: 48, justifyContent: "center" },
    exTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20 },
    exSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
    aud: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20 },
    link: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
});
