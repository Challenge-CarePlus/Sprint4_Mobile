import { Dimensions } from "react-native";

import { appWidthFor } from "../theme/layout";

/**
 * Câmera dimensionada pela proporção real da webcam, não a tela inteira.
 * `ratio` é a fração da altura da janela pedida pra câmera; min/max evitam
 * que fique grande demais num monitor ou pequena demais num celular baixo.
 * `contentPadding` é o total de padding horizontal do container (os dois
 * lados somados) que não está disponível pra câmera.
 *
 * `aspect` é a proporção real do stream da webcam (largura/altura), lida do
 * próprio vídeo assim que carrega (`FaceTrackingCamera`'s `onAspectRatioChange`)
 * — sem isso, uma caixa larga de desktop (ex. 1800x450) forçada sobre uma
 * webcam 4:3 sobrava tarja preta nas laterais com `contentFit: "contain"`,
 * ou, em telas estreitas, a câmera podia ficar bem maior que a caixa
 * pretendida porque só a largura era limitada e a altura não acompanhava.
 * Calculando largura E altura juntas a partir da proporção real, a caixa
 * nasce do tamanho certo em qualquer tela — sem precisar de `"cover"`, que
 * cortaria o rosto (o mesmo problema já corrigido antes no vídeo de
 * demonstração).
 */
export function getCameraBoxSize(
    ratio: number,
    min: number,
    max: number,
    aspect: number | null,
    contentPadding: number
): { width: number; height: number } {
    const window = Dimensions.get("window");
    const maxWidth = appWidthFor(window.width) - contentPadding;
    const height = Math.min(max, Math.max(min, window.height * ratio));

    if (!aspect) {
        return { width: maxWidth, height };
    }

    const width = height * aspect;
    if (width <= maxWidth) {
        return { width, height };
    }

    // A altura "ideal" (baseada na janela) faria a caixa ficar mais larga do
    // que a tela permite — encolhe os dois lados juntos pra manter a
    // proporção real da câmera (senão a largura ficaria presa na tela mas a
    // altura não, voltando a sobrar tarja preta, só que em cima/embaixo).
    return { width: maxWidth, height: maxWidth / aspect };
}
