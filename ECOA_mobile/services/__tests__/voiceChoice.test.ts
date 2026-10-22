import { VoiceInfo, isPtBr, pickAutoVoice, ptBrVoices, resolveVoice, scoreVoice } from "../voiceChoice";

const v = (name: string, language = "pt-BR", extra: Partial<VoiceInfo> = {}): VoiceInfo => ({
    identifier: name,
    name,
    language,
    ...extra,
});

describe("isPtBr / ptBrVoices", () => {
    it("aceita pt-BR e pt_BR e recusa pt-PT e outros idiomas", () => {
        expect(isPtBr(v("a", "pt-BR"))).toBe(true);
        expect(isPtBr(v("a", "pt_BR"))).toBe(true);
        expect(isPtBr(v("a", "PT-br"))).toBe(true);
        expect(isPtBr(v("a", "pt-PT"))).toBe(false);
        expect(isPtBr(v("a", "en-US"))).toBe(false);
        expect(ptBrVoices([v("x", "en-US"), v("y")])).toHaveLength(1);
    });
});

describe("pickAutoVoice", () => {
    it("prefere vozes naturais/neurais às comuns", () => {
        const pick = pickAutoVoice([
            v("Microsoft Maria - Portuguese (Brazil)"),
            v("Microsoft Francisca Online (Natural) - Portuguese (Brazil)"),
            v("Google português do Brasil"),
        ]);
        expect(pick?.name).toContain("Francisca Online (Natural)");
    });

    it("prefere a voz do Google em português do Brasil a uma voz sem destaque", () => {
        const pick = pickAutoVoice([v("Voz Genérica"), v("Google português do Brasil")]);
        expect(pick?.name).toBe("Google português do Brasil");
    });

    it("reconhece vozes da Apple e evita as compactas/robóticas", () => {
        expect(pickAutoVoice([v("espeak-ng pt-br"), v("Luciana")])?.name).toBe("Luciana");
        expect(pickAutoVoice([v("Voz Compact"), v("Felipe")])?.name).toBe("Felipe");
    });

    it("usa a qualidade Enhanced quando o aparelho informa", () => {
        const pick = pickAutoVoice([v("Voz A"), v("Voz B", "pt-BR", { quality: "Enhanced" })]);
        expect(pick?.name).toBe("Voz B");
    });

    it("ignora vozes que não são pt-BR e devolve null sem nenhuma", () => {
        expect(pickAutoVoice([v("Samantha", "en-US"), v("Joana", "pt-PT")])).toBeNull();
        expect(pickAutoVoice([])).toBeNull();
    });

    it("em empate fica com a primeira", () => {
        expect(pickAutoVoice([v("Voz A"), v("Voz B")])?.name).toBe("Voz A");
    });

    it("dá nota baixa às robóticas", () => {
        expect(scoreVoice(v("eSpeak Compact"))).toBeLessThan(0);
    });
});

describe("resolveVoice", () => {
  const voices = [v("Luciana"), v("Voz Genérica"), v("Samantha", "en-US")];

    it("usa a escolhida enquanto ela existir e for pt-BR", () => {
        expect(resolveVoice(voices, "Voz Genérica")?.name).toBe("Voz Genérica");
    });

    it("cai na automática se a escolhida sumiu ou não é pt-BR", () => {
        expect(resolveVoice(voices, "Removida")?.name).toBe("Luciana");
        expect(resolveVoice(voices, "Samantha")?.name).toBe("Luciana");
        expect(resolveVoice(voices, null)?.name).toBe("Luciana");
    });
});
