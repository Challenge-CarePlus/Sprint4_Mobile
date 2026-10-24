import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Children, Fragment, isValidElement, ReactNode, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    Image,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import { fonts, kidsColors, kidsFonts, radii, Theme } from "../theme/tokens";
import { useLayout } from "../theme/layout";
import { useTheme, useThemedStyles } from "../theme/ThemeContext";

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
    align = "center",
}: {
    title: string;
    subtitle?: string;
    icon?: IconName;
    align?: "center" | "left";
}) {
    const { colors, gradients } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={[styles.intro, align === "left" && { alignItems: "flex-start" }]}>
            {icon && (
                <LinearGradient colors={gradients.hero} style={styles.introIcon}>
                    <MaterialIcons name={icon} size={32} color={colors.onHero} />
                </LinearGradient>
            )}
            <Text style={[styles.introTitle, align === "left" && { textAlign: "left" }]} accessibilityRole="header">
                {title}
            </Text>
            {subtitle ? (
                <Text style={[styles.introSubtitle, align === "left" && { textAlign: "left", maxWidth: undefined }]}>
                    {subtitle}
                </Text>
            ) : null}
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
    const { colors, gradients } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            accessibilityRole="button"
            aria-disabled={disabled}
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

            {disabled ? (
                <View style={styles.soon}>
                    <View style={styles.soonDot} />
                    <Text style={styles.soonText}>Em breve</Text>
                </View>
            ) : (
                <View style={styles.arrowSoft}>
                    <MaterialIcons name="arrow-forward" size={18} color={colors.brandInk} />
                </View>
            )}
        </Pressable>
    );
}

export function Alert({ tone, children }: { tone: "danger" | "success" | "info"; children: ReactNode }) {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
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
    const { colors, shadow, gradients } = useTheme();
    const styles = useThemedStyles(makeStyles);
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
    const { colors, kids: palette } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={[styles.badge, kids && { backgroundColor: palette.hero }]}>
            <Text style={[styles.badgeText, kids && { color: palette.onHero, fontFamily: kidsFonts.bold }]}>
                {children}
            </Text>
        </View>
    );
}

export function RepChip({ children, kids = false }: { children: ReactNode; kids?: boolean }) {
    const { colors, kids: palette } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={[styles.chip, kids && { backgroundColor: palette.yellowSoft }]}>
            <MaterialIcons name="repeat" size={16} color={kids ? palette.ink : colors.brandInk} />
            <Text style={[styles.chipText, kids && { color: palette.ink, fontFamily: kidsFonts.bold }]}>
                {children}
            </Text>
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* Botão (cp-btn): pílula 52px, primário marinho sólido                */
/* ------------------------------------------------------------------ */

export function Button({
    title,
    onPress,
    variant = "primary",
    icon,
    loading = false,
    disabled = false,
    minHeight,
    fontSize,
    block = true,
    kids = false,
}: {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "ghost";
    /** Trilha Infantil: verde com texto índigo (primário) ou card do kit (secundário). */
    kids?: boolean;
    icon?: IconName;
    loading?: boolean;
    disabled?: boolean;
    /** Trilha Idoso: 56px. */
    minHeight?: number;
    /** Trilha Idoso: rótulo de 18px+. */
    fontSize?: number;
    block?: boolean;
}) {
    const { colors, kids: palette } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const off = disabled || loading;
    const fg = kids
        ? variant === "primary"
            ? palette.indigo
            : palette.ink
        : variant === "primary"
          ? colors.onHero
          : variant === "ghost"
            ? colors.brandInk
            : colors.ink;

    return (
        <Pressable
            onPress={onPress}
            disabled={off}
            accessibilityRole="button"
            accessibilityLabel={title}
            aria-disabled={off}
            aria-busy={loading}
            style={({ pressed }) => [
                styles.btn,
                { minHeight: minHeight ?? (variant === "ghost" ? 48 : 52) },
                block && variant !== "ghost" && styles.btnBlock,
                variant === "primary" && { backgroundColor: kids ? palette.green : pressed ? colors.heroEnd : colors.brandDeep },
                variant === "secondary" && {
                    backgroundColor: kids ? palette.card : colors.surfaceRaised,
                    borderColor: pressed ? colors.lineStrong : colors.line,
                },
                variant === "ghost" && { paddingHorizontal: 8 },
                off && !loading && { backgroundColor: colors.line, borderColor: "transparent" },
            ]}
        >
            {loading ? (
                <ActivityIndicator color={fg} />
            ) : (
                <>
                    {icon ? (
                        <MaterialIcons name={icon} size={18} color={disabled ? colors.inkMuted : fg} />
                    ) : null}
                    <Text
                        style={[
                            styles.btnText,
                            { color: disabled ? colors.inkMuted : fg },
                            fontSize ? { fontSize, lineHeight: Math.round(fontSize * 1.33) } : null,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
}

/* ------------------------------------------------------------------ */
/* Estrutura de tela: AppBar, NavDrawer, HeroHeader, Sheet             */
/* ------------------------------------------------------------------ */

/** Selo de estado com ponto (cp-badge). */
export function Badge({ tone = "neutral", children }: { tone?: "info" | "success" | "warning" | "danger" | "neutral"; children: ReactNode }) {
    const { colors } = useTheme();
    const map = {
        info: [colors.brandSoft, colors.brandInk],
        success: [colors.successSoft, colors.success],
        warning: [colors.warningSoft, colors.warning],
        danger: [colors.dangerSoft, colors.danger],
        neutral: [colors.surface, colors.ink],
    }[tone];

    return (
        <View
            style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: radii.pill,
                backgroundColor: map[0],
            }}
        >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: map[1] }} />
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, color: map[1] }}>{children}</Text>
        </View>
    );
}

