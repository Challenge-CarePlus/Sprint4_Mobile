import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, gradients, kidsColors, kidsFonts, radii, shadow } from "../theme/tokens";

type IconName = keyof typeof MaterialIcons.glyphMap;

/**
 * Componentes do DS Care Plus usados nas telas do app Ecoa (protótipo
 * "Telas do App Ecoa"): PageIntro, MenuCard, Alert, ActionBar, StepBadge,
 * RepChip. Núcleo marinho/tonal; a variante `kids` usa o kit infantil.
 */

export function PageIntro({
    title,
    subtitle,
    icon,
}: {
    title: string;
    subtitle?: string;
    icon?: IconName;
}) {
    return (
        <View style={styles.intro}>
            {icon && (
                <LinearGradient colors={gradients.hero} style={styles.introIcon}>
                    <MaterialIcons name={icon} size={32} color={colors.onHero} />
                </LinearGradient>
            )}
            <Text style={styles.introTitle} accessibilityRole="header">
                {title}
            </Text>
            {subtitle ? <Text style={styles.introSubtitle}>{subtitle}</Text> : null}
        </View>
    );
}

/** Card de navegação: o card inteiro é o botão. `disabled` = "Em breve" tracejado. */
export function MenuCard({
    icon,
    title,
    subtitle,
    meta,
    kids = false,
    disabled = false,
    onPress,
}: {
    icon: IconName;
    title: string;
    subtitle: string;
    meta?: string;
    kids?: boolean;
    disabled?: boolean;
    onPress?: () => void;
}) {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            accessibilityLabel={`${title}. ${subtitle}${disabled ? ". Em breve" : ""}`}
            style={({ pressed }) => [
                styles.mcard,
                disabled && styles.mcardOff,
                pressed && !disabled && styles.mcardPressed,
            ]}
        >
            {disabled ? (
                <View style={[styles.mcardIcon, styles.mcardIconOff]}>
                    <MaterialIcons name={icon} size={24} color={colors.inkMuted} />
                </View>
            ) : (
                <LinearGradient
                    colors={kids ? gradients.kidsPrimary : gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mcardIcon}
                >
                    <MaterialIcons name={icon} size={24} color={kids ? kidsColors.indigo : colors.onHero} />
                </LinearGradient>
            )}

            <View style={styles.mcardText}>
                <Text style={[styles.mcardTitle, disabled && { color: colors.inkMuted }]}>{title}</Text>
                <Text style={styles.mcardSubtitle}>{subtitle}</Text>
                {meta ? (
                    <View style={styles.mcardMeta}>
                        <Text style={styles.mcardMetaText}>{meta}</Text>
                    </View>
                ) : null}
            </View>

            {!disabled && <MaterialIcons name="chevron-right" size={22} color={colors.inkMuted} />}
        </Pressable>
    );
}

export function Alert({ tone, children }: { tone: "danger" | "success" | "info"; children: ReactNode }) {
    const map = {
        danger: { bg: colors.dangerSoft, fg: colors.danger, icon: "error-outline" as IconName },
        success: { bg: colors.successSoft, fg: colors.success, icon: "check-circle-outline" as IconName },
        info: { bg: colors.brandSoft, fg: colors.brandInk, icon: "info-outline" as IconName },
    }[tone];

    return (
        <View
            style={[styles.alert, { backgroundColor: map.bg }]}
            accessibilityRole={tone === "danger" ? "alert" : undefined}
        >
            <MaterialIcons name={map.icon} size={20} color={map.fg} />
            <Text style={[styles.alertText, { color: map.fg }]}>{children}</Text>
        </View>
    );
}

