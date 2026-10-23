import request from "supertest";

const load = (flag: string | undefined, password: string | undefined, env = "production") => {
    const saved = {
        node: process.env.NODE_ENV,
        admin: process.env.ADMIN_PASSWORD,
        flag: process.env.ALLOW_WEAK_ADMIN_PASSWORD,
    };
    process.env.NODE_ENV = env;
    if (password === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = password;
    if (flag === undefined) delete process.env.ALLOW_WEAK_ADMIN_PASSWORD;
    else process.env.ALLOW_WEAK_ADMIN_PASSWORD = flag;
    const warn = jest.spyOn(console, "warn").mockImplementation();
    try {
        let mod: any;
        jest.isolateModules(() => {
            mod = require("../src/config/adminPassword");
        });
        return { mod: mod as { ADMIN_PASSWORD: string; DEMO_MODE: boolean }, warnings: warn.mock.calls.map((c) => c.join(" ")) };
    } finally {
        warn.mockRestore();
        process.env.NODE_ENV = saved.node;
        for (const [key, value] of [["ADMIN_PASSWORD", saved.admin], ["ALLOW_WEAK_ADMIN_PASSWORD", saved.flag]] as const) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
};

describe("modo demonstração (ALLOW_WEAK_ADMIN_PASSWORD)", () => {
    it("sem a chave a regra forte continua valendo (ecoa2026 e <12 recusadas)", () => {
        expect(() => load(undefined, "ecoa2026")).toThrow(/pacientes mockados/);
        expect(() => load(undefined, "Abcd-1234")).toThrow(/12 caracteres/);
        expect(() => load("false", "ecoa2026")).toThrow(/pacientes mockados/);
    });

    it("com 'true', ecoa2026 sobe em produção, avisa no log e não imprime a senha", () => {
        const { mod, warnings } = load("true", "ecoa2026");

        expect(mod.ADMIN_PASSWORD).toBe("ecoa2026");
        expect(mod.DEMO_MODE).toBe(true);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(/MODO DEMONSTRACAO: senha de administrador fraca\/publica permitida/);
        expect(warnings[0]).not.toContain("ecoa2026");
    });

    it("com 'true' aceita também fracas e curtas (>= 8): senha123, 12345678, ecoa2026", () => {
        for (const password of ["senha123", "12345678", "Abcd-1234"]) {
            expect(load("true", password).mod.ADMIN_PASSWORD).toBe(password);
        }
    });

    it("com 'true' continua recusando vazia e < 8 caracteres", () => {
        expect(() => load("true", "")).toThrow(/não definida/); // produção: vazia
        expect(() => load("true", "", "development")).toThrow(/8 caracteres/);
        expect(() => load("true", "abc1234")).toThrow(/8 caracteres/);
        expect(() => load("true", undefined)).toThrow(/não definida/);
    });

    it.each([["TRUE"], ["True"], ["1"], ["yes"], [" true"], ["true "], [""]])(
        "valor %j NÃO liga o modo (só 'true' exato)",
        (flag) => {
            expect(() => load(flag, "ecoa2026")).toThrow(/pacientes mockados/);
        }
    );

    it("sem a chave não há aviso e DEMO_MODE é falso", () => {
        const { mod, warnings } = load(undefined, "Cavalo-Azul-Roda-2026!");
        expect(mod.DEMO_MODE).toBe(false);
        expect(warnings).toEqual([]);
    });

    it("/health não revela o modo demonstração (só status)", async () => {
        const saved = process.env.ALLOW_WEAK_ADMIN_PASSWORD;
        process.env.ALLOW_WEAK_ADMIN_PASSWORD = "true";
        const { makeApp } = require("./helpers");
        const ctx = makeApp({ adminPassword: "ecoa2026" });
        try {
            const res = await request(ctx.app).get("/health");
            expect(res.body).toEqual({ status: "ok" });
        } finally {
            if (saved === undefined) delete process.env.ALLOW_WEAK_ADMIN_PASSWORD;
            else process.env.ALLOW_WEAK_ADMIN_PASSWORD = saved;
            ctx.cleanup();
        }
    });
});
