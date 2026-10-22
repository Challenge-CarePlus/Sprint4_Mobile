/** Limites do vídeo de demonstração (SPEC v3): iguais aos do servidor, para avisar antes de enviar. */
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;
export const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];

export type VideoCandidate = {
    size: number;
    mime: string;
    /** Em segundos, quando o aparelho/navegador informa. */
    durationSeconds?: number | null;
};

function megabytes(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(1).replace(".", ",");
}

/** Mensagem amigável se o vídeo não pode ser usado; `null` se está dentro dos limites. */
export function validateVideo(video: VideoCandidate): string | null {
    if (!ALLOWED_VIDEO_MIMES.includes(video.mime.toLowerCase())) {
        return "Formato de vídeo não aceito. Use MP4, WebM ou MOV (QuickTime).";
    }

    if (video.size > MAX_VIDEO_BYTES) {
        return `O vídeo tem ${megabytes(video.size)} MB e o limite é 30 MB. Grave um trecho mais curto ou comprima o vídeo.`;
    }

    if (video.size <= 0) {
        return "Não foi possível ler esse vídeo. Escolha outro arquivo.";
    }

    if (video.durationSeconds != null && video.durationSeconds > MAX_VIDEO_SECONDS) {
        return `O vídeo tem ${Math.round(video.durationSeconds)} s e o limite é 60 s. Grave um trecho mais curto.`;
    }

    return null;
}

/** Tipo declarado pelo aparelho às vezes vem vazio (galeria): deduz pela extensão. */
export function guessVideoMime(fileName: string | undefined | null, declared?: string | null): string {
    if (declared) return declared;
    const ext = (fileName ?? "").toLowerCase().split(".").pop();
    if (ext === "mp4" || ext === "m4v") return "video/mp4";
    if (ext === "webm") return "video/webm";
    if (ext === "mov") return "video/quicktime";
    return "";
}
