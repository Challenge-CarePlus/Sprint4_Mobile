import { CustomExercise, Training, blankExercise } from "../../data/training";
import {
    customToExercise,
    customToValidationRule,
    inferMovement,
    validationNoteFor,
} from "../customExercise";
import { MOVEMENT_ACTIVATION_DELTA } from "../movementThresholds";

jest.mock("../../services/trainingsApi", () => ({
    resolveMediaUrl: (url: string) => `http://api.test${url}`,
}));

function exercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
    return { ...blankExercise(), name: "Teste", steps: ["Passo"], ...overrides };
}

describe("inferMovement", () => {
    const cases: [string, string | undefined, string[], string | null][] = [
        ["Sorriso largo", undefined, ["Dê um sorriso bem grande"], "mouthSmile"],
        ["Beijinho", undefined, ["Faça um bico, como num beijo"], "mouthPucker"],
        ["Alongamento", "Relaxa a mandíbula", ["Abra bem a boca, como um bocejo"], "jawOpen"],
        ["Balão", undefined, ["Encha as bochechas de ar"], "cheekPuff"],
        ["Força", undefined, ["Aperte os lábios com firmeza"], "lipPress"],
        ["Deglutição", "Esforço ao engolir", ["Engula com esforço"], "lipPress"],
        ["Sorriso e bico", undefined, ["Sorria, depois faça bico, e repita"], "alternateSmilePucker"],
        ["Vogais", undefined, ["Fale A, E, I, O, U devagar"], "vowels"],
        ["Fale as vogais", undefined, ["Repita"], "vowels"],
        ["Respirar", undefined, ["Inspire pelo nariz"], null],
    ];

    it.each(cases)("%s → %s", (name, goal, steps, expected) => {
        expect(inferMovement(name, goal, steps)).toBe(expected);
    });

    it("ignora acentos e caixa", () => {
        expect(inferMovement("SORRISO", undefined, [])).toBe("mouthSmile");
        expect(inferMovement("Mandíbula", undefined, [])).toBe("jawOpen");
    });
});

describe("customToValidationRule", () => {
    it("converte tempos para ms e repetições", () => {
        const rule = customToValidationRule(
            exercise({ repetitions: 4, holdSeconds: 3, relaxSeconds: 2, validation: { movement: "mouthSmile", sensitivity: "normal" } })
        );
        expect(rule).toMatchObject({ movement: "mouthSmile", repetitions: 4, holdDurationMs: 3000, relaxDurationMs: 2000 });
        expect(rule.mode).toBeUndefined();
    });

    it("multiplica o limiar padrão pela sensibilidade", () => {
        const base = MOVEMENT_ACTIVATION_DELTA.jawOpen;
        const delta = (sensitivity: "soft" | "normal" | "firm") =>
            customToValidationRule(exercise({ validation: { movement: "jawOpen", sensitivity } })).activationDelta;

        expect(delta("normal")).toBeCloseTo(base, 5);
        expect(delta("soft")).toBeCloseTo(base * 0.7, 3);
        expect(delta("firm")).toBeCloseTo(base * 1.3, 3);
    });

    it("mapeia alternar e vogais para os modos dos detectores de sequência", () => {
        const alt = customToValidationRule(exercise({ validation: { movement: "alternateSmilePucker", sensitivity: "normal" } }));
        expect(alt).toMatchObject({ movement: "mouthSmile", mode: "alternate", activationDelta: undefined });

        const vowels = customToValidationRule(exercise({ validation: { movement: "vowels", sensitivity: "firm" } }));
        expect(vowels).toMatchObject({ movement: "jawOpen", mode: "vowels" });
    });

    it("passa a mensagem de incentivo só quando preenchida", () => {
        const rule = (promptMessage?: string) =>
            customToValidationRule(exercise({ validation: { movement: "jawOpen", sensitivity: "normal", promptMessage } }));
        expect(rule("  Abra bem  ").promptMessage).toBe("Abra bem");
        expect(rule("   ").promptMessage).toBeUndefined();
    });
});

describe("customToExercise", () => {
    const training: Training = {
        id: "t1",
        name: "Meu treino",
        audience: { all: true, ids: [] },
        exercises: [],
        createdAt: "",
        updatedAt: "",
        createdBy: "a1",
    };

    it("vira um exercício validado do núcleo, com a url do vídeo completa", () => {
        const ex = customToExercise(
            training,
            exercise({ goal: "", video: { url: "/media/a.mp4", name: "a.mp4", size: 1, mime: "video/mp4" } }),
            2
        );

        expect(ex.validationType).toBe("validado");
        expect(ex.ageGroup).toBe("adults");
        expect(ex.id).toBe("t1:2");
        expect(ex.therapeuticGoal).toBe("Meu treino");
        expect(ex.demoVideoUrl).toBe("http://api.test/media/a.mp4");
        expect(ex.validationRule).toBeDefined();
    });

    it("usa a nota do admin ou um texto padrão sobre o que a câmera confirma", () => {
        expect(validationNoteFor(exercise({ validation: { movement: "mouthSmile", sensitivity: "normal", note: "Confirma o sorriso" } }))).toBe(
            "Confirma o sorriso"
        );
        expect(validationNoteFor(exercise({ validation: { movement: "mouthSmile", sensitivity: "normal" } }))).toBe(
            "A câmera confirma: sorrir."
        );
    });
});
