import { getExerciseById } from "../data/exercises";
import { TRACKS } from "../data/tracks";
import { Exercise, Track } from "../data/types";
import { Training } from "../data/training";
import { customToExercise } from "../vision/customExercise";

/** Prefixo dos ids de trilha personalizada (não colide com as 3 trilhas padrão). */
export const CUSTOM_TRACK_PREFIX = "custom-";

type CustomEntry = { track: Track; exercises: Exercise[]; training: Training };

let custom: CustomEntry[] = [];

/**
 * Trilhas e exercícios vêm de dois lugares: os dados estáticos do app (3 trilhas padrão) e os treinos
 * personalizados que o servidor devolve. As telas do fluxo (prévia, calibração, sessão, resumo) buscam por
 * id aqui, sem saber de onde veio. O registro dos personalizados fica em memória e é refeito a cada
 * carregamento da lista de trilhas.
 */
export function setCustomTrainings(trainings: Training[]): void {
    custom = trainings
        .filter((training) => training.exercises.length > 0)
        .map((training) => {
            const exercises = training.exercises.map((exercise, index) => customToExercise(training, exercise, index));
            const track: Track = {
                id: `${CUSTOM_TRACK_PREFIX}${training.id}`,
                ageGroup: "adults",
                name: training.name,
                description: "Treino criado pela sua fonoaudióloga.",
                exerciseIds: exercises.map((exercise) => exercise.id),
            };
            return { track, exercises, training };
        });
}

export function listCustomTracks(): Track[] {
    return custom.map((entry) => entry.track);
}

export function isCustomTrack(trackId: string): boolean {
    return trackId.startsWith(CUSTOM_TRACK_PREFIX);
}

export function findTrack(trackId: string | undefined): Track | undefined {
    if (!trackId) return undefined;
    return TRACKS.find((track) => track.id === trackId) ?? custom.find((entry) => entry.track.id === trackId)?.track;
}

export function findExercise(exerciseId: string | undefined): Exercise | undefined {
    if (!exerciseId) return undefined;
    return getExerciseById(exerciseId) ?? custom.flatMap((entry) => entry.exercises).find((exercise) => exercise.id === exerciseId);
}
