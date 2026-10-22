import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useState } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
    StyleProp,
} from "react-native";

import { fonts, radii, Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";

type IconName = keyof typeof MaterialIcons.glyphMap;

/**
 * Peças do modo administrador (protótipo "Ecoa Modo Administrador", classes .px-*): campos com
 * rótulo, listas em cartão, métricas, barras, seletores. Núcleo do DS, claro e escuro.
 */

/** Seta circular suave dos cartões navegáveis (cp-arrow-soft). */
export function ArrowSoft() {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.arrowSoft}>
            <MaterialIcons name="arrow-forward" size={18} color={colors.brandInk} />
        </View>
    );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
    const styles = useThemedStyles(makeStyles);
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase();

    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} accessibilityLabel={name}>
            <Text style={[styles.avatarText, { fontSize: size >= 56 ? 18 : 16 }]}>{initials}</Text>
        </View>
    );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.sec}>
            <Text style={styles.secTitle} accessibilityRole="header">
                {children}
            </Text>
            {aside}
        </View>
    );
}

/** Bolinha com a contagem ao lado de um título (px-count). */
export function CountPill({ value }: { value: number }) {
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.count}>
            <Text style={styles.countText}>{value}</Text>
        </View>
    );
}

/** Nota discreta (px-note) e mensagem de erro (px-err). */
export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) {
    const styles = useThemedStyles(makeStyles);
    return (
        <Text style={tone === "error" ? styles.err : styles.note} accessibilityRole={tone === "error" ? "alert" : undefined}>
            {children}
        </Text>
    );
}

/**
 * Campo com rótulo visível (cp-field): pílula de 52px, ou área de texto (px-textarea) com
 * `multiline`. Erro = borda e ajuda em `danger`.
 */
export function Field({
    label,
    optional = false,
    hideLabel = false,
    error,
    help,
    multiline = false,
    rows = 2,
    ...input
}: TextInputProps & { label: string; optional?: boolean; hideLabel?: boolean; error?: string; help?: string; rows?: number }) {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const [focused, setFocused] = useState(false);
    const message = error ?? help;

    return (
        <View style={styles.field}>
            {hideLabel ? null : (
                <Text style={styles.fieldLabel}>
                    {label}
                    {optional ? <Text style={styles.optional}> (opcional)</Text> : null}
                </Text>
            )}
            <TextInput
                {...input}
                multiline={multiline}
                numberOfLines={multiline ? rows : 1}
                accessibilityLabel={label}
                placeholderTextColor={colors.inkMuted}
                onFocus={(e) => {
                    setFocused(true);
                    input.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    input.onBlur?.(e);
                }}
                style={[
                    multiline ? styles.textarea : styles.input,
                    multiline && { minHeight: 22 * rows + 24 },
                    focused && { borderColor: colors.brand },
                    error ? { borderColor: colors.danger } : null,
                    noOutline,
                ]}
            />
            {message ? <Text style={[styles.help, error ? styles.helpError : null]}>{message}</Text> : null}
        </View>
    );
}

const noOutline = Platform.OS === "web" ? ({ outlineStyle: "none", outlineWidth: 0 } as object) : null;

/** Linha-cartão navegável (px-prow / px-trow): à esquerda avatar ou ícone, título, subtítulo, seta. */
export function RowCard({
    leading,
    title,
    subtitle,
    children,
    onPress,
    trailing,
    accessibilityLabel,
    style,
}: {
    leading?: ReactNode;
    title: string;
    subtitle?: string;
    children?: ReactNode;
    onPress?: () => void;
    trailing?: ReactNode;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const styles = useThemedStyles(makeStyles);
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
            style={({ pressed }) => [styles.row, pressed && { transform: [{ scale: 0.99 }] }, style]}
        >
            {leading}
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
                {children}
            </View>
            {trailing === undefined ? <ArrowSoft /> : trailing}
        </Pressable>
    );
}

/** Círculo marinho de 44px com ícone (cp-mcard-ic reduzido). */
export function IconCircle({ icon, size = 44 }: { icon: IconName; size?: number }) {
    const { colors, gradients } = useTheme();
    return (
        <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}
        >
            <MaterialIcons name={icon} size={22} color={colors.onHero} />
        </LinearGradient>
    );
}

