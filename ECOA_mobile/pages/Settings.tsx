import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { SwitchRow } from "../components/admin";
import { Alert, Button, Option, OptionGroup, PageIntro } from "../components/ds";
import { useToast } from "../components/Toast";
import { useSpeechStatus } from "../hooks/useSpeechStatus";
import { configureVoice, loadVoices, subscribeVoices, testVoice } from "../services/speech";
import { ptBrVoices, VoiceInfo } from "../services/voiceChoice";
import { Theme } from "../theme/tokens";
import { ThemePreference, useTheme, useThemedStyles } from "../theme/ThemeContext";

import {
    AppSettings,
    CameraPositionOption,
    CaptureIntervalOption,
    DEFAULT_SETTINGS,
    getSettings,
    resetSettings,
    saveSettings,
    VoiceRateOption,
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

const themeOptions: Option<ThemePreference>[] = [
    { value: "auto", title: "Automático", description: "Segue o tema do celular", icon: "brightness-auto" },
    { value: "light", title: "Claro", description: "Fundo claro o tempo todo", icon: "light-mode" },
    {
        value: "dark",
        title: "Escuro",
        description: "Mais confortável à noite e em ambientes escuros",
        icon: "dark-mode",
    },
];

const rateOptions: Option<VoiceRateOption>[] = [
    { value: 0.8, title: "Devagar", description: "Fala mais pausada", icon: "hourglass-bottom" },
    { value: 0.9, title: "Calma", description: "Recomendado", icon: "spa" },
    { value: 1, title: "Normal", description: "Velocidade natural", icon: "speed" },
];

export default function Settings() {
    const styles = useThemedStyles(makeStyles);
    const { preference, setPreference } = useTheme();
    const toast = useToast();
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [voices, setVoices] = useState<VoiceInfo[]>([]);
    const speechStatus = useSpeechStatus();

    // As vozes chegam de forma assíncrona (no navegador, depois do evento voiceschanged).
    useEffect(() => {
        let alive = true;
        loadVoices().then((list) => alive && setVoices(list));
        const unsubscribe = subscribeVoices((list) => alive && setVoices(list));
        return () => {
            alive = false;
            unsubscribe();
        };
    }, []);

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
        configureVoice({
            enabled: updatedSettings.voiceEnabled,
            voiceId: updatedSettings.voiceId,
            rate: updatedSettings.voiceRate,
        });
        await saveSettings(updatedSettings);
    }

    async function handleResetSettings() {
        const defaultSettings = await resetSettings();
        setSettings(defaultSettings);
        configureVoice({
            enabled: defaultSettings.voiceEnabled,
            voiceId: defaultSettings.voiceId,
            rate: defaultSettings.voiceRate,
        });
    }

    const ptBr = ptBrVoices(voices);
    const voiceOptions: Option<string>[] = [
        { value: "auto", title: "Automática (recomendada)", description: "Escolhe a voz mais calma do aparelho", icon: "auto-awesome" },
        ...ptBr.map((voice) => ({
            value: voice.identifier,
            title: voice.name,
            description: voice.language.replace("_", "-"),
            icon: "record-voice-over" as const,
        })),
    ];
    // Voz salva que sumiu do aparelho volta a aparecer como Automática.
    const voiceValue = settings.voiceId && ptBr.some((voice) => voice.identifier === settings.voiceId) ? settings.voiceId : "auto";
    const noVoice = voices.length > 0 ? ptBr.length === 0 : speechStatus === "unavailable";

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <PageIntro icon="settings" title="Configurações" subtitle="Ajuste o app e o exercício do seu jeito." />

            <OptionGroup
                label="Aparência"
                options={themeOptions}
                value={preference}
                onChange={(next) => {
                    setPreference(next);
                    toast(
                        next === "auto"
                            ? "Tema automático: segue o celular."
                            : next === "dark"
                              ? "Modo escuro ativado."
                              : "Modo claro ativado."
                    );
                }}
            />

            <View style={styles.section}>
                <SwitchRow
                    on={settings.voiceEnabled}
                    label="Voz de orientação"
                    sub="Fala as instruções durante os exercícios"
                    onChange={(voiceEnabled) => updateSettings({ voiceEnabled })}
                />

                {settings.voiceEnabled && (
                    <>
                        {noVoice && (
                            <Alert tone="info">
                                Seu aparelho não tem uma voz em português instalada. As instruções continuam aparecendo na tela. Para ativar a voz,
                                instale uma voz em português nas configurações do aparelho.
                            </Alert>
                        )}

                        {!noVoice && (
                            <OptionGroup
                                label="Voz"
                                options={voiceOptions}
                                value={voiceValue}
                                onChange={(value) => updateSettings({ voiceId: value === "auto" ? null : value })}
                            />
                        )}

                        <OptionGroup
                            label="Ritmo"
                            options={rateOptions}
                            value={settings.voiceRate}
                            onChange={(voiceRate) => updateSettings({ voiceRate })}
                        />

                        <Button variant="secondary" icon="volume-up" title="Testar voz" onPress={testVoice} />

                        {speechStatus === "blocked" && (
                            <Alert tone="info">
                                O navegador ainda não liberou o som. Toque em Testar voz de novo; se continuar sem som, confira o volume do aparelho.
                            </Alert>
                        )}
                    </>
                )}
            </View>

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
    section: { gap: 16 },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        gap: 16,
    },
});
