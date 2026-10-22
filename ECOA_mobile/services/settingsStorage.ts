import AsyncStorage from "@react-native-async-storage/async-storage";

export type CaptureIntervalOption = 300 | 500 | 1000;
export type CameraPositionOption = "front" | "back";
/** Ritmo da voz: Devagar · Calma (padrão) · Normal. */
export type VoiceRateOption = 0.8 | 0.9 | 1;

export type AppSettings = {
    captureInterval: CaptureIntervalOption;
    preferredCamera: CameraPositionOption;
    /** Voz de orientação ligada (padrão). */
    voiceEnabled: boolean;
    /** Identificador da voz escolhida; `null` = Automática (recomendada). */
    voiceId: string | null;
    voiceRate: VoiceRateOption;
};

export const VOICE_RATES: VoiceRateOption[] = [0.8, 0.9, 1];

export const DEFAULT_SETTINGS: AppSettings = {
    captureInterval: 500,
    preferredCamera: "front",
    voiceEnabled: true,
    voiceId: null,
    voiceRate: 0.9,
};

const SETTINGS_KEY = "@ecoa_settings";

/**
 * Junta o que estava salvo com os padrões: quem já tinha configurações (só câmera e captura)
 * ganha a voz com os valores padrão, e valores inválidos voltam ao padrão.
 */
export function mergeSettings(stored: unknown): AppSettings {
    const raw = stored && typeof stored === "object" ? (stored as Partial<AppSettings>) : {};

    return {
        ...DEFAULT_SETTINGS,
        ...raw,
        voiceEnabled: typeof raw.voiceEnabled === "boolean" ? raw.voiceEnabled : DEFAULT_SETTINGS.voiceEnabled,
        voiceId: typeof raw.voiceId === "string" && raw.voiceId ? raw.voiceId : null,
        voiceRate: VOICE_RATES.includes(raw.voiceRate as VoiceRateOption)
            ? (raw.voiceRate as VoiceRateOption)
            : DEFAULT_SETTINGS.voiceRate,
    };
}

export async function getSettings(): Promise<AppSettings> {
    const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!storedSettings) {
        return DEFAULT_SETTINGS;
    }

    try {
        return mergeSettings(JSON.parse(storedSettings));
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: AppSettings) {
    await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}

export async function resetSettings() {
    await saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
}
