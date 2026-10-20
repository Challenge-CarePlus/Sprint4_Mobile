import React, { useState } from "react";
import {
    View,
    Image,
    Text,
    StyleSheet,
    StatusBar,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import AuthTextField from "../components/AuthTextField";
import { Alert } from "../components/ds";
import GradientButton from "../components/GradientButton";
import { colors, fonts, radii, shadow } from "../theme/tokens";

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

    async function handleRegister() {
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        setLoading(true);

        const result = await register(
            name,
            email,
            password
        );

        if (!result.success) {
            setError(
                result.message ||
                "Erro ao cadastrar usuário"
            );
        } else {
            setSuccess(
                "Usuário cadastrado com sucesso!"
            );

            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                navigation.navigate("LOGIN" as never);
            }, 2000);
        }

        setLoading(false);
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

                <View style={styles.fieldsContainer}>
                    <AuthTextField icon="person-outline" placeholder="Nome" value={name} onChangeText={setName} />

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

                    <AuthTextField
                        icon="lock-outline"
                        placeholder="Confirmar senha"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                </View>

                <GradientButton
                    title="Cadastrar"
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.registerButton}
                />

                {error !== "" && (
                    <View>
                        <Alert tone="danger">{error}</Alert>
                    </View>
                )}

                {success !== "" && (
                    <View style={styles.successBanner}>
                        <Text style={styles.successText}>{success}</Text>
                    </View>
                )}
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
        top: -30,
    },

    iconWrapper: {
        width: 120,
        height: 120,
        borderRadius: radii.pill,
        backgroundColor: colors.surfaceRaised,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        ...shadow.lg,
    },

    iconImage: {
        width: 98,
        height: 98,
        borderRadius: radii.pill,
    },

    fieldsContainer: {
        width: "100%",
        gap: 12,
    },

    registerButton: {
        marginTop: 12,
    },

    errorBanner: {
        marginTop: 4,
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

    successBanner: {
        marginTop: 4,
        backgroundColor: colors.successSoft,
        borderRadius: radii.sm,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },

    successText: {
        color: colors.success,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "600",
        textAlign: "center",
        fontSize: 13,
    },
});
