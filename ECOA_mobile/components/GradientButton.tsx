import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";

import { colors, fonts, gradients, radii, shadow } from "../theme/tokens";

type GradientName = keyof typeof gradients;

type Props = {
    title: string;
    onPress: () => void;
    icon?: keyof typeof MaterialIcons.glyphMap;
    iconPosition?: "left" | "right";
    gradient?: GradientName;
    disabled?: boolean;
    loading?: boolean;
    minHeight?: number;
    fontSize?: number;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    accessibilityLabel?: string;
};

/**
 * Botão primário com gradiente e feedback tátil (encolhe um pouco ao tocar).
 * Único lugar onde o CTA principal é desenhado — trocar o visual do botão em
 * todo o app passa a ser uma mudança aqui, não em cada tela.
 */
export default function GradientButton({
    title,
    onPress,
    icon,
    iconPosition = "right",
    gradient = "primary",
    disabled = false,
    loading = false,
    minHeight = 52,
    fontSize = 16,
    style,
    textStyle,
    accessibilityLabel,
}: Props) {
    const isDisabled = disabled || loading;

    const iconElement = icon ? (
        <MaterialIcons name={icon} size={22} color={colors.white} style={styles.icon} />
    ) : null;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? title}
            style={({ pressed }) => [
                styles.wrapper,
                { minHeight },
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabledWrapper,
                style,
            ]}
        >
            <LinearGradient
                colors={isDisabled ? [colors.lineStrong, colors.lineStrong] : gradients[gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { minHeight }, !isDisabled && shadow.sm]}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <>
                        {icon && iconPosition === "left" ? iconElement : null}
                        <Text style={[styles.text, { fontSize }, textStyle]}>{title}</Text>
                        {icon && iconPosition === "right" ? iconElement : null}
                    </>
                )}
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        borderRadius: radii.md,
    },
    pressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.92,
    },
    disabledWrapper: {
        opacity: 0.7,
    },
    gradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: radii.md,
        paddingHorizontal: 20,
    },
    text: {
        color: colors.white,
        fontFamily: fonts.bodySemiBold,
        fontWeight: "700",
    },
    icon: {
        marginTop: 1,
    },
});
