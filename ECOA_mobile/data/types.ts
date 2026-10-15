export type AgeGroup = "children" | "adults" | "elderly";

export type ValidationType = "validado" | "guiado";

/**
 * "tongueOut" existiu aqui antes, mas o MediaPipe Face Landmarker não expõe
 * esse blendshape (a lista oficial de 52 categorias, diferente do conjunto
 * do ARKit, não inclui rastreamento de língua — não dá pra ver a língua de
 * forma confiável só com landmarks 2D de rosto). Qualquer exercício que
 * dependesse dele nunca validava de verdade: o score ficava sempre 0,
 * travado pedindo o movimento pra sempre. Ver "children-tongue-out" em
 * data/exercises.ts, convertido para "guiado".
 */
export type FacialMovement = "jawOpen" | "mouthPucker" | "mouthSmile" | "cheekPuff";

export type ValidationRule = {
    movement: FacialMovement;
    holdDurationMs?: number;
    repetitions?: number;
};

type ExerciseBase = {
    id: string;
    name: string;
    ageGroup: AgeGroup;
    therapeuticGoal: string;
    instructions: string[];
    repetitions?: number;
    durationSeconds?: number;
    /** URL remota (produção — ainda placeholder até os vídeos serem hospedados). */
    demoVideoUrl: string;
    /** Asset de vídeo local bundlado (require), usado enquanto não há hospedagem remota. */
    demoVideoAsset?: number;
    professionalGuidanceRecommended?: boolean;
};

/**
 * Union discriminada por validationType: um exercício "validado" sempre tem
 * validationRule (o MovementDetector depende dele); um "guiado" nunca tem.
 * Evita precisar de `exercise.validationRule!` em quem consome o tipo.
 */
export type Exercise =
    | (ExerciseBase & { validationType: "validado"; validationRule: ValidationRule })
    | (ExerciseBase & { validationType: "guiado"; validationRule?: undefined });

export type Track = {
    id: string;
    ageGroup: AgeGroup;
    name: string;
    description: string;
    exerciseIds: string[];
};
