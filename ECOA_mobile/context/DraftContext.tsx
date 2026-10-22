import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import {
    Audience,
    CustomExercise,
    Training,
    TrainingDraft,
    blankDraft,
    draftFromTraining,
} from "../data/training";

type DraftContextValue = {
    draft: TrainingDraft;
    /** Índice do exercício em edição (-1 = novo). */
    exerciseIndex: number;
    startNew: () => void;
    startEdit: (training: Training) => void;
    setName: (name: string) => void;
    setAudience: (audience: Audience) => void;
    /** Edição de exercício: -1 adiciona ao fim; senão substitui o índice. */
    editExercise: (index: number) => void;
    saveExercise: (exercise: CustomExercise) => void;
    removeExercise: (index: number) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

/**
 * Rascunho do treino em edição: sobrevive à ida e volta entre Editar treino, Editar exercício e
 * Escolher pacientes (telas diferentes da pilha), e só vira treino de verdade ao salvar.
 */
export function DraftProvider({ children }: { children: ReactNode }) {
    const [draft, setDraft] = useState<TrainingDraft>(blankDraft);
    const [exerciseIndex, setExerciseIndex] = useState(-1);

    const startNew = useCallback(() => setDraft(blankDraft()), []);
    const startEdit = useCallback((training: Training) => setDraft(draftFromTraining(training)), []);
    const setName = useCallback((name: string) => setDraft((d) => ({ ...d, name })), []);
    const setAudience = useCallback((audience: Audience) => setDraft((d) => ({ ...d, audience })), []);
    const editExercise = useCallback((index: number) => setExerciseIndex(index), []);
    const saveExercise = useCallback(
        (exercise: CustomExercise) =>
            setDraft((d) => {
                const exercises = d.exercises.slice();
                if (exerciseIndex >= 0 && exerciseIndex < exercises.length) exercises[exerciseIndex] = exercise;
                else exercises.push(exercise);
                return { ...d, exercises };
            }),
        [exerciseIndex]
    );
    const removeExercise = useCallback(
        (index: number) => setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== index) })),
        []
    );

    const value = useMemo(
        () => ({ draft, exerciseIndex, startNew, startEdit, setName, setAudience, editExercise, saveExercise, removeExercise }),
        [draft, exerciseIndex, startNew, startEdit, setName, setAudience, editExercise, saveExercise, removeExercise]
    );

    return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
    const value = useContext(DraftContext);
    if (!value) throw new Error("useDraft fora do DraftProvider");
    return value;
}
