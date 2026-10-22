import fs from "fs/promises";
import path from "path";

/**
 * Arquivo JSON com fila: todo read-modify-write passa por uma fila única,
 * senão duas requisições simultâneas leem o mesmo estado e a última a gravar
 * apaga a outra. A gravação é atômica (arquivo temporário + rename). Se o
 * arquivo não existe, é criado a partir do seed.
 */
export function createJsonStore<T>(getPath: () => string, getSeed: () => Promise<T> | T) {
    let queue: Promise<unknown> = Promise.resolve();

    function enqueue<R>(task: () => Promise<R>): Promise<R> {
        const run = queue.then(task, task);
        queue = run.catch(() => undefined);
        return run;
    }

    async function save(data: T) {
        const file = getPath();
        await fs.mkdir(path.dirname(file), { recursive: true });
        const tmp = `${file}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(data, null, 2));
        await fs.rename(tmp, file);
    }

    async function load(): Promise<T> {
        try {
            return JSON.parse(await fs.readFile(getPath(), "utf-8"));
        } catch (error: any) {
            if (error?.code !== "ENOENT") throw error;
            const seed = await getSeed();
            await save(seed);
            return seed;
        }
    }

    return {
        read: () => enqueue(load),
        /** `next` presente = grava; ausente = nada mudou, não escreve. */
        update: <R>(fn: (data: T) => { next?: T; result: R } | Promise<{ next?: T; result: R }>) =>
            enqueue(async () => {
                const { next, result } = await fn(await load());
                if (next !== undefined) await save(next);
                return result;
            }),
    };
}
