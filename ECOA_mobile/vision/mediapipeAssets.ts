import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

const MEDIAPIPE_DIR = `${FileSystem.documentDirectory}mediapipe/`;
const WASM_DIR = `${MEDIAPIPE_DIR}wasm/`;

type AssetCopySpec = {
    module: number;
    destination: string;
};

function getCopySpecs(): AssetCopySpec[] {
    return [
        { module: require("../assets/mediapipe/index.html"), destination: `${MEDIAPIPE_DIR}index.html` },
        { module: require("../assets/mediapipe/vision_bundle.wasmjs"), destination: `${MEDIAPIPE_DIR}vision_bundle.js` },
        { module: require("../assets/mediapipe/wasm/vision_wasm_internal.wasmjs"), destination: `${WASM_DIR}vision_wasm_internal.js` },
        { module: require("../assets/mediapipe/wasm/vision_wasm_internal.wasm"), destination: `${WASM_DIR}vision_wasm_internal.wasm` },
        { module: require("../assets/mediapipe/face_landmarker.task"), destination: `${MEDIAPIPE_DIR}face_landmarker.task` },
    ];
}

let preparedHtmlUri: Promise<string> | null = null;

/**
 * Copia o runtime do MediaPipe (bundlado como asset, sem CDN) para um diretório
 * gravável do app, com os nomes de arquivo originais — exigido porque o loader
 * do MediaPipe busca "vision_wasm_internal.js/.wasm" por nome fixo. Idempotente:
 * em chamadas seguintes, assets já copiados não são copiados de novo.
 */
export function getMediaPipeHtmlUri(): Promise<string> {
    if (!preparedHtmlUri) {
        preparedHtmlUri = prepareAssets();
    }

    return preparedHtmlUri;
}

async function prepareAssets(): Promise<string> {
    await FileSystem.makeDirectoryAsync(WASM_DIR, { intermediates: true }).catch(() => {});

    for (const spec of getCopySpecs()) {
        const asset = Asset.fromModule(spec.module);
        await asset.downloadAsync();

        if (!asset.localUri) {
            throw new Error(`Falha ao preparar asset do MediaPipe: ${spec.destination}`);
        }

        const info = await FileSystem.getInfoAsync(spec.destination);

        if (!info.exists) {
            await FileSystem.copyAsync({ from: asset.localUri, to: spec.destination });
        }
    }

    return `${MEDIAPIPE_DIR}index.html`;
}
