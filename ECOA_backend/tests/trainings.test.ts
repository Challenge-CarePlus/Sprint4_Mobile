import request from "supertest";
import { bearer, exercise, login, makeApp, training } from "./helpers";

const ctx = makeApp();
afterAll(ctx.cleanup);

let admin: string;
let mariana: string; // p3
let pedro: string; // p2

beforeAll(async () => {
    admin = await login(ctx.app, "ecoafono@email.com");
    mariana = await login(ctx.app, "mariana.costa@ecoa.test");
    pedro = await login(ctx.app, "pedro.souza@ecoa.test");
});

const create = (body: unknown, token = admin) =>
    request(ctx.app).post("/trainings").set(bearer(token)).send(body as object);

describe("autorização das rotas de admin (401 sem token, 403 para paciente)", () => {
    const routes: Array<[string, string]> = [
        ["post", "/trainings"],
        ["put", "/trainings/t-ex"],
        ["delete", "/trainings/t-ex"],
        ["post", "/uploads/video"],
        ["get", "/patients"],
        ["get", "/patients/p1"],
    ];

    it.each(routes)("%s %s", async (method, path) => {
        const call = (token?: string) => {
            const req = (request(ctx.app) as any)[method](path);
            return token ? req.set(bearer(token)) : req;
        };

        expect((await call()).status).toBe(401);
        expect((await call("token-lixo")).status).toBe(401);
        expect((await call(mariana)).status).toBe(403);
    });

    it("o seed não foi alterado pelas tentativas negadas", async () => {
        const res = await request(ctx.app).get("/trainings").set(bearer(admin));
        expect(res.body.trainings.map((t: any) => t.id)).toEqual(["t-ex"]);
    });
});

describe("seed", () => {
    it("treino de exemplo existe, marcado example, p3/p4/p5, já com validation", async () => {
        const res = await request(ctx.app).get("/trainings/t-ex").set(bearer(admin));

        expect(res.status).toBe(200);
        expect(res.body.training).toMatchObject({
            id: "t-ex",
            name: "Aquecimento para apresentações",
            example: true,
            audience: { all: false, ids: ["p3", "p4", "p5"] },
        });
        expect(res.body.training.exercises).toHaveLength(2);
        for (const e of res.body.training.exercises) {
            expect(e.validation.movement).toBeTruthy();
        }
    });
});

describe("CRUD (admin)", () => {
    it("cria, lê, substitui e exclui", async () => {
        const created = await create(training({ name: "  Meu treino  " }));
        expect(created.status).toBe(201);
        const { id, createdAt, createdBy } = created.body.training;
        expect(created.body.training).toMatchObject({ name: "Meu treino", createdBy: "a1" });
        expect(id).toBeTruthy();

        const read = await request(ctx.app).get(`/trainings/${id}`).set(bearer(admin));
        expect(read.body.training.exercises[0].id).toBeTruthy();

        const updated = await request(ctx.app)
            .put(`/trainings/${id}`)
            .set(bearer(admin))
            .send(training({ name: "Renomeado", exercises: [exercise({ name: "Outro", repetitions: 7 })] }));
        expect(updated.status).toBe(200);
        expect(updated.body.training).toMatchObject({ id, name: "Renomeado", createdAt, createdBy });
        expect(updated.body.training.exercises[0].repetitions).toBe(7);
        expect(updated.body.training.updatedAt >= createdAt).toBe(true);

        expect((await request(ctx.app).delete(`/trainings/${id}`).set(bearer(admin))).status).toBe(200);
        expect((await request(ctx.app).get(`/trainings/${id}`).set(bearer(admin))).status).toBe(404);
        expect((await request(ctx.app).delete(`/trainings/${id}`).set(bearer(admin))).status).toBe(404);
        expect((await request(ctx.app).put(`/trainings/${id}`).set(bearer(admin)).send(training())).status).toBe(404);
    });

    it("ignora id/papel/createdBy enviados pelo cliente", async () => {
        const res = await create({ ...training(), id: "t-ex", createdBy: "p1", example: true });
        expect(res.status).toBe(201);
        expect(res.body.training.id).not.toBe("t-ex");
        expect(res.body.training.createdBy).toBe("a1");
        expect(res.body.training.example).toBeUndefined();
    });

    it("criações simultâneas não se perdem", async () => {
        const before = (await request(ctx.app).get("/trainings").set(bearer(admin))).body.trainings.length;
        const results = await Promise.all(Array.from({ length: 8 }, (_, i) => create(training({ name: `Par ${i}` }))));
        expect(results.every((r) => r.status === 201)).toBe(true);

        const after = (await request(ctx.app).get("/trainings").set(bearer(admin))).body.trainings.length;
        expect(after).toBe(before + 8);
    });
});

