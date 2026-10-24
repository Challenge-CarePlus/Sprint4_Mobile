import fs from "fs";
import path from "path";
import request from "supertest";
import { bearer, exercise, login, makeApp, training } from "./helpers";

const ctx = makeApp();
afterAll(ctx.cleanup);

let admin: string;
let mariana: string;
beforeAll(async () => {
    admin = await login(ctx.app, "ecoafono@email.com");
    mariana = await login(ctx.app, "mariana.costa@ecoa.test");
});

const get = (token = admin) => request(ctx.app).get("/trainings/t-ex").set(bearer(token));
const put = (body: unknown, token = admin) => request(ctx.app).put("/trainings/t-ex").set(bearer(token)).send(body as object);
const del = (id: string, token = admin) => request(ctx.app).delete(`/trainings/${id}`).set(bearer(token));
const asInput = (t: any, overrides: Record<string, unknown> = {}) => ({
    name: t.name,
    audience: t.audience,
    exercises: t.exercises,
    ...overrides,
});

describe("F7: treino padrão não pode ser excluído", () => {
    it("DELETE do exemplo → 403 com a mensagem; o treino continua lá", async () => {
        const res = await del("t-ex");

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ success: false, message: "Treino padrão não pode ser excluído" });
        expect((await get()).status).toBe(200);
    });

    it("401 sem token e 403 para paciente continuam valendo (e a mensagem é a de papel)", async () => {
        expect((await request(ctx.app).delete("/trainings/t-ex")).status).toBe(401);
        const asPatient = await del("t-ex", mariana);
        expect(asPatient.status).toBe(403);
        expect(asPatient.body.message).not.toBe("Treino padrão não pode ser excluído");
    });

    it("treino personalizado e os exercícios dele continuam excluíveis; inexistente → 404", async () => {
        const created = (await request(ctx.app).post("/trainings").set(bearer(admin)).send(training())).body.training;

        expect(created.protected).toBeUndefined();
        expect(created.exercises.every((e: any) => e.protected === undefined)).toBe(true);
        expect((await del(created.id)).status).toBe(200);
        expect((await del(created.id)).status).toBe(404);
    });
});

describe("F7: PUT no treino padrão não remove os exercícios originais", () => {
    it("remover um exercício original → 400 com mensagem clara e nada muda", async () => {
        const current = (await get()).body.training;
        const res = await put(asInput(current, { exercises: current.exercises.slice(1) }));

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ success: false, message: "Exercícios padrão não podem ser removidos" });
        expect((await get()).body.training.exercises).toHaveLength(2);
    });

    it("trocar os originais por exercícios novos (sem os ids) também é recusado", async () => {
        const res = await put({ name: "Outro", audience: { all: true, ids: [] }, exercises: [exercise({ name: "Novo" })] });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Exercícios padrão não podem ser removidos");
    });

    it("mandar o id do original no corpo de outro exercício não engana: precisa ser mantido", async () => {
        const current = (await get()).body.training;
        const res = await put(asInput(current, { exercises: [current.exercises[0], current.exercises[0]] }));
        // o id e1 só vale uma vez; e2 sumiu → recusado
        expect(res.status).toBe(400);
    });

    it("editar nome, público e campos dos originais é permitido e os ids ficam os mesmos", async () => {
        const current = (await get()).body.training;
        const edited = current.exercises.map((e: any, i: number) => ({ ...e, name: `Editado ${i}`, repetitions: 9 }));

        const res = await put(asInput(current, { name: "Aquecimento (editado)", audience: { all: true, ids: [] }, exercises: edited }));

        expect(res.status).toBe(200);
        expect(res.body.training.name).toBe("Aquecimento (editado)");
        expect(res.body.training.audience.all).toBe(true);
        expect(res.body.training.exercises.map((e: any) => e.id)).toEqual(["e1", "e2"]);
        expect(res.body.training.exercises.map((e: any) => e.name)).toEqual(["Editado 0", "Editado 1"]);
        expect(res.body.training.example).toBe(true);
    });

    it("pode ADICIONAR exercícios novos (excluíveis) e depois removê-los, mantendo os originais", async () => {
        const current = (await get()).body.training;
        const added = await put(asInput(current, { exercises: [...current.exercises, exercise({ name: "Extra" })] }));
        expect(added.status).toBe(200);
        const [e1, e2, extra] = added.body.training.exercises;
        expect([e1.id, e2.id]).toEqual(["e1", "e2"]);
        expect(extra.id).not.toMatch(/^e[12]$/);
        expect(extra.protected).toBeUndefined();

        const removed = await put(asInput(added.body.training, { exercises: [e1, e2] }));
        expect(removed.status).toBe(200);
        expect(removed.body.training.exercises).toHaveLength(2);
    });

    it("PUT por paciente/sem token segue 403/401", async () => {
        expect((await put({}, mariana)).status).toBe(403);
        expect((await request(ctx.app).put("/trainings/t-ex").send({})).status).toBe(401);
    });
});

