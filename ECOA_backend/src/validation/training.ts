import { randomUUID } from "crypto";
import { PATIENT_IDS } from "../data/seed";
import {
    Audience,
    CustomExercise,
    CustomValidation,
    ExerciseVideo,
    MOVEMENTS,
    Movement,
    SENSITIVITIES,
    Sensitivity,
} from "../models/training";

export const LIMITS = {
    name: 100,
    goal: 200,
    step: 300,
    steps: 20,
    exercises: 30,
    repetitions: 100,
    seconds: 120,
    promptMessage: 120,
    note: 300,
    videoName: 100,
};

export const VIDEO_URL = /^\/media\/[a-f0-9]{32}\.(mp4|webm|mov)$/;
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];

class Invalid extends Error {}

const fail = (message: string): never => {
    throw new Invalid(message);
};

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

/** Texto limpo: string, sem caracteres de controle, sem HTML (< >), com limite. */
function text(value: unknown, label: string, max: number, required: boolean): string {
    if (value === undefined || value === null || value === "") {
        return required ? fail(`${label} é obrigatório`) : "";
    }
    if (typeof value !== "string") return fail(`${label} deve ser texto`);

    const clean = value.trim();
    if (required && !clean) return fail(`${label} é obrigatório`);
    if (clean.length > max) return fail(`${label} deve ter até ${max} caracteres`);
    if (/[<>]/.test(clean)) return fail(`${label} não pode conter HTML`);
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)) {
        return fail(`${label} contém caracteres inválidos`);
    }
    return clean;
}

function integer(value: unknown, label: string, min: number, max: number): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
        return fail(`${label} deve ser um número inteiro entre ${min} e ${max}`);
    }
    return value;
}

function validateAudience(value: unknown): Audience {
    if (!isObject(value) || typeof value.all !== "boolean") {
        return fail("Audiência inválida: informe { all, ids }");
    }
    if (value.all) return { all: true, ids: [] };

    const ids = value.ids ?? [];
    if (!Array.isArray(ids)) return fail("Audiência inválida: ids deve ser uma lista");

    const unique = [...new Set(ids)];
    for (const id of unique) {
        if (typeof id !== "string" || !PATIENT_IDS.includes(id)) {
            return fail("Audiência inválida: paciente inexistente");
        }
    }
    return { all: false, ids: unique as string[] };
}

function validateVideo(value: unknown): ExerciseVideo | null {
    if (value === null || value === undefined) return null;
    if (!isObject(value)) return fail("Vídeo inválido");

    // Só aceita a URL que o próprio upload devolve: nada de link externo ou javascript:.
    if (typeof value.url !== "string" || !VIDEO_URL.test(value.url)) {
        return fail("Vídeo inválido: use a URL devolvida pelo upload");
    }
    if (typeof value.mime !== "string" || !VIDEO_MIMES.includes(value.mime)) {
        return fail("Vídeo inválido: tipo não permitido");
    }
    return {
        url: value.url,
        name: text(value.name, "Nome do vídeo", LIMITS.videoName, false),
        size: integer(value.size, "Tamanho do vídeo", 0, 30 * 1024 * 1024),
        mime: value.mime,
    };
}

function validateValidation(value: unknown): CustomValidation {
    if (!isObject(value)) return fail("Informe como a câmera valida o exercício");

    if (!MOVEMENTS.includes(value.movement as Movement)) {
        return fail("Movimento de validação inválido");
    }
    if (!SENSITIVITIES.includes(value.sensitivity as Sensitivity)) {
        return fail("Sensibilidade inválida (soft, normal ou firm)");
    }

    const result: CustomValidation = {
        movement: value.movement as Movement,
        sensitivity: value.sensitivity as Sensitivity,
    };
    const promptMessage = text(value.promptMessage, "Mensagem de orientação", LIMITS.promptMessage, false);
    const note = text(value.note, "Nota da validação", LIMITS.note, false);
    if (promptMessage) result.promptMessage = promptMessage;
    if (note) result.note = note;
    return result;
}

function validateExercise(value: unknown, position: number): CustomExercise {
    const label = `Exercício ${position}`;
    if (!isObject(value)) return fail(`${label} inválido`);

    const name = text(value.name, `${label}: nome`, LIMITS.name, true);

    if (!Array.isArray(value.steps)) return fail(`${label}: informe os passos`);
    const steps = value.steps
        .map((s) => text(s, `${label}: passo`, LIMITS.step, false))
        .filter(Boolean);
    if (steps.length < 1) return fail(`${label}: informe pelo menos 1 passo`);
    if (steps.length > LIMITS.steps) return fail(`${label}: no máximo ${LIMITS.steps} passos`);

    const goal = text(value.goal, `${label}: objetivo`, LIMITS.goal, false);
    const id =
        typeof value.id === "string" && /^[\w-]{1,64}$/.test(value.id) ? value.id : randomUUID();

    return {
        id,
        name,
        ...(goal ? { goal } : {}),
        steps,
        repetitions: integer(value.repetitions, `${label}: repetições`, 1, LIMITS.repetitions),
        holdSeconds: integer(value.holdSeconds, `${label}: tempo de segurar`, 0, LIMITS.seconds),
        relaxSeconds: integer(value.relaxSeconds, `${label}: relaxamento`, 0, LIMITS.seconds),
        video: validateVideo(value.video),
        validation: validateValidation(value.validation),
    };
}

export type TrainingInput = {
    name: string;
    audience: Audience;
    exercises: CustomExercise[];
};

/** Valida o corpo de POST/PUT. Devolve os dados já limpos ou a mensagem de erro (400). */
export function validateTrainingInput(
    body: unknown
): { ok: true; value: TrainingInput } | { ok: false; message: string } {
    try {
        if (!isObject(body)) return { ok: false, message: "Corpo inválido" };

        const name = text(body.name, "Nome do treino", LIMITS.name, true);

        if (!Array.isArray(body.exercises) || body.exercises.length < 1) {
            return { ok: false, message: "Inclua pelo menos 1 exercício" };
        }
        if (body.exercises.length > LIMITS.exercises) {
            return { ok: false, message: `No máximo ${LIMITS.exercises} exercícios` };
        }

        return {
            ok: true,
            value: {
                name,
                audience: validateAudience(body.audience),
                exercises: body.exercises.map((e, i) => validateExercise(e, i + 1)),
            },
        };
    } catch (error) {
        if (error instanceof Invalid) return { ok: false, message: error.message };
        throw error;
    }
}
