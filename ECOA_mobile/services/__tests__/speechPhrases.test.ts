jest.mock("../speech", () => ({ speak: jest.fn() }));

import { gentlePrompt, phraseFor, rateOffsetFor } from "../speechPhrases";

describe("gentlePrompt", () => {
    it("troca incentivos secos por versões gentis", () => {
        expect(gentlePrompt("Abra mais a boca")).toBe("Quando quiser, abra um pouquinho mais a boca");
        expect(gentlePrompt("Sorria mais")).toBe("Se puder, sorria um pouquinho mais");
    });

    it("mensagens desconhecidas (ex.: escritas pelo admin) ganham um começo suave", () => {
        expect(gentlePrompt("Feche os olhos devagar.")).toBe("Quando quiser, feche os olhos devagar");
    });

    it("infantil usa 'Vamos lá' no lugar do começo de adulto", () => {
        expect(gentlePrompt("Abra mais a boca", "children")).toBe("Vamos lá, abra um pouquinho mais a boca");
        expect(gentlePrompt("Feche os olhos", "children")).toBe("Vamos lá, feche os olhos");
    });
});

describe("gentlePrompt — mensagens que o detector já escreve de forma gentil", () => {
    it("'Quase lá, tente de novo' ganha a versão da tabela, sem prefixo duplicado", () => {
        expect(gentlePrompt("Quase lá, tente de novo")).toBe("Está quase, pode tentar de novo");
    });

    it("não prefixa mensagens que já começam de forma gentil ou orientam o próximo passo", () => {
        expect(gentlePrompt("Agora, o E")).toBe("Agora, o E");
        expect(gentlePrompt("Comece com o A, abrindo bem a boca")).toBe("Comece com o A, abrindo bem a boca");
        expect(gentlePrompt("Quando puder, solte o ar")).toBe("Quando puder, solte o ar".replace("Quando puder", "Quando puder"));
        expect(gentlePrompt("Que tal um sorriso?")).toBe("Que tal um sorriso?");
    });

    it("infantil junta 'Vamos lá' sem repetir 'Vamos'", () => {
        expect(gentlePrompt("Vamos tentar de novo", "children")).toBe("Vamos tentar de novo");
        expect(gentlePrompt("Agora, o E", "children")).toBe("Vamos lá, agora, o E");
    });

    it("as mensagens de incentivo dos exercícios do app (imperativas) ganham o começo suave", () => {
        expect(gentlePrompt("Expire devagar pela boca")).toBe("Quando quiser, expire devagar pela boca");
    });
});

describe("phraseFor", () => {
    it("usa as frases do mapa de Orientação, sem o 'Ótimo!' seco", () => {
        expect(phraseFor("holding")).toBe("Isso, mantenha assim… você está indo bem.");
        expect(phraseFor("release")).toBe("Muito bem.");
        expect(phraseFor("relax")).toBe("Agora relaxe, respire com calma.");
        expect(phraseFor("complete")).toBe("Pronto, exercício concluído. Muito bem.");
    });

    it("tem versão calorosa para a trilha infantil e curta para idosos", () => {
        expect(phraseFor("complete", "children")).toContain("Parabéns");
        expect(phraseFor("holding", "elderly")).toBe("Isso, mantenha assim.");
        expect(phraseFor("holding", "elderly").length).toBeLessThan(phraseFor("holding", "adults").length);
    });

    it("prompt usa a mensagem recebida", () => {
        expect(phraseFor("prompt", "adults", "Abra mais a boca")).toContain("pouquinho");
    });

    it("nenhuma frase tem exclamação dupla ou 'Ótimo!'", () => {
        for (const age of ["adults", "children", "elderly"] as const) {
            for (const kind of ["calibrate-start", "no-face", "holding", "release", "relax", "complete"] as const) {
                const text = phraseFor(kind, age);
                expect(text).not.toMatch(/!!|Ótimo!/);
            }
        }
    });
});

describe("rateOffsetFor", () => {
    it("só idosos ficam mais lentos", () => {
        expect(rateOffsetFor("elderly")).toBe(-0.05);
        expect(rateOffsetFor("adults")).toBe(0);
        expect(rateOffsetFor("children")).toBe(0);
    });
});
