import fs from "fs";
import request from "supertest";
import { bearer, exercise, fakeMp4, fakeWebm, login, makeApp, training } from "./helpers";

const ctx = makeApp();
afterAll(ctx.cleanup);

let admin: string;
let mariana: string;

beforeAll(async () => {
    admin = await login(ctx.app, "ecoafono@email.com");
    mariana = await login(ctx.app, "mariana.costa@ecoa.test");
});

const upload = (buffer: Buffer, filename: string, contentType: string, token = admin) =>
    request(ctx.app).post("/uploads/video").set(bearer(token)).attach("file", buffer, { filename, contentType });

const files = () => (fs.existsSync(ctx.uploadsDir) ? fs.readdirSync(ctx.uploadsDir) : []);

describe("POST /uploads/video", () => {
    it("aceita mp4: nome aleatório em disco, url relativa, metadados", async () => {
        const res = await upload(fakeMp4(), "meu video.mp4", "video/mp4");

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ success: true, name: "meu video.mp4", size: 2048, mime: "video/mp4" });
        expect(res.body.url).toMatch(/^\/media\/[a-f0-9]{32}\.mp4$/);
        expect(files()).toContain(res.body.url.replace("/media/", ""));
    });

    it("aceita webm e quicktime (.mov)", async () => {
        const webm = await upload(fakeWebm(), "a.webm", "video/webm");
        expect(webm.status).toBe(201);
        expect(webm.body.url).toMatch(/\.webm$/);

        const mov = await upload(fakeMp4(), "IMG_0001.MOV", "video/quicktime");
        expect(mov.status).toBe(201);
        expect(mov.body.url).toMatch(/\.mov$/);
    });

    it("aceita exatamente 30 MB e recusa acima (413, mensagem clara)", async () => {
        const limit = 30 * 1024 * 1024;
        expect((await upload(fakeMp4(limit), "limite.mp4", "video/mp4")).status).toBe(201);

        const big = await upload(fakeMp4(limit + 1), "grande.mp4", "video/mp4");
        expect(big.status).toBe(413);
        expect(big.body.message).toMatch(/30 MB/);
    });

    it("recusa tipo inválido (400)", async () => {
        const before = files().length;
        for (const [name, type, buf] of [
            ["a.txt", "text/plain", Buffer.from("oi")],
            ["a.exe", "application/octet-stream", Buffer.from("MZ")],
            ["a.png", "image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
            ["a.avi", "video/x-msvideo", fakeMp4()],
            ["a.mp4", "text/html", fakeMp4()],
        ] as const) {
            const res = await upload(buf as Buffer, name, type);
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        }
        expect(files().length).toBe(before);
    });

    it("recusa conteúdo que não é vídeo mesmo com mime e extensão certos", async () => {
        const html = await upload(Buffer.from("<html><script>alert(1)</script></html>"), "falso.mp4", "video/mp4");
        expect(html.status).toBe(400);
        expect(html.body.message).toMatch(/não é um vídeo válido/);

        expect((await upload(fakeMp4(), "mp4-como-webm.webm", "video/webm")).status).toBe(400);
    });

    it("recusa extensão dupla", async () => {
        expect((await upload(fakeMp4(), "shell.php.mp4", "video/mp4")).status).toBe(400);
        expect((await upload(fakeMp4(), "page.html.mp4", "video/mp4")).status).toBe(400);
    });

    it("nome com ../ (multipart cru, sem o basename do supertest): nada escapa da pasta de uploads", async () => {
        const raw = (filename: string) => {
            const boundary = "----ecoa";
            const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: video/mp4\r\n\r\n`;
            return {
                boundary,
                body: Buffer.concat([Buffer.from(head), fakeMp4(), Buffer.from(`\r\n--${boundary}--\r\n`)]),
            };
        };
        const outside = () => fs.readdirSync(require("path").dirname(ctx.uploadsDir)).sort().join(",");
        const before = outside();

        for (const filename of ["../../etc/passwd.mp4", "..\\..\\x.mp4", "a/../../b.mp4", "..%2F..%2Fx.mp4"]) {
            const { boundary, body } = raw(filename);
            const res = await request(ctx.app)
                .post("/uploads/video")
                .set(bearer(admin))
                .set("Content-Type", `multipart/form-data; boundary=${boundary}`)
                .send(body);

            // Ou o servidor recusa, ou aceita guardando com nome aleatório e devolvendo um nome sem caminho.
            expect([201, 400]).toContain(res.status);
            if (res.status === 201) {
                expect(res.body.url).toMatch(/^\/media\/[a-f0-9]{32}\.mp4$/);
                expect(res.body.name).not.toMatch(/[\\/]|\.\./);
            }
        }
        expect(outside()).toBe(before);
    });

    it("sem arquivo → 400; paciente → 403; sem token → 401", async () => {
        expect((await request(ctx.app).post("/uploads/video").set(bearer(admin))).status).toBe(400);
        expect((await upload(fakeMp4(), "a.mp4", "video/mp4", mariana)).status).toBe(403);
        expect((await request(ctx.app).post("/uploads/video").attach("file", fakeMp4(), "a.mp4")).status).toBe(401);
    });

    it("o nome exibido não carrega < >", async () => {
        const res = await upload(fakeMp4(), "<b>x</b>.mp4", "video/mp4");
        expect(res.status).toBe(201);
        expect(res.body.name).not.toMatch(/[<>]/);
    });
});

describe("GET /media/:file", () => {
    let url: string;
    let body: Buffer;

    beforeAll(async () => {
        body = Buffer.concat([fakeMp4(100), Buffer.from("0123456789".repeat(10))]);
        url = (await upload(body, "range.mp4", "video/mp4")).body.url;
    });

    it("serve com Content-Type certo, Accept-Ranges e sem login", async () => {
        const res = await request(ctx.app).get(url);

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toBe("video/mp4");
        expect(res.headers["accept-ranges"]).toBe("bytes");
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
        expect(Number(res.headers["content-length"])).toBe(body.length);
    });

    it("Range → 206 com Content-Range (o <video> do celular exige)", async () => {
        const res = await request(ctx.app).get(url).set("Range", "bytes=100-109").buffer(true).parse((r, cb) => {
            const chunks: Buffer[] = [];
            r.on("data", (c: Buffer) => chunks.push(c));
            r.on("end", () => cb(null, Buffer.concat(chunks)));
        });

        expect(res.status).toBe(206);
        expect(res.headers["content-range"]).toBe(`bytes 100-109/${body.length}`);
        expect((res.body as Buffer).toString()).toBe("0123456789");
    });

    it("Range fora do arquivo → 416", async () => {
        const res = await request(ctx.app).get(url).set("Range", "bytes=99999-100000");
        expect(res.status).toBe(416);
    });

    it("serve webm e mov com o tipo certo", async () => {
        const webm = (await upload(fakeWebm(), "a.webm", "video/webm")).body.url;
        const mov = (await upload(fakeMp4(), "a.mov", "video/quicktime")).body.url;
        expect((await request(ctx.app).get(webm)).headers["content-type"]).toBe("video/webm");
        expect((await request(ctx.app).get(mov)).headers["content-type"]).toBe("video/quicktime");
    });

    it("path traversal e listagem de diretório → 404", async () => {
        const attempts = [
            "/media/..%2F..%2Fpackage.json",
            "/media/%2e%2e/%2e%2e/package.json",
            "/media/..%5C..%5Cpackage.json",
            "/media/../package.json",
            "/media/%2E%2E%2Fdata%2Fusers.json",
            "/media/",
            "/media",
            "/media/.",
            "/media/..",
            "/media/users.json",
            "/media/0123456789abcdef0123456789abcdef.exe",
            "/media/0123456789abcdef0123456789abcdef.mp4", // formato válido, arquivo inexistente
        ];
        for (const path of attempts) {
            const res = await request(ctx.app).get(path);
            expect([404]).toContain(res.status);
            expect(res.headers["content-type"]).toMatch(/json/);
            expect(res.text).not.toMatch(/"name":\s*"ECOA_backend"|\$2[aby]\$/);
        }
    });

    it("HEAD funciona (probe do player)", async () => {
        expect((await request(ctx.app).head(url)).status).toBe(200);
    });
});

describe("vídeos órfãos", () => {
    const videoRef = (u: { url: string; name: string; size: number; mime: string }) => ({ video: u });
    const upOne = async () => (await upload(fakeMp4(), "v.mp4", "video/mp4")).body;
    const exists = async (url: string) => (await request(ctx.app).get(url)).status === 200;

    it("excluir o treino apaga o vídeo", async () => {
        const v = await upOne();
        const t = await request(ctx.app).post("/trainings").set(bearer(admin)).send(training({ exercises: [exercise(videoRef(v))] }));
        expect(t.status).toBe(201);
        expect(await exists(v.url)).toBe(true);

        await request(ctx.app).delete(`/trainings/${t.body.training.id}`).set(bearer(admin));
        expect(await exists(v.url)).toBe(false);
    });

    it("trocar ou remover o vídeo num PUT apaga o antigo, mantém o novo", async () => {
        const [a, b] = [await upOne(), await upOne()];
        const t = (await request(ctx.app).post("/trainings").set(bearer(admin)).send(training({ exercises: [exercise(videoRef(a))] }))).body.training;

        await request(ctx.app).put(`/trainings/${t.id}`).set(bearer(admin)).send(training({ exercises: [exercise(videoRef(b))] }));
        expect(await exists(a.url)).toBe(false);
        expect(await exists(b.url)).toBe(true);

        await request(ctx.app).put(`/trainings/${t.id}`).set(bearer(admin)).send(training({ exercises: [exercise({ video: null })] }));
        expect(await exists(b.url)).toBe(false);
    });

    it("vídeo compartilhado por outro treino NÃO é apagado", async () => {
        const v = await upOne();
        const make = () => request(ctx.app).post("/trainings").set(bearer(admin)).send(training({ exercises: [exercise(videoRef(v))] }));
        const [t1, t2] = [(await make()).body.training, (await make()).body.training];

        await request(ctx.app).delete(`/trainings/${t1.id}`).set(bearer(admin));
        expect(await exists(v.url)).toBe(true);

        await request(ctx.app).delete(`/trainings/${t2.id}`).set(bearer(admin));
        expect(await exists(v.url)).toBe(false);
    });
});
