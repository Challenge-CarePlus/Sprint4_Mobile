import { MovementDetector } from "../MovementDetector";
import { AlternatingDetector, VowelSequenceDetector } from "../SequenceDetectors";

const bs = (o: Record<string, number>) => Object.entries(o).map(([name, score]) => ({ name, score }));

const SMILE = bs({ mouthSmileLeft: 0.7, mouthSmileRight: 0.7 });
const PUCKER = bs({ mouthPucker: 0.6 });
const NEUTRAL = bs({});

/** Alimenta o detector com a mesma leitura por `ms` ms (um quadro a cada 50ms). */
function hold(d: { processReading: (b: any, t: number) => any }, reading: any, from: number, ms: number) {
    let last: any;
    for (let t = from; t <= from + ms; t += 50) last = d.processReading(reading, t);
    return { last, end: from + ms + 50 };
}

describe("AlternatingDetector — sorriso e bico alternados", () => {
    const rule = { movement: "mouthSmile" as const, repetitions: 4, mode: "alternate" as const };

    it("só sorriso repetido NÃO conclui o exercício", () => {
        const d = new AlternatingDetector(rule, {});
        let t = 0;
        for (let i = 0; i < 10; i++) {
            t = hold(d, SMILE, t, 400).end;
            t = hold(d, NEUTRAL, t, 200).end;
        }
        expect(d.repetitionsCompleted).toBe(1);
    });

    it("alternar sorriso e bico conta cada troca e conclui", () => {
        const d = new AlternatingDetector(rule, {});
        let t = 0;
        let result: any;
        for (const pose of [SMILE, PUCKER, SMILE, PUCKER]) {
            const r = hold(d, pose, t, 400);
            result = r.last;
            t = r.end;
        }
        expect(d.repetitionsCompleted).toBe(4);
        expect(result.kind === "exercise-complete" || d.repetitionsCompleted >= 4).toBe(true);
    });
});

describe("VowelSequenceDetector — A-E-I-O-U", () => {
    const rule = { movement: "jawOpen" as const, repetitions: 5, mode: "vowels" as const };
    const A = bs({ jawOpen: 0.7 });
    const E = bs({ jawOpen: 0.3, mouthSmileLeft: 0.4, mouthSmileRight: 0.4 });
    const I = bs({ jawOpen: 0.05, mouthSmileLeft: 0.6, mouthSmileRight: 0.6 });
    const O = bs({ jawOpen: 0.35, mouthPucker: 0.4 });
    const U = bs({ jawOpen: 0.05, mouthPucker: 0.6 });

    it("só abrir a boca repetidamente (A) não conclui", () => {
        const d = new VowelSequenceDetector(rule, {});
        let t = 0;
        for (let i = 0; i < 6; i++) {
            t = hold(d, A, t, 400).end;
            t = hold(d, NEUTRAL, t, 200).end;
        }
        expect(d.repetitionsCompleted).toBe(1);
    });

    it("A, E, I, O, U em ordem conclui", () => {
        const d = new VowelSequenceDetector(rule, {});
        let t = 0;
        for (const v of [A, E, I, O, U]) {
            t = hold(d, v, t, 400).end;
            t = hold(d, NEUTRAL, t, 100).end;
        }
        expect(d.repetitionsCompleted).toBe(5);
    });
});

describe("MovementDetector — tolerância na sustentação", () => {
    it("uma queda curta (<400ms) do sinal não zera a contagem do tempo", () => {
        const rule = { movement: "mouthSmile" as const, holdDurationMs: 2000, repetitions: 1 };
        const d = new MovementDetector(rule, {});
        let t = 0;
        t = hold(d, SMILE, t, 1000).end;
        t = hold(d, NEUTRAL, t, 150).end; // oscilação
        hold(d, SMILE, t, 1000);
        expect(d.repetitionsCompleted).toBe(1);
    });
});
