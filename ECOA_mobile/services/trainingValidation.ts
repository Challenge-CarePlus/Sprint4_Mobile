import { TrainingDraft } from "../data/training";

/** O servidor recusa textos com < ou > (XSS); o app avisa antes de enviar. */
export const FORBIDDEN_CHARS_MESSAGE = "Não use os símbolos < e > nos textos.";

export function hasForbiddenChars(text: string | undefined): boolean {
    return /[<>]/.test(text ?? "");
}

export type DraftErrors = {
    name?: string;
    exercises?: string;
    audience?: string;
};

/** Campos do treino que o servidor valida; mensagens do protótipo. */
export function validateDraft(draft: TrainingDraft): DraftErrors {
    const errors: DraftErrors = {};

    if (!draft.name.trim()) {
        errors.name = 'Dê um nome para a trilha, como "Aquecimento vocal".';
    } else if (hasForbiddenChars(draft.name)) {
        errors.name = FORBIDDEN_CHARS_MESSAGE;
    }

    if (!draft.exercises.length) {
        errors.exercises = "Adicione pelo menos um exercício.";
    }

    if (!draft.audience.all && !draft.audience.ids.length) {
        errors.audience = "Escolha quem vai ver este treino.";
    }

    return errors;
}

export type ExerciseErrors = {
    name?: string;
    steps?: string;
    movement?: string;
};

/** Erros do formulário de exercício (usado também pelo "Testar agora"). */
export function validateExerciseFields(fields: {
    name: string;
    goal?: string;
    steps: string[];
    movement: string | null;
    promptMessage?: string;
    note?: string;
}): ExerciseErrors {
    const errors: ExerciseErrors = {};

    if (!fields.name.trim()) {
        errors.name = "Dê um nome ao exercício.";
    } else if (hasForbiddenChars(fields.name)) {
        errors.name = FORBIDDEN_CHARS_MESSAGE;
    }

    const steps = fields.steps.map((s) => s.trim()).filter(Boolean);
    if (!steps.length) {
        errors.steps = "Descreva pelo menos um passo de como fazer.";
    } else if (steps.some(hasForbiddenChars) || hasForbiddenChars(fields.goal)) {
        errors.steps = FORBIDDEN_CHARS_MESSAGE;
    }

    if (!fields.movement) {
        errors.movement = "Escolha o que a câmera deve ver.";
    }

    if (hasForbiddenChars(fields.promptMessage) || hasForbiddenChars(fields.note)) {
        errors.movement = FORBIDDEN_CHARS_MESSAGE;
    }

    return errors;
}

/**
 * Erros que continuam valendo: só os campos que já foram mostrados e ainda estão inválidos (com a mensagem
 * atual). Um campo corrigido sai da lista na hora; um campo que ainda não foi tentado não aparece.
 */
export function pruneErrors<T extends Record<string, string | undefined>>(shown: T, current: T): T {
    const kept: Record<string, string> = {};
    for (const key of Object.keys(shown)) {
        const message = current[key];
        if (shown[key] && message) kept[key] = message;
    }
    return kept as T;
}
