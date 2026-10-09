type Baseline = Record<string, number>;

/**
 * Guarda a calibração por trilha só em memória, durante a sessão do app —
 * recalibrar a cada abertura do app é mais correto do que persistir, já que
 * iluminação e posição do rosto mudam de uma sessão para outra.
 */
const baselines = new Map<string, Baseline>();

export function setCalibration(trackId: string, baseline: Baseline): void {
    baselines.set(trackId, baseline);
}

export function getCalibration(trackId: string): Baseline | undefined {
    return baselines.get(trackId);
}

export function clearCalibration(trackId: string): void {
    baselines.delete(trackId);
}

export function hasCalibration(trackId: string): boolean {
    return baselines.has(trackId);
}
