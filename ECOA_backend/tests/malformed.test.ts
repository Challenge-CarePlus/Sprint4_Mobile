import request from "supertest";
import { bearer, fakeMp4, login, makeApp } from "./helpers";

const ctx = makeApp();
afterAll(ctx.cleanup);

let admin: string;
beforeAll(async () => {
    admin = await login(ctx.app, "ecoafono@email.com");
});

const boundary = "----ecoa";
const part = (disposition: string, content: Buffer | string = fakeMp4()) =>
    Buffer.concat([
        Buffer.from(`--${boundary}\r\n${disposition}\r\nContent-Type: video/mp4\r\n\r\n`, "latin1"),
        Buffer.from(content),
        Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

const post = (body: Buffer, contentType = `multipart/form-data; boundary=${boundary}`) =>
    request(ctx.app).post("/uploads/video").set(bearer(admin)).set("Content-Type", contentType).send(body);

describe("V3-B1: multipart malformado → 400 (nunca 500)", () => {
    let errorLog: jest.SpyInstance;
    beforeEach(() => {
        errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);
    });
    afterEach(() => errorLog.mockRestore());

    // Toda linha com 3 valores: com menos, o jest-each passa `done` no lugar do terceiro argumento.
    const cases: Array<[string, Buffer, string | undefined]> = [
        ["NUL no filename", part('Content-Disposition: form-data; name="file"; filename="a\u0000.mp4"'), undefined],
        ["cabeçalho de parte quebrado", Buffer.from(`--${boundary}\r\nContent-Disposition form-data name=file\r\n\r\nxx\r\n--${boundary}--\r\n`), undefined],
        ["corpo truncado (sem boundary final)", Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.mp4"\r\nContent-Type: video/mp4\r\n\r\n`), undefined],
        ["content-type multipart sem boundary", fakeMp4(64), "multipart/form-data"],
        ["boundary que não aparece no corpo", Buffer.from("lixo qualquer sem boundary"), "multipart/form-data; boundary=naoexiste"],
        ["corpo vazio", Buffer.alloc(0), undefined],
        ["partes demais", Buffer.concat(Array.from({ length: 20 }, () => Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="x"\r\n\r\n1\r\n`)).concat(Buffer.from(`--${boundary}--\r\n`))), undefined],
    ];

    it.each(cases)("%s", async (_label, body, contentType) => {
        const res = await post(body, contentType);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ success: false, message: expect.any(String) });
        expect(res.text).not.toMatch(/at .*\.(ts|js):\d+|node_modules/);
        // Entrada malformada do cliente não é erro do servidor: não vai pro log como stack.
        expect(errorLog).not.toHaveBeenCalled();
    });

    it("campo com outro nome ou arquivo extra → 400", async () => {
        const res = await request(ctx.app)
            .post("/uploads/video")
            .set(bearer(admin))
            .attach("outro", fakeMp4(), { filename: "a.mp4", contentType: "video/mp4" });
        expect(res.status).toBe(400);
    });

    it("um upload válido continua funcionando depois dos malformados", async () => {
        const res = await post(part('Content-Disposition: form-data; name="file"; filename="ok.mp4"'));
        expect(res.status).toBe(201);
    });
});
