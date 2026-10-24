/**
 * Treinos personalizados ("trilhas personalizadas") criados pela equipe — contrato do
 * docs/v3/SPEC.md. O que o admin informa em `validation` é o que a câmera usa para validar.
 */

/** ids = id de paciente (p1..p8). */
export type Audience = { all: boolean; ids: string[] };

export type CustomMovement =
    | "jawOpen"
    | "mouthSmile"
    | "mouthPucker"
    | "cheekPuff"
    | "lipPress"
    | "alternateSmilePucker"
    | "vowels";

export type Sensitivity = "soft" | "normal" | "firm";

export type CustomValidation = {
    movement: CustomMovement;
    sensitivity: Sensitivity;
    /** Fala/mostra enquanto o movimento não é detectado. */
    promptMessage?: string;
    /** "O que a câmera confirma" — mostrado ao paciente (transparência). */
    note?: string;
};

export type ExerciseVideo = { url: string; name: string; size: number; mime: string };

export type CustomExercise = {
    /** Só no app (chave de lista); o servidor não guarda. */
    id: string;
    name: string;
    goal?: string;
    /** "Como fazer": pelo menos um passo não vazio. */
    steps: string[];
    repetitions: number;
    /** 0 = sem tempo de segurar. */
    holdSeconds: number;
    relaxSeconds: number;
    video: ExerciseVideo | null;
    validation: CustomValidation;
    /** Permite contar as repetições à mão ("Fiz uma vez"), além da câmera. */
    allowManualCount?: boolean;
    /** Exercício padrão (vem do servidor, só leitura): pode ser editado, não excluído. */
    protected?: boolean;
};

export type Training = {
    id: string;
    name: string;
    example?: boolean;
    /** Treino padrão (servidor): pode ser editado, não excluído. */
    protected?: boolean;
    audience: Audience;
    exercises: CustomExercise[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
};

/** Corpo de POST/PUT /trainings: id, datas e autor são do servidor. */
export type TrainingInput = {
    name: string;
    audience: Audience;
    /** `id` só dos exercícios que o servidor já conhece (ele os preserva; e1/e2 do padrão precisam continuar na lista). */
    exercises: (Omit<CustomExercise, "id" | "protected"> & { id?: string })[];
};

/** Rascunho em edição no painel (id novo gerado no app até salvar). */
export type TrainingDraft = {
    id: string;
    isNew: boolean;
    protected?: boolean;
    name: string;
    audience: Audience;
    exercises: CustomExercise[];
};

export type Patient = {
    id: string;
    name: string;
    email: string;
    trail: string;
    /** Adesão em %. */
    adherence: number;
    sessions: number;
    lastSession: string;
    /** Exercícios por dia nos últimos 7 dias (segunda a domingo no protótipo). */
    week: number[];
    /** Sempre true: dados de exemplo, rotulados na UI. */
    sample: boolean;
    trainings: { id: string; name: string }[];
};

export function audienceLabel(audience: Audience): string {
    if (audience.all) return "Todos os pacientes";
    const n = audience.ids.length;
    return n === 0 ? "Nenhum paciente" : n === 1 ? "1 paciente" : `${n} pacientes`;
}

export function exerciseCountLabel(n: number): string {
    return n === 1 ? "1 exercício" : `${n} exercícios`;
}

export function repsLabel(exercise: Pick<CustomExercise, "repetitions" | "holdSeconds">): string {
    const base = `${exercise.repetitions}×`;
    return exercise.holdSeconds ? `${base} · ${exercise.holdSeconds} s cada` : base;
}

/** Id de rascunho gerado por `newLocalId` (nunca é id do servidor). */
export function isLocalId(id: string): boolean {
    return /^[a-z]-[0-9a-z]+-\d+$/.test(id);
}

let counter = 0;
/** Id local de rascunho (único na sessão). */
export function newLocalId(prefix = "n"): string {
    counter += 1;
    return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function blankExercise(): CustomExercise {
    return {
        id: newLocalId("e"),
        name: "",
        goal: "",
        steps: [""],
        repetitions: 3,
        holdSeconds: 3,
        relaxSeconds: 2,
        video: null,
        validation: { movement: "jawOpen", sensitivity: "normal" },
    };
}

export function blankDraft(): TrainingDraft {
    return { id: newLocalId("t"), isNew: true, name: "", audience: { all: true, ids: [] }, exercises: [] };
}

export function draftFromTraining(training: Training): TrainingDraft {
    return {
        id: training.id,
        isNew: false,
        protected: training.protected === true,
        name: training.name,
        audience: { all: training.audience.all, ids: [...training.audience.ids] },
        exercises: training.exercises.map((e, i) => ({
            ...e,
            id: e.id ?? newLocalId("e"),
            steps: [...e.steps],
            validation: { ...e.validation },
            video: e.video ? { ...e.video } : null,
        })),
    };
}

export function inputFromDraft(draft: TrainingDraft): TrainingInput {
    return {
        name: draft.name.trim(),
        audience: draft.audience.all ? { all: true, ids: [] } : { all: false, ids: [...draft.audience.ids] },
        exercises: draft.exercises.map(({ id, protected: _protected, ...rest }) => ({
            // Id local de rascunho não vai (o servidor gera); o de um exercício que já existia volta, para ele ser preservado.
            ...(isLocalId(id) ? {} : { id }),
            ...rest,
            // null explícito: JSON.stringify descarta undefined, e o corpo não deve depender de como o servidor trata campo ausente.
            video: rest.video ?? null,
            name: rest.name.trim(),
            goal: rest.goal?.trim() || undefined,
            steps: rest.steps.map((s) => s.trim()).filter(Boolean),
        })),
    };
}
