import { ADMIN_PASSWORD_REQUIRED_MESSAGE, isKnownEmail, planEntry } from "../entryPlan";

describe("planEntry", () => {
    it("vazio entra como paciente anônimo", () => {
        expect(planEntry("", "")).toEqual({ kind: "guest" });
        expect(planEntry("   ", "")).toEqual({ kind: "guest" });
    });

    it("e-mail do admin sem senha pede a senha", () => {
        expect(planEntry("ecoafono@email.com", "")).toEqual({
            kind: "error",
            message: ADMIN_PASSWORD_REQUIRED_MESSAGE,
        });
        expect(planEntry("  EcoaFono@Email.com ", "")).toMatchObject({ kind: "error" });
    });

    it("e-mail comum sem senha segue anônimo", () => {
        expect(planEntry("ana.lima@ecoa.test", "")).toEqual({ kind: "guest" });
        expect(planEntry("qualquer@um.com", "")).toEqual({ kind: "guest" });
    });

    it("com e-mail e senha tenta o login, com o e-mail normalizado", () => {
        expect(planEntry(" Mariana.Costa@ecoa.test ", "ecoa2026")).toEqual({
            kind: "login",
            email: "mariana.costa@ecoa.test",
            password: "ecoa2026",
        });
    });
});

describe("isKnownEmail", () => {
    it("reconhece admin e pacientes mockados, sem diferenciar caixa", () => {
        expect(isKnownEmail("ECOAFONO@email.com")).toBe(true);
        expect(isKnownEmail("jose.pereira@ecoa.test")).toBe(true);
        expect(isKnownEmail("outro@email.com")).toBe(false);
    });
});
