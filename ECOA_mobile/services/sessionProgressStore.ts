import { ValidationType } from "../data/types";

export type ExerciseOutcome = {
    exerciseId: string;
    validationType: ValidationType;
    success: boolean;
    selfAssessment?: "yes" | "partial" | "no";
    /** Como as repetições foram contadas: pela câmera ou à mão ("Fiz uma vez"). */
    countedBy?: "camera" | "manual";
};

/** Se alguma repetição foi confirmada à mão, o exercício conta como "manual"; senão, pela câmera. */
export function countedByFor(manualReps: number): "camera" | "manual" {
    return manualReps > 0 ? "manual" : "camera";
}

/**
 * Resultados do ciclo em andamento, só em memória — acumulados enquanto o
 * usuário percorre os 5 exercícios da trilha. CycleSummaryScreen lê isso,
 * persiste o resumo em services/progressStorage.ts (AsyncStorage) e limpa.
 */
const outcomesByTrack = new Map<string, ExerciseOutcome[]>();

export function recordExerciseOutcome(trackId: string, outcome: ExerciseOutcome): void {
    const list = outcomesByTrack.get(trackId) ?? [];
    list.push(outcome);
    outcomesByTrack.set(trackId, list);
}

export function getSessionOutcomes(trackId: string): ExerciseOutcome[] {
    return outcomesByTrack.get(trackId) ?? [];
}

export function clearSessionOutcomes(trackId: string): void {
    outcomesByTrack.delete(trackId);
}
