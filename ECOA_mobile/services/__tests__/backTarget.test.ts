import { backTarget } from "../backTarget";

describe("backTarget", () => {
    it("calibração e sessão voltam para a prévia do mesmo exercício", () => {
        const params = { trackId: "adults", exerciseIndex: 2 };
        expect(backTarget("CALIBRATION", params)).toEqual({ type: "replace", name: "EXERCISE_PREVIEW", params });
        expect(backTarget("EXERCISE_SESSION", params)).toEqual({ type: "replace", name: "EXERCISE_PREVIEW", params });
    });

    it("prévia volta para a escolha de trilha; escolha e resumo, para a Home", () => {
        expect(backTarget("EXERCISE_PREVIEW", { trackId: "a", exerciseIndex: 0 })).toEqual({ type: "popTo", name: "TRACK_SELECT" });
        expect(backTarget("TRACK_SELECT")).toEqual({ type: "popTo", name: "MAIN" });
        expect(backTarget("CYCLE_SUMMARY", { trackId: "a" })).toEqual({ type: "popTo", name: "MAIN" });
    });

    it("admin: cada tela volta para a anterior da hierarquia", () => {
        expect(backTarget("EVOLUTION")).toEqual({ type: "popTo", name: "MAIN" });
        expect(backTarget("PATIENT", { id: "1" })).toEqual({ type: "popTo", name: "EVOLUTION" });
        expect(backTarget("TRAININGS")).toEqual({ type: "popTo", name: "MAIN" });
        expect(backTarget("EDIT_TRAINING")).toEqual({ type: "popTo", name: "TRAININGS" });
        expect(backTarget("EDIT_EXERCISE")).toEqual({ type: "popTo", name: "EDIT_TRAINING" });
        expect(backTarget("PICK_PATIENTS")).toEqual({ type: "popTo", name: "EDIT_TRAINING" });
    });

    it("configurações e teste voltam para a tela de origem", () => {
        expect(backTarget("SETTINGS")).toEqual({ type: "pop" });
        expect(backTarget("TEST_EXERCISE")).toEqual({ type: "pop" });
    });
});
