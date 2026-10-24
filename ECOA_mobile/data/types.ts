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
export type FacialMovement = "jawOpen" | "mouthPucker" | "mouthSmile" | "cheekPuff" | "lipPress";

export type ValidationRule = {
    movement: FacialMovement;
    holdDurationMs?: number;
    repetitions?: number;
    /**
     * Exercícios que não são "um movimento repetido": `alternate` (sorriso ↔ bico,
     * cada troca conta) e `vowels` (A-E-I-O-U em ordem). Ver SequenceDetectors.
     */
    mode?: "alternate" | "vowels";
    /** Substitui o limiar padrão do movimento (delta sobre a calibração, 0–1). */
    activationDelta?: number;
    /**
     * Tempo de RELAXAMENTO contado entre repetições: o rosto precisa ficar abaixo do
     * limiar por esse tempo antes da próxima. Padrão: 1500 ms se o exercício tem
     * tempo de segurar, senão 0.
     */
    relaxDurationMs?: number;
    /** Instrução falada/mostrada enquanto o movimento não é detectado (padrão: a do movimento). */
    promptMessage?: string;
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
    /**
     * Contagem manual além da câmera ("Fiz uma vez" / "Finalizar exercício"): para movimentos que o MediaPipe mede
     * mal (ex.: bochecha cheia). Exceção explícita à regra "todos validados pela câmera" (23/10).
     */
    allowManualCount?: boolean;
    /**
     * Transparência: o que a câmera de fato confirma, quando a validação usa um
     * indicador facial aproximado (ex.: a língua não é visível para o MediaPipe).
     */
    validationNote?: string;
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
