import { AgeGroup } from "../data/types";

export type AgeGroupPresentation = {
    /** Multiplicador aplicado sobre os tamanhos de fonte base dos tokens. */
    fontScale: number;
    /** Idosos: menos toques por tela, fontes grandes, alto contraste, áudio sempre ativo. */
    highContrast: boolean;
    /** Crianças: estrelas, personagem guia, animações que reagem ao movimento. */
    gamified: boolean;
    /** Adultos: visual limpo, foco em métricas numéricas de desempenho. */
    metricsFocused: boolean;
    minTouchTarget: number;
};

export const AGE_GROUP_PRESENTATIONS: Record<AgeGroup, AgeGroupPresentation> = {
    children: {
        fontScale: 1.1,
        highContrast: false,
        gamified: true,
        metricsFocused: false,
        minTouchTarget: 48,
    },
    adults: {
        fontScale: 1,
        highContrast: false,
        gamified: false,
        metricsFocused: true,
        minTouchTarget: 44,
    },
    elderly: {
        fontScale: 1.3,
        highContrast: true,
        gamified: false,
        metricsFocused: false,
        minTouchTarget: 56,
    },
};

export function getPresentation(ageGroup: AgeGroup): AgeGroupPresentation {
    return AGE_GROUP_PRESENTATIONS[ageGroup];
}