describe("validação do modelo (400 com mensagem)", () => {
    const cases: Array<[string, unknown]> = [
        ["sem nome", training({ name: "   " })],
        ["nome grande demais", training({ name: "x".repeat(101) })],
        ["nome com HTML", training({ name: "<script>alert(1)</script>" })],
        ["sem exercícios", training({ exercises: [] })],
        ["exercícios não é lista", training({ exercises: "x" })],
        ["exercício sem nome", training({ exercises: [exercise({ name: "" })] })],
        ["exercício sem passos", training({ exercises: [exercise({ steps: [] })] })],
        ["só passos vazios", training({ exercises: [exercise({ steps: ["", "  "] })] })],
        ["passo com HTML", training({ exercises: [exercise({ steps: ["<img src=x onerror=1>"] })] })],
        ["repetições 0", training({ exercises: [exercise({ repetitions: 0 })] })],
        ["repetições fracionária", training({ exercises: [exercise({ repetitions: 2.5 })] })],
        ["repetições texto", training({ exercises: [exercise({ repetitions: "3" })] })],
        ["segurar negativo", training({ exercises: [exercise({ holdSeconds: -1 })] })],
        ["sem validation", training({ exercises: [exercise({ validation: undefined })] })],
        ["movimento fora da lista", training({ exercises: [exercise({ validation: { movement: "tongueOut", sensitivity: "normal" } })] })],
        ["sensibilidade inválida", training({ exercises: [exercise({ validation: { movement: "jawOpen", sensitivity: "extreme" } })] })],
        ["nota grande demais", training({ exercises: [exercise({ validation: { movement: "jawOpen", sensitivity: "soft", note: "x".repeat(301) } })] })],
        ["audiência ausente", { ...training(), audience: undefined }],
        ["audiência com paciente inexistente", training({ audience: { all: false, ids: ["p99"] } })],
        ["audiência com o admin", training({ audience: { all: false, ids: ["a1"] } })],
        ["vídeo com URL externa", training({ exercises: [exercise({ video: { url: "https://evil.example/x.mp4", name: "x", size: 1, mime: "video/mp4" } })] })],
        ["vídeo com javascript:", training({ exercises: [exercise({ video: { url: "javascript:alert(1)", name: "x", size: 1, mime: "video/mp4" } })] })],
        ["vídeo com traversal", training({ exercises: [exercise({ video: { url: "/media/../../etc/passwd", name: "x", size: 1, mime: "video/mp4" } })] })],
    ];

    it.each(cases)("%s", async (_label, body) => {
        const res = await create(body);
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ success: false, message: expect.any(String) });
    });

    it("os 7 movimentos e as 3 sensibilidades são aceitos", async () => {
        const movements = ["jawOpen", "mouthSmile", "mouthPucker", "cheekPuff", "lipPress", "alternateSmilePucker", "vowels"];
        const exercises = movements.map((movement, i) =>
            exercise({ validation: { movement, sensitivity: (["soft", "normal", "firm"] as const)[i % 3] } })
        );
        expect((await create(training({ exercises }))).status).toBe(201);
    });

    it("corpo que não é objeto → 400", async () => {
        const res = await request(ctx.app).post("/trainings").set(bearer(admin)).send([1, 2]);
        expect(res.status).toBe(400);
    });

    it("audiência all:true zera os ids", async () => {
        const res = await create(training({ audience: { all: true, ids: ["p1"] } }));
        expect(res.body.training.audience).toEqual({ all: true, ids: [] });
    });
});

