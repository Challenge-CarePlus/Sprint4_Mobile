import { Dimensions } from "react-native";

/**
 * Em monitores e notebooks o app é desenhado como num tablet: uma coluna
 * centralizada com esta largura máxima (o fundo da janela fica em volta).
 * Celulares e tablets menores ocupam a largura toda.
 */
export const MAX_APP_WIDTH = 768;

/** Largura realmente disponível para o conteúdo do app na janela atual. */
export function getAppWidth(): number {
    return Math.min(Dimensions.get("window").width, MAX_APP_WIDTH);
}
