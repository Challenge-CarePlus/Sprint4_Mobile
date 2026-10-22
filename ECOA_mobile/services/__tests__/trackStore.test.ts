import { TRACKS } from "../../data/tracks";
import { Training, blankExercise } from "../../data/training";
import { findExercise, findTrack, isCustomTrack, listCustomTracks, setCustomTrainings } from "../trackStore";

jest.mock("../trainingsApi", () => ({
    resolveMediaUrl: (url: string) => `http://api.test${url}`,
}));

function training(id: string, exercises = 2): Training {
    return {
        id,
        name: `Treino ${id}`,
        audience: { all: true, ids: [] },
        exercises: Array.from({ length: exercises }, (_, i) => ({ ...blankExercise(), name: `Ex ${i + 1}`, steps: ["Passo"] })),
        createdAt: "",
        updatedAt: "",
        createdBy: "a1",
    };
}

describe("trackStore", () => {
    beforeEach(() => setCustomTrainings([]));

    it("mantém as 3 trilhas padrão e seus exercícios", () => {
        expect(findTrack(TRACKS[0].id)).toBe(TRACKS[0]);
        expect(findExercise(TRACKS[0].exerciseIds[0])).toBeDefined();
        expect(listCustomTracks()).toEqual([]);
    });

    it("registra treinos personalizados como trilha + exercícios validados", () => {
        setCustomTrainings([training("t1", 2)]);

        const [track] = listCustomTracks();
        expect(track.id).toBe("custom-t1");
        expect(isCustomTrack(track.id)).toBe(true);
        expect(track.exerciseIds).toHaveLength(2);
        expect(findTrack("custom-t1")).toBe(track);

        const exercise = findExercise(track.exerciseIds[1]);
        expect(exercise?.name).toBe("Ex 2");
        expect(exercise?.validationType).toBe("validado");
    });

    it("ignora treino sem exercícios e esquece os que saíram da lista", () => {
        setCustomTrainings([training("vazio", 0), training("t2", 1)]);
        expect(listCustomTracks().map((t) => t.id)).toEqual(["custom-t2"]);

        setCustomTrainings([]);
        expect(findTrack("custom-t2")).toBeUndefined();
        expect(findExercise("t2:0")).toBeUndefined();
    });

    it("não acha id vazio ou desconhecido", () => {
        expect(findTrack(undefined)).toBeUndefined();
        expect(findExercise("nao-existe")).toBeUndefined();
    });
});
