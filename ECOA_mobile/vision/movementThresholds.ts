import { FacialMovement } from "../data/types";

/**
 * Cada movimento validável pode depender de mais de um blendshape do MediaPipe
 * (ex.: sorriso é mouthSmileLeft + mouthSmileRight). O score usado é o maior
 * delta entre eles em relação à calibração — ver computeRelativeScore.
 */
export const MOVEMENT_BLENDSHAPES: Record<FacialMovement, string[]> = {
    jawOpen: ["jawOpen"],
    mouthPucker: ["mouthPucker"],
    mouthSmile: ["mouthSmileLeft", "mouthSmileRight"],
    cheekPuff: ["cheekPuff"],
};

/**
 * Delta mínimo acima da linha de base (calibração) para considerar que o
 * movimento está sendo feito. Valores iniciais razoáveis para score 0-1 do
 * MediaPipe — ainda não calibrados com rostos reais em device; esperado
 * ajuste fino depois da validação em campo (ver CLAUDE.md, Fase 0).
 */
export const MOVEMENT_ACTIVATION_DELTA: Record<FacialMovement, number> = {
    jawOpen: 0.35,
    mouthPucker: 0.25,
    mouthSmile: 0.3,
    cheekPuff: 0.25,
};

export const ENCOURAGEMENT_BY_MOVEMENT: Record<FacialMovement, string> = {
    jawOpen: "Abra mais a boca",
    mouthPucker: "Faça mais bico com os lábios",
    mouthSmile: "Sorria mais",
    cheekPuff: "Encha mais as bochechas",
};