/** Barra de adesão (px-prog): "baixa" abaixo de 55%. */
export function Progress({ value, label }: { value: number; label: string }) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    const pct = Math.max(0, Math.min(100, value));
    return (
        <View style={styles.prog}>
            <View
                style={styles.progTrack}
                accessibilityRole="progressbar"
                accessibilityLabel={label}
                accessibilityValue={{ min: 0, max: 100, now: pct }}
            >
                <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: pct < 55 ? colors.warning : colors.brandDeep }]} />
            </View>
            <Text style={styles.progN}>{pct}%</Text>
        </View>
    );
}

/** Filtro em chips rolável (px-chips). */
export function Chips<T extends string>({
    options,
    value,
    onChange,
    label,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    label: string;
}) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    return (
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
            {options.map((o) => {
                const on = o.value === value;
                return (
                    <Pressable
                        key={o.value}
                        onPress={() => onChange(o.value)}
                        accessibilityRole="radio"
                        aria-checked={on}
                        style={[styles.chip, on && { backgroundColor: colors.brandDeep }]}
                    >
                        <Text style={[styles.chipText, on && { color: colors.onHero }]}>{o.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

/** Painel de métricas tonal (cp-tonal cp-metrics): 3 colunas com divisória. */
export function MetricPanel({
    title,
    metrics,
}: {
    title: string;
    metrics: { label: string; value: string; unit: string; icon: IconName }[];
}) {
    const styles = useThemedStyles(makeStyles);
    const { colors, gradients } = useTheme();
    return (
        <LinearGradient colors={gradients.tonal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.metrics}>
            <Text style={styles.metricsTitle} accessibilityRole="header">
                {title}
            </Text>
            <View style={styles.metricsGrid}>
                {metrics.map((m, i) => (
                    <View
                        key={m.label}
                        style={[styles.metric, i === 0 && { paddingLeft: 0 }, i > 0 && styles.metricDivider]}
                        accessible
                        accessibilityLabel={`${m.label}: ${m.value} ${m.unit}`}
                    >
                        <Text style={styles.metricLabel} numberOfLines={1}>
                            {m.label}
                        </Text>
                        <Text style={styles.metricVal}>{m.value}</Text>
                        <View style={styles.metricFoot}>
                            <Text style={styles.metricUnit}>{m.unit}</Text>
                            <View style={styles.metricIc}>
                                <MaterialIcons name={m.icon} size={14} color={colors.brandInk} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </LinearGradient>
    );
}

/** Gráfico de barras de 7 dias (px-bars). */
export function Bars({ values, caption }: { values: number[]; caption: string }) {
    const styles = useThemedStyles(makeStyles);
    const { colors, gradients } = useTheme();
    const max = Math.max(3, ...values);
    const days = ["S", "T", "Q", "Q", "S", "S", "D"];

    return (
        <View style={styles.bars}>
            <Text style={styles.barsCaption}>{caption}</Text>
            <View style={styles.barsPlot} accessible accessibilityRole="image" accessibilityLabel={`${caption}: ${values.join(", ")}`}>
                {values.map((v, i) => (
                    <View key={i} style={styles.bar}>
                        <Text style={styles.barV}>{v}</Text>
                        <LinearGradient
                            colors={[colors.heroEnd, colors.brandDeep]}
                            style={[styles.barCol, { height: `${(v / max) * 100 - 0}%`, minHeight: 3 }]}
                        />
                        <Text style={styles.barD}>{days[i] ?? ""}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

/** Cartão vazio tracejado (px-empty). */
export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    return (
        <View style={styles.empty}>
            <MaterialIcons name={icon} size={28} color={colors.inkMuted} />
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyText}>{text}</Text>
        </View>
    );
}

/** Botão tracejado "adicionar" (px-add). */
export function AddButton({ title, onPress, small = false }: { title: string; onPress: () => void; small?: boolean }) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => [styles.add, small && { minHeight: 48 }, pressed && { backgroundColor: colors.brandSoft }]}
        >
            <MaterialIcons name="add" size={small ? 18 : 20} color={colors.brandInk} />
            <Text style={[styles.addText, small && { fontSize: 14 }]}>{title}</Text>
        </Pressable>
    );
}

/** Botão-ícone redondo de 48px de alvo (px-icon-btn). */
export function IconAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
    const { colors } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{ width: 48, height: 48, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" }}
        >
            <MaterialIcons name={icon} size={18} color={colors.inkMuted} />
        </Pressable>
    );
}

/** Ação destrutiva em texto (px-del). */
export function DangerLink({ title, icon, onPress }: { title: string; icon: IconName; onPress: () => void }) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    return (
        <Pressable onPress={onPress} accessibilityRole="button" style={styles.del}>
            <MaterialIcons name={icon} size={18} color={colors.danger} />
            <Text style={styles.delText}>{title}</Text>
        </Pressable>
    );
}

/** Contador +/- (px-stepper). */
export function Stepper({
    label,
    value,
    min = 0,
    max = 99,
    unit,
    onChange,
}: {
    label: string;
    value: number;
    min?: number;
    max?: number;
    unit?: string;
    onChange: (value: number) => void;
}) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    return (
        <View style={styles.stepper}>
            <Text style={styles.stepperLabel}>{label}</Text>
            <View style={styles.stepperCtl} accessibilityRole="adjustable" accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ""}`}>
                <Pressable
                    onPress={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    accessibilityRole="button"
                    accessibilityLabel="Diminuir"
                    style={[styles.stepBtn, value <= min && { opacity: 0.45 }]}
                >
                    <MaterialIcons name="remove" size={18} color={colors.brandInk} />
                </Pressable>
                <Text style={styles.stepOut}>
                    {value}
                    {unit ? <Text style={styles.stepUnit}> {unit}</Text> : null}
                </Text>
                <Pressable
                    onPress={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                    accessibilityRole="button"
                    accessibilityLabel="Aumentar"
                    style={[styles.stepBtn, value >= max && { opacity: 0.45 }]}
                >
                    <MaterialIcons name="add" size={18} color={colors.brandInk} />
                </Pressable>
            </View>
        </View>
    );
}

/** Interruptor em cartão (px-switch). */
export function SwitchRow({ on, label, sub, onChange }: { on: boolean; label: string; sub?: string; onChange: (on: boolean) => void }) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    return (
        <Pressable
            onPress={() => onChange(!on)}
            accessibilityRole="switch"
            aria-checked={on}
            accessibilityLabel={sub ? `${label}. ${sub}` : label}
            style={styles.switchRow}
        >
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{label}</Text>
                {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
            </View>
            <View style={[styles.switchTrack, on && { backgroundColor: colors.brandDeep, borderWidth: 0 }]}>
                <View style={[styles.switchKnob, on ? { left: 25, backgroundColor: colors.onHero } : { left: 3 }]} />
            </View>
        </Pressable>
    );
}

/** Linha com caixa de seleção (px-check). */
export function CheckRow({
    on,
    title,
    subtitle,
    avatar,
    onChange,
}: {
    on: boolean;
    title: string;
    subtitle?: string;
    avatar?: ReactNode;
    onChange: () => void;
}) {
    const styles = useThemedStyles(makeStyles);
    const { colors } = useTheme();
    return (
        <Pressable
            onPress={onChange}
            accessibilityRole="checkbox"
            aria-checked={on}
            accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
            style={[styles.row, on && { backgroundColor: colors.brandSoft, ...({ shadowOpacity: 0, elevation: 0 } as object) }]}
        >
            {avatar}
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
            </View>
            <View style={[styles.box, on && { backgroundColor: colors.brandDeep, borderColor: colors.brandDeep }]}>
                {on ? <MaterialIcons name="check" size={16} color={colors.onHero} /> : null}
            </View>
        </Pressable>
    );
}

/** Pequeno selo de estado ("com vídeo" ok / "sem vídeo" aviso). */
export function InlineStatus({ ok, children }: { ok: boolean; children: ReactNode }) {
    const { colors } = useTheme();
    return <Text style={{ color: ok ? colors.success : colors.warning, fontFamily: fonts.bodySemiBold }}>{children}</Text>;
}

/** Rodapé fixo com degradê até o fundo da tela (cp-dock). */
export function Dock({ children }: { children: ReactNode }) {
    const { colors } = useTheme();
    return (
        <LinearGradient
            colors={[`${colors.surface}00`, colors.surface]}
            locations={[0, 0.45]}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 32 }}
            pointerEvents="box-none"
        >
            {children}
        </LinearGradient>
    );
}

const makeStyles = ({ colors, shadow }: Theme) =>
    StyleSheet.create({
        arrowSoft: {
            width: 36,
            height: 36,
            borderRadius: radii.pill,
            backgroundColor: colors.brandSoft,
            alignItems: "center",
            justifyContent: "center",
        },
        avatar: {
            backgroundColor: colors.brandSoft,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: colors.surfaceRaised,
        },
        avatarText: { fontFamily: fonts.bodySemiBold, color: colors.brandInk },

        sec: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 },
        secTitle: { fontFamily: fonts.bodySemiBold, fontSize: 17, lineHeight: 22, color: colors.ink },
        count: {
            minWidth: 24,
            height: 24,
            paddingHorizontal: 8,
            borderRadius: radii.pill,
            backgroundColor: colors.brandSoft,
            alignItems: "center",
            justifyContent: "center",
        },
        countText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.brandInk },
        note: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
        err: { marginTop: -8, fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.danger },

        field: { gap: 6 },
        fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.ink },
        optional: { fontFamily: fonts.body, color: colors.inkMuted },
        input: {
            height: 52,
            paddingHorizontal: 24,
            borderWidth: 1.5,
            borderColor: colors.line,
            borderRadius: radii.pill,
            backgroundColor: colors.surfaceRaised,
            color: colors.ink,
            fontFamily: fonts.body,
            fontSize: 16,
        },
        textarea: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1.5,
            borderColor: colors.line,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceRaised,
            color: colors.ink,
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
            textAlignVertical: "top",
        },
        help: { paddingHorizontal: 24, fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
        helpError: { color: colors.danger, fontFamily: fonts.bodySemiBold },

        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceRaised,
            ...shadow.card,
        },
        rowText: { flex: 1, minWidth: 0, gap: 3 },
        rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, color: colors.ink },
        rowSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkMuted },

        prog: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
        progTrack: { flex: 1, height: 6, borderRadius: radii.pill, backgroundColor: colors.brandSoft, overflow: "hidden" },
        progFill: { height: "100%", borderRadius: radii.pill },
        progN: { width: 34, textAlign: "right", fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink },

        chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: {
            height: 48,
            paddingHorizontal: 14,
            borderRadius: radii.pill,
            backgroundColor: colors.surfaceRaised,
            justifyContent: "center",
            ...shadow.card,
        },
        chipText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink },

        metrics: { borderRadius: radii.md, padding: 16 },
        metricsTitle: { fontFamily: fonts.displaySemiBold, fontSize: 16, lineHeight: 22, color: colors.ink, marginBottom: 16 },
        metricsGrid: { flexDirection: "row" },
        metric: { flex: 1, paddingHorizontal: 12, gap: 6, minWidth: 0 },
        metricDivider: { borderLeftWidth: 1, borderLeftColor: colors.lineTonal },
        metricLabel: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
        metricVal: { fontFamily: fonts.medium, fontSize: 24, lineHeight: 28, letterSpacing: -0.24, color: colors.ink },
        metricFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
        metricUnit: { fontFamily: fonts.body, fontSize: 11, lineHeight: 14, color: colors.inkMuted },
        metricIc: {
            width: 24,
            height: 24,
            borderRadius: radii.pill,
            backgroundColor: colors.surfaceRaised,
            alignItems: "center",
            justifyContent: "center",
        },

        bars: { gap: 12 },
        barsCaption: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink },
        barsPlot: { flexDirection: "row", gap: 8, height: 132, alignItems: "flex-end" },
        bar: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end", gap: 4 },
        barCol: { flexShrink: 1, width: "100%", maxWidth: 26, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
        barV: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.inkMuted },
        barD: { fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted },

        empty: {
            alignItems: "center",
            gap: 6,
            paddingVertical: 32,
            paddingHorizontal: 16,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.lineStrong,
            borderRadius: radii.md,
        },
        emptyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.ink },
        emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, textAlign: "center" },

        add: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 56,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.brand,
            borderRadius: radii.md,
        },
        addText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.brandInk },
        del: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, marginTop: 8 },
        delText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.danger },

        stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
        stepperLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink, flexShrink: 1 },
        stepperCtl: { flexDirection: "row", alignItems: "center", gap: 6 },
        stepBtn: {
            width: 48,
            height: 48,
            borderRadius: radii.pill,
            backgroundColor: colors.brandSoft,
            alignItems: "center",
            justifyContent: "center",
        },
        stepOut: { minWidth: 56, textAlign: "center", fontFamily: fonts.bodySemiBold, fontSize: 20, color: colors.ink },
        stepUnit: { fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },

        switchRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceRaised,
            ...shadow.card,
        },
        switchTrack: {
            width: 52,
            height: 30,
            borderRadius: radii.pill,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: colors.lineStrong,
            justifyContent: "center",
        },
        switchKnob: { position: "absolute", top: 3, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceRaised },
        box: {
            width: 26,
            height: 26,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: colors.lineStrong,
            alignItems: "center",
            justifyContent: "center",
        },
    });
