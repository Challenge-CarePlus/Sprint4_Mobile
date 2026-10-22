import fs from "fs/promises";
import path from "path";
import { uploadsDir } from "./config/paths";
import { listTrainings } from "./db/trainingStore";
import { CustomExercise, Training } from "./models/training";
import { VIDEO_URL } from "./validation/training";

/** Único formato de nome de arquivo que o upload gera (e que /media e a limpeza aceitam). */
export const MEDIA_FILE = /^[a-f0-9]{32}\.(mp4|webm|mov)$/;

/** Uploads sem treino por mais que isso são apagados pela limpeza. */
export const STALE_UPLOAD_MS = 24 * 60 * 60 * 1000;
const SWEEP_EVERY_MS = 6 * 60 * 60 * 1000;

/** Nome do arquivo de uma URL /media/<arquivo>; null se a URL não é de um vídeo nosso. */
export function videoFileFromUrl(url: string): string | null {
    return VIDEO_URL.test(url) ? url.slice("/media/".length) : null;
}

/** Os vídeos citados pelos exercícios existem em UPLOADS_DIR? (o disco do Render free é efêmero) */
export async function allVideosExist(exercises: CustomExercise[]): Promise<boolean> {
    for (const exercise of exercises) {
        if (!exercise.video) continue;
        const file = videoFileFromUrl(exercise.video.url);
        if (!file) return false;
        try {
            await fs.access(path.join(path.resolve(uploadsDir()), file));
        } catch {
            return false;
        }
    }
    return true;
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

/**
 * Apaga uploads que nenhum treino referencia e que têm mais de 24 h. O admin sobe o vídeo
 * ANTES de salvar o treino, então um upload recente sem treino é normal (formulário aberto);
 * um antigo é lixo (formulário abandonado, treino excluído por fora). Só mexe em arquivos
 * com o nome gerado pelo upload — qualquer outra coisa na pasta é ignorada.
 */
export async function removeStaleUploads(now = Date.now()): Promise<number> {
    const dir = path.resolve(uploadsDir());

    let names: string[];
    try {
        names = await fs.readdir(dir);
    } catch (error: any) {
        if (error?.code === "ENOENT") return 0; // ainda não houve upload
        throw error;
    }

    const used = new Set((await listTrainings()).flatMap(videoUrlsOf));
    let removed = 0;

    for (const name of names) {
        if (!MEDIA_FILE.test(name) || used.has(`/media/${name}`)) continue;

        const file = path.join(dir, name);
        const { mtimeMs } = await fs.stat(file);
        if (now - mtimeMs <= STALE_UPLOAD_MS) continue;

        await fs.rm(file, { force: true });
        removed++;
    }
    return removed;
}

/** Limpeza na inicialização e a cada 6 h. O timer não segura o processo aberto. */
export function startUploadsCleanup(everyMs = SWEEP_EVERY_MS): NodeJS.Timeout {
    const sweep = () =>
        removeStaleUploads().catch((error) =>
            console.error("limpeza de uploads:", (error as Error).message)
        );

    void sweep();
    return setInterval(sweep, everyMs).unref();
}
