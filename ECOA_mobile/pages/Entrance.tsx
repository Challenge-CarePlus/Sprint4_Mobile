import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";

import AuthTextField from "../components/AuthTextField";
import { Alert, AuthLayout, Button } from "../components/ds";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";
import { fonts, radii, Theme } from "../theme/tokens";

/**
 * Entrada do evento (protótipo "Ecoa Modo Administrador", tela Login): o acesso é livre —
 * vazio + "Entrar" = paciente anônimo. A equipe entra com e-mail e senha para abrir o painel.
 */
export default function Entrance() {
    const styles = useThemedStyles(makeStyles);
    const { colors, shadow, gradients, mode, setPreference } = useTheme();
    const { enter } = useAuth();
    const toast = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleEnter() {
        setError("");
        setLoading(true);

        try {
            const result = await enter(email, password);

            if (!result.success) {
                setError(result.message ?? "Não foi possível entrar.");
                return;
            }

            // O roteador troca de tela quando a sessão muda; o aviso aparece na Home.
            toast(
                result.role === "admin"
                    ? "Painel do administrador liberado."
                    : "Bem-vindo! Acesso livre no dia do evento."
            );
        } finally {
            setLoading(false);
        }
    }

    const dark = mode === "dark";

    function flipTheme() {
        setPreference(dark ? "light" : "dark");
        toast(dark ? "Modo claro ativado." : "Modo escuro ativado.");
    }

    return (
        <View style={styles.root}>
            <StatusBar hidden />

            <AuthLayout
                compact
                title="Bem-vindo ao Ecoa"
                footer={
                    <View style={styles.hint}>
                        <MaterialIcons name="shield" size={16} color={colors.inkMuted} />
                        <Text style={styles.hintText}>Equipe Ecoa: entre com seu e-mail para abrir o painel.</Text>
                    </View>
                }
            >
                <LinearGradient
                    colors={gradients.tonal}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.event}
                    accessibilityRole="summary"
                >
                    <LinearGradient
                        colors={gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.eventIcon}
                    >
                        <MaterialIcons name="event" size={22} color={colors.onHero} />
                    </LinearGradient>
                    <View style={styles.eventText}>
                        <Text style={styles.eventTitle}>Hoje o acesso é livre</Text>
                        <Text style={styles.eventSub}>Dia do evento: é só tocar em Entrar, sem login.</Text>
                    </View>
                </LinearGradient>

                {error !== "" && <Alert tone="danger">{error}</Alert>}

                <AuthTextField
                    icon="mail-outline"
                    placeholder="E-mail (opcional hoje)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                />

                <AuthTextField
                    icon="lock-outline"
                    placeholder="Senha (opcional hoje)"
                    secureTextEntry
                    autoComplete="current-password"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleEnter}
                />

                <View style={styles.submit}>
                    <Button title="Entrar" onPress={handleEnter} loading={loading} />
                </View>
            </AuthLayout>

            <Pressable
                onPress={flipTheme}
                accessibilityRole="button"
                accessibilityLabel={dark ? "Mudar para modo claro" : "Mudar para modo escuro"}
                style={[styles.themeQuick, shadow.float]}
            >
                <MaterialIcons name={dark ? "light-mode" : "dark-mode"} size={20} color={colors.ink} />
            </Pressable>
        </View>
    );
}

const makeStyles = ({ colors }: Theme) =>
    StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.surface },
        event: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: radii.md,
        },
        eventIcon: {
            width: 44,
            height: 44,
            borderRadius: radii.pill,
            alignItems: "center",
            justifyContent: "center",
        },
        eventText: { flex: 1 },
        eventTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, color: colors.ink },
        eventSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
        submit: { marginTop: 8 },
        hint: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 },
        hintText: { flexShrink: 1, fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
        themeQuick: {
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 5,
            width: 44,
            height: 44,
            borderRadius: radii.pill,
            backgroundColor: colors.surfaceRaised,
            alignItems: "center",
            justifyContent: "center",
        },
    });
