import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
} from "react-native";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  async function handleLogin() {
    const success = await login(
      email,
      password
    );

    if (!success) {
      Alert.alert(
        "Erro",
        "Email ou senha inválidos"
      );
    }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title="Entrar"
        onPress={handleLogin}
      />
    </View>
  );
}