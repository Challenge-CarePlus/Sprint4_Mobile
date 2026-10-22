import * as Speech from "expo-speech";
import { Platform } from "react-native";

import { DEFAULT_SETTINGS, getSettings, VoiceRateOption } from "./settingsStorage";
import { resolveVoice, VoiceInfo } from "./voiceChoice";

const MAX_UTTERANCE_MS = 8000;
/** Sem `onstart` nesse prazo, o navegador bloqueou (ou não tem) a fala. */
const START_TIMEOUT_MS = 1500;
/** Tom levemente suave (1,0 = normal). */
const PITCH = 0.97;

/** ok = falando/pronta · blocked = o navegador exige um toque antes · unavailable = sem síntese de voz. */
export type SpeechStatus = "ok" | "blocked" | "unavailable";

type VoiceConfig = { enabled: boolean; voiceId: string | null; rate: VoiceRateOption };

let config: VoiceConfig = {
    enabled: DEFAULT_SETTINGS.voiceEnabled,
    voiceId: DEFAULT_SETTINGS.voiceId,
    rate: DEFAULT_SETTINGS.voiceRate,
};

let isSpeaking = false;
let lastSpokenText: string | null = null;
let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;
let startTimeoutId: ReturnType<typeof setTimeout> | null = null;

let status: SpeechStatus = "ok";
const statusListeners = new Set<(status: SpeechStatus) => void>();

let cachedVoices: VoiceInfo[] = [];
const voiceListeners = new Set<(voices: VoiceInfo[]) => void>();

/* ------------------------- configuração e estado ------------------------- */

/** Aplica as configurações de voz (chamado ao abrir o app e quando a pessoa muda em Configurações). */
export function configureVoice(next: Partial<VoiceConfig>): void {
    config = { ...config, ...next };
}

export function getVoiceConfig(): VoiceConfig {
    return config;
}

/** Lê as configurações salvas e aplica. Falha de leitura mantém os padrões. */
export async function loadVoiceSettings(): Promise<void> {
    try {
        const settings = await getSettings();
        configureVoice({ enabled: settings.voiceEnabled, voiceId: settings.voiceId, rate: settings.voiceRate });
    } catch {
        // mantém os padrões
    }
}

export function getSpeechStatus(): SpeechStatus {
    return status;
}

function setStatus(next: SpeechStatus): void {
    if (status === next) return;
    status = next;
    statusListeners.forEach((listener) => listener(next));
}

export function subscribeSpeechStatus(listener: (status: SpeechStatus) => void): () => void {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
}

/* ------------------------------- vozes ------------------------------- */

const isWeb = () => Platform.OS === "web";

function webSynth(): SpeechSynthesis | null {
    return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

function toVoiceInfo(voice: SpeechSynthesisVoice): VoiceInfo {
    return {
        identifier: voice.voiceURI,
        name: voice.name,
        language: voice.lang,
        localService: voice.localService,
        isDefault: voice.default,
    };
}

function publishVoices(voices: VoiceInfo[]): void {
    cachedVoices = voices;
    voiceListeners.forEach((listener) => listener(voices));
}

/**
 * Vozes do aparelho. No navegador a lista chega de forma assíncrona (evento `voiceschanged`) e pode
 * nunca chegar quando não há nenhuma — por isso o prazo: depois dele devolve o que houver.
 */
export function loadVoices(timeoutMs = 1500): Promise<VoiceInfo[]> {
    if (isWeb()) {
        const synth = webSynth();
        if (!synth) return Promise.resolve([]);

        return new Promise((resolve) => {
            const read = () => synth.getVoices().map(toVoiceInfo);
            const initial = read();
            if (initial.length) {
                publishVoices(initial);
                resolve(initial);
                return;
            }

            const finish = () => {
                synth.removeEventListener?.("voiceschanged", finish);
                const voices = read();
                publishVoices(voices);
                resolve(voices);
            };
            synth.addEventListener?.("voiceschanged", finish);
            setTimeout(finish, timeoutMs);
        });
    }

    return Speech.getAvailableVoicesAsync()
        .then((voices) => {
            const mapped = voices.map((voice) => ({
                identifier: voice.identifier,
                name: voice.name,
                language: voice.language,
                quality: String(voice.quality),
            }));
            publishVoices(mapped);
            return mapped;
        })
        .catch(() => []);
}

/** Avisa quando a lista de vozes muda (o navegador termina de carregar, o usuário instala uma voz). */
export function subscribeVoices(listener: (voices: VoiceInfo[]) => void): () => void {
    voiceListeners.add(listener);

    const synth = isWeb() ? webSynth() : null;
    const onChange = () => publishVoices(synth ? synth.getVoices().map(toVoiceInfo) : cachedVoices);
    synth?.addEventListener?.("voiceschanged", onChange);

    return () => {
        voiceListeners.delete(listener);
        synth?.removeEventListener?.("voiceschanged", onChange);
    };
}

/* -------------------------------- fala -------------------------------- */

function clearTimers(): void {
    if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId);
        safetyTimeoutId = null;
    }
    if (startTimeoutId) {
        clearTimeout(startTimeoutId);
        startTimeoutId = null;
    }
}

