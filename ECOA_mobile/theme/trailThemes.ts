import { AgeGroup } from "../data/types";
import { useTheme } from "./ThemeContext";
import { fonts, kidsColors, kidsFonts, Theme } from "./tokens";

/**
 * Tema das telas do fluxo de exercício, por trilha. Regra do DS (Projeto
 * Ecoa): tudo segue o NÚCLEO do app (marinho, tonal, cards brancos, Plus
 * Jakarta Sans) — Adultos e Idosos —, com a Trilha Idoso só com
 * acessibilidade reforçada (texto 18px+, alvos de 56px, via
 * `ageGroupThemes`). A ÚNICA trilha com cores próprias é a Infantil: kit
 * "Ecoa · Hábitos Sustentáveis" (verde/laranja/amarelo/azul/índigo, Figtree,
 * títulos em frase normal). Texto sobre as cores vivas é sempre índigo,
 * nunca branco.
 */
export type TrailTheme = {
    background: string;
    text: string;
    textMuted: string;
    title: string;
    titleFont: string;
    /** Tamanho base do título da tela (antes do `fontScale` da faixa etária). */
    titleSize: number;
    chipBackground: string;
    chipText: string;
    card: string;
    cardText: string;
    /** Botão primário: gradiente marinho no núcleo, verde→azul no infantil. */
    ctaGradient: readonly [string, string];
    /** Cor única do botão, para ícones e marcadores de progresso. */
    cta: string;
    onCta: string;
    ctaFont: string;
    ctaSize: number;
    accent: string;
    onAccent: string;
    progressTrack: string;
    ringIdle: string;
    ringHolding: string;
    hero: string;
    onHero: string;
};

function coreTheme({ colors, gradients }: Theme): TrailTheme {
    return {
    background: colors.surface,
    text: colors.ink,
    textMuted: colors.inkMuted,
    title: colors.ink,
    titleFont: fonts.display,
    titleSize: 26,
    chipBackground: colors.brandDeep,
    chipText: colors.onHero,
    card: colors.surfaceRaised,
    cardText: colors.ink,
    ctaGradient: gradients.primary,
    cta: colors.brandDeep,
    onCta: colors.onHero,
    ctaFont: fonts.bodySemiBold,
    ctaSize: 16,
    accent: colors.brandDeep,
    onAccent: colors.onHero,
    progressTrack: colors.tonalEnd,
    ringIdle: colors.brandDeep,
    ringHolding: colors.brand,
    hero: colors.brandDeep,
    onHero: colors.onHero,
    };
}

const kidsTheme: TrailTheme = {
    background: kidsColors.bg,
    text: kidsColors.ink,
    textMuted: kidsColors.inkMuted,
    title: kidsColors.indigo,
    titleFont: kidsFonts.display,
    titleSize: 30,
    chipBackground: kidsColors.indigo,
    chipText: "#FFFFFF",
    card: "#FFFFFF",
    cardText: kidsColors.ink,
    ctaGradient: [kidsColors.green, kidsColors.blue],
    cta: kidsColors.green,
    onCta: kidsColors.indigo,
    ctaFont: kidsFonts.display,
    ctaSize: 17,
    accent: kidsColors.green,
    onAccent: kidsColors.indigo,
    progressTrack: kidsColors.track,
    ringIdle: kidsColors.indigo,
    ringHolding: kidsColors.blue,
    hero: kidsColors.indigo,
    onHero: "#FFFFFF",
};

/** Adultos/Idosos seguem o tema (claro/escuro); a Infantil é sempre clara (kit próprio). */
export function getTrailTheme(ageGroup: AgeGroup, theme: Theme): TrailTheme {
    if (ageGroup === "children") return kidsTheme;

    const core = coreTheme(theme);
    // Idosos: núcleo, sem tom "muted" (alto contraste); o resto da acessibilidade
    // (fonte 18px+, alvos 56px) vem de ageGroupThemes.
    return ageGroup === "elderly" ? { ...core, textMuted: theme.colors.ink } : core;
}

export function useTrailTheme(ageGroup: AgeGroup): TrailTheme {
    const theme = useTheme();
    return getTrailTheme(ageGroup, theme);
}
