import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

function OptionButton({
    title,
    description,
    iconName,
    selected,
    onPress,
}: OptionButtonProps) {
    return (
        <TouchableOpacity
            style={[
                styles.optionButton,
                selected && styles.optionButtonSelected,
            ]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View
                style={[
                    styles.optionIconContainer,
                    selected && styles.optionIconContainerSelected,
                ]}
            >
                <MaterialIcons
                    name={iconName}
                    size={24}
                    color={selected ? "#284A7D" : "#fff"}
                />
            </View>

            <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>
                    {title}
                </Text>

                <Text style={styles.optionDescription}>
                    {description}
                </Text>
            </View>

            {selected && (
                <MaterialIcons
                    name="check-circle"
                    size={24}
                    color="#284A7D"
                />
            )}
        </TouchableOpacity>
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
                <View style={styles.headerIconContainer}>
                    <MaterialIcons
                        name="settings"
                        size={38}
                        color="#fff"
                    />
                </View>

                <Text style={styles.titleText}>
                    Configurações
                </Text>

                <Text style={styles.subtitleText}>
                    Personalize a experiência do exercício conforme sua preferência.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Exibição
                </Text>

                <View style={styles.settingCard}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>
                            Pontos faciais
                        </Text>

                        <Text style={styles.settingDescription}>
                            Mostra os pontos detectados no rosto durante o exercício.
                        </Text>
                    </View>

                    <Switch
                        value={settings.showLandmarks}
                        onValueChange={(value) =>
                            updateSettings({ showLandmarks: value })
                        }
                        trackColor={{
                            false: "#D1D5DB",
                            true: "#AFC7E8",
                        }}
                        thumbColor={
                            settings.showLandmarks ? "#284A7D" : "#F3F4F6"
                        }
                    />
                </View>

                <View style={styles.settingCard}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>
                            Feedback visual
                        </Text>

                        <Text style={styles.settingDescription}>
                            Altera a cor da mensagem conforme o retorno do exercício.
                        </Text>
                    </View>

                    <Switch
                        value={settings.visualFeedback}
                        onValueChange={(value) =>
                            updateSettings({ visualFeedback: value })
                        }
                        trackColor={{
                            false: "#D1D5DB",
                            true: "#AFC7E8",
                        }}
                        thumbColor={
                            settings.visualFeedback ? "#284A7D" : "#F3F4F6"
                        }
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Frequência de captura
                </Text>

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
                <Text style={styles.sectionTitle}>
                    Câmera preferida
                </Text>

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

            <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetSettings}
                activeOpacity={0.85}
            >
                <MaterialIcons
                    name="restart-alt"
                    size={24}
                    color="#284A7D"
                />

                <Text style={styles.resetButtonText}>
                    Restaurar configurações padrão
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: "10%"
    },

    contentContainer: {
        paddingHorizontal: 32,
        paddingVertical: 40,
        gap: 24,
    },

    headerContainer: {
        alignItems: "center",
        gap: 12,
    },

    headerIconContainer: {
        width: 78,
        height: 78,
        borderRadius: 999,
        backgroundColor: "#284A7D",
        justifyContent: "center",
        alignItems: "center",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 5,
    },

    titleText: {
        fontFamily: "Righteous_400Regular",
        fontSize: 32,
        color: "#1E3E6D",
        textAlign: "center",
    },

    subtitleText: {
        color: "#6B7280",
        fontSize: 16,
        lineHeight: 22,
        textAlign: "center",
        fontWeight: "500",
    },

    section: {
        gap: 14,
    },

    sectionTitle: {
        fontFamily: "Righteous_400Regular",
        fontSize: 24,
        color: "#1E3E6D",
    },

    settingCard: {
        width: "100%",
        borderColor: "#284A7D",
        borderWidth: 2,
        borderRadius: 8,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#fff",
    },

    settingTextContainer: {
        flex: 1,
        gap: 4,
    },

    settingTitle: {
        color: "#000",
        fontFamily: "Righteous_400Regular",
        fontSize: 20,
    },

    settingDescription: {
        color: "#6B7280",
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "500",
    },

    optionsContainer: {
        gap: 12,
    },

    optionButton: {
        width: "100%",
        borderColor: "#284A7D",
        borderWidth: 2,
        borderRadius: 8,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "#fff",
    },

    optionButtonSelected: {
        backgroundColor: "#EAF2FF",
    },

    optionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        backgroundColor: "#284A7D",
        justifyContent: "center",
        alignItems: "center",
    },

    optionIconContainerSelected: {
        backgroundColor: "#fff",
    },

    optionTextContainer: {
        flex: 1,
        gap: 4,
    },

    optionTitle: {
        color: "#000",
        fontFamily: "Righteous_400Regular",
        fontSize: 19,
    },

    optionDescription: {
        color: "#6B7280",
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "500",
    },

    resetButton: {
        borderColor: "#284A7D",
        borderWidth: 2,
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#fff",
        marginBottom: "20%"
    },

    resetButtonText: {
        color: "#284A7D",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center"
    },
});