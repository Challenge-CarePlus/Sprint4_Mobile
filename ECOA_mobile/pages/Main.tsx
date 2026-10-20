import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { MenuCard } from "../components/ds";
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
        <MenuCard
          icon="fitness-center"
          title="Exercícios"
          subtitle="Pratique agora"
          onPress={handleOpenExercises}
        />

        <MenuCard
          icon="settings"
          title="Configurações"
          subtitle="Câmera e frequência de captura"
          onPress={() => navigation.navigate("SETTINGS" as never)}
        />

        <MenuCard icon="record-voice-over" title="Treinos" subtitle="Sequências guiadas" disabled />

        <MenuCard icon="insights" title="Evolução" subtitle="Seu progresso semana a semana" disabled />

        {/* Fase 0 (spike técnico) — ferramenta de diagnóstico, nunca visível em produção. */}
        {__DEV__ && (
          <MenuCard
            icon="science"
            title="Spike (dev)"
            subtitle="Latência MediaPipe"
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
    paddingBottom: 56,
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
    color: colors.onHeroMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  // Sheet: os cards sobem sobre o hero marinho.
  cardContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: -24,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
});
