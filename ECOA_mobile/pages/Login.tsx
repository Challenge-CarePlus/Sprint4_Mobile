import React, { useState } from "react";
import {
    View,
    Image,
    TouchableOpacity,
    Text,
    StyleSheet,
    StatusBar,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import AuthTextField from "../components/AuthTextField";
import GradientButton from "../components/GradientButton";
import { Alert } from "../components/ds";
import { colors, fonts, radii, shadow } from "../theme/tokens";

export default function Login() {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigation = useNavigation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin() {
        try {
            setError("");
            setLoading(true);

            const result = await login(
                email.trim(),
                password
            );

            if (!result.success) {
                setError(
                    result.message ||
                    "Erro ao realizar login"
                );
            }
        } catch {
            setError("Erro ao conectar com o servidor");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <Image
                source={require("./../assets/waves1.png")}
                style={styles.waves}
            />

            <View style={styles.loginContainer}>
                <View style={styles.iconWrapper}>
                    <Image
                        source={require("./../assets/icon.png")}
                        style={styles.iconImage}
                    />
                </View>

                <Text style={styles.title}>Bem-vindo de volta</Text>
                <Text style={styles.subtitle}>Entre para continuar seus exercícios</Text>

                <View style={styles.fieldsContainer}>
                    <AuthTextField
                        icon="mail-outline"
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <AuthTextField
                        icon="lock-outline"
                        placeholder="Senha"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                {error !== "" && <Alert tone="danger">{error}</Alert>}

                <GradientButton
                    title="Entrar"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.loginButton}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Ainda não tem conta? </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("REGISTER" as never)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.link}>Criar conta</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: colors.surface,
    },

    waves: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        zIndex: 0,
    },

    loginContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "80%",
        gap: 14,
        top: -40,
    },

    iconWrapper: {
        width: 140,
        height: 140,
        borderRadius: radii.pill,
        backgroundColor: colors.surfaceRaised,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        ...shadow.lg,
    },

    iconImage: {
        width: 116,
        height: 116,
        borderRadius: radii.pill,
    },

    title: {
        fontFamily: fonts.displaySemiBold,
        fontSize: 24,
        lineHeight: 30,
        color: colors.ink,
        textAlign: "center",
    },

    subtitle: {
        fontFamily: fonts.body,
        fontSize: 14,
        color: colors.inkMuted,
        textAlign: "center",
        marginTop: -6,
        marginBottom: 6,
    },

    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    footerText: {
        fontFamily: fonts.body,
        fontSize: 14,
        color: colors.inkMuted,
    },

    fieldsContainer: {
        width: "100%",
        gap: 12,
    },

    link: {
        color: colors.brandInk,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
    },

    loginButton: {
        marginTop: 12,
    },

    errorBanner: {
        marginTop: 8,
        backgroundColor: colors.dangerSoft,
        borderRadius: radii.sm,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },

    errorText: {
        color: colors.danger,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "600",
        textAlign: "center",
        fontSize: 13,
    },
});
