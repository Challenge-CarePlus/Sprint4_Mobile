import { useWindowDimensions } from "react-native";

/**
 * Em monitores e tablets na horizontal o app é uma coluna centralizada com esta largura máxima (o fundo da
 * janela fica em volta). Abaixo de `WIDE_BREAKPOINT` (celulares, tablet em pé) usa até `MAX_APP_WIDTH`.
 * Galaxy Tab S6 no Chrome: ≈1280×800 na horizontal (coluna larga) e ≈800×1280 em pé (largura toda).
 */
export const MAX_APP_WIDTH = 840;
export const MAX_APP_WIDTH_WIDE = 1040;
/** Janela a partir da qual a coluna larga e as duas colunas entram. */
export const WIDE_BREAKPOINT = 1000;

/** Largura do app para uma janela de `windowWidth` px. */
export function appWidthFor(windowWidth: number): number {
    return Math.min(windowWidth, windowWidth >= WIDE_BREAKPOINT ? MAX_APP_WIDTH_WIDE : MAX_APP_WIDTH);
}

/** Hook: assina mudanças da janela (rotação do tablet) e devolve o layout atual. */
export function useLayout(): { width: number; height: number; appWidth: number; wide: boolean } {
    const { width, height } = useWindowDimensions();
    const appWidth = appWidthFor(width);
    return { width, height, appWidth, wide: appWidth >= 900 };
}
