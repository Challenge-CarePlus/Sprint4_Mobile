import { Training } from "../models/training";
import { seedTrainings } from "../data/seed";
import { trainingsFile } from "../config/paths";
import { createJsonStore } from "./jsonStore";

const store = createJsonStore<Training[]>(trainingsFile, seedTrainings);

export const listTrainings = () => store.read();

export async function findTraining(id: string): Promise<Training | undefined> {
    return (await store.read()).find((t) => t.id === id);
}

export function createTraining(training: Training): Promise<Training> {
    return store.update((all) => ({ next: [...all, training], result: training }));
}

/** Substitui o treino; devolve o anterior e o novo (pra limpar vídeos órfãos), ou null se não existe. */
export function replaceTraining(
    id: string,
    build: (previous: Training) => Training
): Promise<{ previous: Training; current: Training } | null> {
    return store.update((all) => {
        const index = all.findIndex((t) => t.id === id);
        if (index === -1) return { result: null };

        const current = build(all[index]);
        const next = [...all];
        next[index] = current;
        return { next, result: { previous: all[index], current } };
    });
}

export function deleteTraining(id: string): Promise<Training | null> {
    return store.update((all) => {
        const found = all.find((t) => t.id === id);
        if (!found) return { result: null };
        return { next: all.filter((t) => t.id !== id), result: found };
    });
}
