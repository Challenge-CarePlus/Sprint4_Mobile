import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { hasConsent } from "../services/consentStorage";
import { useTheme } from "../theme/ThemeContext";
import { useToast } from "./Toast";
import { ADMINBAR_HEIGHT, APPBAR_HEIGHT, AdminBar, AppBar, NavDrawer, NavDrawerItem } from "./ds";

/** Cabeçalho fixo das telas logadas: AppBar de 64px + NavDrawer marinho com véu. */
export default function Menu() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigation = useNavigation();

    const route = useRoute();
    const { logout, role } = useAuth();
    const { mode, setPreference } = useTheme();
    const toast = useToast();

    const isAdmin = role === "admin";
    const canGoBack = navigation.canGoBack() && route.name !== "MAIN";
    // Faixa "Modo administrador" em todas as telas, menos no próprio painel.
    const showAdminBar = isAdmin && route.name !== "MAIN";
    const dark = mode === "dark";

    async function handleLogout() {
        setMenuOpen(false);
        await logout();
    }

    async function handleOpenExercises() {
        const consented = await hasConsent();
        setMenuOpen(false);
        navigation.navigate((consented ? "TRACK_SELECT" : "CONSENT") as never);
    }

    function go(name: string) {
        setMenuOpen(false);
        navigation.navigate(name as never);
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
        { id: "home", label: isAdmin ? "Painel" : "Página inicial", icon: "home", onPress: () => go("MAIN") },
        { id: "exercise", label: "Exercícios", icon: "fitness-center", onPress: handleOpenExercises },
        { id: "settings", label: "Configurações", icon: "settings", onPress: () => go("SETTINGS") },
        {
            id: "theme",
            label: dark ? "Mudar para modo claro" : "Mudar para modo escuro",
            icon: dark ? "light-mode" : "dark-mode",
            onPress: () => {
                setPreference(dark ? "light" : "dark");
                setMenuOpen(false);
                toast(dark ? "Modo claro ativado." : "Modo escuro ativado.");
            },
        },
        { id: "logout", label: "Sair", icon: "logout", onPress: handleLogout, separated: true },
    ];

    return (
        <View style={[styles.wrapper, showAdminBar && { height: APPBAR_HEIGHT + ADMINBAR_HEIGHT }]}>
            <StatusBar hidden />

            <AppBar
                onBack={canGoBack ? () => navigation.goBack() : undefined}
                onMenu={() => setMenuOpen(!menuOpen)}
                menuOpen={menuOpen}
            />

            {showAdminBar && <AdminBar />}

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
