import * as Speech from "expo-speech";

let isSpeaking = false;
let lastSpokenText: string | null = null;

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
        onDone: () => {
            isSpeaking = false;
        },
        onStopped: () => {
            isSpeaking = false;
        },
        onError: () => {
            isSpeaking = false;
        },
    });
}

/** Permite que a próxima frase igual à última seja falada de novo (ex.: ao trocar de exercício). */
export function resetSpeechDedup(): void {
    lastSpokenText = null;
}

export function stopSpeaking(): void {
    Speech.stop();
    isSpeaking = false;
}
