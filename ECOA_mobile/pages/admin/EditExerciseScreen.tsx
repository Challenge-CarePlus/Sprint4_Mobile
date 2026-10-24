import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
    AddButton,
    Chips,
    Dock,
    Field,
    IconAction,
    Note,
    SectionTitle,
    Stepper,
    SwitchRow,
} from "../../components/admin";
import { ActionBar, Alert, Button, OptionGroup, PageIntro } from "../../components/ds";
import { useToast } from "../../components/Toast";
import VideoPicker from "../../components/VideoPicker";
import { useDraft } from "../../context/DraftContext";
import { CustomExercise, CustomMovement, ExerciseVideo, Sensitivity, blankExercise } from "../../data/training";
import { ExerciseErrors, pruneErrors, validateExerciseFields } from "../../services/trainingValidation";
import { useTheme, useThemedStyles } from "../../theme/ThemeContext";
import { fonts, radii, Theme } from "../../theme/tokens";
import {
    MOVEMENT_OPTIONS,
    SENSITIVITY_OPTIONS,
    defaultPrompt,
    inferMovement,
    movementLabel,
} from "../../vision/customExercise";
import { padStyles } from "./common";

type IconName = keyof typeof MaterialIcons.glyphMap;

/** Novo/Editar exercício: dados do protótipo + "Como a câmera valida" + vídeo. */
export default function EditExerciseScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const toast = useToast();
    const { draft, exerciseIndex, saveExercise } = useDraft();

    const isNew = exerciseIndex < 0 || exerciseIndex >= draft.exercises.length;
    const initial = useMemo<CustomExercise>(
        () => (isNew ? blankExercise() : draft.exercises[exerciseIndex]),
        // O formulário parte do exercício escolhido uma única vez.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const [name, setName] = useState(initial.name);
    const [goal, setGoal] = useState(initial.goal ?? "");
    const [steps, setSteps] = useState<string[]>(initial.steps.length ? initial.steps : [""]);
    const [repetitions, setRepetitions] = useState(initial.repetitions);
    const [holdSeconds, setHoldSeconds] = useState(initial.holdSeconds);
    const [relaxSeconds, setRelaxSeconds] = useState(initial.relaxSeconds);
    const [video, setVideo] = useState<ExerciseVideo | null>(initial.video);
    // Novo exercício: o admin precisa escolher (ou aceitar a sugestão); editar parte do que já foi salvo.
    const [movement, setMovement] = useState<CustomMovement | null>(isNew ? null : initial.validation.movement);
    const [sensitivity, setSensitivity] = useState<Sensitivity>(initial.validation.sensitivity);
    const [promptMessage, setPromptMessage] = useState(initial.validation.promptMessage ?? "");
    const [allowManualCount, setAllowManualCount] = useState(initial.allowManualCount === true);
    const [note, setNote] = useState(initial.validation.note ?? "");
    const [shown, setShown] = useState<ExerciseErrors>({});
    const errors = pruneErrors(shown, validateExerciseFields({ name, goal, steps, movement, promptMessage, note }));

    const suggested = useMemo(() => inferMovement(name, goal, steps), [name, goal, steps]);
    const sequence = movement === "alternateSmilePucker" || movement === "vowels";

    function build(): CustomExercise | null {
        const found = validateExerciseFields({ name, goal, steps, movement, promptMessage, note });
        setShown(found);
        if (Object.keys(found).length || !movement) return null;

        return {
            id: initial.id,
            name: name.trim(),
            goal: goal.trim() || undefined,
            steps: steps.map((s) => s.trim()).filter(Boolean),
            repetitions,
            holdSeconds,
            relaxSeconds,
            video,
            allowManualCount: allowManualCount || undefined,
            protected: initial.protected,
            validation: {
                movement,
                sensitivity,
                promptMessage: promptMessage.trim() || undefined,
                note: note.trim() || undefined,
            },
        };
    }

    function save() {
        const exercise = build();
        if (!exercise) return;
        saveExercise(exercise);
        toast(isNew ? "Exercício adicionado ao treino." : "Exercício atualizado.");
        navigation.goBack();
    }

    function testNow() {
        const exercise = build();
        if (!exercise) return;
        (navigation as any).navigate("TEST_EXERCISE", { exercise });
    }

    const failed = Object.keys(errors).length > 0;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={padStyles.padDock} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <PageIntro
                    align="left"
                    title={isNew ? "Novo exercício" : "Editar exercício"}
                    subtitle="Mesmos dados dos exercícios do app: nome, como fazer, repetições e vídeo."
                />

                {failed && <Alert tone="danger">Faltam alguns dados para salvar. Veja os campos marcados.</Alert>}

                <Field label="Nome do exercício" value={name} onChangeText={setName} placeholder="Ex.: Vibração de lábios" error={errors.name} maxLength={120} />
                <Field
                    label="Objetivo"
                    optional
                    value={goal}
                    onChangeText={setGoal}
                    placeholder="Ex.: Aquece a musculatura antes de falar"
                    maxLength={200}
                />

                <SectionTitle>Como fazer</SectionTitle>
                {steps.map((step, index) => (
                    <View key={index} style={styles.stepRow}>
                        <View style={styles.stepN}>
                            <Text style={styles.stepNText}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label={`Passo ${index + 1}`}
                                hideLabel
                                multiline
                                value={step}
                                onChangeText={(text) => setSteps(steps.map((s, i) => (i === index ? text : s)))}
                                placeholder={index === 0 ? "Ex.: Junte os lábios sem apertar." : "Próximo passo"}
                                maxLength={300}
                            />
                        </View>
                        {steps.length > 1 && (
                            <IconAction
                                icon="close"
                                label={`Remover passo ${index + 1}`}
                                onPress={() => setSteps(steps.filter((_, i) => i !== index))}
                            />
                        )}
                    </View>
                ))}
                {errors.steps ? <Note tone="error">{errors.steps}</Note> : null}
                <AddButton small title="Adicionar passo" onPress={() => setSteps([...steps, ""])} />

                <SectionTitle>Repetições</SectionTitle>
                <View style={styles.card}>
                    <Stepper label="Quantas vezes" value={repetitions} min={1} max={30} unit="×" onChange={setRepetitions} />
                    <Stepper label="Segurar (segundos)" value={holdSeconds} min={0} max={60} unit="s" onChange={setHoldSeconds} />
                    <Stepper label="Relaxar entre vezes" value={relaxSeconds} min={0} max={30} unit="s" onChange={setRelaxSeconds} />
                </View>
                <Note>O tempo de relaxamento conta na validação: o rosto precisa ficar solto antes da próxima repetição.</Note>

                <SectionTitle>Como a câmera valida</SectionTitle>
                <Note>
                    A câmera vê o rosto. Ela não vê língua, barriga nem garganta — para esses exercícios, escolha o indicador facial mais
                    próximo (por exemplo, boca aberta) e explique abaixo o que ela confirma.
                </Note>

                {suggested && suggested !== movement && (
                    <View style={styles.suggest} accessibilityRole="summary">
                        <MaterialIcons name="auto-awesome" size={20} color={colors.brandInk} />
                        <Text style={styles.suggestText}>
                            {`Sugerimos: ${movementLabel(suggested)} — com base no que você escreveu.`}
                        </Text>
                        <Pressable onPress={() => setMovement(suggested)} accessibilityRole="button" accessibilityLabel={`Usar ${movementLabel(suggested)}`} style={styles.suggestBtn}>
                            <Text style={styles.suggestBtnText}>Usar</Text>
                        </Pressable>
                    </View>
                )}

                <OptionGroup<CustomMovement | "">
                    label="O que a câmera deve ver"
                    value={movement ?? ""}
                    onChange={(value) => value && setMovement(value)}
                    options={MOVEMENT_OPTIONS.map((o) => ({
                        value: o.value,
                        title: o.title,
                        description: o.description,
                        icon: o.icon as IconName,
                    }))}
                />
                {errors.movement ? <Note tone="error">{errors.movement}</Note> : null}

                <Chips<Sensitivity>
                    label="Sensibilidade"
                    value={sensitivity}
                    onChange={setSensitivity}
                    options={SENSITIVITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
                <Note>
                    {sequence
                        ? "Neste movimento a câmera usa limiares próprios; a sensibilidade não muda o resultado."
                        : `${SENSITIVITY_OPTIONS.find((o) => o.value === sensitivity)?.hint}. Leve ajuda quando o paciente tem pouco movimento.`}
                </Note>

                <SwitchRow
                    on={allowManualCount}
                    label="Permitir contagem manual"
                    sub="O paciente também pode tocar em Fiz uma vez, para movimentos que a câmera mede mal."
                    onChange={setAllowManualCount}
                />

                <Field
                    label="Mensagem enquanto o movimento não aparece"
                    optional
                    value={promptMessage}
                    onChangeText={setPromptMessage}
                    placeholder={movement ? defaultPrompt(movement) : "Ex.: Abra mais a boca"}
                    maxLength={120}
                />
                <Field
                    label="O que a câmera confirma (o paciente vê)"
                    optional
                    multiline
                    value={note}
                    onChangeText={setNote}
                    placeholder="Ex.: A câmera confirma a boca aberta; a língua não é visível para ela."
                    maxLength={300}
                />

                <Button variant="secondary" icon="videocam" title="Testar agora" onPress={testNow} />

                <SectionTitle>Vídeo de demonstração</SectionTitle>
                <VideoPicker value={video} onChange={setVideo} />
            </ScrollView>

            <Dock>
                <ActionBar title="Salvar exercício" subtitle="Volta para o treino" onPress={save} />
            </Dock>
        </View>
    );
}

const makeStyles = ({ colors, shadow }: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.surface },
        stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
        stepN: {
            width: 26,
            height: 26,
            marginTop: 12,
            borderRadius: 13,
            backgroundColor: colors.brandDeep,
            alignItems: "center",
            justifyContent: "center",
        },
        stepNText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.onHero },
        card: { gap: 12, padding: 16, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, ...shadow.card },
        suggest: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 8,
            paddingLeft: 16,
            paddingRight: 8,
            borderRadius: radii.md,
            backgroundColor: colors.brandSoft,
        },
        suggestText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.brandInk },
        suggestBtn: {
            minHeight: 48,
            minWidth: 56,
            paddingHorizontal: 14,
            borderRadius: radii.pill,
            backgroundColor: colors.brandDeep,
            alignItems: "center",
            justifyContent: "center",
        },
        suggestBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.onHero },
    });
