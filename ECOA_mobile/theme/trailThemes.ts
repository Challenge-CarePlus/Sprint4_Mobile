import { AgeGroup } from "../data/types";
import { colors, fonts, gradients, kidsColors, kidsFonts } from "./tokens";

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

const core: TrailTheme = {
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

export const TRAIL_THEMES: Record<AgeGroup, TrailTheme> = {
    adults: core,
    // Idosos: núcleo, sem tom "muted" (alto contraste); o resto da
    // acessibilidade (fonte 18px+, alvos 56px) vem de ageGroupThemes.
    elderly: { ...core, textMuted: colors.ink },
    children: {
        background: kidsColors.bg,
        text: kidsColors.ink,
        textMuted: kidsColors.inkMuted,
        title: kidsColors.indigo,
        titleFont: kidsFonts.display,
        titleSize: 30,
        chipBackground: kidsColors.indigo,
        chipText: colors.white,
        card: colors.white,
        cardText: kidsColors.ink,
        ctaGradient: gradients.kidsPrimary,
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
        onHero: colors.white,
    },
};

export function getTrailTheme(ageGroup: AgeGroup): TrailTheme {
    return TRAIL_THEMES[ageGroup];
}
