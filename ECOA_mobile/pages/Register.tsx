import React, { useState } from "react";
import {
    View,
    Image,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

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
                <View
                    style={styles.iconFieldContainer}
                >
                    <Image
                        source={require("./../assets/icon.png")}
                        style={styles.iconImage}
                    />

                    <TextInput
                        placeholder="Nome"
                        placeholderTextColor="#d9d9d9"
                        style={styles.loginInput}
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#d9d9d9"
                        style={styles.loginInput}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        placeholder="Senha"
                        placeholderTextColor="#d9d9d9"
                        secureTextEntry
                        style={styles.loginInput}
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TextInput
                        placeholder="Confirmar senha"
                        placeholderTextColor="#d9d9d9"
                        secureTextEntry
                        style={styles.loginInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.loginButton,
                        loading &&
                        styles.disabledButton,
                    ]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text
                            style={
                                styles.loginButtonText
                            }
                        >
                            Cadastrar
                        </Text>
                    )}
                </TouchableOpacity>

                {error !== "" && (
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                )}

                {success !== "" && (
                    <Text style={styles.successText}>
                        {success}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
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
        width: "70%",
        gap: 10,
        top: -70,
    },

    iconFieldContainer: {
        width: "100%",
        alignItems: "center",
        gap: 10,
    },

    iconImage: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginBottom: 40,
    },

    loginInput: {
        backgroundColor: "#4887E3",
        borderRadius: 5,
        paddingHorizontal: 20,
        width: "100%",
        height: 45,
        color: "#fff",
        fontWeight: "500",
    },

    loginButton: {
        backgroundColor: "#284A7D",
        width: "60%",
        padding: 12,
        borderRadius: 5,
        marginTop: 20,
        alignItems: "center",
    },

    disabledButton: {
        opacity: 0.7,
    },

    loginButtonText: {
        color: "#fff",
        fontWeight: "600",
    },

    errorText: {
        color: "#ff3b30",
        fontWeight: "500",
        textAlign: "center",
        marginTop: 10,
    },

    successText: {
        color: "#34c759",
        fontWeight: "500",
        textAlign: "center",
        marginTop: 10,
    },
});