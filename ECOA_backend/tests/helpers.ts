import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";

/** Senha dos pacientes mockados (pública, sem privilégio). */
export const PASSWORD = "ecoa2026";
/** Senha do admin SÓ nos testes: o servidor a recebe por ADMIN_PASSWORD, como em produção. */
export const ADMIN_TEST_PASSWORD = "senha-de-teste-do-admin";
export const ADMIN_EMAIL = "ecoafono@email.com";

/**
 * Sobe uma instância isolada do app: pasta de dados e de uploads temporárias
 * (nunca toca ECOA_backend/data) e módulos recarregados, já que os paths vêm de env.
 */
export function makeApp(
    options: {
        authRateLimit?: number;
        /** Reaproveita a pasta de dados de outra instância (pra testar troca de ADMIN_PASSWORD). */
        reuseDirOf?: { dir: string };
        /** undefined = senha de teste; null = sem a variável (usa o valor de dev). */
        adminPassword?: string | null;
    } = {}
) {
    const dir = options.reuseDirOf?.dir ?? fs.mkdtempSync(path.join(os.tmpdir(), "ecoa-api-"));
    process.env.DATA_DIR = path.join(dir, "data");
    process.env.UPLOADS_DIR = path.join(dir, "uploads");
    process.env.JWT_SECRET = "test-secret";
    if (options.adminPassword === null) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = options.adminPassword ?? ADMIN_TEST_PASSWORD;
    delete process.env.NODE_ENV;
    delete process.env.CORS_ORIGIN;

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createApp } = require("../src/app");
    const app = createApp({ authRateLimit: options.authRateLimit ?? 1000 });

    return {
        app,
        dir,
        uploadsDir: process.env.UPLOADS_DIR as string,
        cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
    };
}

export async function login(
    app: any,
    email: string,
    password = email === ADMIN_EMAIL ? ADMIN_TEST_PASSWORD : PASSWORD
): Promise<string> {
    const res = await request(app).post("/auth/login").send({ email, password });
    if (res.status !== 200) throw new Error(`login ${email} falhou: ${res.status}`);
    return res.body.token;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export function exercise(overrides: Record<string, unknown> = {}) {
    return {
        name: "Sorriso largo",
        goal: "Mobilidade dos lábios",
        steps: ["Sorria bem aberto", "Segure por 2 segundos"],
        repetitions: 5,
        holdSeconds: 2,
        relaxSeconds: 2,
        video: null,
        validation: { movement: "mouthSmile", sensitivity: "normal", note: "A câmera confirma o sorriso." },
        ...overrides,
    };
}

export function training(overrides: Record<string, unknown> = {}) {
    return {
        name: "Treino de teste",
        audience: { all: true, ids: [] },
        exercises: [exercise()],
        ...overrides,
    };
}

/** Cabeçalho mínimo de um MP4 válido ("ftyp" no byte 4) + enchimento. */
export function fakeMp4(bytes = 2048): Buffer {
    const buf = Buffer.alloc(bytes, 0x20);
    buf.writeUInt32BE(24, 0);
    buf.write("ftypisom", 4, "latin1");
    return buf;
}

/** Cabeçalho EBML de um WebM. */
export function fakeWebm(bytes = 2048): Buffer {
    const buf = Buffer.alloc(bytes, 0x20);
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]).copy(buf, 0);
    return buf;
}
