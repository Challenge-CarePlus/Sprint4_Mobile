import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import Card from "../components/Card";

export default function Main() {
  const { logout } = useAuth();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.containerMain}>
        <Text style={styles.titleText}>
          Cuidado fonoaudiológico de alta performance
        </Text>

        <View style={styles.cardContainer}>
          <Card
            title="Exercícios"
            subtitle="Prática"
            iconName="fitness-center"
            active={true}
            onPress={() => navigation.navigate("CAMERA" as never)}
          />

          <Card
            title="Treinos"
            subtitle="Em breve"
            iconName="record-voice-over"
            active={false}
            onPress={() => { }}
          />

          <Card
            title="Evolução"
            subtitle="Em breve"
            iconName="analytics"
            active={false}
            onPress={() => { }}
          />

          <Card
            title="Configurações"
            subtitle="Em breve"
            iconName="settings"
            active={false}
            onPress={() => { }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    alignItems: "center",
  },

  containerMain: {
    width: "80%",
    flex: 1,
    justifyContent: "space-evenly",
  },

  titleText: {
    fontFamily: "Righteous_400Regular",
    fontSize: 32,
    textAlign: "center",
    color: "#1E3E6D",
  },

  cardContainer: {
    gap: 20,
  },
  
});