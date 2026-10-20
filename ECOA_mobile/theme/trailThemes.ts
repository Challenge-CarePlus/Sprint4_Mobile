import { AgeGroup } from "../data/types";

/**
 * Identidade visual de cada trilha, tirada da sub-marca "Projeto Ecoa" do
 * design system Care Plus (tokens `ecoa-*`, `kids-*`, `idoso-*`). O DS avisa
 * que essas cores foram extraídas de um JPEG pequeno — trocar pelos valores
 * exatos quando houver o arquivo de design.
 *
 * As telas do Ecoa são sempre claras (não seguem o tema escuro do app). O
 * restante do app (login, Home, menu) continua no núcleo Care Plus de
 * `tokens.ts`; só as telas do fluxo de exercício, que sabem a trilha, usam
 * este tema.
 */
export type TrailTheme = {
    background: string;
    /** Texto corrido sobre `background`. */
    text: string;
    textMuted: string;
    /** Título da tela, em Barlow Condensed caixa-alta. */
    title: string;
    /** Fundo e texto dos chips (progresso, repetições). */
    chipBackground: string;
    chipText: string;
    /** Cards e caixas de instrução; sempre com `cardText` por cima. */
    card: string;
    cardText: string;
    /** Botão primário: preenchimento sólido (o DS não usa gradiente em botão). */
    cta: string;
    onCta: string;
    /** Número das instruções, ícones de destaque. */
    accent: string;
    onAccent: string;
    /** Contorno da câmera aguardando / segurando o movimento. */
    ringIdle: string;
    ringHolding: string;
    /** Hero do resumo do ciclo. */
    hero: string;
    onHero: string;
};

export const TRAIL_THEMES: Record<AgeGroup, TrailTheme> = {
    adults: {
        background: "#E3F5F3", // ecoa-mist
        text: "#0E3B4F", // ecoa-ink
        textMuted: "#4A6572", // ecoa-ink-muted
        title: "#0E3B4F",
        chipBackground: "#074A67", // ecoa-navy
        chipText: "#FFFFFF",
        card: "#FFFFFF", // ecoa-paper
        cardText: "#0E3B4F",
        cta: "#098273", // ecoa-teal-strong (texto branco)
        onCta: "#FFFFFF",
        accent: "#098273",
        onAccent: "#FFFFFF",
        ringIdle: "#074A67",
        ringHolding: "#098273",
        hero: "#074A67",
        onHero: "#FFFFFF",
    },
    children: {
        background: "#0D7ABE", // kids-blue
        text: "#FFFFFF",
        textMuted: "#FFFFFF",
        title: "#FFD52E", // kids-yellow
        chipBackground: "#0A3F7A", // kids-deep
        chipText: "#FFFFFF",
        card: "#FFFFFF",
        cardText: "#0E3B4F",
        cta: "#FFD52E",
        onCta: "#0A3F7A", // kids-deep sobre kids-yellow
        accent: "#DB350D", // ecoa-red (texto branco)
        onAccent: "#FFFFFF",
        ringIdle: "#FFFFFF",
        ringHolding: "#FFD52E",
        hero: "#0A3F7A",
        onHero: "#FFFFFF",
    },
    elderly: {
        background: "#FBF3E1", // idoso-cream
        text: "#183C3C", // idoso-ink
        textMuted: "#183C3C", // alto contraste: sem tom mais claro para idosos
        title: "#183C3C",
        chipBackground: "#13565C", // idoso-teal
        chipText: "#FFFFFF",
        card: "#FFFFFF",
        cardText: "#183C3C",
        cta: "#C2463A", // idoso-coral (texto branco)
        onCta: "#FFFFFF",
        accent: "#A84E17", // idoso-rust
        onAccent: "#FFFFFF",
        ringIdle: "#13565C",
        ringHolding: "#A84E17",
        hero: "#13565C",
        onHero: "#FFFFFF",
    },
};

export function getTrailTheme(ageGroup: AgeGroup): TrailTheme {
    return TRAIL_THEMES[ageGroup];
}

/** Barlow Condensed 800 em caixa-alta: título, tile, pílula e botão do Ecoa. */
export const trailFont = "BarlowCondensed_800ExtraBold";
