export const MOVEMENTS = [
    "jawOpen",
    "mouthSmile",
    "mouthPucker",
    "cheekPuff",
    "lipPress",
    "alternateSmilePucker",
    "vowels",
] as const;
export type Movement = (typeof MOVEMENTS)[number];

export const SENSITIVITIES = ["soft", "normal", "firm"] as const;
export type Sensitivity = (typeof SENSITIVITIES)[number];

export type Audience = { all: boolean; ids: string[] };

export type CustomValidation = {
    movement: Movement;
    sensitivity: Sensitivity;
    promptMessage?: string;
    note?: string;
};

export type ExerciseVideo = { url: string; name: string; size: number; mime: string };

export type CustomExercise = {
    id: string;
    name: string;
    goal?: string;
    steps: string[];
    repetitions: number;
    holdSeconds: number;
    relaxSeconds: number;
    video: ExerciseVideo | null;
    validation: CustomValidation;
    /** Opcional (ausente = false): o paciente pode contar a repetição manualmente (balãozinho). */
    allowManualCount?: boolean;
    /** Só na resposta (calculado, nunca gravado nem aceito do cliente): exercício padrão, não excluível. */
    protected?: boolean;
};

export type Training = {
    id: string;
    name: string;
    example?: boolean;
    /** Só na resposta (calculado): treino padrão, não excluível. */
    protected?: boolean;
    audience: Audience;
    exercises: CustomExercise[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
};
