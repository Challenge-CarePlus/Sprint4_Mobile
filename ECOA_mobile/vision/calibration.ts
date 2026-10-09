import type { Blendshape } from "./FaceLandmarkerBridge";

export const CALIBRATION_DURATION_MS = 3000;

/**
 * Coleta leituras de blendshapes com o rosto relaxado por ~3s e calcula a
 * média de cada um, usada como linha de base da calibração do usuário. Os
 * detectores de movimento comparam o score ao vivo contra essa linha de
 * base, nunca contra um valor absoluto — rostos e expressões de repouso
 * variam muito de pessoa para pessoa.
 */
export class CalibrationCollector {
    private sums: Record<string, number> = {};
    private counts: Record<string, number> = {};

    addSample(blendshapes: Blendshape[]): void {
        for (const blendshape of blendshapes) {
            this.sums[blendshape.name] = (this.sums[blendshape.name] ?? 0) + blendshape.score;
            this.counts[blendshape.name] = (this.counts[blendshape.name] ?? 0) + 1;
        }
    }

    get sampleCount(): number {
        return Math.max(0, ...Object.values(this.counts));
    }

    buildBaseline(): Record<string, number> {
        const baseline: Record<string, number> = {};

        for (const name of Object.keys(this.sums)) {
            baseline[name] = this.sums[name] / this.counts[name];
        }

        return baseline;
    }
}
