/**
 * Design system oficial Care Plus (v1, artifact fornecido pelo usuário) —
 * substitui a paleta navy+coral criada "no escuro" nas fases anteriores da
 * v2. `brand` (#0079C8) é a cor institucional publicada no site da Care
 * Plus; o restante (marinho, tons de apoio, status) são propostas coerentes
 * com ela, documentadas no próprio design system como "validar com o manual
 * de marca oficial antes de produção".
 *
 * Só o tema claro foi aplicado aqui — o design system também define valores
 * para tema escuro, mas o app ECOA não tem nenhuma infraestrutura de tema
 * ainda (sem contexto de tema, sem `useColorScheme` em uso); decisão
 * combinada com o usuário foi fazer isso como uma etapa separada depois.
 */
export const colors = {
    // Superfícies
    surface: "#F4F8FC",
    surfaceRaised: "#FFFFFF",
    line: "#D7E2EE",
    lineStrong: "#8A9DB3",

    // Texto
    ink: "#0B2340",
    inkMuted: "#4E6279",
    white: "#FFFFFF",

    // Marca
    brand: "#0079C8",
    brandInk: "#005A96",
    brandStrong: "#005A96",
    brandSoft: "#E3F1FB",
    onBrand: "#FFFFFF",
    brandDeep: "#0B2340",
    sky: "#7FC4EE",

    // Status — sempre com texto/ícone, nunca só a cor
    success: "#1D7044",
    successSoft: "#E4F4EA",
    warning: "#8A5300",
    warningSoft: "#FDF1DC",
    danger: "#B3261E",
    dangerSoft: "#FCE6E4",

    focus: "#0079C8",
} as const;

export const fonts = {
    /** Montserrat — títulos. Open Sans — texto corrido (ver `typography`). */
    display: "Montserrat_700Bold",
    displaySemiBold: "Montserrat_600SemiBold",
    body: "OpenSans_400Regular",
    bodySemiBold: "OpenSans_600SemiBold",
} as const;

export const typography = {
    display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
    titleLarge: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
    titleMedium: { fontFamily: fonts.displaySemiBold, fontSize: 18, lineHeight: 24 },
    bodyLarge: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
    bodySmall: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
    label: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 },
    caption: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.02 },
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
} as const;

export const radii = {
    sm: 8,
    md: 16,
    lg: 24,
    /** Além do DS oficial (que para em 24/lg) — cantos bem grandes do hero da Home e do card de resumo de ciclo. */
    xxl: 32,
    pill: 999,
} as const;

export const touchTarget = {
    minSize: 48,
} as const;

/**
 * O design system define só `shadow-card` e `shadow-nav` (ambos mesma cor
 * `ink`, variando só offset/blur). `sm`/`lg` são extrapolações nossas da
 * mesma receita para os outros níveis de elevação que o app já usa
 * (botões, hero) — não vêm do DS, mas seguem a cor e opacidade dele.
 */
export const shadow = {
    sm: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    card: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    md: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
    lg: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    nav: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
} as const;

/**
 * Gradientes — o design system não define a família (os botões do DS são
 * preenchimento sólido em `brand`, não gradiente), mas o app já usa
 * `LinearGradient` em vários componentes (botão, selos, hero). Mantidos
 * como variações tonais dentro do azul único da marca — sem a cor de
 * apoio/coral que a v2 tinha antes, já que o DS oficial não define nenhuma.
 */
export const gradients = {
    hero: [colors.brandDeep, colors.brand] as const,
    primary: [colors.brand, colors.brandStrong] as const,
    accent: [colors.brand, colors.brandStrong] as const,
    calm: [colors.sky, colors.brandDeep] as const,
    success: [colors.success, "#124D30"] as const,
    surface: [colors.white, colors.brandSoft] as const,
} as const;
