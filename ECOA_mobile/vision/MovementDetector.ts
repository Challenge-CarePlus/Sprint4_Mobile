import { ValidationRule } from "../data/types";
import type { Blendshape } from "./FaceLandmarkerBridge";
import {
    ENCOURAGEMENT_BY_MOVEMENT,
    MOVEMENT_ACTIVATION_DELTA,
    MOVEMENT_BLENDSHAPES,
} from "./movementThresholds";

export type DetectorFeedback =
    | { kind: "prompt"; message: string }
    | { kind: "holding"; message: string; remainingMs: number }
    | { kind: "waiting-release"; message: string }
    | { kind: "relaxing"; message: string; remainingMs: number }
    | { kind: "repetition-complete"; message: string; repetitionsDone: number }
    | { kind: "exercise-complete"; repetitionsDone: number };

type InternalState = "idle" | "engaging" | "cooldown";

/**
 * Quanto o sinal pode ficar abaixo do limiar durante a sustentação sem perder
 * a repetição: o score do MediaPipe oscila de quadro a quadro, e zerar o
 * tempo a cada queda de 1 quadro tornava "segure 3 segundos" quase impossível.
 */
const HOLD_GRACE_MS = 400;

/**
 * Relaxamento adaptativo: o sinal "relaxou" quando cai a esta fração do PICO da repetição (ou fica abaixo do
 * limiar). Quem tem o repouso acima do limiar (ex.: lábios finos no lipPress) nunca voltaria ao nível absoluto.
 */
export const RELAX_PEAK_RATIO = 0.6;
/** Quando o repouso fica acima do limiar, a próxima repetição exige subir esta fração entre o repouso e o pico. */
const REARM_FRACTION = 0.5;

/**
 * Calcula o quanto um movimento está "ativo" em relação à calibração do
 * usuário (não um valor absoluto). Quando o movimento depende de mais de um
 * blendshape (ex.: sorriso = lado esquerdo + direito), usa o maior delta.
 */
export function computeRelativeScore(
    rule: Pick<ValidationRule, "movement">,
    blendshapes: Blendshape[],
    baseline: Record<string, number>
): number {
    const names = MOVEMENT_BLENDSHAPES[rule.movement];

    const deltas = names.map((name) => {
        const raw = blendshapes.find((b) => b.name === name)?.score ?? 0;
        const base = baseline[name] ?? 0;
        return Math.max(0, raw - base);
    });

    return Math.max(...deltas);
}

/**
 * Máquina de estados para um exercício "validado": idle (aguardando o
 * movimento) -> engaging (segurando, se o exercício exigir) -> cooldown
 * (aguardando o usuário relaxar antes de contar a próxima repetição).
 * Sem acoplamento com UI, câmera ou voz — só recebe leituras de blendshapes
 * com timestamp e devolve o que aconteceu.
 */
export class MovementDetector {
    private state: InternalState = "idle";
    private engagedSince: number | null = null;
    private belowSince: number | null = null;
    private relaxSince: number | null = null;
    private repetitionsDone = 0;
    /** Maior score relativo desde o início da repetição atual. */
    private peak = 0;
    /** Maior score visto durante o relaxamento aceito pela queda em relação ao pico (repouso acima do limiar). */
    private relaxedLevel = 0;
    /** Limiar para a próxima repetição (sobe quando o repouso da pessoa fica acima do limiar padrão). */
    private engageThreshold: number | null = null;

    constructor(
        private readonly rule: ValidationRule,
        private readonly baseline: Record<string, number>
    ) {}

    get repetitionsCompleted(): number {
        return this.repetitionsDone;
    }

