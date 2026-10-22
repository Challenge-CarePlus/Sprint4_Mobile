import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { fonts, radii, Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";

type Props = TextInputProps & {
    icon: keyof typeof MaterialIcons.glyphMap;
    /** Mensagem de erro: borda e texto em `danger`. */
    error?: string;
    /** Texto de ajuda abaixo do campo (some quando há erro). */
    help?: string;
};

/**
 * TextField do DS (cp-field com ícone): pílula de 52px, ícone à esquerda,
 * sombra de card em vez de borda, olho de revelar senha. O `placeholder` faz
 * o papel de rótulo (o DS usa `hideLabel`), então também vira o label de
 * acessibilidade.
 */
export default function AuthTextField({
    icon,
    error,
    help,
    style,
    onFocus,
    onBlur,
    secureTextEntry,
    placeholder,
    ...rest
}: Props) {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const message = error ?? help;

    return (
        <View style={styles.field}>
            <View
                style={[
                    styles.wrapper,
                    focused && styles.wrapperFocused,
                    error ? styles.wrapperInvalid : null,
                ]}
            >
                <View style={styles.icon} pointerEvents="none">
                    <MaterialIcons name={icon} size={20} color={colors.brandInk} />
                </View>
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={colors.inkMuted}
                    accessibilityLabel={placeholder}
                    style={[styles.input, secureTextEntry ? styles.inputTrail : null, noOutline, style]}
                    onFocus={(e) => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    secureTextEntry={secureTextEntry && !visible}
                    {...rest}
                />
                {secureTextEntry ? (
                    <Pressable
                        onPress={() => setVisible((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
                        accessibilityState={{ expanded: visible }}
                        style={styles.trail}
                    >
                        <MaterialIcons
                            name={visible ? "visibility-off" : "visibility"}
                            size={20}
                            color={colors.inkMuted}
                        />
                    </Pressable>
                ) : null}
            </View>
            {message ? (
                <Text
                    style={[styles.help, error ? styles.helpInvalid : null]}
                    accessibilityRole={error ? "alert" : undefined}
                >
                    {message}
                </Text>
            ) : null}
        </View>
    );
}

// Na web, `outline-style: none` (RN não tipa o valor, por isso o cast) tira o contorno
// preto do navegador; o foco aparece no wrapper. No nativo não existe contorno.
const noOutline = Platform.OS === "web" ? ({ outlineStyle: "none", outlineWidth: 0 } as object) : null;

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    field: { width: "100%", gap: 6 },
    wrapper: {
        width: "100%",
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceRaised,
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: "transparent",
        ...shadow.card,
    },
    // Foco visível em `brand` (DS) no lugar do contorno preto padrão do navegador.
    wrapperFocused: { borderColor: colors.brand },
    wrapperInvalid: { borderColor: colors.danger },
    icon: { position: "absolute", left: 16 },
    input: {
        flex: 1,
        minWidth: 0,
        height: "100%",
        paddingLeft: 52,
        paddingRight: 24,
        color: colors.ink,
        fontFamily: fonts.body,
        fontSize: 16,
    },
    inputTrail: { paddingRight: 52 },
    trail: {
        position: "absolute",
        right: 4,
        width: 44,
        height: 44,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    help: {
        paddingHorizontal: 24,
        fontFamily: fonts.body,
        fontSize: 12,
        lineHeight: 16,
        color: colors.inkMuted,
    },
    helpInvalid: { color: colors.danger, fontFamily: fonts.bodySemiBold },
});
