import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import IconBadge from "../components/IconBadge";
import { colors, fonts, radii, shadow } from "../theme/tokens";

import {
    AppSettings,
    CameraPositionOption,
    CaptureIntervalOption,
    DEFAULT_SETTINGS,
    getSettings,
    resetSettings,
    saveSettings,
} from "../services/settingsStorage";

type OptionButtonProps = {
    title: string;
    description: string;
    iconName: keyof typeof MaterialIcons.glyphMap;
    selected: boolean;
    onPress: () => void;
};

const captureIntervalOptions: {
    label: string;
    description: string;
    value: CaptureIntervalOption;
    iconName: keyof typeof MaterialIcons.glyphMap;
}[] = [
    {
        label: "Rápido",
        description: "Captura a cada 300 ms",
        value: 300,
        iconName: "speed",
    },
    {
        label: "Normal",
        description: "Captura a cada 500 ms",
        value: 500,
        iconName: "timer",
    },
    {
        label: "Leve",
        description: "Captura a cada 1000 ms",
        value: 1000,
        iconName: "battery-saver",
    },
];

const cameraOptions: {
    label: string;
    description: string;
    value: CameraPositionOption;
    iconName: keyof typeof MaterialIcons.glyphMap;
}[] = [
    {
        label: "Frontal",
        description: "Ideal para acompanhar o próprio rosto",
        value: "front",
        iconName: "camera-front",
    },
    {
        label: "Traseira",
        description: "Use se preferir outra pessoa filmando",
        value: "back",
        iconName: "camera-rear",
    },
];

function OptionButton({ title, description, iconName, selected, onPress }: OptionButtonProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.optionButton,
                selected && styles.optionButtonSelected,
                pressed && styles.optionButtonPressed,
            ]}
            onPress={onPress}
        >
            <IconBadge
                name={iconName}
                size={48}
                iconSize={22}
                gradient={selected ? "accent" : "primary"}
            />

            <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{title}</Text>
                <Text style={styles.optionDescription}>{description}</Text>
            </View>

            {selected && <MaterialIcons name="check-circle" size={24} color={colors.brand} />}
        </Pressable>
    );
}

export default function Settings() {
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
            <View style={styles.headerContainer}>
                <IconBadge name="settings" size={78} iconSize={38} gradient="primary" />

                <Text style={styles.titleText}>Configurações</Text>

                <Text style={styles.subtitleText}>
                    Personalize a experiência do exercício conforme sua preferência.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Frequência de captura</Text>

                <View style={styles.optionsContainer}>
                    {captureIntervalOptions.map((option) => (
                        <OptionButton
                            key={option.value}
                            title={option.label}
                            description={option.description}
                            iconName={option.iconName}
                            selected={settings.captureInterval === option.value}
                            onPress={() =>
                                updateSettings({
                                    captureInterval: option.value,
                                })
                            }
                        />
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Câmera preferida</Text>

                <View style={styles.optionsContainer}>
                    {cameraOptions.map((option) => (
                        <OptionButton
                            key={option.value}
                            title={option.label}
                            description={option.description}
                            iconName={option.iconName}
                            selected={settings.preferredCamera === option.value}
                            onPress={() =>
                                updateSettings({
                                    preferredCamera: option.value,
                                })
                            }
                        />
                    ))}
                </View>
            </View>

            <Pressable
                style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
                onPress={handleResetSettings}
            >
                <MaterialIcons name="restart-alt" size={22} color={colors.brand} />
                <Text style={styles.resetButtonText}>Restaurar configurações padrão</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
        paddingTop: "10%",
    },

    contentContainer: {
        paddingHorizontal: 28,
        paddingVertical: 40,
        gap: 28,
    },

    headerContainer: {
        alignItems: "center",
        gap: 12,
    },

    titleText: {
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 30,
        color: colors.ink,
        textAlign: "center",
    },

    subtitleText: {
        color: colors.inkMuted,
        fontFamily: fonts.body,
        fontSize: 15,
        lineHeight: 21,
        textAlign: "center",
        fontWeight: "500",
    },

    section: {
        gap: 14,
    },

    sectionTitle: {
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 20,
        color: colors.ink,
    },

    optionsContainer: {
        gap: 12,
    },

    optionButton: {
        width: "100%",
        backgroundColor: colors.surfaceRaised,
        borderRadius: radii.lg,
        borderWidth: 2,
        borderColor: "transparent",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        ...shadow.sm,
    },
    optionButtonPressed: {
        transform: [{ scale: 0.99 }],
    },

    optionButtonSelected: {
        backgroundColor: colors.brandSoft,
        borderColor: colors.brand,
    },

    optionTextContainer: {
        flex: 1,
        gap: 4,
    },

    optionTitle: {
        color: colors.ink,
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 17,
    },

    optionDescription: {
        color: colors.inkMuted,
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "500",
    },

    resetButton: {
        borderColor: colors.brandInk,
        borderWidth: 2,
        borderRadius: radii.md,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.surfaceRaised,
        marginBottom: 24,
    },
    resetButtonPressed: {
        backgroundColor: colors.brandSoft,
    },

    resetButtonText: {
        color: colors.brandInk,
        fontFamily: fonts.bodySemiBold,
        fontSize: 15,
        fontWeight: "700",
        textAlign: "center",
    },
});