function markDone(): void {
    clearTimers();
    isSpeaking = false;
}

function markStarted(): void {
    if (startTimeoutId) {
        clearTimeout(startTimeoutId);
        startTimeoutId = null;
    }
    setStatus("ok");
}

type SpeakOptions = {
    /** Soma ao ritmo configurado (ex.: -0,05 para idosos). */
    rateOffset?: number;
    /** Fala mesmo com a voz desligada (botão "Testar voz"). */
    force?: boolean;
};

/**
 * Fala uma instrução em pt-BR com a voz, o ritmo e o tom configurados. Respeita o interruptor da voz,
 * nunca repete a mesma frase em sequência e nunca fala duas ao mesmo tempo — se já estiver falando, a
 * nova frase é descartada (o próximo ciclo de feedback tenta de novo). No navegador, se a fala não
 * começar em ~1,5 s, marca `blocked` (falta um toque da pessoa) para a tela oferecer "Toque para ativar a voz".
 */
export function speak(text: string, options: SpeakOptions = {}): void {
    if (!text || (!config.enabled && !options.force)) {
        return;
    }

    if (!options.force && (text === lastSpokenText || isSpeaking)) {
        return;
    }

    const rate = Math.min(1.2, Math.max(0.5, config.rate + (options.rateOffset ?? 0)));
    const voice = resolveVoice(cachedVoices, config.voiceId);

    if (isWeb()) {
        const synth = webSynth();
        if (!synth) {
            setStatus("unavailable");
            return;
        }
        speakOnWeb(synth, text, rate, voice, options.force === true);
        return;
    }

    isSpeaking = true;
    lastSpokenText = text;

    Speech.speak(text, {
        language: "pt-BR",
        voice: voice?.identifier,
        rate,
        pitch: PITCH,
        onDone: markDone,
        onStopped: markDone,
        onError: markDone,
    });

    // Se o evento de término não chegar, isSpeaking travaria em true e nada mais seria falado.
    safetyTimeoutId = setTimeout(markDone, MAX_UTTERANCE_MS);
}

function speakOnWeb(synth: SpeechSynthesis, text: string, rate: number, voice: VoiceInfo | null, force: boolean): void {
    isSpeaking = true;
    lastSpokenText = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = rate;
    utterance.pitch = PITCH;

    if (voice) {
        const match = synth.getVoices().find((candidate) => candidate.voiceURI === voice.identifier);
        try {
            if (match) utterance.voice = match;
        } catch {
            // voz que o navegador deixou de aceitar: fala com a padrão em pt-BR
        }
    }

    utterance.onstart = markStarted;
    utterance.onend = markDone;
    utterance.onerror = (event) => {
        markDone();
        // "not-allowed": o navegador exige um gesto da pessoa antes de falar.
        if ((event as SpeechSynthesisErrorEvent).error === "not-allowed") setStatus("blocked");
    };

    // Uma fala antiga pendurada (comum quando o navegador bloqueou) impediria as próximas.
    if (force) synth.cancel();

    // Chamado de forma síncrona: no Safari/iOS a primeira fala só passa dentro do toque da pessoa.
    synth.speak(utterance);

    startTimeoutId = setTimeout(() => {
        // Nenhum `onstart`: bloqueada (ou sem voz). Libera a fila e avisa a tela.
        isSpeaking = false;
        setStatus(synth.getVoices().length === 0 && !synth.speaking ? "unavailable" : "blocked");
    }, START_TIMEOUT_MS);
    safetyTimeoutId = setTimeout(markDone, MAX_UTTERANCE_MS);
}

/** Frase do botão "Testar voz": também destrava o áudio do navegador (é um gesto da pessoa). */
export const TEST_VOICE_PHRASE = "Olá! Vou te orientar com calma durante os exercícios.";

export function testVoice(): void {
    speak(TEST_VOICE_PHRASE, { force: true });
}

/** "Toque para ativar a voz": o toque destrava e confirma falando. */
export function unlockSpeech(): void {
    speak("Pronto, voz ativada.", { force: true });
}

/** Permite que a próxima frase igual à última seja falada de novo (ex.: ao trocar de exercício). */
export function resetSpeechDedup(): void {
    lastSpokenText = null;
}

export function stopSpeaking(): void {
    if (isWeb()) webSynth()?.cancel();
    else Speech.stop();
    markDone();
}
