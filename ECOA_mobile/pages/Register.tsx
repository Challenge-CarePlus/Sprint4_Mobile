import React, { useEffect, useRef, useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import AuthTextField from "../components/AuthTextField";
import { Alert, AuthLayout, Button, TextLink } from "../components/ds";
import { colors, fonts } from "../theme/tokens";

// O backend exige 6–72 caracteres na senha.
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};

function validate(name: string, email: string, password: string, confirmPassword: string): FieldErrors {
    const errors: FieldErrors = {};

    if (!name.trim()) {
        errors.name = "Conte como podemos te chamar.";
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
        errors.email = "Digite um e-mail, como nome@email.com.";
    }

    if (password.length < PASSWORD_MIN) {
        errors.password = `Mínimo de ${PASSWORD_MIN} caracteres.`;
    } else if (password.length > PASSWORD_MAX) {
        errors.password = `Máximo de ${PASSWORD_MAX} caracteres.`;
    }

    if (confirmPassword !== password) {
        errors.confirmPassword = "As senhas não coincidem.";
    }

    return errors;
}

export default function Register() {
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigation = useNavigation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (redirectRef.current) clearTimeout(redirectRef.current);
        };
    }, []);

    async function handleRegister() {
        setError("");
        setSuccess("");

        const errors = validate(name, email, password, confirmPassword);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setError("Preencha nome, e-mail e senha para continuar.");
            return;
        }

        setLoading(true);

        const result = await register(name.trim(), email.trim(), password);

        if (!result.success) {
            setError(result.message || "Erro ao cadastrar usuário");
        } else {
            setSuccess("Usuário cadastrado com sucesso!");

            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

            redirectRef.current = setTimeout(() => {
                navigation.navigate("LOGIN" as never);
            }, 2000);
        }

        setLoading(false);
    }

    return (
        <>
            <StatusBar hidden />
            <AuthLayout
                compact
                title="Criar conta"
                footer={
                    <>
                        <Text style={styles.footerText}>Já tem conta? </Text>
                        <TextLink title="Entrar" onPress={() => navigation.navigate("LOGIN" as never)} />
                    </>
                }
            >
                {error !== "" && <Alert tone="danger">{error}</Alert>}
                {success !== "" && <Alert tone="success">{success}</Alert>}

                <AuthTextField
                    icon="person-outline"
                    placeholder="Nome"
                    autoComplete="name"
                    value={name}
                    onChangeText={setName}
                    error={fieldErrors.name}
                />

                <AuthTextField
                    icon="mail-outline"
                    placeholder="E-mail"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    error={fieldErrors.email}
                />

                <AuthTextField
                    icon="lock-outline"
                    placeholder="Senha"
                    secureTextEntry
                    autoComplete="new-password"
                    value={password}
                    onChangeText={setPassword}
                    error={fieldErrors.password}
                    help={`Mínimo de ${PASSWORD_MIN} caracteres.`}
                />

                <AuthTextField
                    icon="lock-outline"
                    placeholder="Confirmar senha"
                    secureTextEntry
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onSubmitEditing={handleRegister}
                    error={fieldErrors.confirmPassword}
                />

                <View style={styles.submit}>
                    <Button title="Criar conta" onPress={handleRegister} loading={loading} />
                </View>
            </AuthLayout>
        </>
    );
}

const styles = StyleSheet.create({
    submit: { marginTop: 8 },
    footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted },
});
