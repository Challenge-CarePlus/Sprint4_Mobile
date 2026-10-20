import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import { Image, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { hasConsent } from "../services/consentStorage";
import { colors, fonts, gradients, radii, shadow } from "../theme/tokens";

type MenuItem = {
    key: string;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    onPress: () => void;
    separated?: boolean;
};

export default function Menu() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigation = useNavigation();

    const route = useRoute();
    const { logout } = useAuth();

    const canGoBack = navigation.canGoBack() && route.name !== "MAIN";

    async function handleLogout() {
        await logout();
        setMenuOpen(false);
    }

    async function handleOpenExercises() {
        const consented = await hasConsent();
        setMenuOpen(false);
        navigation.navigate((consented ? "TRACK_SELECT" : "CONSENT") as never);
    }

    // Item da tela atual fica marcado no painel.
    const isCurrent = (key: string) =>
        (key === "home" && route.name === "MAIN") ||
        (key === "settings" && route.name === "SETTINGS") ||
        (key === "exercise" && route.name.includes("EXERCISE")) ||
        (key === "exercise" && route.name === "TRACK_SELECT");

    const items: MenuItem[] = [
        {
            key: "home",
            label: "Página inicial",
            icon: "home",
            onPress: () => {
                setMenuOpen(false);
                navigation.navigate("MAIN" as never);
            },
        },
        { key: "exercise", label: "Exercício", icon: "fitness-center", onPress: handleOpenExercises },
        {
            key: "settings",
            label: "Configurações",
            icon: "settings",
            onPress: () => {
                setMenuOpen(false);
                navigation.navigate("SETTINGS" as never);
            },
        },
        { key: "logout", label: "Sair", icon: "logout", onPress: handleLogout, separated: true },
    ];

    return (
        <View style={styles.fullMenu}>
            <StatusBar hidden />

            <View style={styles.menuContainer}>
                <View style={styles.menu}>
                    <View style={styles.leftSection}>
                        {canGoBack && (
                            <Pressable
                                onPress={() => navigation.goBack()}
                                style={({ pressed }) => [
                                    styles.backButton,
                                    pressed && styles.menuButtonPressed,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Voltar"
                            >
                                <MaterialIcons name="arrow-back" size={22} color={colors.brand} />
                            </Pressable>
                        )}

                        <Image source={require("./../assets/ECOA.png")} style={styles.logo} />
                    </View>

                    <Pressable
                        onPress={() => setMenuOpen(!menuOpen)}
                        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Abrir menu"
                    >
                        <MaterialIcons name={menuOpen ? "close" : "menu"} size={26} color={colors.brand} />
                    </Pressable>
                </View>
            </View>

            {menuOpen && (
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dropDown}
                >
                    {items.map((item) => (
                        <Pressable
                            key={item.key}
                            onPress={item.onPress}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.menuItem,
                                item.separated && styles.menuItemSeparated,
                                isCurrent(item.key) && styles.menuItemPressed,
                                pressed && styles.menuItemPressed,
                            ]}
                        >
                            <MaterialIcons name={item.icon} size={20} color={colors.white} />
                            <Text style={styles.menuText}>{item.label}</Text>
                        </Pressable>
                    ))}
                </LinearGradient>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    fullMenu: {
        width: "100%",
        height: 70,
        zIndex: 1,
    },

    menuContainer: {
        position: "absolute",
        top: 0,
        width: "100%",
        height: 70,
        backgroundColor: colors.surfaceRaised,
        justifyContent: "center",
        paddingHorizontal: 25,
        ...shadow.sm,
    },

    menu: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    leftSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    backButton: {
        width: 36,
        height: 36,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
    },

    logo: {
        width: 64,
        height: 24,
        resizeMode: "contain",
    },

    menuButton: {
        width: 40,
        height: 40,
        borderRadius: radii.pill,
        backgroundColor: colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
    },
    menuButtonPressed: {
        opacity: 0.7,
    },

    dropDown: {
        position: "absolute",
        top: 0,
        marginTop: 70,

        width: "100%",

        paddingVertical: 12,
        paddingHorizontal: 18,
        gap: 4,

        borderBottomLeftRadius: radii.lg,
        borderBottomRightRadius: radii.lg,
        ...shadow.lg,
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: radii.sm,
    },
    menuItemSeparated: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.14)",
        borderRadius: 0,
    },
    menuItemPressed: {
        backgroundColor: "rgba(255,255,255,0.12)",
    },

    menuText: {
        color: colors.white,
        fontFamily: fonts.bodySemiBold,
        fontSize: 16,
        fontWeight: "600",
    },
});
