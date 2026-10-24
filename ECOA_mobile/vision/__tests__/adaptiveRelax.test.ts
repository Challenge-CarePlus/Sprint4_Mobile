import { ValidationRule } from "../../data/types";
import { getExerciseById } from "../../data/exercises";
import type { Blendshape } from "../FaceLandmarkerBridge";
import { MovementDetector } from "../MovementDetector";

const PRESS = (value: number): Blendshape[] => [
    { name: "mouthPressLeft", score: value },
    { name: "mouthPressRight", score: value },
];

/** Alimenta o detector a 10 quadros/s com `value` durante `ms`; devolve o relógio e o último feedback. */
function run(detector: MovementDetector, clock: { t: number }, value: number, ms: number) {
    let last;
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
        last = detector.processReading(PRESS(value), clock.t);
        clock.t += 100;
    }
    return last;
}

function swallowRule(): ValidationRule {
    const exercise = getExerciseById("elderly-effortful-swallow");
    if (!exercise || exercise.validationType !== "validado") throw new Error("exercício não encontrado");
    return exercise.validationRule;
}

describe("relaxamento adaptativo (F6) — Deglutição em esforço", () => {
    it("lábios finos (repouso ~0,18, esforço ~0,45): relaxa pela queda e conta as 5 repetições", () => {
        // Calibração com os lábios soltos (0,02), mas o repouso real da pessoa é 0,18 (acima do limiar 0,15).
        const detector = new MovementDetector(swallowRule(), { mouthPressLeft: 0.02, mouthPressRight: 0.02 });
        const clock = { t: 0 };

        run(detector, clock, 0.18, 1000); // parte do repouso alto: 0,16 relativo > 0,15 → não pode contar sozinho
        expect(detector.repetitionsCompleted).toBe(0);

        for (let rep = 1; rep <= 5; rep++) {
            run(detector, clock, 0.45, 1500); // esforço
            expect(detector.repetitionsCompleted).toBe(rep);
            if (rep < 5) {
                const feedback = run(detector, clock, 0.18, 3000); // volta ao repouso alto
                expect(detector.repetitionsCompleted).toBe(rep); // a queda não vira nova repetição
                expect(feedback).toMatchObject({ kind: "prompt" });
            }
        }
    });

    it("lábios finos: repouso alto sustentado nunca gera repetição (sem falso positivo)", () => {
        const detector = new MovementDetector(swallowRule(), { mouthPressLeft: 0.02, mouthPressRight: 0.02 });
        const clock = { t: 0 };

        run(detector, clock, 0.45, 1500);
        expect(detector.repetitionsCompleted).toBe(1);
        run(detector, clock, 0.18, 20000);
        expect(detector.repetitionsCompleted).toBe(1);
    });

    it("lábios normais (repouso ~0,02): comportamento de sempre, 5 repetições", () => {
        const detector = new MovementDetector(swallowRule(), { mouthPressLeft: 0.02, mouthPressRight: 0.02 });
        const clock = { t: 0 };

        for (let rep = 1; rep <= 5; rep++) {
            run(detector, clock, 0.45, 1500);
            expect(detector.repetitionsCompleted).toBe(rep);
            run(detector, clock, 0.02, 2500);
        }
    });

    it("lábios normais: um segundo esforço mais fraco ainda conta (limiar padrão)", () => {
        const detector = new MovementDetector(swallowRule(), { mouthPressLeft: 0.02, mouthPressRight: 0.02 });
        const clock = { t: 0 };

        run(detector, clock, 0.6, 1500);
        run(detector, clock, 0.02, 2500);
        run(detector, clock, 0.25, 1500);
        expect(detector.repetitionsCompleted).toBe(2);
    });

    it("continuar apertando (queda pequena) segue como 'aguardando soltar'", () => {
        const detector = new MovementDetector(swallowRule(), { mouthPressLeft: 0.02, mouthPressRight: 0.02 });
        const clock = { t: 0 };

        run(detector, clock, 0.45, 1500);
        const feedback = run(detector, clock, 0.35, 4000); // 80% do pico: ainda apertando
        expect(feedback).toMatchObject({ kind: "waiting-release" });
        expect(detector.repetitionsCompleted).toBe(1);
    });
});
