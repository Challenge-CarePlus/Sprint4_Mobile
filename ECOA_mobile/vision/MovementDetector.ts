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
    private repetitionsDone = 0;

    constructor(
        private readonly rule: ValidationRule,
        private readonly baseline: Record<string, number>
    ) {}

    get repetitionsCompleted(): number {
        return this.repetitionsDone;
    }

    processReading(blendshapes: Blendshape[], now: number): DetectorFeedback {
        const relativeScore = computeRelativeScore(this.rule, blendshapes, this.baseline);
        const threshold = MOVEMENT_ACTIVATION_DELTA[this.rule.movement];
        const isAboveThreshold = relativeScore >= threshold;
        const requiredHoldMs = this.rule.holdDurationMs ?? 0;

        if (this.state === "idle") {
            return this.handleIdle(isAboveThreshold, requiredHoldMs, now);
        }

        if (this.state === "engaging") {
            return this.handleEngaging(isAboveThreshold, requiredHoldMs, now);
        }

        return this.handleCooldown(isAboveThreshold);
    }

    private handleIdle(
        isAboveThreshold: boolean,
        requiredHoldMs: number,
        now: number
    ): DetectorFeedback {
        if (!isAboveThreshold) {
            return { kind: "prompt", message: ENCOURAGEMENT_BY_MOVEMENT[this.rule.movement] };
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

    private handleCooldown(isAboveThreshold: boolean): DetectorFeedback {
        if (!isAboveThreshold) {
            this.state = "idle";
            return { kind: "prompt", message: ENCOURAGEMENT_BY_MOVEMENT[this.rule.movement] };
        }

        return { kind: "waiting-release", message: "Ótimo! Relaxe antes da próxima repetição." };
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
