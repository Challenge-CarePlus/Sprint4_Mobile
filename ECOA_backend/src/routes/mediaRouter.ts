import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import { RequestHandler, Router } from "express";
import multer from "multer";
import { uploadsDir } from "../config/paths";
import { MEDIA_FILE } from "../media";
import { requireRole } from "../middleware/auth";

export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

// Tipo declarado → extensão gravada em disco. A extensão do arquivo do usuário nunca é usada.
const MIME_TO_EXT: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
};
const ALLOWED_EXTENSIONS = ["mp4", "webm", "mov"];
// Segmento intermediário perigoso ("x.php.mp4"): recusado mesmo que o nome em disco seja aleatório.
const DANGEROUS_INNER = /\.(php\d?|phtml|jsp|asp|aspx|cgi|pl|py|rb|sh|bat|cmd|exe|dll|js|mjs|html?|svg|xml)\./i;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_VIDEO_BYTES, files: 1, fields: 5, parts: 6 },
    defParamCharset: "utf8",
});

/** Confere os primeiros bytes: o Content-Type enviado pelo cliente é só uma declaração. */
function matchesContainer(mime: string, head: Buffer): boolean {
    if (mime === "video/webm") {
        return head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    }
    // MP4 / QuickTime: caixa "ftyp" (ou, em .mov antigos, moov/mdat/wide/free) no byte 4.
    return ["ftyp", "moov", "mdat", "wide", "free"].includes(head.subarray(4, 8).toString("latin1"));
}

function displayName(original: string): string {
    // eslint-disable-next-line no-control-regex
    return original.replace(/[\u0000-\u001f\u007f<>]/g, "").slice(-100);
}

export const uploadsRouter = Router();

uploadsRouter.post("/video", ...requireRole("admin"), ((req, res) => {
    upload.single("file")(req, res, async (error: unknown) => {
        const refuse = (status: number, message: string) =>
            res.status(status).json({ success: false, message });

        if (error instanceof multer.MulterError) {
            return error.code === "LIMIT_FILE_SIZE"
                ? refuse(413, "Vídeo maior que 30 MB")
                : refuse(400, "Envie um único arquivo no campo \"file\"");
        }
        if (error) {
            // O que sobra aqui vem do parser multipart (busboy): cabeçalho quebrado, corpo truncado,
            // boundary ausente, NUL no nome... é entrada ruim do cliente, não falha do servidor.
            return refuse(400, "Upload inválido: o envio do arquivo está malformado");
        }

        const file = req.file;
        if (!file) return refuse(400, "Nenhum vídeo enviado (campo \"file\")");

        const original = file.originalname;
        // eslint-disable-next-line no-control-regex
        if (/[\\/\u0000-\u001f\u007f]|\.\./.test(original) || DANGEROUS_INNER.test(original)) {
            return refuse(400, "Nome de arquivo inválido");
        }

        const extension = original.split(".").pop()?.toLowerCase() ?? "";
        const ext = MIME_TO_EXT[file.mimetype];
        if (!ext || !ALLOWED_EXTENSIONS.includes(extension)) {
            return refuse(400, "Tipo de vídeo não permitido (use mp4, webm ou mov)");
        }
        if (!matchesContainer(file.mimetype, file.buffer.subarray(0, 16))) {
            return refuse(400, "O arquivo não é um vídeo válido");
        }

        const stored = `${randomBytes(16).toString("hex")}.${ext}`;
        try {
            const dir = path.resolve(uploadsDir());
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(path.join(dir, stored), file.buffer);
        } catch (writeError) {
            // Falha de disco é do servidor: registra só a mensagem, sem despejar o objeto.
            console.error("upload: falha ao gravar o vídeo:", (writeError as Error).message);
            return refuse(500, "Erro interno");
        }

        res.status(201).json({
            success: true,
            url: `/media/${stored}`,
            name: displayName(original),
            size: file.size,
            mime: file.mimetype,
        });
    });
}) as RequestHandler);

export const mediaRouter = Router();

// sendFile cuida de Range/206, Content-Length e Content-Type (pelo nome em disco).
// O regex fecha path traversal e listagem de diretório: só passa um nome gerado pelo upload.
mediaRouter.get("/:file", (req, res) => {
    const notFound = () => res.status(404).json({ success: false, message: "Vídeo não encontrado" });

    if (!MEDIA_FILE.test(req.params.file)) return notFound();

    res.sendFile(
        req.params.file,
        {
            root: path.resolve(uploadsDir()),
            dotfiles: "deny",
            maxAge: "1h",
            headers: {
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": "inline",
                // O app web (Vercel) está em outra origem e carrega o vídeo num <video>.
                "Cross-Origin-Resource-Policy": "cross-origin",
            },
        },
        (error: any) => {
            if (!error || res.headersSent) return;

            // Repassa o status que o sendFile calculou: 416 (Range fora do arquivo, com o Content-Range
            // que o player precisa pra se recuperar), 412 etc. Só arquivo inexistente é 404.
            const status = error.status >= 400 && error.status < 500 ? error.status : 404;
            if (status === 404) return notFound();

            // O sendFile já gravou headers de vídeo (Content-Type, ETag, Cache-Control...) antes de
            // falhar: sem limpar, o corpo JSON sairia como video/mp4 e um erro poderia ser cacheado.
            for (const header of ["Content-Type", "Content-Length", "ETag", "Last-Modified", "Cache-Control"]) {
                res.removeHeader(header);
            }
            res.status(status).set(error.headers ?? {}).json({
                success: false,
                message: status === 416 ? "Faixa de bytes inválida" : "Requisição inválida",
            });
        }
    );
});
