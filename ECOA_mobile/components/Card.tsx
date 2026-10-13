import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import IconBadge from "./IconBadge";
import { colors, radii, shadow } from "../theme/tokens";

type CardProps = {
  title: string;
  subtitle: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  gradient?: "primary" | "accent";
  onPress?: () => void;
};

export default function Card({
  title,
  subtitle,
  iconName,
  active,
  gradient = "primary",
  onPress,
}: CardProps) {
  return (
    <Pressable
      onPress={active ? onPress : undefined}
      disabled={!active}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !active }}
      style={({ pressed }) => [
        styles.container,
        !active && styles.disabled,
        pressed && active && styles.pressed,
      ]}
    >
      <IconBadge name={iconName} gradient={active ? gradient : "primary"} size={56} />

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {active && <MaterialIcons name="chevron-right" size={26} color={colors.neutral300} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...shadow.sm,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    color: colors.neutral900,
    fontFamily: "Righteous_400Regular",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
});
