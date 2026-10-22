import { ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HeroHeader, MenuCard, Sheet } from "../components/ds";
import { useAuth } from "../context/AuthContext";
import { hasConsent } from "../services/consentStorage";
import { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";

export default function Main() {
    const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const admin = useAuth().role === "admin";

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
      <HeroHeader
        eyebrow={admin ? "ECOA · ADMINISTRADOR" : "ECOA"}
        title={admin ? ["Painel do", "administrador"] : ["Cuidado fonoaudiológico", "de alta performance"]}
        subtitle={
          admin ? "Acompanhe os pacientes e crie treinos sob medida." : "Seus exercícios de hoje estão prontos."
        }
      />

      <Sheet>
        <MenuCard
          icon={admin ? "record-voice-over" : "fitness-center"}
          title="Exercícios"
          subtitle={admin ? "As 3 trilhas padrão do app" : "Pratique agora"}
          onPress={handleOpenExercises}
        />

        <MenuCard
          icon="settings"
          title="Configurações"
          subtitle="Câmera e frequência de captura"
          onPress={() => navigation.navigate("SETTINGS" as never)}
        />

        {!admin && (
          <MenuCard icon="insights" title="Evolução" subtitle="Seu progresso semana a semana" disabled />
        )}

        {/* Fase 0 (spike técnico) — ferramenta de diagnóstico, nunca visível em produção. */}
        {__DEV__ && (
          <MenuCard
            icon="science"
            title="Spike (dev)"
            subtitle="Latência MediaPipe"
            onPress={() => navigation.navigate("VISION_SPIKE" as never)}
          />
        )}
      </Sheet>
    </ScrollView>
  );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: 24,
  },
});
