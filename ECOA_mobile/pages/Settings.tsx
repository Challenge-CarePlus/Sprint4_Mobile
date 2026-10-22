import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { Button, Option, OptionGroup, PageIntro } from "../components/ds";
import { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";

import {
    AppSettings,
    CameraPositionOption,
    CaptureIntervalOption,
    DEFAULT_SETTINGS,
    getSettings,
    resetSettings,
    saveSettings,
} from "../services/settingsStorage";

type IconName = keyof typeof MaterialIcons.glyphMap;

const captureIntervalOptions: Option<CaptureIntervalOption>[] = [
    { value: 300, title: "Rápido", description: "Captura a cada 300 ms", icon: "speed" },
    { value: 500, title: "Normal", description: "Captura a cada 500 ms", icon: "timer" },
    {
        value: 1000,
        title: "Leve",
        description: "Captura a cada 1000 ms · economiza bateria",
        icon: "battery-saver" as IconName,
    },
];

const cameraOptions: Option<CameraPositionOption>[] = [
    { value: "front", title: "Frontal", description: "Para acompanhar o próprio rosto", icon: "camera-front" },
    {
        value: "back",
        title: "Traseira",
        description: "Quando outra pessoa estiver filmando",
        icon: "camera-rear",
    },
];

export default function Settings() {
    const styles = useThemedStyles(makeStyles);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        const storedSettings = await getSettings();
        setSettings(storedSettings);
    }

    async function updateSettings(newSettings: Partial<AppSettings>) {
        const updatedSettings = {
            ...settings,
            ...newSettings,
        };

        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
    }

    async function handleResetSettings() {
        const defaultSettings = await resetSettings();
        setSettings(defaultSettings);
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <PageIntro icon="settings" title="Configurações" subtitle="Ajuste o exercício do seu jeito." />

            <OptionGroup
                label="Frequência de captura"
                options={captureIntervalOptions}
                value={settings.captureInterval}
                onChange={(captureInterval) => updateSettings({ captureInterval })}
            />

            <OptionGroup
                label="Câmera preferida"
                options={cameraOptions}
                value={settings.preferredCamera}
                onChange={(preferredCamera) => updateSettings({ preferredCamera })}
            />

            <Button variant="secondary" icon="refresh" title="Restaurar padrão" onPress={handleResetSettings} />
        </ScrollView>
    );
}

// Protótipo (.cp-phone-pad-sm): 16 / 16 / 24, gap 16.
const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        gap: 16,
    },
});
