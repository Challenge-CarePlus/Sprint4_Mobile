import jwt from "jsonwebtoken";
import request from "supertest";
import { bearer, login, makeApp, PASSWORD } from "./helpers";

const ctx = makeApp();
afterAll(ctx.cleanup);

describe("POST /auth/login", () => {
    it("admin: devolve token e user com role admin", async () => {
        const res = await request(ctx.app)
            .post("/auth/login")
            .send({ email: "ecoafono@email.com", password: PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toEqual({
            id: "a1",
            name: "Equipe Ecoa",
            email: "ecoafono@email.com",
            role: "admin",
        });
        expect(jwt.verify(res.body.token, "test-secret")).toMatchObject({ id: "a1", role: "admin" });
        expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/);
    });

    it("paciente mockado: role patient e claim role no JWT", async () => {
        const res = await request(ctx.app)
            .post("/auth/login")
            .send({ email: "mariana.costa@ecoa.test", password: PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ id: "p3", name: "Mariana Costa", role: "patient" });
        expect(jwt.verify(res.body.token, "test-secret")).toMatchObject({ id: "p3", role: "patient" });
    });

    it("os 9 usuários do seed entram com a senha padrão", async () => {
        const emails = [
            "ecoafono@email.com",
            "ana.lima@ecoa.test",
            "pedro.souza@ecoa.test",
            "mariana.costa@ecoa.test",
            "lucas.almeida@ecoa.test",
            "juliana.rocha@ecoa.test",
            "antonio.ferreira@ecoa.test",
            "helena.martins@ecoa.test",
            "jose.pereira@ecoa.test",
        ];
        for (const email of emails) {
            const res = await request(ctx.app).post("/auth/login").send({ email, password: PASSWORD });
            expect(res.status).toBe(200);
        }
    });

    it("e-mail com caixa/espaços diferentes continua valendo", async () => {
        const res = await request(ctx.app)
            .post("/auth/login")
            .send({ email: "  Ecoafono@Email.COM ", password: PASSWORD });
        expect(res.status).toBe(200);
    });

    it("mensagem ÚNICA: senha errada e e-mail desconhecido são indistinguíveis", async () => {
        const wrongPassword = await request(ctx.app)
            .post("/auth/login")
            .send({ email: "ecoafono@email.com", password: "senha-errada" });
        const unknownEmail = await request(ctx.app)
            .post("/auth/login")
            .send({ email: "ninguem@ecoa.test", password: PASSWORD });

        expect(wrongPassword.status).toBe(401);
        expect(unknownEmail.status).toBe(401);
        expect(wrongPassword.body).toEqual(unknownEmail.body);
        expect(wrongPassword.body.message).toBe("E-mail ou senha inválidos");
    });

    it("campos ausentes ou de tipo errado → 400 (nunca 500)", async () => {
        for (const body of [{}, { email: "a@b.com" }, { email: "a@b.com", password: 123 }, { email: ["a@b.com"], password: "x" }]) {
            const res = await request(ctx.app).post("/auth/login").send(body);
            expect(res.status).toBe(400);
        }
    });
});

describe("GET /auth/me", () => {
    it("token válido → usuário; sem token/token lixo → 401", async () => {
        const token = await login(ctx.app, "pedro.souza@ecoa.test");

        const ok = await request(ctx.app).get("/auth/me").set(bearer(token));
        expect(ok.status).toBe(200);
        expect(ok.body.user).toMatchObject({ id: "p2", role: "patient" });

        expect((await request(ctx.app).get("/auth/me")).status).toBe(401);
        expect((await request(ctx.app).get("/auth/me").set(bearer("lixo"))).status).toBe(401);
    });

    it("token assinado com outro segredo → 401", async () => {
        const forged = jwt.sign({ id: "a1", email: "ecoafono@email.com", role: "admin" }, "outro-segredo");
        expect((await request(ctx.app).get("/auth/me").set(bearer(forged))).status).toBe(401);
    });
});

describe("POST /auth/register", () => {
    it("cadastra sempre como paciente, mesmo se o corpo pedir admin", async () => {
        const res = await request(ctx.app)
            .post("/auth/register")
            .send({ name: "Teste", email: "novo@ecoa.test", password: "abcdef", role: "admin", access: "Admin" });

        expect(res.status).toBe(201);
        expect(res.body.user.role).toBe("patient");

        const token = await login(ctx.app, "novo@ecoa.test", "abcdef");
        expect(jwt.verify(token, "test-secret")).toMatchObject({ role: "patient" });
    });

    it("e-mail duplicado (caixa diferente) → 409; validação → 400", async () => {
        const dup = await request(ctx.app)
            .post("/auth/register")
            .send({ name: "X", email: "ANA.LIMA@ecoa.test", password: "abcdef" });
        expect(dup.status).toBe(409);

        for (const body of [
            { name: "X", email: "nao-e-email", password: "abcdef" },
            { name: "X", email: "a@b.com", password: "1" },
            { name: "x".repeat(101), email: "a@b.com", password: "abcdef" },
            { name: "X", email: "a@b.com", password: { a: 1 } },
        ]) {
            expect((await request(ctx.app).post("/auth/register").send(body)).status).toBe(400);
        }
    });

    it("cadastros simultâneos não se perdem", async () => {
        const results = await Promise.all(
            Array.from({ length: 10 }, (_, i) =>
                request(ctx.app)
                    .post("/auth/register")
                    .send({ name: `P${i}`, email: `par${i}@ecoa.test`, password: "abcdef" })
            )
        );
        expect(results.every((r) => r.status === 201)).toBe(true);

        for (let i = 0; i < 10; i++) {
            expect((await request(ctx.app).post("/auth/login").send({ email: `par${i}@ecoa.test`, password: "abcdef" })).status).toBe(200);
        }
    });
});

describe("infra", () => {
    it("JSON malformado → 400 em JSON, sem stack trace; rota inexistente → 404 em JSON", async () => {
        const bad = await request(ctx.app).post("/auth/login").set("Content-Type", "application/json").send("{bad");
        expect(bad.status).toBe(400);
        expect(bad.body.success).toBe(false);
        expect(bad.text).not.toMatch(/at .*\.(ts|js):\d+|node_modules/);

        const missing = await request(ctx.app).get("/nao-existe");
        expect(missing.status).toBe(404);
        expect(missing.body.success).toBe(false);
    });

    it("sem x-powered-by; /health ok", async () => {
        const res = await request(ctx.app).get("/health");
        expect(res.status).toBe(200);
        expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    it("rate limit: 429 depois do limite em /auth/login", async () => {
        const limited = makeApp({ authRateLimit: 3 });
        const statuses: number[] = [];
        for (let i = 0; i < 5; i++) {
            statuses.push(
                (await request(limited.app).post("/auth/login").send({ email: "a@b.com", password: "xxxxxx" })).status
            );
        }
        expect(statuses).toEqual([401, 401, 401, 429, 429]);
        limited.cleanup();
    });

    it("em produção sem JWT_SECRET o módulo se recusa a carregar", () => {
        const saved = { env: process.env.NODE_ENV, secret: process.env.JWT_SECRET };
        process.env.NODE_ENV = "production";
        delete process.env.JWT_SECRET;

        jest.isolateModules(() => {
            expect(() => require("../src/config/jwt")).toThrow(/JWT_SECRET/);
        });

        if (saved.env === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = saved.env;
        process.env.JWT_SECRET = saved.secret;
    });

    it("CORS: origem da Vercel do projeto passa; domínio parecido (ponto trocado) não", async () => {
        process.env.CORS_ORIGIN = "https://app.exemplo.com";
        jest.resetModules();
        const { createApp } = require("../src/app");
        const app = createApp({ authRateLimit: 1000 });

        const preflight = (origin: string) =>
            request(app)
                .options("/auth/login")
                .set("Origin", origin)
                .set("Access-Control-Request-Method", "POST");

        const ok = [
            "https://app.exemplo.com",
            "https://care-plus-xyz-isabelabarcellos0812-6004s-projects.vercel.app",
            "https://care-plus-git-v3-isabelabarcellos0812-6004s-projects.vercel.app",
        ];
        for (const origin of ok) {
            expect((await preflight(origin)).headers["access-control-allow-origin"]).toBe(origin);
        }

        const blocked = [
            "https://evil.example.com",
            "https://care-plus-a-isabelabarcellos0812-6004s-projects-vercel.app",
            "http://care-plus-xyz-isabelabarcellos0812-6004s-projects.vercel.app",
        ];
        for (const origin of blocked) {
            expect((await preflight(origin)).headers["access-control-allow-origin"]).toBeUndefined();
        }
        delete process.env.CORS_ORIGIN;
    });
});
