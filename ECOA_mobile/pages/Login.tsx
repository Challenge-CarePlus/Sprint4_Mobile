import React, { useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import AuthTextField from "../components/AuthTextField";
import { useToast } from "../components/Toast";
import { Alert, AuthLayout, Button, TextLink } from "../components/ds";
import { fonts, Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";

export default function Login() {
    const styles = useThemedStyles(makeStyles);
    const { login } = useAuth();
    const toast = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigation = useNavigation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin() {
        try {
            setError("");
            setLoading(true);

            const result = await login(email.trim(), password);

            if (!result.success) {
                setError(result.message || "Erro ao realizar login");
            }
        } catch {
            setError("Erro ao conectar com o servidor");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <StatusBar hidden />
            <AuthLayout
                title="Bem-vindo de volta"
                subtitle="Entre para continuar seus exercícios"
                footer={
                    <>
                        <Text style={styles.footerText}>Ainda não tem conta? </Text>
                        <TextLink title="Criar conta" onPress={() => navigation.navigate("REGISTER" as never)} />
                    </>
                }
            >
                {error !== "" && <Alert tone="danger">{error}</Alert>}

                <AuthTextField
                    icon="mail-outline"
                    placeholder="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                />

                <AuthTextField
                    icon="lock-outline"
                    placeholder="Senha"
                    secureTextEntry
                    autoComplete="current-password"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleLogin}
                />

                <View style={styles.forgotRow}>
                    <TextLink
                        title="Esqueci minha senha"
                        onPress={() => toast("Em breve: a recuperação de senha ainda não está disponível.")}
                    />
                </View>

                <View style={styles.submit}>
                    <Button title="Entrar" onPress={handleLogin} loading={loading} />
                </View>
            </AuthLayout>
        </>
    );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    forgotRow: { alignItems: "flex-end" },
    submit: { marginTop: 8 },
    footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted },
});
