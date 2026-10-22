import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import request from "supertest";
import { ADMIN_EMAIL, ADMIN_TEST_PASSWORD, makeApp, PASSWORD } from "./helpers";

const attempt = (app: any, email: string, password: string) =>
    request(app).post("/auth/login").send({ email, password });

const readUsers = (ctx: { dir: string }): Array<{ id: string; role: string; password: string }> =>
    JSON.parse(fs.readFileSync(path.join(ctx.dir, "data", "users.json"), "utf-8"));

describe("V3-S21: a senha do admin vem de ADMIN_PASSWORD", () => {
    const saved = { node: process.env.NODE_ENV, admin: process.env.ADMIN_PASSWORD };
    afterEach(() => {
        if (saved.node === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = saved.node;
        if (saved.admin === undefined) delete process.env.ADMIN_PASSWORD;
        else process.env.ADMIN_PASSWORD = saved.admin;
    });

    describe("em produção", () => {
        it("sem ADMIN_PASSWORD o servidor não sobe (config e cadeia do app)", () => {
            process.env.NODE_ENV = "production";
            process.env.JWT_SECRET = "x";
            delete process.env.ADMIN_PASSWORD;

            jest.isolateModules(() => {
                expect(() => require("../src/config/adminPassword")).toThrow(/ADMIN_PASSWORD/);
            });
            jest.isolateModules(() => {
                expect(() => require("../src/app")).toThrow(/ADMIN_PASSWORD/);
            });
        });

        it("ADMIN_PASSWORD vazia também derruba", () => {
            process.env.NODE_ENV = "production";
            process.env.JWT_SECRET = "x";
            process.env.ADMIN_PASSWORD = "";

            jest.isolateModules(() => {
                expect(() => require("../src/config/adminPassword")).toThrow(/ADMIN_PASSWORD/);
            });
        });

        it("com a variável sobe", () => {
            process.env.NODE_ENV = "production";
            process.env.JWT_SECRET = "x";
            process.env.ADMIN_PASSWORD = "uma-senha-forte-123";

            jest.isolateModules(() => {
                expect(require("../src/config/adminPassword").ADMIN_PASSWORD).toBe("uma-senha-forte-123");
            });
        });
    });

    it("menos de 8 caracteres é recusada (em qualquer ambiente)", () => {
        delete process.env.NODE_ENV;
        process.env.ADMIN_PASSWORD = "curta12";

        jest.isolateModules(() => {
            expect(() => require("../src/config/adminPassword")).toThrow(/8 caracteres/);
        });
    });

    describe("login do admin", () => {
        const ctx = makeApp();
        afterAll(ctx.cleanup);

        it("entra só com o valor da env", async () => {
            const ok = await attempt(ctx.app, ADMIN_EMAIL, ADMIN_TEST_PASSWORD);
            expect(ok.status).toBe(200);
            expect(ok.body.user.role).toBe("admin");
        });

        it("a senha dos pacientes (ecoa2026) e a de dev NÃO abrem o admin", async () => {
            expect((await attempt(ctx.app, ADMIN_EMAIL, PASSWORD)).status).toBe(401);
            expect((await attempt(ctx.app, ADMIN_EMAIL, "ecoa-admin-dev")).status).toBe(401);
        });

        it("a senha do admin não abre conta de paciente, e o paciente não vira admin", async () => {
            expect((await attempt(ctx.app, "mariana.costa@ecoa.test", ADMIN_TEST_PASSWORD)).status).toBe(401);

            const patient = await attempt(ctx.app, "mariana.costa@ecoa.test", PASSWORD);
            expect(patient.body.user.role).toBe("patient");
        });

        it("o arquivo de dados não guarda a senha em texto e o hash do admin difere do dos pacientes", async () => {
            await attempt(ctx.app, ADMIN_EMAIL, ADMIN_TEST_PASSWORD); // garante o seed
            const raw = fs.readFileSync(path.join(ctx.dir, "data", "users.json"), "utf-8");
            expect(raw).not.toContain(ADMIN_TEST_PASSWORD);
            expect(raw).not.toContain("ecoa-admin-dev");

            const users = readUsers(ctx);
            const admin = users.find((u) => u.role === "admin")!;
            const patient = users.find((u) => u.role === "patient")!;
            expect(await bcrypt.compare(ADMIN_TEST_PASSWORD, admin.password)).toBe(true);
            expect(await bcrypt.compare(PASSWORD, admin.password)).toBe(false);
            expect(await bcrypt.compare(PASSWORD, patient.password)).toBe(true);
            expect(admin.password).not.toBe(patient.password);
        });
    });

    it("fora de produção, sem a variável: vale o valor de dev, que é diferente da senha dos pacientes", async () => {
        const dev = makeApp({ adminPassword: null });

        expect((await attempt(dev.app, ADMIN_EMAIL, "ecoa-admin-dev")).status).toBe(200);
        expect((await attempt(dev.app, ADMIN_EMAIL, PASSWORD)).status).toBe(401);
        expect("ecoa-admin-dev").not.toBe(PASSWORD);
        dev.cleanup();
    });

    it("trocar ADMIN_PASSWORD atualiza o hash do admin num arquivo já existente", async () => {
        const first = makeApp({ adminPassword: "primeira-senha-123" });
        expect((await attempt(first.app, ADMIN_EMAIL, "primeira-senha-123")).status).toBe(200);

        // Mesmo arquivo de dados, nova senha na env (como um redeploy com outra senha).
        const second = makeApp({ adminPassword: "segunda-senha-456", reuseDirOf: first });
        expect((await attempt(second.app, ADMIN_EMAIL, "segunda-senha-456")).status).toBe(200);
        expect((await attempt(second.app, ADMIN_EMAIL, "primeira-senha-123")).status).toBe(401);

        // Pacientes intactos.
        expect((await attempt(second.app, "ana.lima@ecoa.test", PASSWORD)).status).toBe(200);
        first.cleanup();
    });

    it("com a env igual ao hash gravado, o arquivo não é reescrito", async () => {
        const first = makeApp();
        await attempt(first.app, ADMIN_EMAIL, ADMIN_TEST_PASSWORD);
        const before = fs.readFileSync(path.join(first.dir, "data", "users.json"), "utf-8");

        const again = makeApp({ reuseDirOf: first });
        await attempt(again.app, ADMIN_EMAIL, ADMIN_TEST_PASSWORD);
        expect(fs.readFileSync(path.join(first.dir, "data", "users.json"), "utf-8")).toBe(before);
        first.cleanup();
    });
});
