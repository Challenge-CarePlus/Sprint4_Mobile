import fs from "fs";
import path from "path";
import request from "supertest";
import { bearer, exercise, fakeMp4, login, makeApp, training } from "./helpers";

const ctx = makeApp();
afterAll(ctx.cleanup);

let admin: string;
beforeAll(async () => {
    admin = await login(ctx.app, "ecoafono@email.com");
});

const upload = async () => {
    const res = await request(ctx.app)
        .post("/uploads/video")
        .set(bearer(admin))
        .attach("file", fakeMp4(4096), { filename: "v.mp4", contentType: "video/mp4" });
    expect(res.status).toBe(201);
    return res.body as { url: string; name: string; size: number; mime: string };
};
const post = (body: unknown) => request(ctx.app).post("/trainings").set(bearer(admin)).send(body as object);
const media = () => require("../src/media") as typeof import("../src/media");
const onDisk = (url: string) => path.join(ctx.uploadsDir, url.replace("/media/", ""));

describe("V3-B2: Range inválido em /media → 416 (não 404)", () => {
    let url: string;
    let size: number;
    beforeAll(async () => {
        const v = await upload();
        url = v.url;
        size = v.size;
    });

    it("início depois do fim do arquivo → 416 com Content-Range bytes */tamanho", async () => {
        const res = await request(ctx.app).get(url).set("Range", "bytes=99999-100000");

        expect(res.status).toBe(416);
        expect(res.headers["content-range"]).toBe(`bytes */${size}`);
        expect(res.headers["content-type"]).toMatch(/json/); // não herda o video/mp4 do sendFile
        expect(res.headers["last-modified"]).toBeUndefined(); // o do vídeo não vaza pro erro
        expect(res.headers["cache-control"]).toBeUndefined(); // erro não é cacheável
        expect(res.body).toEqual({ success: false, message: expect.any(String) });
    });

    it("início exatamente no tamanho → 416; último byte → 206", async () => {
        expect((await request(ctx.app).get(url).set("Range", `bytes=${size}-`)).status).toBe(416);
        expect((await request(ctx.app).get(url).set("Range", `bytes=${size - 1}-`)).status).toBe(206);
    });

    it("404 continua sendo só para arquivo inexistente (mesmo com Range)", async () => {
        const missing = "/media/0123456789abcdef0123456789abcdef.mp4";
        expect((await request(ctx.app).get(missing)).status).toBe(404);
        expect((await request(ctx.app).get(missing).set("Range", "bytes=99999-100000")).status).toBe(404);
    });

    it("Range válido segue dando 206", async () => {
        expect((await request(ctx.app).get(url).set("Range", "bytes=0-9")).status).toBe(206);
    });
});

describe("V3-B3: ids de exercício gerados pelo servidor", () => {
    it("ids repetidos enviados pelo cliente viram ids únicos", async () => {
        const res = await post(
            training({
                exercises: [
                    exercise({ id: "ex1", name: "A" }),
                    exercise({ id: "ex1", name: "B" }),
                    exercise({ id: "ex1", name: "C" }),
                ],
            })
        );

        expect(res.status).toBe(201);
        const ids = res.body.training.exercises.map((e: any) => e.id);
        expect(new Set(ids).size).toBe(3);
        expect(ids).not.toContain("ex1");
        expect(ids.every((id: string) => /^[0-9a-f-]{36}$/.test(id))).toBe(true);
    });

    it("id enviado (inclusive de formato esquisito) é ignorado", async () => {
        const res = await post(
            training({
                exercises: [exercise({ id: "e1" }), exercise({ id: "<script>" }), exercise({ id: 123 }), exercise({ id: "../x" })],
            })
        );

        expect(res.status).toBe(201);
        const ids = res.body.training.exercises.map((e: any) => e.id);
        expect(ids).not.toContain("e1");
        expect(new Set(ids).size).toBe(4);
    });

    it("no PUT também: ids únicos e gerados pelo servidor", async () => {
        const created = (await post(training())).body.training;
        const res = await request(ctx.app)
            .put(`/trainings/${created.id}`)
            .set(bearer(admin))
            .send(training({ exercises: [exercise({ id: "dup" }), exercise({ id: "dup" })] }));

        expect(res.status).toBe(200);
        const ids = res.body.training.exercises.map((e: any) => e.id);
        expect(new Set(ids).size).toBe(2);
        expect(ids).not.toContain("dup");
    });
});