describe("visibilidade por audiência", () => {
    let forTwo: string;
    let forAll: string;

    beforeAll(async () => {
        forTwo = (await create(training({ name: "Só Mariana e Lucas", audience: { all: false, ids: ["p3", "p4"] } }))).body.training.id;
        forAll = (await create(training({ name: "Para todos", audience: { all: true, ids: [] } }))).body.training.id;
    });

    const names = async (token?: string) => {
        const req = request(ctx.app).get("/trainings");
        const res = await (token ? req.set(bearer(token)) : req);
        expect(res.status).toBe(200);
        return res.body.trainings.map((t: any) => t.name) as string[];
    };

    it("anônimo vê só os 'para todos'", async () => {
        const list = await names();
        expect(list).toContain("Para todos");
        expect(list).not.toContain("Só Mariana e Lucas");
        expect(list).not.toContain("Aquecimento para apresentações");
    });

    it("Mariana (p3) vê os dela + os de todos", async () => {
        const list = await names(mariana);
        expect(list).toEqual(expect.arrayContaining(["Só Mariana e Lucas", "Para todos", "Aquecimento para apresentações"]));
    });

    it("Pedro (p2) NÃO vê os de Mariana", async () => {
        const list = await names(pedro);
        expect(list).toContain("Para todos");
        expect(list).not.toContain("Só Mariana e Lucas");
        expect(list).not.toContain("Aquecimento para apresentações");
    });

    it("admin vê todos, com a lista de pacientes", async () => {
        const res = await request(ctx.app).get("/trainings").set(bearer(admin));
        const mine = res.body.trainings.find((t: any) => t.id === forTwo);
        expect(mine.audience).toEqual({ all: false, ids: ["p3", "p4"] });
    });

    it("não-admin não recebe a lista de quem mais vê o treino", async () => {
        const res = await request(ctx.app).get("/trainings").set(bearer(mariana));
        const mine = res.body.trainings.find((t: any) => t.id === forTwo);
        expect(mine.audience).toEqual({ all: false, ids: [] });
    });

    it("GET /trainings/:id: 404 (e não 403) para quem não vê", async () => {
        expect((await request(ctx.app).get(`/trainings/${forTwo}`).set(bearer(pedro))).status).toBe(404);
        expect((await request(ctx.app).get(`/trainings/${forTwo}`)).status).toBe(404);
        expect((await request(ctx.app).get(`/trainings/${forTwo}`).set(bearer(mariana))).status).toBe(200);
        expect((await request(ctx.app).get(`/trainings/${forAll}`)).status).toBe(200);
    });

    it("token inválido na leitura → 401 (o app descarta a sessão)", async () => {
        expect((await request(ctx.app).get("/trainings").set(bearer("lixo"))).status).toBe(401);
    });

    it("mudar a audiência muda quem vê", async () => {
        await request(ctx.app)
            .put(`/trainings/${forTwo}`)
            .set(bearer(admin))
            .send(training({ name: "Só Mariana e Lucas", audience: { all: false, ids: ["p2"] } }));

        expect(await names(pedro)).toContain("Só Mariana e Lucas");
        expect(await names(mariana)).not.toContain("Só Mariana e Lucas");
    });
});

describe("GET /patients (admin)", () => {
    it("8 pacientes com dados de evolução de exemplo", async () => {
        const res = await request(ctx.app).get("/patients").set(bearer(admin));

        expect(res.status).toBe(200);
        expect(res.body.patients).toHaveLength(8);
        expect(res.body.patients.map((p: any) => p.id)).toEqual(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]);
        for (const p of res.body.patients) {
            expect(p.sample).toBe(true);
            expect(p.week).toHaveLength(7);
            expect(typeof p.adherence).toBe("number");
            expect(p.password).toBeUndefined();
        }
    });

    it("/patients/:id traz os treinos que o paciente vê; id desconhecido → 404", async () => {
        const res = await request(ctx.app).get("/patients/p3").set(bearer(admin));
        expect(res.status).toBe(200);
        expect(res.body.patient).toMatchObject({
            id: "p3",
            name: "Mariana Costa",
            trail: "Dicção e oratória",
            adherence: 93,
            sessions: 18,
            lastSession: "Hoje",
            week: [3, 3, 3, 2, 3, 3, 2],
        });
        expect(res.body.patient.trainings.map((t: any) => t.id)).toContain("t-ex");

        expect((await request(ctx.app).get("/patients/zz").set(bearer(admin))).status).toBe(404);
    });
});
