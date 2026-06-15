import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type CardProps = {
  title: string;
  subtitle: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  onPress?: () => void;
};

export default function Card({
  title,
  subtitle,
  iconName,
  active,
  onPress,
}: CardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, !active && styles.desativado]}
      onPress={active ? onPress : undefined}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={iconName}
          size={32}
          color="#fff"
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderColor: "#284A7D",
    borderWidth: 3,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  desativado: {
    opacity: 0.4,
    backgroundColor: "#b0c7e6",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#284A7D",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    color: "#000",
    fontFamily: "Righteous_400Regular",
  },
  subtitle: {
    fontSize: 18,
    color: "#8B8B8B",
    fontFamily: "Righteous_400Regular",
  },
});