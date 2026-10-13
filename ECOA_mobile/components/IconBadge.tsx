import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { gradients, shadow } from "../theme/tokens";

type GradientName = keyof typeof gradients;

type Props = {
    name: keyof typeof MaterialIcons.glyphMap;
    size?: number;
    iconSize?: number;
    gradient?: GradientName;
    glow?: boolean;
    style?: StyleProp<ViewStyle>;
};

/**
 * Selo circular com gradiente usado para ícones em destaque (cards, cabeçalhos
 * de tela, conquistas). Substitui os círculos de cor lisa que o app tinha
 * antes — reaproveita o degradê navy -> coral do logo da ECOA.
 */
export default function IconBadge({
    name,
    size = 56,
    iconSize,
    gradient = "primary",
    glow = false,
    style,
}: Props) {
    return (
        <LinearGradient
            colors={gradients[gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.badge,
                { width: size, height: size, borderRadius: size / 2 },
                glow && shadow.glow,
                style,
            ]}
        >
            <MaterialIcons name={name} size={iconSize ?? Math.round(size * 0.5)} color="#fff" />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignItems: "center",
        justifyContent: "center",
    },
});
