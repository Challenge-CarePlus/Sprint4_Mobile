import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { colors, fonts, radii, shadow } from "../theme/tokens";

type Props = TextInputProps & {
    icon: keyof typeof MaterialIcons.glyphMap;
};

/** Campo de texto padrão das telas de login/cadastro — usado nas duas para ficarem idênticas. */
export default function AuthTextField({ icon, style, ...rest }: Props) {
    return (
        <View style={styles.wrapper}>
            <MaterialIcons name={icon} size={20} color={colors.brand} />
            <TextInput
                placeholderTextColor={colors.lineStrong}
                style={[styles.input, style]}
                {...rest}
            />
        </View>
    );
}

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
        ...shadow.sm,
    },
    input: {
        flex: 1,
        color: colors.ink,
        fontFamily: fonts.body,
        fontWeight: "500",
        fontSize: 15,
    },
});
