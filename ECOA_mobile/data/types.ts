export type AgeGroup = "children" | "adults" | "elderly";

export type ValidationType = "validado" | "guiado";

export type FacialMovement =
    | "jawOpen"
    | "mouthPucker"
    | "mouthSmile"
    | "cheekPuff"
    | "tongueOut";

export type ValidationRule = {
    movement: FacialMovement;
    holdDurationMs?: number;
    repetitions?: number;
};

export type Exercise = {
    id: string;
    name: string;
    ageGroup: AgeGroup;
    therapeuticGoal: string;
    instructions: string[];
    repetitions?: number;
    durationSeconds?: number;
    validationType: ValidationType;
    validationRule?: ValidationRule;
    demoVideoUrl: string;
    professionalGuidanceRecommended?: boolean;
};

export type Track = {
    id: string;
    ageGroup: AgeGroup;
    name: string;
    description: string;
    exerciseIds: string[];
};
