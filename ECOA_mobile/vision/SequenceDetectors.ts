import { ValidationRule } from "../data/types";
import type { DetectorFeedback } from "./MovementDetector";
import type { Blendshape } from "./FaceLandmarkerBridge";

/**
 * Detectores de exercícios cuja instrução NÃO é "repita um único movimento":
 * - `alternate`: alternar sorriso e bico (cada troca de posição conta).
 * - `vowels`: A-E-I-O-U em ordem (a boca muda de forma a cada vogal).
 * Um detector de movimento único (sorriso ×8) deixava validar o exercício
 * sem nunca fazer o bico, ou sem articular I e U (boca quase fechada).
 *
 * Mesma interface do MovementDetector: recebe leituras e devolve feedback.
 * Os limiares são relativos à calibração (rosto relaxado) e ainda precisam de
 * ajuste fino com rostos reais.
 */
export interface Detector {
    processReading(blendshapes: Blendshape[], now: number): DetectorFeedback;
    readonly repetitionsCompleted: number;
}

/** Tempo mínimo que a posição precisa durar para contar (evita ruído de 1 quadro). */
const POSE_MIN_MS = 250;

type Reader = (name: string) => number;

function makeReader(blendshapes: Blendshape[], baseline: Record<string, number>): Reader {
    return (name) => {
        const raw = blendshapes.find((b) => b.name === name)?.score ?? 0;
        return Math.max(0, raw - (baseline[name] ?? 0));
    };
}

const smileOf = (r: Reader) => Math.max(r("mouthSmileLeft"), r("mouthSmileRight"));

/** Sorriso e bico alternados: cada nova posição (sorriso ↔ bico) conta uma alternância. */
export class AlternatingDetector implements Detector {
    private last: "smile" | "pucker" | null = null;
    private candidate: { pose: "smile" | "pucker"; since: number } | null = null;
    private done = 0;

    constructor(
        private readonly rule: ValidationRule,
        private readonly baseline: Record<string, number>
    ) {}

    get repetitionsCompleted(): number {
        return this.done;
    }

    processReading(blendshapes: Blendshape[], now: number): DetectorFeedback {
        const read = makeReader(blendshapes, this.baseline);
        const smile = smileOf(read);
        const pucker = read("mouthPucker");

        const pose: "smile" | "pucker" | null =
            smile >= 0.3 && smile > pucker ? "smile" : pucker >= 0.25 && pucker > smile ? "pucker" : null;

        const expected: "smile" | "pucker" = this.last === "smile" ? "pucker" : "smile";

        if (pose && pose === expected) {
            if (!this.candidate || this.candidate.pose !== pose) {
                this.candidate = { pose, since: now };
            } else if (now - this.candidate.since >= POSE_MIN_MS) {
                this.last = pose;
                this.candidate = null;
                this.done += 1;

                if (this.done >= (this.rule.repetitions ?? 8)) {
                    return { kind: "exercise-complete", repetitionsDone: this.done };
                }

                return { kind: "repetition-complete", message: "Ótimo!", repetitionsDone: this.done };
            }
            return { kind: "holding", message: pose === "smile" ? "Sorriso!" : "Bico!", remainingMs: 0 };
        }

        this.candidate = null;
        const message =
            expected === "smile"
                ? this.last === null
                    ? "Comece com um sorriso bem aberto"
                    : "Agora, um sorriso aberto"
                : "Agora, faça o bico";
        return { kind: "prompt", message };
    }
}

type Vowel = "A" | "E" | "I" | "O" | "U";
const VOWELS: Vowel[] = ["A", "E", "I", "O", "U"];

/**
 * Cada vogal tem uma região própria (abertura da mandíbula × sorriso × bico),
 * disjuntas entre vogais vizinhas na ordem A-E-I-O-U:
 * A boca bem aberta · E aberta e esticada · I esticada e quase fechada ·
 * O aberta e arredondada · U arredondada e quase fechada.
 */
function matchesVowel(v: Vowel, r: Reader): boolean {
    const jaw = r("jawOpen");
    const smile = smileOf(r);
    const round = Math.max(r("mouthPucker"), r("mouthFunnel"));

    switch (v) {
        case "A":
            return jaw >= 0.4 && round < 0.3;
        case "E":
            return smile >= 0.2 && jaw >= 0.2 && jaw < 0.5;
        case "I":
            return smile >= 0.3 && jaw < 0.15;
        case "O":
            return round >= 0.2 && jaw >= 0.2;
        case "U":
            return round >= 0.3 && jaw < 0.2;
    }
}

/** Sobrearticulação vocálica: A-E-I-O-U em ordem, repetindo as séries até completar. */
export class VowelSequenceDetector implements Detector {
    private index = 0;
    private candidateSince: number | null = null;
    // A vogal seguinte só vale depois de a boca ter saído da anterior (evita
    // avançar duas vogais com o mesmo formato de boca).
    private mustLeaveShape = false;
    private done = 0;

    constructor(
        private readonly rule: ValidationRule,
        private readonly baseline: Record<string, number>
    ) {}

    get repetitionsCompleted(): number {
        return this.done;
    }

    processReading(blendshapes: Blendshape[], now: number): DetectorFeedback {
        const read = makeReader(blendshapes, this.baseline);
        const expected = VOWELS[this.index % VOWELS.length];
        const matches = matchesVowel(expected, read);

        if (this.mustLeaveShape) {
            if (!matches) this.mustLeaveShape = false;
        } else if (matches) {
            if (this.candidateSince === null) {
                this.candidateSince = now;
            } else if (now - this.candidateSince >= POSE_MIN_MS) {
                this.candidateSince = null;
                this.mustLeaveShape = true;
                this.index += 1;
                this.done += 1;

                if (this.done >= (this.rule.repetitions ?? 10)) {
                    return { kind: "exercise-complete", repetitionsDone: this.done };
                }

                return { kind: "repetition-complete", message: "Ótimo!", repetitionsDone: this.done };
            }
            return { kind: "holding", message: `Isso, ${expected}!`, remainingMs: 0 };
        }

        this.candidateSince = null;
        const next = VOWELS[this.index % VOWELS.length];
        return {
            kind: "prompt",
            message: this.index === 0 ? "Comece com o A, abrindo bem a boca" : `Agora, o ${next}`,
        };
    }
}