export const APPBAR_HEIGHT = 64;
export const ADMINBAR_HEIGHT = 28;

/** Faixa fina "Modo administrador" sob a AppBar (px-adminbar). */
export function AdminBar() {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.adminbar} accessibilityRole="summary">
            <MaterialIcons name="shield" size={14} color={colors.brandInk} />
            <Text style={styles.adminbarText}>Modo administrador</Text>
        </View>
    );
}

function SmallIconButton({
    icon,
    label,
    tone,
    onPress,
    expanded,
}: {
    icon: IconName;
    label: string;
    tone: "flat" | "soft";
    onPress?: () => void;
    expanded?: boolean;
}) {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            aria-expanded={expanded}
            // Alvo de 48px; o círculo visível continua com os 36px do protótipo.
            style={({ pressed }) => [styles.ibHit, pressed && { opacity: 0.7 }]}
        >
            <View style={[styles.ibSm, tone === "soft" && { backgroundColor: colors.brandSoft }]}>
                <MaterialIcons name={icon} size={18} color={colors.brandInk} />
            </View>
        </Pressable>
    );
}

/** Barra branca de 64px com logo e botão de menu (cp-appbar). */
export function AppBar({
    onBack,
    onMenu,
    menuOpen = false,
}: {
    onBack?: () => void;
    onMenu?: () => void;
    menuOpen?: boolean;
}) {
    const { colors, mode } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.appbar}>
            {onBack ? <SmallIconButton icon="arrow-back" label="Voltar" tone="flat" onPress={onBack} /> : null}
            <View style={styles.appbarLogo}>
                <Image
                    source={require("../assets/ECOA.png")}
                    // O logotipo é escuro: no tema escuro vira um traço claro (legível sobre a barra).
                    style={[styles.logoImg, mode === "dark" && { tintColor: colors.ink }]}
                    resizeMode="contain"
                    accessibilityLabel="Ecoa"
                />
            </View>
            {onMenu ? (
                <SmallIconButton
                    icon={menuOpen ? "close" : "menu"}
                    label={menuOpen ? "Fechar menu" : "Abrir menu"}
                    tone="soft"
                    onPress={onMenu}
                    expanded={menuOpen}
                />
            ) : null}
        </View>
    );
}

