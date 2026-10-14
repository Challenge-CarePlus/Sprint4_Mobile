import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { colors, gradients } from "../theme/tokens";

type GradientName = keyof typeof gradients;

type Props = {
    name: keyof typeof MaterialIcons.glyphMap;
    size?: number;
    iconSize?: number;
    gradient?: GradientName;
    style?: StyleProp<ViewStyle>;
};

/**
 * Selo circular com gradiente usado para ícones em destaque (cards, cabeçalhos
 * de tela, conquistas). Substitui os círculos de cor lisa que o app tinha
 * antes.
 */
export default function IconBadge({
    name,
    size = 56,
    iconSize,
    gradient = "primary",
    style,
}: Props) {
    return (
        <LinearGradient
            colors={gradients[gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }, style]}
        >
            <MaterialIcons name={name} size={iconSize ?? Math.round(size * 0.5)} color={colors.white} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignItems: "center",
        justifyContent: "center",
    },
});
