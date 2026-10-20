import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { hasConsent } from "../services/consentStorage";
import { APPBAR_HEIGHT, AppBar, NavDrawer, NavDrawerItem } from "./ds";

/** Cabeçalho fixo das telas logadas: AppBar de 64px + NavDrawer marinho com véu. */
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
    const activeId =
        route.name === "MAIN"
            ? "home"
            : route.name === "SETTINGS"
              ? "settings"
              : route.name.includes("EXERCISE") || route.name === "TRACK_SELECT"
                ? "exercise"
                : undefined;

    const items: NavDrawerItem[] = [
        {
            id: "home",
            label: "Página inicial",
            icon: "home",
            onPress: () => {
                setMenuOpen(false);
                navigation.navigate("MAIN" as never);
            },
        },
        { id: "exercise", label: "Exercícios", icon: "fitness-center", onPress: handleOpenExercises },
        {
            id: "settings",
            label: "Configurações",
            icon: "settings",
            onPress: () => {
                setMenuOpen(false);
                navigation.navigate("SETTINGS" as never);
            },
        },
        { id: "logout", label: "Sair", icon: "logout", onPress: handleLogout, separated: true },
    ];

    return (
        <View style={styles.wrapper}>
            <StatusBar hidden />

            <AppBar
                onBack={canGoBack ? () => navigation.goBack() : undefined}
                onMenu={() => setMenuOpen(!menuOpen)}
                menuOpen={menuOpen}
            />

            {menuOpen && <NavDrawer items={items} activeId={activeId} onClose={() => setMenuOpen(false)} />}
        </View>
    );
}

const styles = StyleSheet.create({
    // Reserva a altura da barra; painel e véu são absolutos a partir daqui.
    wrapper: {
        width: "100%",
        height: APPBAR_HEIGHT,
        zIndex: 1,
    },
});