export type NavDrawerItem = {
    id: string;
    label: string;
    icon: IconName;
    separated?: boolean;
    onPress: () => void;
};

/**
 * Painel marinho que cai da AppBar, com véu escuro por trás (cp-scrim +
 * cp-drawer). Posicionado em relação ao wrapper de 64px da AppBar.
 */
export function NavDrawer({
    items,
    activeId,
    onClose,
}: {
    items: NavDrawerItem[];
    activeId?: string;
    onClose: () => void;
}) {
    const { colors, shadow, gradients } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <>
            <Pressable
                onPress={onClose}
                accessibilityLabel="Fechar menu"
                style={[styles.scrim, { height: Dimensions.get("window").height }]}
            />
            <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.drawer, shadow.hero]}
                accessibilityLabel="Menu"
            >
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        onPress={item.onPress}
                        accessibilityRole="button"
                        aria-selected={item.id === activeId}
                        style={({ pressed }) => [
                            styles.drawerItem,
                            item.separated && styles.drawerSep,
                            (item.id === activeId || pressed) && { backgroundColor: "rgba(255,255,255,0.12)" },
                        ]}
                    >
                        <MaterialIcons
                            name={item.icon}
                            size={20}
                            color={item.separated ? colors.onHeroMuted : colors.onHero}
                        />
                        <Text
                            style={[
                                styles.drawerText,
                                { color: item.separated ? colors.onHeroMuted : colors.onHero },
                            ]}
                        >
                            {item.label}
                        </Text>
                    </Pressable>
                ))}
            </LinearGradient>
        </>
    );
}

/** Cabeçalho marinho de página (cp-hhead, sem barra): cantos retos, a Sheet sobe por cima. */
export function HeroHeader({
    eyebrow,
    title,
    subtitle,
}: {
    eyebrow?: string;
    title: string[];
    subtitle?: string;
}) {
    const { colors, gradients } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hhead}
        >
            {eyebrow ? <Text style={styles.hheadEyebrow}>{eyebrow}</Text> : null}
            <View style={eyebrow ? { marginTop: -8 } : undefined}>
                <Text style={styles.hheadTitle} accessibilityRole="header">
                    {title[0]}
                </Text>
                {title.slice(1).map((line) => (
                    <Text key={line} style={[styles.hheadTitle, { color: colors.onHeroMuted }]}>
                        {line}
                    </Text>
                ))}
            </View>
            {subtitle ? <Text style={styles.hheadSub}>{subtitle}</Text> : null}
        </LinearGradient>
    );
}

/** Folha clara que sobe 24px sobre o HeroHeader, com os cards dentro (cp-sheet). */
export function Sheet({ children }: { children: ReactNode }) {
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.sheet}>
            <Columns>{children}</Columns>
        </View>
    );
}

/** Achata fragmentos, para cada card virar um item da grade. */
function flatten(children: ReactNode): ReactNode[] {
    return Children.toArray(children).flatMap((child) =>
        isValidElement(child) && child.type === Fragment ? flatten((child.props as { children?: ReactNode }).children) : [child]
    );
}

