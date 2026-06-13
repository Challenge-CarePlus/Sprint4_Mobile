import { View, Text, Button } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Main() {
  const { logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Usuário autenticado</Text>

      <Button
        title="Sair"
        onPress={logout}
      />
    </View>
  );
}