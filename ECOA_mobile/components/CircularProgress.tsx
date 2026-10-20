import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "../theme/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
    /** 0 a 1. */
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
    labelColor?: string;
    label?: string;
};

/**
 * Anel de progresso circular animado — usado na contagem de 3s da
 * calibração, bem mais sofisticado que um número cru na tela.
 */
export default function CircularProgress({
    progress,
    size = 140,
    strokeWidth = 10,
    color = colors.brand,
    trackColor = colors.brandSoft,
    labelColor = colors.ink,
    label,
}: Props) {
    const animatedProgress = useRef(new Animated.Value(progress)).current;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 250,
            useNativeDriver: false,
        }).start();
    }, [progress, animatedProgress]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            {label ? (
                <View style={styles.labelContainer} pointerEvents="none">
                    <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    labelContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 36,
        fontWeight: "700",
        color: colors.ink,
    },
});
