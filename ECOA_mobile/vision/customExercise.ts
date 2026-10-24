import { CustomExercise, CustomMovement, Sensitivity, Training } from "../data/training";
import { Exercise, FacialMovement, ValidationRule } from "../data/types";
import { resolveMediaUrl } from "../services/trainingsApi";
import { ENCOURAGEMENT_BY_MOVEMENT, MOVEMENT_ACTIVATION_DELTA } from "./movementThresholds";

/** Movimentos que o admin escolhe: só o que o MediaPipe mede (nomes amigáveis). */
export const MOVEMENT_OPTIONS: { value: CustomMovement; title: string; description: string; icon: string }[] = [
    { value: "jawOpen", title: "Abrir a boca", description: "Mandíbula abaixa (bocejo, vogal A, abrir e fechar)", icon: "sentiment-very-satisfied" },
    { value: "mouthSmile", title: "Sorrir", description: "Cantos da boca sobem", icon: "mood" },
    { value: "mouthPucker", title: "Fazer bico", description: "Lábios projetados, como num beijo", icon: "campaign" },
    { value: "cheekPuff", title: "Encher as bochechas", description: "Bochechas cheias de ar (a câmera vê pouco; use sensibilidade Leve)", icon: "bubble-chart" },
    { value: "lipPress", title: "Apertar os lábios", description: "Lábios firmes um contra o outro", icon: "compress" },
    { value: "alternateSmilePucker", title: "Alternar sorriso e bico", description: "Cada troca de sorriso para bico conta", icon: "swap-horiz" },
    { value: "vowels", title: "Vogais A-E-I-O-U", description: "As cinco vogais, em ordem", icon: "record-voice-over" },
];

export function movementLabel(movement: CustomMovement): string {
    return MOVEMENT_OPTIONS.find((o) => o.value === movement)?.title ?? movement;
}

export const SENSITIVITY_OPTIONS: { value: Sensitivity; label: string; factor: number; hint: string }[] = [
    { value: "soft", label: "Leve", factor: 0.7, hint: "Aceita movimentos pequenos" },
    { value: "normal", label: "Normal", factor: 1, hint: "Equilíbrio padrão" },
    { value: "firm", label: "Firme", factor: 1.3, hint: "Exige o movimento bem marcado" },
];

export function sensitivityFactor(sensitivity: Sensitivity): number {
    return SENSITIVITY_OPTIONS.find((o) => o.value === sensitivity)?.factor ?? 1;
}

/** Sem acentos e minúsculo, para casar palavras-chave. */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

/**
 * Sugere o movimento a partir do que o admin escreveu (nome, objetivo e passos). Só sugere —
 * o admin confirma ou troca. `null` = nenhuma palavra-chave reconhecida (escolha manual).
 */
export function inferMovement(name: string, goal: string | undefined, steps: string[]): CustomMovement | null {
    const text = normalize([name, goal ?? "", ...steps].join(" . "));

    if (/\bvogais\b|a-e-i-o-u|\baeiou\b|\ba, e, i, o,? (e )?u\b|\ba e i o u\b/.test(text)) return "vowels";

    const smile = /\bsorri/.test(text);
    const pucker = /\bbico|\bbeijo|\bprojet|\bprotru/.test(text);
    if (smile && pucker) return "alternateSmilePucker";

    if (/\bbochecha|\bbalao|\bbexiga/.test(text)) return "cheekPuff";
    if (/aperte? os labios|apertar os labios|apertando os labios|\besforco|pression\w* os labios|labios firmes/.test(text)) return "lipPress";
    if (pucker) return "mouthPucker";
    if (/\babr(a|ir|e|indo)\b.{0,20}\bboca|\bbocejo|\bmandibula|\bboca aberta/.test(text)) return "jawOpen";
    if (smile) return "mouthSmile";

    return null;
}

/** Movimento do app (blendshape) + modo do detector para a escolha do admin. */
function resolveMovement(movement: CustomMovement): { movement: FacialMovement; mode?: "alternate" | "vowels" } {
    if (movement === "alternateSmilePucker") return { movement: "mouthSmile", mode: "alternate" };
    if (movement === "vowels") return { movement: "jawOpen", mode: "vowels" };
    return { movement };
}

/** `CustomExercise` → regra que o `createDetector` já entende (mapeamento do SPEC). */
export function customToValidationRule(exercise: CustomExercise): ValidationRule {
    const { movement, mode } = resolveMovement(exercise.validation.movement);
    const base = MOVEMENT_ACTIVATION_DELTA[movement];
    const promptMessage = exercise.validation.promptMessage?.trim();

    return {
        movement,
        mode,
        repetitions: exercise.repetitions,
        holdDurationMs: exercise.holdSeconds * 1000,
        relaxDurationMs: exercise.relaxSeconds * 1000,
        // Os modos alternate/vowels têm limiares próprios nos detectores de sequência.
        activationDelta: mode ? undefined : Math.round(base * sensitivityFactor(exercise.validation.sensitivity) * 1000) / 1000,
        promptMessage: promptMessage || undefined,
    };
}

/** Texto de transparência mostrado ao paciente na prévia. */
export function validationNoteFor(exercise: CustomExercise): string {
    const custom = exercise.validation.note?.trim();
    const base = custom || `A câmera confirma: ${movementLabel(exercise.validation.movement).toLowerCase()}.`;
    return exercise.allowManualCount ? `${base} Se a câmera não reconhecer, conte você mesma(o).` : base;
}

/** Exercício criado pelo admin → `Exercise` do fluxo do paciente (sempre validado pela câmera). */
export function customToExercise(training: Training, exercise: CustomExercise, index: number): Exercise {
    const rule = customToValidationRule(exercise);

    return {
        id: `${training.id}:${index}`,
        name: exercise.name,
        ageGroup: "adults",
        therapeuticGoal: exercise.goal?.trim() || training.name,
        instructions: exercise.steps,
        repetitions: exercise.repetitions,
        durationSeconds: exercise.holdSeconds || undefined,
        demoVideoUrl: exercise.video ? resolveMediaUrl(exercise.video.url) : "",
        validationType: "validado",
        validationRule: rule,
        validationNote: validationNoteFor(exercise),
        ...(exercise.allowManualCount ? { allowManualCount: true } : {}),
    };
}

/** Mensagem de incentivo que o paciente verá enquanto o movimento não aparece. */
export function defaultPrompt(movement: CustomMovement): string {
    const { movement: facial } = resolveMovement(movement);
    if (movement === "alternateSmilePucker") return "Alterne: sorria e depois faça bico";
    if (movement === "vowels") return "Fale as vogais A, E, I, O, U, abrindo bem a boca";
    return ENCOURAGEMENT_BY_MOVEMENT[facial];
}
