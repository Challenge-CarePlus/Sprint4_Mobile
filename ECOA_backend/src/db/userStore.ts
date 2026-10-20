import fs from "fs/promises";
import path from "path";
import { Login } from "../models/login";

// Relativo a este arquivo (e não ao cwd): funciona igual rodando de src/ (dev)
// ou de dist/ (build) — nos dois casos "../../src/db" aponta pro users.json
// versionado.
const DB_PATH =
    process.env.USERS_DB_PATH ?? path.resolve(__dirname, "../../src/db/users.json");

// Fila de operações: serializa todo read-modify-write do arquivo, senão
// cadastros simultâneos leem o mesmo estado e o último a gravar apaga os outros.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
}

async function read(): Promise<Login[]> {
    return JSON.parse(await fs.readFile(DB_PATH, "utf-8"));
}

async function write(users: Login[]) {
    // Grava em arquivo temporário e renomeia: um crash no meio não corrompe o JSON.
    const tmp = `${DB_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(users, null, 2));
    await fs.rename(tmp, DB_PATH);
}

export function findByEmail(email: string): Promise<Login | undefined> {
    return enqueue(async () => (await read()).find((u) => u.email === email));
}

export function findById(id: number): Promise<Login | undefined> {
    return enqueue(async () => (await read()).find((u) => u.id === id));
}

/** Cria o usuário de forma atômica; devolve null se o e-mail já existe. */
export function createUser(data: Omit<Login, "id">): Promise<Login | null> {
    return enqueue(async () => {
        const users = await read();
        if (users.some((u) => u.email === data.email)) return null;

        const id = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
        const user: Login = { id, ...data };
        users.push(user);
        await write(users);
        return user;
    });
}
