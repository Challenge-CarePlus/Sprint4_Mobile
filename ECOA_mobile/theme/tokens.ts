/**
 * Design system oficial Care Plus (v2, artifact do usuário). O núcleo do app é
 * marinho + tonal sobre um cinza-azulado claro, com o Azul Care Plus
 * (#0079C8) como ACENTO — não mais como preenchimento de botão: a ação
 * principal agora é marinho (`brandDeep`). Hierarquia por camadas (fundo,
 * card branco, painel tonal, hero marinho), não por bordas.
 *
 * Só a Trilha Infantil tem cores próprias (kit "Ecoa · Hábitos
 * Sustentáveis": `kidsColors`, Figtree) — ver `trailThemes.ts`.
 *
 * Só o tema claro foi aplicado: o DS define o escuro, mas o app ainda não
 * tem infraestrutura de tema (etapa separada).
 */
export const lightColors = {
    // Superfícies
    surface: "#F3F4F7",
    surfaceRaised: "#FFFFFF",
    line: "#E4E7EE",
    lineStrong: "#8A93A5",

    // Texto
    ink: "#0A1A33",
    inkMuted: "#4F5666",
    white: "#FFFFFF",

    // Marca
    brand: "#0079C8",
    brandInk: "#005A96",
    brandStrong: "#005A96",
    brandSoft: "#DCE7F9",
    onBrand: "#FFFFFF",
    sky: "#7FC4EE",

    // Hero marinho e painéis tonais
    brandDeep: "#061B38",
    heroEnd: "#173A66",
    onHero: "#FFFFFF",
    onHeroMuted: "#A9BFE6",
    tonalStart: "#C6D8F6",
    tonalEnd: "#E6EEFA",
    lineTonal: "#B3C7EC",

    // Status — sempre com texto/ícone, nunca só a cor
    success: "#1D7044",
    successSoft: "#E4F4EA",
    warning: "#8A5300",
    warningSoft: "#FDF1DC",
    danger: "#B3261E",
    dangerSoft: "#FCE6E4",

    focus: "#0079C8",
} as const;

/** Mesmas chaves, valores string (o `as const` acima fixaria os literais claros). */
export type Colors = { [K in keyof typeof lightColors]: string };

/** Tema escuro do DS (tokens.json): elevação por camada, sem sombras. */
export const darkColors: Colors = {
    surface: "#0A1322",
    surfaceRaised: "#131E31",
    line: "#24324A",
    lineStrong: "#6B7890",

    ink: "#EEF2F8",
    inkMuted: "#A3AEC2",
    white: "#FFFFFF",

    brand: "#5AB4F0",
    brandInk: "#8CCBF5",
    brandStrong: "#8CCBF5",
    brandSoft: "#172A47",
    onBrand: "#0A1322",
    sky: "#3A8FCC",

    brandDeep: "#1C3A66",
    heroEnd: "#2A4F85",
    onHero: "#FFFFFF",
    onHeroMuted: "#B8CBEB",
    tonalStart: "#1A2F52",
    tonalEnd: "#142540",
    lineTonal: "#2E4673",

    success: "#6BD196",
    successSoft: "#0F2E1E",
    warning: "#F5C451",
    warningSoft: "#33260A",
    danger: "#FF8A80",
    dangerSoft: "#3A1412",

    focus: "#5AB4F0",
};

/** Kit "Ecoa · Hábitos Sustentáveis" — usado só na Trilha Infantil. */
export const kidsColors = {
    green: "#00CC7A", // Eco Green — principal
    orange: "#FF6F4B", // Active Orange
    yellow: "#FFCB0F", // Solar Yellow
    blue: "#05A9EE", // Impact Blue
    indigo: "#2A2867", // Night Indigo — texto sobre as cores vivas, hero
    bg: "#F6F6EC",
    ink: "#0F3A3C",
    inkMuted: "#4E6668",
    track: "#E6E8DA",
    greenSoft: "#DDF7EA",
    orangeSoft: "#FFE6DE",
    yellowSoft: "#FFF4C7",
    blueSoft: "#DCF2FC",
    /** Superfície dos cards, cor dos títulos e do hero (no escuro mudam; ver `kidsDarkColors`). */
    card: "#FFFFFF",
    title: "#2A2867",
    hero: "#2A2867",
    onHero: "#FFFFFF",
} as const;

export type KidsPalette = { [K in keyof typeof kidsColors]: string };

/**
 * Variante ESCURA do kit infantil (23/10, pedido da usuária; o DS original não tem). Derivada do kit:
 * índigo profundo no fundo, cards e trilhos em índigos mais claros, texto lavanda; as quatro cores vivas
 * ficam iguais e o texto SOBRE elas segue sempre índigo `#2A2867` (indigo não muda). Contraste medido em
 * docs/v3/CONTRASTE-INFANTIL-ESCURO.md.
 */
