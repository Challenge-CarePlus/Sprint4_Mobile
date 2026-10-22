/** Voz instalada no aparelho (mesmo formato do expo-speech e do Web Speech API). */
export type VoiceInfo = {
    identifier: string;
    name: string;
    language: string;
    quality?: string;
    localService?: boolean;
    isDefault?: boolean;
};

/** pt-BR, com hífen ou sublinhado (Android devolve `pt_BR`). pt-PT e outros ficam de fora. */
export function isPtBr(voice: VoiceInfo): boolean {
    return /^pt[-_]br$/i.test((voice.language ?? "").trim());
}

export function ptBrVoices(voices: VoiceInfo[]): VoiceInfo[] {
    return voices.filter(isPtBr);
}

/**
 * Pontua a "calma" provável de uma voz pelo nome: vozes neurais/naturais soam menos robóticas que as
 * compactas. Heurística — a qualidade real depende do aparelho; por isso a escolha manual existe.
 */
export function scoreVoice(voice: VoiceInfo): number {
    const name = (voice.name ?? "").toLowerCase();
    let score = 0;

    if (/natural|neural|online|premium|enhanced|aprimorad/.test(name)) score += 50;
    if (voice.quality?.toLowerCase() === "enhanced") score += 25;
    if (/google/.test(name) && /portugu[eê]s do brasil|pt-br|brazil/.test(name)) score += 30;
    if (/francisca|maria|thalita|antonio|antônio/.test(name) && /microsoft/.test(name)) score += 25;
    if (/luciana|fernanda|felipe/.test(name)) score += 20;
    if (voice.isDefault) score += 5;
    if (/compact|espeak|robot|festival/.test(name)) score -= 60;

    return score;
}

/** Voz automática: a de maior pontuação entre as pt-BR; `null` se o aparelho não tem nenhuma. */
export function pickAutoVoice(voices: VoiceInfo[]): VoiceInfo | null {
    const candidates = ptBrVoices(voices);
    if (!candidates.length) return null;

    return candidates.reduce((best, voice) => (scoreVoice(voice) > scoreVoice(best) ? voice : best));
}

/** Voz a usar: a escolhida pela pessoa, se ainda existir; senão a automática. */
export function resolveVoice(voices: VoiceInfo[], voiceId: string | null): VoiceInfo | null {
    if (voiceId) {
        const chosen = voices.find((voice) => voice.identifier === voiceId && isPtBr(voice));
        if (chosen) return chosen;
    }
    return pickAutoVoice(voices);
}