describe("F7: ids estáveis e preservados no PUT", () => {
    it("o seed tem ids fixos (t-ex, e1, e2) e cria o exemplo de novo se o arquivo não existe", async () => {
        const first = makeApp();
        const t1 = await login(first.app, "ecoafono@email.com");
        const a = (await request(first.app).get("/trainings/t-ex").set(bearer(t1))).body.training;
        first.cleanup();

        const second = makeApp();
        const t2 = await login(second.app, "ecoafono@email.com");
        const b = (await request(second.app).get("/trainings/t-ex").set(bearer(t2))).body.training;
        second.cleanup();

        expect(a.exercises.map((e: any) => e.id)).toEqual(["e1", "e2"]);
        expect(b.exercises.map((e: any) => e.id)).toEqual(["e1", "e2"]);
    });

    it("apagar o arquivo de treinos e reiniciar recria o exemplo com os mesmos ids", async () => {
        const first = makeApp();
        const token = await login(first.app, "ecoafono@email.com");
        await request(first.app).get("/trainings").set(bearer(token));
        fs.rmSync(path.join(first.dir, "data", "trainings.json"));

        const again = makeApp({ reuseDirOf: first });
        const t = await login(again.app, "ecoafono@email.com");
        const res = await request(again.app).get("/trainings/t-ex").set(bearer(t));
        expect(res.status).toBe(200);
        expect(res.body.training.exercises.map((e: any) => e.id)).toEqual(["e1", "e2"]);
        first.cleanup();
    });

    it("treino personalizado: PUT preserva o id dos exercícios que já existiam e gera para os novos", async () => {
        const created = (await request(ctx.app).post("/trainings").set(bearer(admin)).send(training({ exercises: [exercise({ name: "A" }), exercise({ name: "B" })] }))).body.training;
        const [a, b] = created.exercises;

        const res = await request(ctx.app)
            .put(`/trainings/${created.id}`)
            .set(bearer(admin))
            .send(asInput(created, { exercises: [b, a, exercise({ id: a.id, name: "Cópia" }), exercise({ id: "forjado", name: "Novo" })] }));

        expect(res.status).toBe(200);
        const ids = res.body.training.exercises.map((e: any) => e.id);
        expect(ids.slice(0, 2)).toEqual([b.id, a.id]); // preservados, na nova ordem
        expect(new Set(ids).size).toBe(4); // a cópia com id repetido e o forjado ganham ids novos
        expect(ids).not.toContain("forjado");
    });
});