/** Lista em uma coluna (celular, tablet em pé) ou em duas (tela larga: tablet na horizontal, monitor). */
export function Columns({ children }: { children: ReactNode }) {
    const { wide } = useLayout();
    const items = flatten(children).filter((child) => child !== null && child !== false);

    if (!wide) return <View style={{ gap: 16 }}>{items}</View>;

    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
            {items.map((child, index) => (
                <View key={index} style={{ width: "48.8%" }}>
                    {child}
                </View>
            ))}
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* AuthLayout: logo em círculo, título, formulário sobre as ondas      */
/* ------------------------------------------------------------------ */

function AuthWaves({ compact }: { compact: boolean }) {
    const { colors } = useTheme();
    // Elipses do protótipo (.cp-auth-wave-1/2) em coordenadas relativas ao contêiner.
    const w1 = compact ? { cy: 120, ry: 26 } : { cy: 112, ry: 26 };
    const w2 = compact ? { cy: 117, ry: 23 } : { cy: 107, ry: 23 };

    return (
        <Svg
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFill}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            pointerEvents="none"
        >
            <Defs>
                <SvgGradient id="wave1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={colors.brandDeep} />
                    <Stop offset="0.45" stopColor={colors.brandDeep} />
                    <Stop offset="1" stopColor={colors.heroEnd} />
                </SvgGradient>
                <SvgGradient id="wave2" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={colors.heroEnd} />
                    <Stop offset="1" stopColor={colors.tonalStart} />
                </SvgGradient>
            </Defs>
            <Ellipse cx={50} cy={w1.cy} rx={85} ry={w1.ry} fill="url(#wave1)" />
            <Ellipse cx={97.5} cy={w2.cy} rx={62.5} ry={w2.ry} fill="url(#wave2)" opacity={0.55} />
        </Svg>
    );
}

export function AuthLayout({
    title,
    subtitle,
    compact = false,
    footer,
    children,
}: {
    title: string;
    subtitle?: string;
    compact?: boolean;
    footer?: ReactNode;
    children: ReactNode;
}) {
    const { shadow } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const logo = compact ? 80 : 112;

    return (
        <View style={styles.auth}>
            <AuthWaves compact={compact} />
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.authScroll,
                    compact ? { paddingTop: 24, paddingBottom: 72 } : { paddingTop: 32, paddingBottom: 180 },
                ]}
            >
                <View style={styles.authInner}>
                    <View
                        style={[
                            styles.authLogo,
                            { width: logo, height: logo, marginBottom: compact ? 4 : 12 },
                            shadow.float,
                        ]}
                    >
                        <Image
                            source={require("../assets/icon.png")}
                            style={{ width: logo - 16, height: logo - 16, borderRadius: radii.pill }}
                            accessibilityLabel="Ecoa"
                        />
                    </View>
                    <Text
                        style={[styles.authTitle, compact && { fontSize: 22, lineHeight: 28 }]}
                        accessibilityRole="header"
                    >
                        {title}
                    </Text>
                    {subtitle ? <Text style={styles.authSub}>{subtitle}</Text> : null}
                    <View style={styles.authForm}>{children}</View>
                    {footer ? <View style={styles.authFoot}>{footer}</View> : null}
                </View>
            </ScrollView>
        </View>
    );
}

/** Link de texto (cp-link): 14px 600 brandInk. */
export function TextLink({ title, onPress }: { title: string; onPress: () => void }) {
    const styles = useThemedStyles(makeStyles);
    return (
        <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={styles.link}>
            <Text style={styles.linkText}>{title}</Text>
        </Pressable>
    );
}

/* ------------------------------------------------------------------ */
/* Calibração: CameraFrame (carregando) e CountdownRing                */
/* ------------------------------------------------------------------ */

function Spinner() {
    const styles = useThemedStyles(makeStyles);
    const spin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [spin]);

    return (
        <Animated.View
            style={[
                styles.spin,
                { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] },
            ]}
        />
    );
}

/**
 * Estado "carregando" do CameraFrame (cp-cam-loading): fundo marinho, anel
 * girando e mensagem, sobre a caixa da câmera enquanto ela inicializa.
 */
