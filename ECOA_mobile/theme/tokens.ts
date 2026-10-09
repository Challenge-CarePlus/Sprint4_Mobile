export const colors = {
    primary900: "#1E3E6D",
    primary700: "#284A7D",
    primary500: "#3C64AA",
    primary100: "#EAF2FF",

    secondary500: "#E0704F",
    secondary700: "#B84A2E",

    neutral900: "#1F2933",
    neutral500: "#6E7681",
    neutral300: "#8B8B8B",
    neutral200: "#E5E7EB",
    neutral100: "#F3F4F6",

    background: "#FFFFFF",
    white: "#FFFFFF",
    text: "#1F2933",
    textMuted: "#6E7681",
    textDecorative: "#8B8B8B",

    success: "#2E7D32",
    warning: "#F9A825",
    warningText: "#1F2933",
    attention: "#B84F00",
    error: "#C62828",
} as const;

export const fonts = {
    display: "Righteous_400Regular",
} as const;

export const typography = {
    title: { fontFamily: fonts.display, fontSize: 32 },
    titleSmall: { fontFamily: fonts.display, fontSize: 24 },
    cardTitle: { fontFamily: fonts.display, fontSize: 19 },
    body: { fontSize: 16, fontWeight: "500" as const },
    bodySmall: { fontSize: 14, fontWeight: "500" as const },
    label: { fontSize: 14, fontWeight: "700" as const },
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
} as const;

export const radii = {
    sm: 5,
    md: 8,
    pill: 999,
} as const;

export const touchTarget = {
    minSize: 44,
} as const;

export const shadow = {
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 5,
    },
} as const;