describe("V3-B4: video.url precisa existir em UPLOADS_DIR", () => {
    const ghost = { url: "/media/0123456789abcdef0123456789abcdef.mp4", name: "x.mp4", size: 10, mime: "video/mp4" };

    it("POST com url bem formada mas sem arquivo → 400 com mensagem clara", async () => {
        const res = await post(training({ exercises: [exercise({ video: ghost })] }));

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ success: false, message: "Vídeo não encontrado, envie de novo" });
    });

    it("PUT com url sem arquivo → 400 e o treino não muda", async () => {
        const created = (await post(training({ name: "Estável" }))).body.training;
        const res = await request(ctx.app)
            .put(`/trainings/${created.id}`)
            .set(bearer(admin))
            .send(training({ name: "Mudou", exercises: [exercise({ video: ghost })] }));

        expect(res.status).toBe(400);
        const after = await request(ctx.app).get(`/trainings/${created.id}`).set(bearer(admin));
        expect(after.body.training.name).toBe("Estável");
    });

    it("com o arquivo enviado antes, o treino é aceito", async () => {
        const v = await upload();
        const res = await post(training({ exercises: [exercise({ video: v })] }));

        expect(res.status).toBe(201);
        expect(res.body.training.exercises[0].video.url).toBe(v.url);
    });

    it("se o arquivo sumiu do disco (ex.: reinício do Render), regravar o treino exige reenviar", async () => {
        const v = await upload();
        const created = (await post(training({ exercises: [exercise({ video: v })] }))).body.training;

        fs.rmSync(onDisk(v.url)); // disco efêmero apagou o vídeo

        const res = await request(ctx.app)
            .put(`/trainings/${created.id}`)
            .set(bearer(admin))
            .send(training({ exercises: created.exercises }));
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Vídeo não encontrado, envie de novo");
    });

    it("url com formato inválido continua 400 (mesmo que o arquivo exista)", async () => {
        const v = await upload();
        const res = await post(training({ exercises: [exercise({ video: { ...v, url: `/media/../media/${v.url.slice(7)}` } })] }));
        expect(res.status).toBe(400);
    });
});

describe("V3-B4: limpeza de uploads órfãos > 24 h", () => {
    const age = (url: string, hours: number) => {
        const t = new Date(Date.now() - hours * 3600 * 1000);
        fs.utimesSync(onDisk(url), t, t);
    };

    it("apaga só o que é antigo E sem treino; mantém o recente e o referenciado", async () => {
        const [oldOrphan, oldUsed, freshOrphan] = [await upload(), await upload(), await upload()];
        await post(training({ exercises: [exercise({ video: oldUsed })] }));
        age(oldOrphan.url, 25);
        age(oldUsed.url, 48);
        age(freshOrphan.url, 1);

        const removed = await media().removeStaleUploads();

        expect(removed).toBeGreaterThanOrEqual(1);
        expect(fs.existsSync(onDisk(oldOrphan.url))).toBe(false);
        expect(fs.existsSync(onDisk(oldUsed.url))).toBe(true); // referenciado por um treino
        expect(fs.existsSync(onDisk(freshOrphan.url))).toBe(true); // formulário ainda pode estar aberto
    });

    it("fronteira de 24 h: 23 h fica, 25 h sai", async () => {
        const [almost, over] = [await upload(), await upload()];
        age(almost.url, 23);
        age(over.url, 25);

        await media().removeStaleUploads();

        expect(fs.existsSync(onDisk(almost.url))).toBe(true);
        expect(fs.existsSync(onDisk(over.url))).toBe(false);
    });

    it("ignora arquivos que o upload não gerou (nome fora do padrão)", async () => {
        const stray = ["notas.txt", "abc.mp4", "0123456789abcdef0123456789abcdef.exe", "0123456789abcdef0123456789abcdef.mp4.tmp"];
        for (const name of stray) {
            const file = path.join(ctx.uploadsDir, name);
            fs.writeFileSync(file, "x");
            const old = new Date(Date.now() - 100 * 3600 * 1000);
            fs.utimesSync(file, old, old);
        }

        await media().removeStaleUploads();

        for (const name of stray) expect(fs.existsSync(path.join(ctx.uploadsDir, name))).toBe(true);
    });

    it("pasta de uploads inexistente não é erro", async () => {
        const other = makeApp();
        await expect(require("../src/media").removeStaleUploads()).resolves.toBe(0);
        other.cleanup();
    });

    it("startUploadsCleanup varre na inicialização e o timer não segura o processo", async () => {
        const fresh = makeApp();
        const token = await login(fresh.app, "ecoafono@email.com");
        const up = await request(fresh.app)
            .post("/uploads/video")
            .set(bearer(token))
            .attach("file", fakeMp4(), { filename: "v.mp4", contentType: "video/mp4" });
        const file = path.join(fresh.uploadsDir, up.body.url.replace("/media/", ""));
        const old = new Date(Date.now() - 30 * 3600 * 1000);
        fs.utimesSync(file, old, old);

        const timer = require("../src/media").startUploadsCleanup(60_000);
        try {
            for (let i = 0; i < 50 && fs.existsSync(file); i++) await new Promise((r) => setTimeout(r, 40));
            expect(fs.existsSync(file)).toBe(false);
            expect(timer.hasRef()).toBe(false); // unref: não impede o servidor de encerrar
        } finally {
            clearInterval(timer);
            fresh.cleanup();
        }
    });
});
