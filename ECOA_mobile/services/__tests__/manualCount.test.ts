jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

import { getExerciseById } from "../../data/exercises";
import { CustomExercise, Training } from "../../data/training";
import { customToExercise, validationNoteFor } from "../../vision/customExercise";
import { countedByFor } from "../sessionProgressStore";

function custom(overrides: Partial<CustomExercise> = {}): CustomExercise {
    return {
        id: "e",
        name: "Bochechas",
        steps: ["Encha as bochechas"],
        repetitions: 3,
        holdSeconds: 2,
        relaxSeconds: 1,
        video: null,
        validation: { movement: "cheekPuff", sensitivity: "normal" },
        ...overrides,
    };
}

const training = { id: "t1", name: "Treino" } as Training;

describe("contagem manual (F4)", () => {
    it("o balãozinho permite contagem manual e a prévia é honesta", () => {
        const exercise = getExerciseById("children-blow-balloon");
        expect(exercise?.allowManualCount).toBe(true);
        expect(exercise?.validationType).toBe("validado");
        expect(exercise?.validationNote).toBe("A câmera tenta reconhecer as bochechas; se não reconhecer, conte você mesma(o).");
    });

    it("os outros exercícios padrão continuam só pela câmera", () => {
        const others = ["adults-lip-trill", "elderly-effortful-swallow", "adults-jaw-stretch"].map(getExerciseById);
        for (const exercise of others) expect(exercise?.allowManualCount).toBeUndefined();
    });

    it("exercício personalizado: o interruptor vira allowManualCount e avisa na nota", () => {
        expect(customToExercise(training, custom({ allowManualCount: true }), 0).allowManualCount).toBe(true);
        expect(validationNoteFor(custom({ allowManualCount: true }))).toContain("conte você mesma(o)");
        expect(customToExercise(training, custom(), 0).allowManualCount).toBeUndefined();
        expect(validationNoteFor(custom())).not.toContain("conte");
    });

    it("registra como foi contado: manual se qualquer repetição foi à mão", () => {
        expect(countedByFor(0)).toBe("camera");
        expect(countedByFor(1)).toBe("manual");
    });
});
