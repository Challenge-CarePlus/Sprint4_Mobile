import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Card from "../components/Card";
import { hasConsent } from "../services/consentStorage";
import { colors, fonts, gradients, radii } from "../theme/tokens";

export default function Main() {
  const navigation = useNavigation();

  async function handleOpenExercises() {
    const consented = await hasConsent();
    navigation.navigate((consented ? "TRACK_SELECT" : "CONSENT") as never);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Image
          source={require("../assets/waves1.png")}
          style={styles.heroWave}
          resizeMode="cover"
        />

        <Text style={styles.heroEyebrow}>ECOA</Text>
        <Text style={styles.heroTitle}>
          Cuidado fonoaudiológico{"\n"}de alta performance
        </Text>
        <Text style={styles.heroSubtitle}>Seus exercícios de hoje estão prontos.</Text>
      </LinearGradient>

      <View style={styles.cardContainer}>
        <Card
          title="Exercícios"
          subtitle="Pratique agora"
          iconName="fitness-center"
          active
          gradient="accent"
          onPress={handleOpenExercises}
        />

        <Card
          title="Treinos"
          subtitle="Em breve"
          iconName="record-voice-over"
          active={false}
          onPress={() => {}}
        />

        <Card
          title="Evolução"
          subtitle="Em breve"
          iconName="analytics"
          active={false}
          onPress={() => {}}
        />

        <Card
          title="Configurações"
          subtitle="Preferências"
          iconName="settings"
          active
          onPress={() => navigation.navigate("SETTINGS" as never)}
        />

        {/* Fase 0 (spike técnico) — ferramenta de diagnóstico, nunca visível em produção. */}
        {__DEV__ && (
          <Card
            title="Spike (dev)"
            subtitle="Latência MediaPipe"
            iconName="science"
            active
            onPress={() => navigation.navigate("VISION_SPIKE" as never)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 44,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: "hidden",
    gap: 6,
  },
  heroWave: {
    position: "absolute",
    right: -70,
    top: -50,
    width: 260,
    height: 320,
    opacity: 0.16,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.bodySemiBold,
    fontWeight: "700",
    letterSpacing: 3,
    fontSize: 12,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 26,
    color: colors.onBrand,
    lineHeight: 32,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginTop: -20,
    gap: 16,
  },
});