    processReading(blendshapes: Blendshape[], now: number): DetectorFeedback {
        const relativeScore = computeRelativeScore(this.rule, blendshapes, this.baseline);
        const threshold = this.rule.activationDelta ?? MOVEMENT_ACTIVATION_DELTA[this.rule.movement];
        const requiredHoldMs = this.rule.holdDurationMs ?? 0;

        if (this.state === "idle") {
            const above = relativeScore >= (this.engageThreshold ?? threshold);
            const feedback = this.handleIdle(above, requiredHoldMs, now);
            // Começou a repetição: o pico parte do score atual.
            if (this.state !== "idle") this.peak = relativeScore;
            return feedback;
        }

        this.peak = Math.max(this.peak, relativeScore);

        if (this.state === "engaging") {
            return this.handleEngaging(relativeScore >= threshold, requiredHoldMs, now);
        }

        return this.handleCooldown(relativeScore, threshold, now);
    }

    private handleIdle(
        isAboveThreshold: boolean,
        requiredHoldMs: number,
        now: number
    ): DetectorFeedback {
        if (!isAboveThreshold) {
            return { kind: "prompt", message: this.promptMessage() };
        }

        if (requiredHoldMs === 0) {
            this.state = "cooldown";
            return this.registerRepetition();
        }

        this.state = "engaging";
        this.engagedSince = now;
        return { kind: "holding", message: "Continue segurando...", remainingMs: requiredHoldMs };
    }

    private handleEngaging(
        isAboveThreshold: boolean,
        requiredHoldMs: number,
        now: number
    ): DetectorFeedback {
        if (!isAboveThreshold) {
            this.belowSince ??= now;

            if (now - this.belowSince > HOLD_GRACE_MS) {
                this.state = "idle";
                this.engagedSince = null;
                this.belowSince = null;
                return { kind: "prompt", message: "Quase lá, tente de novo" };
            }
        } else {
            this.belowSince = null;
        }

        const elapsed = now - (this.engagedSince ?? now);
        const remainingMs = requiredHoldMs - elapsed;

        if (remainingMs <= 0) {
            this.state = "cooldown";
            return this.registerRepetition();
        }

        return { kind: "holding", message: "Continue segurando...", remainingMs };
    }

    /** Tempo de relaxamento exigido entre repetições (conta como parte do exercício). */
    private get relaxMs(): number {
        return this.rule.relaxDurationMs ?? ((this.rule.holdDurationMs ?? 0) > 0 ? 1500 : 0);
    }

    private promptMessage(): string {
        return this.rule.promptMessage ?? ENCOURAGEMENT_BY_MOVEMENT[this.rule.movement];
    }

    private handleCooldown(score: number, threshold: number, now: number): DetectorFeedback {
        const belowThreshold = score < threshold;
        // Relaxou: abaixo do limiar OU queda relevante em relação ao pico da repetição (repouso alto, lábios finos).
        const droppedFromPeak = score <= this.peak * RELAX_PEAK_RATIO;

        if (!belowThreshold && !droppedFromPeak) {
            // Ainda no movimento (ou voltou a ele): o relaxamento só conta com o rosto solto.
            this.relaxSince = null;
            this.relaxedLevel = 0;
            return { kind: "waiting-release", message: "Ótimo! Relaxe antes da próxima repetição." };
        }

        this.relaxSince ??= now;
        if (!belowThreshold) this.relaxedLevel = Math.max(this.relaxedLevel, score);
        const remainingMs = this.relaxMs - (now - this.relaxSince);

        if (remainingMs > 0) {
            return { kind: "relaxing", message: "Relaxe...", remainingMs };
        }

        this.state = "idle";
        this.relaxSince = null;
        // Repouso acima do limiar: a próxima repetição precisa subir de verdade acima dele (sem falso positivo).
        this.engageThreshold =
            this.relaxedLevel >= threshold ? this.relaxedLevel + (this.peak - this.relaxedLevel) * REARM_FRACTION : null;
        this.relaxedLevel = 0;
        return { kind: "prompt", message: this.promptMessage() };
    }

    private registerRepetition(): DetectorFeedback {
        this.repetitionsDone += 1;
        const target = this.rule.repetitions ?? 1;

        if (this.repetitionsDone >= target) {
            return { kind: "exercise-complete", repetitionsDone: this.repetitionsDone };
        }

        return {
            kind: "repetition-complete",
            message: "Ótimo!",
            repetitionsDone: this.repetitionsDone,
        };
    }
}
