import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Login } from "../models/login";
import { MOCK_PASSWORD, MOCK_USERS } from "../data/seed";
import { usersFile } from "../config/paths";
import { createJsonStore } from "./jsonStore";

const store = createJsonStore<Login[]>(usersFile, async () => {
    // Um hash só pra todos: a senha é a mesma e o custo do bcrypt roda uma vez.
    const hash = await bcrypt.hash(MOCK_PASSWORD, 10);
    return MOCK_USERS.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: hash,
        role: u.role,
    }));
});

export async function findByEmail(email: string): Promise<Login | undefined> {
    return (await store.read()).find((u) => u.email === email);
}

export async function findById(id: string): Promise<Login | undefined> {
    return (await store.read()).find((u) => u.id === id);
}

/** Cria o usuário de forma atômica; devolve null se o e-mail já existe. */
export function createUser(data: Omit<Login, "id">): Promise<Login | null> {
    return store.update((users) => {
        if (users.some((u) => u.email === data.email)) return { result: null };

        const user: Login = { id: `u-${randomUUID().slice(0, 8)}`, ...data };
        return { next: [...users, user], result: user };
    });
}
