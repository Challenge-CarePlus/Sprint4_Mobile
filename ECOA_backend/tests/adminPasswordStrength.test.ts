const STRONG = "Cavalo-Azul-Roda-2026!"; // só neste teste; não é a senha real de ninguém

const load = (env: "production" | "development", password: string | undefined) => {
    const saved = { node: process.env.NODE_ENV, admin: process.env.ADMIN_PASSWORD, jwt: process.env.JWT_SECRET };
    process.env.NODE_ENV = env;
    process.env.JWT_SECRET = "x";
    if (password === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = password;
    try {
        let result: any;
        jest.isolateModules(() => {
            result = require("../src/config/adminPassword");
        });
        return result as { ADMIN_PASSWORD: string };
    } finally {
        process.env.NODE_ENV = saved.node;
        if (saved.admin === undefined) delete process.env.ADMIN_PASSWORD;
        else process.env.ADMIN_PASSWORD = saved.admin;
        process.env.JWT_SECRET = saved.jwt;
    }
};

/** Capta a mensagem do erro de boot para conferir o motivo e que o valor não vaza. */
const failure = (env: "production" | "development", password: string): string => {
    try {
        load(env, password);
    } catch (error) {
        return (error as Error).message;
    }
    throw new Error("era para recusar a senha");
};

describe("V3-I05b: ADMIN_PASSWORD fraca ou pública é recusada no boot", () => {
    it.each([
        ["igual à dos pacientes", "ecoa2026", /pacientes mockados/],
        ["igual à dos pacientes (maiúsculas)", "ECOA2026", /pacientes mockados/],
        ["igual ao valor de dev", "ecoa-admin-dev", /desenvolvimento/],
        ["igual ao valor de dev (maiúsculas)", "Ecoa-Admin-Dev", /desenvolvimento/],
    ])("%s → recusada em produção e em dev", (_name, password, reason) => {
        for (const env of ["production", "development"] as const) {
            expect(failure(env, password)).toMatch(reason);
        }
    });

    it.each([
        ["senha123"],
        ["Admin123"],
        ["PASSWORD"],
        ["12345678"],
        ["ecoafono"],
        ["EcoaFono"],
        ["careplus"],
    ])("lista de fracas: %s → recusada (case-insensitive)", (password) => {
        for (const env of ["production", "development"] as const) {
            expect(failure(env, password)).toMatch(/fracas/);
        }
    });

    it("contém a senha pública dos pacientes → recusada", () => {
        expect(failure("production", "minha-ecoa2026-forte")).toMatch(/pacientes mockados/);
    });

    it("só números e caractere repetido → recusadas, mesmo longas", () => {
        expect(failure("production", "493827561029384756")).toMatch(/só números/);
        expect(failure("production", "aaaaaaaaaaaaaaaa")).toMatch(/único caractere/);
    });

    it("menos de 12 caracteres em produção; em dev o mínimo é 8", () => {
        expect(failure("production", "Abcdef-1234")).toMatch(/12 caracteres/); // 11
        expect(failure("development", "Abc-123")).toMatch(/8 caracteres/); // 7
        expect(load("development", "Abcd-1234").ADMIN_PASSWORD).toBe("Abcd-1234"); // 9: ok em dev
        expect(() => load("production", "Abcd-1234")).toThrow(/12 caracteres/); // 9: não em produção
    });

    it("12 caracteres exatos passam em produção (fronteira)", () => {
        expect(load("production", "Abcdef-12345").ADMIN_PASSWORD).toBe("Abcdef-12345");
    });

    it("senha forte válida sobe em produção e em dev", () => {
        expect(load("production", STRONG).ADMIN_PASSWORD).toBe(STRONG);
        expect(load("development", STRONG).ADMIN_PASSWORD).toBe(STRONG);
    });

    it("sem a variável: produção não sobe; dev usa o valor de desenvolvimento", () => {
        expect(() => load("production", undefined)).toThrow(/não definida/);
        expect(load("development", undefined).ADMIN_PASSWORD).toBe("ecoa-admin-dev");
    });

    it("a mensagem de erro nunca contém o valor recusado", () => {
        for (const password of ["ecoa2026", "senha123", "493827561029384756", "Abcdef-1234", "minha-ecoa2026-forte"]) {
            expect(failure("production", password)).not.toContain(password);
        }
    });
});

describe("V3-I05b: a senha do admin não aparece em logs, respostas nem dados", () => {
    it("nenhuma resposta de login (sucesso, erro, JSON ruim) repete a senha, e nada é logado", async () => {
        const request = require("supertest");
        const { makeApp, ADMIN_EMAIL, ADMIN_TEST_PASSWORD } = require("./helpers");
        const spies = (["log", "error", "warn", "info"] as const).map((m) => jest.spyOn(console, m).mockImplementation());
        const ctx = makeApp();
        try {
            const bodies = [
                await request(ctx.app).post("/auth/login").send({ email: ADMIN_EMAIL, password: ADMIN_TEST_PASSWORD }),
                await request(ctx.app).post("/auth/login").send({ email: ADMIN_EMAIL, password: `${ADMIN_TEST_PASSWORD}x` }),
                await request(ctx.app)
                    .post("/auth/login")
                    .set("Content-Type", "application/json")
                    .send(`{"email":"${ADMIN_EMAIL}","password":"${ADMIN_TEST_PASSWORD}`),
            ];
            for (const res of bodies) {
                expect(JSON.stringify(res.body)).not.toContain(ADMIN_TEST_PASSWORD);
                expect(res.text).not.toContain(ADMIN_TEST_PASSWORD);
            }
            for (const spy of spies) {
                expect(JSON.stringify(spy.mock.calls)).not.toContain(ADMIN_TEST_PASSWORD);
            }
        } finally {
            spies.forEach((s) => s.mockRestore());
            ctx.cleanup();
        }
    });
});
