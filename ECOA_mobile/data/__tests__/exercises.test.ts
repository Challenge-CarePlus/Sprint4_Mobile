import { getExerciseById } from "../exercises";

describe("adults-lip-trill (F5)", () => {
    it("segura 2 s e relaxa 1,5 s, com textos coerentes", () => {
        const exercise = getExerciseById("adults-lip-trill");
        if (!exercise || exercise.validationType !== "validado") throw new Error("exercício não encontrado");

        expect(exercise.validationRule).toMatchObject({ holdDurationMs: 2000, relaxDurationMs: 1500, repetitions: 5 });
        expect(exercise.durationSeconds).toBe(2);
        expect(exercise.instructions.join(" ")).toContain("cerca de 2 segundos");
        expect(exercise.instructions.join(" ")).not.toContain("3 segundos");
        expect(exercise.validationNote).toContain("2 s");
    });
});