/** Barra de ação fixa no rodapé: marinho (kids: gradiente verde→azul, texto índigo). */
export function ActionBar({
    title,
    subtitle,
    onPress,
    kids = false,
    large = false,
}: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    kids?: boolean;
    large?: boolean;
}) {
    const fg = kids ? kidsColors.indigo : colors.onHero;
    const sub = kids ? kidsColors.indigo : colors.onHeroMuted;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
            style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] }]}
        >
            <LinearGradient
                colors={kids ? gradients.kidsPrimary : gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.action, large && { minHeight: 84 }, kids ? shadow.kids : shadow.hero]}
            >
                <View style={{ flex: 1 }}>
                    <Text
                        style={[
                            styles.actionTitle,
                            { color: fg, fontFamily: kids ? kidsFonts.display : fonts.bodySemiBold },
                            large && { fontSize: 18, lineHeight: 24 },
                        ]}
                    >
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text style={[styles.actionSubtitle, { color: sub }, large && { fontSize: 15 }]}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.actionArrow}>
                    <MaterialIcons name="arrow-forward" size={22} color={kids ? kidsColors.indigo : colors.brandDeep} />
                </View>
            </LinearGradient>
        </Pressable>
    );
}

export function StepBadge({ children, kids = false }: { children: ReactNode; kids?: boolean }) {
    return (
        <View style={[styles.badge, kids && { backgroundColor: kidsColors.indigo }]}>
            <Text style={[styles.badgeText, kids && { color: colors.white, fontFamily: kidsFonts.bold }]}>
                {children}
            </Text>
        </View>
    );
}

export function RepChip({ children, kids = false }: { children: ReactNode; kids?: boolean }) {
    return (
        <View style={[styles.chip, kids && { backgroundColor: kidsColors.yellowSoft }]}>
            <MaterialIcons name="repeat" size={16} color={kids ? kidsColors.ink : colors.brandInk} />
            <Text style={[styles.chipText, kids && { color: kidsColors.ink, fontFamily: kidsFonts.bold }]}>
                {children}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    intro: { alignItems: "center", gap: 8, paddingHorizontal: 8 },
    introIcon: {
        width: 72,
        height: 72,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
        ...shadow.hero,
    },
    introTitle: {
        fontFamily: fonts.displaySemiBold,
        fontSize: 24,
        lineHeight: 30,
        color: colors.ink,
        textAlign: "center",
    },
    introSubtitle: {
        fontFamily: fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: colors.inkMuted,
        textAlign: "center",
        maxWidth: 320,
    },

    mcard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceRaised,
        ...shadow.card,
    },
    mcardOff: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: colors.lineStrong,
        shadowOpacity: 0,
        elevation: 0,
    },
    mcardPressed: { transform: [{ scale: 0.98 }] },
    mcardIcon: {
        width: 52,
        height: 52,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    mcardIconOff: { backgroundColor: colors.surfaceRaised },
    mcardText: { flex: 1, gap: 2 },
    mcardTitle: { fontFamily: fonts.displaySemiBold, fontSize: 16, lineHeight: 22, color: colors.ink },
    mcardSubtitle: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
    mcardMeta: {
        alignSelf: "flex-start",
        marginTop: 4,
        backgroundColor: colors.brandSoft,
        borderRadius: radii.pill,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    mcardMetaText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, color: colors.brandInk },

    alert: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        padding: 12,
        paddingHorizontal: 16,
        borderRadius: radii.md,
    },
    alertText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },

    action: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 76,
        paddingVertical: 16,
        paddingLeft: 24,
        paddingRight: 16,
        borderRadius: radii.lg,
    },
    actionTitle: { fontSize: 15, lineHeight: 20 },
    actionSubtitle: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, marginTop: 2 },
    actionArrow: {
        width: 44,
        height: 44,
        borderRadius: radii.pill,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
    },

    badge: {
        alignSelf: "center",
        height: 28,
        paddingHorizontal: 12,
        borderRadius: radii.pill,
        backgroundColor: colors.brandSoft,
        justifyContent: "center",
    },
    badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, color: colors.brandInk },

    chip: {
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        height: 32,
        paddingHorizontal: 12,
        borderRadius: radii.pill,
        backgroundColor: colors.brandSoft,
    },
    chipText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.brandInk },
});
