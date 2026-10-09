import { ValidationRule } from "../../data/types";
import { computeRelativeScore, MovementDetector } from "../MovementDetector";
import type { Blendshape } from "../FaceLandmarkerBridge";

function bs(name: string, score: number): Blendshape {
    return { name, score };
}

const ZERO_BASELINE: Record<string, number> = {};

describe("computeRelativeScore", () => {
    it("subtracts the calibration baseline from the live score", () => {
        const score = computeRelativeScore(
            { movement: "jawOpen" },
            [bs("jawOpen", 0.8)],
            { jawOpen: 0.2 }
        );

        expect(score).toBeCloseTo(0.6);
    });

    it("never returns a negative delta when the live score dips below baseline", () => {
        const score = computeRelativeScore(
            { movement: "jawOpen" },
            [bs("jawOpen", 0.1)],
            { jawOpen: 0.3 }
        );

        expect(score).toBe(0);
    });

    it("uses the largest delta when a movement maps to multiple blendshapes", () => {
        const score = computeRelativeScore(
            { movement: "mouthSmile" },
            [bs("mouthSmileLeft", 0.1), bs("mouthSmileRight", 0.5)],
            ZERO_BASELINE
        );

        expect(score).toBeCloseTo(0.5);
    });
});

describe("MovementDetector — repetitions sem tempo de segurar", () => {
    const rule: ValidationRule = { movement: "jawOpen", repetitions: 3 };

    it("conta uma repetição por ciclo abaixo -> acima -> abaixo do limiar", () => {
        const detector = new MovementDetector(rule, ZERO_BASELINE);

        expect(detector.processReading([bs("jawOpen", 0)], 0)).toMatchObject({ kind: "prompt" });

        expect(detector.processReading([bs("jawOpen", 0.9)], 100)).toMatchObject({
            kind: "repetition-complete",
            repetitionsDone: 1,
        });
        expect(detector.repetitionsCompleted).toBe(1);

        // Mantendo acima do limiar não deve contar repetições extras.
        expect(detector.processReading([bs("jawOpen", 0.9)], 200)).toMatchObject({
            kind: "waiting-release",
        });
        expect(detector.repetitionsCompleted).toBe(1);

        expect(detector.processReading([bs("jawOpen", 0)], 300)).toMatchObject({
            kind: "prompt",
        });

        expect(detector.processReading([bs("jawOpen", 0.9)], 400)).toMatchObject({
            kind: "repetition-complete",
            repetitionsDone: 2,
        });

        expect(detector.processReading([bs("jawOpen", 0)], 500)).toMatchObject({ kind: "prompt" });

        expect(detector.processReading([bs("jawOpen", 0.9)], 600)).toMatchObject({
            kind: "exercise-complete",
            repetitionsDone: 3,
        });
    });
});

describe("MovementDetector — exercício com tempo de segurar", () => {
    const rule: ValidationRule = { movement: "mouthPucker", repetitions: 1, holdDurationMs: 2000 };

    it("só conta a repetição depois de manter o movimento pelo tempo exigido", () => {
        const detector = new MovementDetector(rule, ZERO_BASELINE);

        expect(detector.processReading([bs("mouthPucker", 0.9)], 0)).toMatchObject({
            kind: "holding",
            remainingMs: 2000,
        });

        expect(detector.processReading([bs("mouthPucker", 0.9)], 1000)).toMatchObject({
            kind: "holding",
            remainingMs: 1000,
        });

        expect(detector.repetitionsCompleted).toBe(0);

        expect(detector.processReading([bs("mouthPucker", 0.9)], 2000)).toMatchObject({
            kind: "exercise-complete",
            repetitionsDone: 1,
        });
    });

    it("reseta sem contar repetição se o usuário soltar antes do tempo", () => {
        const detector = new MovementDetector(rule, ZERO_BASELINE);

        detector.processReading([bs("mouthPucker", 0.9)], 0);

        const feedback = detector.processReading([bs("mouthPucker", 0)], 500);

        expect(feedback).toMatchObject({ kind: "prompt", message: "Quase lá, tente de novo" });
        expect(detector.repetitionsCompleted).toBe(0);
    });
});

describe("MovementDetector — calibração relativa", () => {
    it("exige um delta acima da linha de base, não um valor absoluto", () => {
        const rule: ValidationRule = { movement: "jawOpen", repetitions: 1 };
        const baseline = { jawOpen: 0.5 };
        const detector = new MovementDetector(rule, baseline);

        // Score absoluto alto, mas perto da linha de base do usuário: não deve ativar.
        expect(detector.processReading([bs("jawOpen", 0.6)], 0)).toMatchObject({ kind: "prompt" });

        // Bem acima da própria linha de base: deve ativar.
        expect(detector.processReading([bs("jawOpen", 0.95)], 100)).toMatchObject({
            kind: "exercise-complete",
        });
    });
});
