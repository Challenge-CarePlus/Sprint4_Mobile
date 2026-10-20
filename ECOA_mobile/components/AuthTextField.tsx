import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { colors, fonts, radii, shadow } from "../theme/tokens";

type Props = TextInputProps & {
    icon: keyof typeof MaterialIcons.glyphMap;
};

/** Campo de texto padrão das telas de login/cadastro — usado nas duas para ficarem idênticas. */
export default function AuthTextField({ icon, style, onFocus, onBlur, ...rest }: Props) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
            <MaterialIcons name={icon} size={20} color={colors.brand} />
            <TextInput
                placeholderTextColor={colors.lineStrong}
                style={[styles.input, noOutline, style]}
                onFocus={(e) => {
                    setFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    onBlur?.(e);
                }}
                {...rest}
            />
        </View>
    );
}

// Na web, `outline-style: none` (RN não tipa o valor, por isso o cast) tira o contorno
// preto do navegador; o foco aparece no wrapper. No nativo não existe contorno.
const noOutline = Platform.OS === "web" ? ({ outlineStyle: "none", outlineWidth: 0 } as object) : null;

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: radii.md,
        paddingHorizontal: 16,
        height: 52,
        gap: 10,
        borderWidth: 2,
        borderColor: "transparent",
        ...shadow.sm,
    },
    // Foco visível em `brand` (DS) no lugar do contorno preto padrão do navegador.
    wrapperFocused: {
        borderColor: colors.brand,
    },
    input: {
        flex: 1,
        color: colors.ink,
        fontFamily: fonts.body,
        fontWeight: "500",
        fontSize: 15,
    },
});
