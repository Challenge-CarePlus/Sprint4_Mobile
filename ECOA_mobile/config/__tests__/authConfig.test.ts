import { parseAuthRequired } from "../authConfig";

describe("parseAuthRequired", () => {
    it("é falso por padrão (sem variável, vazia ou valor desconhecido)", () => {
        expect(parseAuthRequired(undefined)).toBe(false);
        expect(parseAuthRequired("")).toBe(false);
        expect(parseAuthRequired("false")).toBe(false);
        expect(parseAuthRequired("1")).toBe(false);
    });

    it("liga só com 'true' (sem diferenciar caixa nem espaços)", () => {
        expect(parseAuthRequired("true")).toBe(true);
        expect(parseAuthRequired(" TRUE ")).toBe(true);
    });
});
