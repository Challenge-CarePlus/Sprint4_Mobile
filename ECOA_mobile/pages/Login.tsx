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
import { colors, radii, shadow } from "../theme/tokens";

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

                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("REGISTER" as never)
                    }
                >
                    <Text style={styles.link}>Criar conta</Text>
                </TouchableOpacity>

                <GradientButton
                    title="Entrar"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.loginButton}
                />

                {error !== "" && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
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
        backgroundColor: colors.background,
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
        backgroundColor: colors.white,
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

    fieldsContainer: {
        width: "100%",
        gap: 12,
    },

    link: {
        color: colors.primary700,
        fontWeight: "700",
    },

    loginButton: {
        marginTop: 12,
    },

    errorBanner: {
        marginTop: 8,
        backgroundColor: "#FDECEA",
        borderRadius: radii.md,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },

    errorText: {
        color: colors.error,
        fontWeight: "600",
        textAlign: "center",
        fontSize: 13,
    },
});
