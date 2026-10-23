import { TrainingDraft, blankExercise, inputFromDraft } from "../../data/training";
import { FORBIDDEN_CHARS_MESSAGE, hasForbiddenChars, pruneErrors, validateDraft, validateExerciseFields } from "../trainingValidation";

function draft(overrides: Partial<TrainingDraft> = {}): TrainingDraft {
    return {
        id: "t-1",
        isNew: true,
        name: "Aquecimento",
        audience: { all: true, ids: [] },
        exercises: [blankExercise()],
        ...overrides,
    };
}

describe("validateDraft", () => {
    it("aceita um treino completo", () => {
        expect(validateDraft(draft())).toEqual({});
    });

    it("pede nome, exercício e público", () => {
        const errors = validateDraft(draft({ name: "  ", exercises: [], audience: { all: false, ids: [] } }));
        expect(errors.name).toContain("Dê um nome");
        expect(errors.exercises).toBe("Adicione pelo menos um exercício.");
        expect(errors.audience).toBe("Escolha quem vai ver este treino.");
    });

    it("recusa < e > no nome", () => {
        expect(validateDraft(draft({ name: "<b>oi</b>" })).name).toBe(FORBIDDEN_CHARS_MESSAGE);
        expect(hasForbiddenChars("ok")).toBe(false);
    });
});

describe("validateExerciseFields", () => {
    const ok = { name: "Bico", steps: ["Faça um bico"], movement: "mouthPucker" };

    it("aceita campos válidos", () => {
        expect(validateExerciseFields(ok)).toEqual({});
    });

    it("exige nome, um passo não vazio e o movimento da câmera", () => {
        const errors = validateExerciseFields({ name: "", steps: ["  "], movement: null });
        expect(errors.name).toBeDefined();
        expect(errors.steps).toBeDefined();
        expect(errors.movement).toBeDefined();
    });
});

describe("inputFromDraft", () => {
    it("tira id local, apara textos e descarta passos vazios", () => {
        const exercise = { ...blankExercise(), name: " Bico ", steps: [" a ", "", "b"], goal: "  " };
        const input = inputFromDraft(draft({ name: " Meu treino ", exercises: [exercise] }));

        expect(input.name).toBe("Meu treino");
        expect(input.exercises[0]).not.toHaveProperty("id");
        expect(input.exercises[0].name).toBe("Bico");
        expect(input.exercises[0].steps).toEqual(["a", "b"]);
        expect(input.exercises[0].goal).toBeUndefined();
    });

    it("zera ids quando o público é todos", () => {
        expect(inputFromDraft(draft({ audience: { all: true, ids: ["p1"] } })).audience).toEqual({ all: true, ids: [] });
    });
});

describe("pruneErrors", () => {
    it("remove o erro assim que o campo fica válido", () => {
        const shown = validateDraft(draft({ name: "", exercises: [] }));
        expect(Object.keys(shown).sort()).toEqual(["exercises", "name"]);

        const after = pruneErrors(shown, validateDraft(draft({ name: "Aquecimento", exercises: [] })));
        expect(after).toEqual({ exercises: "Adicione pelo menos um exercício." });
    });

    it("zera tudo quando nada resta (o alerta geral some)", () => {
        const shown = validateDraft(draft({ name: "" }));
        expect(Object.keys(pruneErrors(shown, validateDraft(draft()))).length).toBe(0);
    });

    it("troca a mensagem quando o motivo muda e não mostra campo ainda não tentado", () => {
        const shown = validateDraft(draft({ name: "" }));
        const current = validateDraft(draft({ name: "a<b", exercises: [] }));
        const after = pruneErrors(shown, current);
        expect(after.name).toBe(FORBIDDEN_CHARS_MESSAGE);
        expect(after.exercises).toBeUndefined();
    });
});
