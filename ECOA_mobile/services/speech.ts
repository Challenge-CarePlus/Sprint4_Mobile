import * as Speech from "expo-speech";

const MAX_UTTERANCE_MS = 8000;

let isSpeaking = false;
let lastSpokenText: string | null = null;
let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;

function clearSafetyTimeout(): void {
    if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId);
        safetyTimeoutId = null;
    }
}

function markDone(): void {
    clearSafetyTimeout();
    isSpeaking = false;
}

/**
 * Fala uma instrução em pt-BR. Nunca repete a mesma frase em sequência e
 * nunca fala duas instruções ao mesmo tempo — se já estiver falando, a nova
 * frase é descartada (o próximo ciclo de feedback tenta de novo).
 */
export function speak(text: string): void {
    if (!text || text === lastSpokenText || isSpeaking) {
        return;
    }

    isSpeaking = true;
    lastSpokenText = text;

    Speech.speak(text, {
        language: "pt-BR",
        onDone: markDone,
        onStopped: markDone,
        onError: markDone,
    });

    // Em alguns navegadores (Web Speech API) o evento de término não dispara
    // de forma confiável — sem isso, isSpeaking travaria em true para sempre
    // e nenhuma instrução seguinte seria falada de novo pelo resto da sessão.
    safetyTimeoutId = setTimeout(markDone, MAX_UTTERANCE_MS);
}

/** Permite que a próxima frase igual à última seja falada de novo (ex.: ao trocar de exercício). */
export function resetSpeechDedup(): void {
    lastSpokenText = null;
}

export function stopSpeaking(): void {
    Speech.stop();
    markDone();
}