export function CameraLoading({
    message = "Preparando a câmera…",
    kids = false,
    style,
}: {
    message?: string;
    kids?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const styles = useThemedStyles(makeStyles);
    const { kids: palette } = useTheme();
    return (
        <View
            style={[styles.camLoading, kids && { backgroundColor: palette.hero }, style]}
            accessibilityRole="progressbar"
            accessibilityLabel={message}
        >
            <Spinner />
            <Text style={[styles.camMsg, kids && { fontFamily: kidsFonts.bold }]}>{message}</Text>
        </View>
    );
}

/** Anel da contagem (cp-count): esvazia conforme os segundos passam. */
export function CountdownRing({
    value,
    total,
    label,
    kids = false,
    large = false,
    size = 120,
}: {
    /** Segundos restantes (contínuo, para o anel esvaziar suave). */
    value: number;
    total: number;
    label?: string;
    kids?: boolean;
    large?: boolean;
    size?: number;
}) {
    const { colors, kids: palette } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const sw = 8;
    const rad = (size - sw) / 2;
    const c = 2 * Math.PI * rad;
    const v = Math.max(0, Math.min(total, value));
    const shown = Math.ceil(v);

    return (
        <View style={styles.count}>
            <View
                style={{ width: size, height: size }}
                accessibilityRole="timer"
                accessibilityLabel={`${shown} segundos`}
            >
                <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={rad}
                        fill="none"
                        strokeWidth={sw}
                        stroke={kids ? palette.track : colors.brandSoft}
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={rad}
                        fill="none"
                        strokeWidth={sw}
                        strokeLinecap="round"
                        stroke={kids ? kidsColors.green : colors.brandDeep}
                        strokeDasharray={c}
                        strokeDashoffset={c * (1 - v / total)}
                    />
                </Svg>
                <View style={styles.countNumBox}>
                    <Text
                        style={[
                            styles.countNum,
                            large && { fontSize: 36 },
                            kids && { fontFamily: kidsFonts.display, color: palette.title },
                        ]}
                    >
                        {shown}s
                    </Text>
                </View>
            </View>
            {label ? (
                <Text
                    style={[
                        styles.countLabel,
                        large && { fontSize: 17 },
                        kids && { color: palette.inkMuted, fontFamily: kidsFonts.body },
                    ]}
                >
                    {label}
                </Text>
            ) : null}
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* OptionGroup (cp-opts): radio cards                                  */
/* ------------------------------------------------------------------ */

export type Option<T extends string | number> = {
    value: T;
    title: string;
    description?: string;
    icon: IconName;
};

export function OptionGroup<T extends string | number>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
}) {
    const { colors, shadow, gradients } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={styles.opts}>
            <Text style={styles.optsTitle} accessibilityRole="header">
                {label}
            </Text>
            <View style={styles.optsList} accessibilityRole="radiogroup" accessibilityLabel={label}>
                {options.map((o) => {
                    const on = o.value === value;

                    return (
                        <Pressable
                            key={o.value}
                            onPress={() => onChange(o.value)}
                            accessibilityRole="radio"
                            aria-checked={on}
                            accessibilityLabel={o.description ? `${o.title}. ${o.description}` : o.title}
                            style={[styles.opt, on ? styles.optOn : shadow.card]}
                        >
                            {on ? (
                                <LinearGradient
                                    colors={gradients.hero}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.optIcon}
                                >
                                    <MaterialIcons name={o.icon} size={22} color={colors.onHero} />
                                </LinearGradient>
                            ) : (
                                <View style={[styles.optIcon, { backgroundColor: colors.surface }]}>
                                    <MaterialIcons name={o.icon} size={22} color={colors.ink} />
                                </View>
                            )}
                            <View style={styles.optText}>
                                <Text style={styles.optTitle}>{o.title}</Text>
                                {o.description ? <Text style={styles.optSub}>{o.description}</Text> : null}
                            </View>
                            <MaterialIcons
                                name="check-circle"
                                size={22}
                                color={colors.brand}
                                style={{ opacity: on ? 1 : 0 }}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const makeStyles = ({ colors, shadow, gradients }: Theme) => StyleSheet.create({
    btn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 24,
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    btnBlock: { alignSelf: "stretch" },
    btnText: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20 },

    ibHit: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
    ibSm: {
        width: 36,
        height: 36,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    appbar: {
        height: APPBAR_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.surfaceRaised,
        zIndex: 4,
        ...shadow.card,
    },
    adminbar: {
        height: ADMINBAR_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: colors.brandSoft,
    },
    adminbarText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.brandInk },
    appbarLogo: { flex: 1, flexDirection: "row", alignItems: "center" },
    logoImg: { width: 84, height: 28 },
    scrim: {
        position: "absolute",
        left: 0,
        right: 0,
        top: APPBAR_HEIGHT,
        zIndex: 2,
        backgroundColor: "rgba(6,27,56,0.45)",
    },
    drawer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: APPBAR_HEIGHT,
        zIndex: 3,
        paddingTop: 12,
        paddingHorizontal: 12,
        paddingBottom: 16,
        gap: 2,
        borderBottomLeftRadius: radii.xl,
        borderBottomRightRadius: radii.xl,
    },
    drawerItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 52,
        paddingHorizontal: 16,
        borderRadius: radii.md,
    },
    drawerSep: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.14)",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    drawerText: { fontFamily: fonts.bodySemiBold, fontSize: 15 },

    hhead: {
        paddingTop: 24,
        paddingHorizontal: 16,
        paddingBottom: 56,
        gap: 16,
    },
    hheadEyebrow: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 1.44,
        color: colors.onHeroMuted,
    },
    hheadTitle: {
        fontFamily: fonts.medium,
        fontSize: 26,
        lineHeight: 32,
        letterSpacing: -0.26,
        color: colors.onHero,
    },
    hheadSub: {
        marginTop: -8,
        fontFamily: fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: colors.onHeroMuted,
    },
    sheet: {
        marginTop: -24,
        padding: 16,
        gap: 16,
        backgroundColor: colors.surface,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
    },

    auth: { flex: 1, backgroundColor: colors.surface, overflow: "hidden" },
    authScroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 },
    authInner: { gap: 12 },
    authLogo: {
        alignSelf: "center",
        borderRadius: radii.pill,
        backgroundColor: colors.surfaceRaised,
        alignItems: "center",
        justifyContent: "center",
    },
    authTitle: {
        fontFamily: fonts.displaySemiBold,
        fontSize: 24,
        lineHeight: 30,
        letterSpacing: -0.24,
        color: colors.ink,
        textAlign: "center",
    },
    authSub: {
        marginTop: -4,
        marginBottom: 8,
        fontFamily: fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: colors.inkMuted,
        textAlign: "center",
    },
    authForm: { gap: 12 },
    authFoot: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },
    link: { minHeight: 24, justifyContent: "center" },
    linkText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.brandInk },

    spin: {
        width: 32,
        height: 32,
        borderRadius: radii.pill,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.25)",
        borderTopColor: colors.onHero,
    },
    camLoading: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 16,
        backgroundColor: colors.brandDeep,
    },
    camMsg: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.onHero, textAlign: "center" },

    count: { alignItems: "center", gap: 8 },
    countNumBox: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
    countNum: { fontFamily: fonts.displaySemiBold, fontSize: 30, letterSpacing: -0.6, color: colors.ink },
    countLabel: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.inkMuted },

    opts: { gap: 12 },
    optsTitle: { fontFamily: fonts.displaySemiBold, fontSize: 17, lineHeight: 22, color: colors.ink },
    optsList: { gap: 8 },
    opt: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: "transparent",
        borderRadius: radii.md,
        backgroundColor: colors.surfaceRaised,
    },
    optOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
    optIcon: {
        width: 44,
        height: 44,
        borderRadius: radii.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    optText: { flex: 1, gap: 2 },
    optTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, color: colors.ink },
    optSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkMuted },

    intro: { alignItems: "center", gap: 8, paddingTop: 8, paddingHorizontal: 8 },
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
    arrowSoft: {
        width: 36,
        height: 36,
        borderRadius: radii.pill,
        backgroundColor: colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
    },
    soonDot: { width: 6, height: 6, borderRadius: radii.pill, backgroundColor: colors.ink },
    soon: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: radii.pill,
        backgroundColor: colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    soonText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, color: colors.ink },
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