describe("F7: o campo protected é calculado, não forjável", () => {
    it("GET (admin e paciente) marca o treino e só os exercícios do seed", async () => {
        for (const token of [admin, mariana]) {
            const t = (await get(token)).body.training;
            expect(t.protected).toBe(true);
            expect(t.example).toBe(true);
            expect(t.exercises.every((e: any) => e.protected === true)).toBe(true);
        }
        const list = (await request(ctx.app).get("/trainings").set(bearer(admin))).body.trainings;
        expect(list.find((t: any) => t.id === "t-ex").protected).toBe(true);
    });

    it("cliente não consegue marcar nem desmarcar: protected no corpo é ignorado", async () => {
        // marcar um treino/exercício novo como protegido
        const created = await request(ctx.app)
            .post("/trainings")
            .set(bearer(admin))
            .send({ ...training(), protected: true, example: true, exercises: [{ ...exercise(), protected: true }] });
        expect(created.status).toBe(201);
        expect(created.body.training.protected).toBeUndefined();
        expect(created.body.training.exercises[0].protected).toBeUndefined();
        expect((await del(created.body.training.id)).status).toBe(200);

        // desmarcar o padrão
        const current = (await get()).body.training;
        const res = await put({
            ...asInput(current),
            protected: false,
            example: false,
            exercises: current.exercises.map((e: any) => ({ ...e, protected: false })),
        });
        expect(res.status).toBe(200);
        expect(res.body.training.protected).toBe(true);
        expect(res.body.training.example).toBe(true);
        expect(res.body.training.exercises.every((e: any) => e.protected === true)).toBe(true);
        expect((await del("t-ex")).status).toBe(403);

        // e o arquivo não guarda o campo
        const raw = fs.readFileSync(path.join(ctx.dir, "data", "trainings.json"), "utf-8");
        expect(raw).not.toContain('"protected"');
    });
});

describe("F4: allowManualCount no exercício", () => {
    const send = (method: "post" | "put", url: string, body: unknown) =>
        (request(ctx.app) as any)[method](url).set(bearer(admin)).send(body);

    it("aceita true e false, devolve no POST/GET e não exige o campo", async () => {
        const created = await send("post", "/trainings", training({
            exercises: [exercise({ allowManualCount: true }), exercise({ allowManualCount: false }), exercise()],
        }));

        expect(created.status).toBe(201);
        const [a, b, c] = created.body.training.exercises;
        expect(a.allowManualCount).toBe(true);
        expect(b.allowManualCount).toBe(false);
        expect(c.allowManualCount).toBeUndefined();

        const read = (await request(ctx.app).get(`/trainings/${created.body.training.id}`).set(bearer(admin))).body.training;
        expect(read.exercises.map((e: any) => e.allowManualCount)).toEqual([true, false, undefined]);
    });

    it.each([["sim"], [1], [0], [null], [{}], [[true]]])("valor não-boolean %j → 400", async (value) => {
        const res = await send("post", "/trainings", training({ exercises: [exercise({ allowManualCount: value })] }));
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/allowManualCount/);
    });

    it("persiste no PUT (ligar, desligar) e o padrão segue protegido", async () => {
        const created = (await send("post", "/trainings", training())).body.training;
        const on = await send("put", `/trainings/${created.id}`, { ...training(), exercises: [{ ...created.exercises[0], allowManualCount: true }] });
        expect(on.body.training.exercises[0].allowManualCount).toBe(true);
        expect(on.body.training.exercises[0].id).toBe(created.exercises[0].id);

        const off = await send("put", `/trainings/${created.id}`, { ...training(), exercises: [{ ...on.body.training.exercises[0], allowManualCount: false }] });
        expect(off.body.training.exercises[0].allowManualCount).toBe(false);

        const std = (await get()).body.training;
        const res = await put(asInput(std, { exercises: std.exercises.map((e: any) => ({ ...e, allowManualCount: true })) }));
        expect(res.status).toBe(200);
        expect(res.body.training.exercises.every((e: any) => e.protected === true && e.allowManualCount === true)).toBe(true);
    });

    it("HTML no nome continua recusado junto do campo novo", async () => {
        const res = await send("post", "/trainings", training({ exercises: [exercise({ name: "<b>x</b>", allowManualCount: true })] }));
        expect(res.status).toBe(400);
    });
});
