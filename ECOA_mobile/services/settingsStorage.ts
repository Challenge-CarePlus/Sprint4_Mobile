import AsyncStorage from "@react-native-async-storage/async-storage";

export type CaptureIntervalOption = 300 | 500 | 1000;
export type CameraPositionOption = "front" | "back";

export type AppSettings = {
    showLandmarks: boolean;
    visualFeedback: boolean;
    captureInterval: CaptureIntervalOption;
    preferredCamera: CameraPositionOption;
};

export const DEFAULT_SETTINGS: AppSettings = {
    showLandmarks: true,
    visualFeedback: true,
    captureInterval: 500,
    preferredCamera: "front",
};

const SETTINGS_KEY = "@ecoa_settings";

export async function getSettings(): Promise<AppSettings> {
    const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!storedSettings) {
        return DEFAULT_SETTINGS;
    }

    return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(storedSettings),
    };
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