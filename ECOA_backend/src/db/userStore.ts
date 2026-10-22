import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Login } from "../models/login";
import { MOCK_USERS, PATIENT_MOCK_PASSWORD } from "../data/seed";
import { ADMIN_PASSWORD } from "../config/adminPassword";
import { usersFile } from "../config/paths";
import { createJsonStore } from "./jsonStore";

const store = createJsonStore<Login[]>(usersFile, async () => {
    // Um hash pros pacientes (mesma senha, o custo do bcrypt roda uma vez) e outro pro admin.
    const [patientHash, adminHash] = await Promise.all([
        bcrypt.hash(PATIENT_MOCK_PASSWORD, 10),
        bcrypt.hash(ADMIN_PASSWORD, 10),
    ]);
    return MOCK_USERS.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.role === "admin" ? adminHash : patientHash,
        role: u.role,
    }));
});

let adminSynced: Promise<void> | null = null;

/**
 * Garante que o hash do admin no arquivo corresponde a ADMIN_PASSWORD. Se a env
 * mudou (ou o arquivo veio de um seed antigo), o hash é atualizado — a senha do
 * admin é sempre a da env, nunca a que ficou gravada. Roda uma vez por processo.
 */
export function initUsers(): Promise<void> {
    adminSynced ??= store
        .update(async (users) => {
            let changed = false;
            const next: Login[] = [];
            for (const user of users) {
                if (user.role === "admin" && !(await bcrypt.compare(ADMIN_PASSWORD, user.password))) {
                    next.push({ ...user, password: await bcrypt.hash(ADMIN_PASSWORD, 10) });
                    changed = true;
                } else {
                    next.push(user);
                }
            }
            return { next: changed ? next : undefined, result: undefined };
        })
        .catch((error) => {
            adminSynced = null; // tenta de novo na próxima chamada
            throw error;
        });
    return adminSynced;
}

export async function findByEmail(email: string): Promise<Login | undefined> {
    await initUsers();
    return (await store.read()).find((u) => u.email === email);
}

export async function findById(id: string): Promise<Login | undefined> {
    await initUsers();
    return (await store.read()).find((u) => u.id === id);
}

/** Cria o usuário de forma atômica; devolve null se o e-mail já existe. */
export async function createUser(data: Omit<Login, "id">): Promise<Login | null> {
    await initUsers();
    return store.update((users) => {
        if (users.some((u) => u.email === data.email)) return { result: null };

        const user: Login = { id: `u-${randomUUID().slice(0, 8)}`, ...data };
        return { next: [...users, user], result: user };
    });
}
