import fs from "fs/promises";
import path from "path";
import { uploadsDir } from "./config/paths";
import { listTrainings } from "./db/trainingStore";
import { Training } from "./models/training";
import { VIDEO_URL } from "./validation/training";

/** Nome do arquivo de uma URL /media/<arquivo>; null se a URL não é de um vídeo nosso. */
export function videoFileFromUrl(url: string): string | null {
    return VIDEO_URL.test(url) ? url.slice("/media/".length) : null;
}

export function videoUrlsOf(training: Training): string[] {
    return training.exercises.flatMap((e) => (e.video ? [e.video.url] : []));
}

/**
 * Apaga os vídeos que deixaram de ser usados por qualquer treino. Recebe só os
 * candidatos (os do treino editado/excluído) e confere contra todos os treinos
 * atuais, pra não apagar um arquivo que outro treino ainda referencia.
 */
export async function removeOrphanVideos(candidates: string[]) {
    if (candidates.length === 0) return;

    const stillUsed = new Set((await listTrainings()).flatMap(videoUrlsOf));

    for (const url of new Set(candidates)) {
        const file = videoFileFromUrl(url);
        if (!file || stillUsed.has(url)) continue;
        await fs.rm(path.join(path.resolve(uploadsDir()), file), { force: true });
    }
}
