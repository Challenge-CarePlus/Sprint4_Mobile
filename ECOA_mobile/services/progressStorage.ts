import AsyncStorage from "@react-native-async-storage/async-storage";

import { AgeGroup } from "../data/types";

export type CycleResult = {
    trackId: string;
    ageGroup: AgeGroup;
    completedAt: string;
    exercisesTotal: number;
    exercisesCompleted: number;
    validatedCompleted: number;
    guidedCompleted: number;
};

const PROGRESS_KEY = "@ecoa_exercise_progress";

export async function getProgressHistory(): Promise<CycleResult[]> {
    const stored = await AsyncStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export async function saveCycleResult(result: CycleResult): Promise<CycleResult[]> {
    const history = await getProgressHistory();
    const updated = [...history, result];

    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
    return updated;
}

export async function getLatestResultForTrack(trackId: string): Promise<CycleResult | undefined> {
    const history = await getProgressHistory();
    return [...history].reverse().find((result) => result.trackId === trackId);
}

export async function getCompletedCycleCount(trackId: string): Promise<number> {
    const history = await getProgressHistory();
    return history.filter((result) => result.trackId === trackId).length;
}