export const kidsDarkColors: KidsPalette = {
    ...kidsColors,
    bg: "#14123A",
    card: "#1F1D52",
    ink: "#F3F2FF",
    inkMuted: "#B9B7E0",
    track: "#2E2B6B",
    greenSoft: "#2E2B6B",
    orangeSoft: "#2E2B6B",
    yellowSoft: "#2E2B6B",
    blueSoft: "#2E2B6B",
    title: "#F3F2FF",
    hero: "#2E2B6B",
    onHero: "#FFFFFF",
};

export const fonts = {
    /** Plus Jakarta Sans em todo o núcleo (400–600, nunca bold pesado). */
    display: "PlusJakartaSans_600SemiBold",
    displaySemiBold: "PlusJakartaSans_600SemiBold",
    medium: "PlusJakartaSans_500Medium",
    body: "PlusJakartaSans_400Regular",
    bodySemiBold: "PlusJakartaSans_600SemiBold",
} as const;

/** Figtree ("Ecoa Sans" do board, até chegar o arquivo oficial) — Trilha Infantil. */
export const kidsFonts = {
    body: "Figtree_500Medium",
    bold: "Figtree_700Bold",
    display: "Figtree_800ExtraBold",
} as const;

export const typography = {
    display: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32 },
    titleLarge: { fontFamily: fonts.medium, fontSize: 26, lineHeight: 32 },
    titleMedium: { fontFamily: fonts.displaySemiBold, fontSize: 16, lineHeight: 22 },
    metric: { fontFamily: fonts.medium, fontSize: 28, lineHeight: 32 },
    bodyLarge: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
    bodySmall: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
    label: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 },
    caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.02 },
} as const;

/** Grade de 4px do design system. */
export const spacing = {
    space1: 4,
    space2: 8,
    space3: 12,
    space4: 16,
    space6: 24,
    space8: 32,
    space12: 48,
    /** Trilha Idoso: altura mínima de botões e alvos de toque. */
    space14: 56,
} as const;

/** Escada de raios do DS: tiles internos → cards/painéis → hero → sheet → pílula. */
export const radii = {
    sm: 12,
    md: 20,
    lg: 24,
    xl: 32,
    pill: 999,
} as const;

export const touchTarget = {
    minSize: 48,
} as const;

/**
 * Sombras largas e quase invisíveis (DS: shadow-card, shadow-float,
 * shadow-hero). `sm`/`md`/`lg`/`nav` são extrapolações nossas na mesma
 * receita para os níveis que o app já usava. `kids` é a do kit infantil.
 */
const lightShadow = (colors: Colors) => ({
    sm: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    card: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        elevation: 4,
    },
    md: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
    },
    float: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 8,
    },
    lg: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    hero: {
        shadowColor: colors.brandDeep,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
        elevation: 10,
    },
    nav: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    kids: {
        shadowColor: kidsColors.indigo,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
} as const);
type ShadowSet = ReturnType<typeof lightShadow>;
const NO_SHADOW = { shadowOpacity: 0, elevation: 0 } as const;

/** No escuro a elevação vem da camada (surface-raised), não de sombra (DS). */
export type Shadows = { [K in keyof ShadowSet]: object };

export function makeShadow(mode: ThemeMode, colors: Colors): Shadows {
    if (mode === "dark") {
        const none: Record<string, object> = {};
        for (const key of Object.keys(lightShadow(colors))) none[key] = NO_SHADOW;
        return none as Shadows;
    }
    return lightShadow(colors);
}

/**
 * Gradientes: o hero marinho (`brandDeep` → `heroEnd`) é também o do botão
 * primário e do item ativo; o tonal é o dos painéis de dados. `kidsPrimary`
 * (verde-água → azul, como o "E" do logo) é a assinatura do kit infantil: só no botão principal.
 */
export function makeGradients(colors: Colors) {
    return {
        hero: [colors.brandDeep, colors.heroEnd] as const,
        primary: [colors.brandDeep, colors.heroEnd] as const,
        accent: [colors.brandDeep, colors.heroEnd] as const,
        calm: [colors.sky, colors.brandDeep] as const,
        success: [colors.success, "#124D30"] as const,
        surface: [colors.white, colors.brandSoft] as const,
        tonal: [colors.tonalStart, colors.tonalEnd] as const,
        kidsPrimary: [kidsColors.green, kidsColors.blue] as const,
    };
}

export type Gradients = ReturnType<typeof makeGradients>;
export type ThemeMode = "light" | "dark";

/** Tudo que a UI precisa de um tema, já resolvido. */
export type Theme = {
    mode: ThemeMode;
    colors: Colors;
    shadow: Shadows;
    gradients: Gradients;
    /** Kit infantil na variante do modo (claro/escuro). */
    kids: KidsPalette;
};

function buildTheme(mode: ThemeMode): Theme {
    const colors = mode === "dark" ? darkColors : lightColors;
    return { mode, colors, shadow: makeShadow(mode, colors), gradients: makeGradients(colors), kids: mode === "dark" ? kidsDarkColors : kidsColors };
}

export const lightTheme: Theme = buildTheme("light");
export const darkTheme: Theme = buildTheme("dark");
