jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { DEFAULT_SETTINGS, mergeSettings } from "../settingsStorage";

describe("mergeSettings", () => {
    it("quem já tinha câmera e captura ganha a voz com os padrões (migração)", () => {
        const merged = mergeSettings({ captureInterval: 300, preferredCamera: "back" });

        expect(merged).toEqual({ ...DEFAULT_SETTINGS, captureInterval: 300, preferredCamera: "back" });
        expect(merged.voiceEnabled).toBe(true);
        expect(merged.voiceRate).toBe(0.9);
        expect(merged.voiceId).toBeNull();
    });

    it("mantém a voz salva", () => {
        expect(mergeSettings({ voiceEnabled: false, voiceId: "Luciana", voiceRate: 0.8 })).toMatchObject({
            voiceEnabled: false,
            voiceId: "Luciana",
            voiceRate: 0.8,
        });
    });

    it("troca valores inválidos pelo padrão", () => {
        expect(mergeSettings({ voiceEnabled: "sim", voiceId: 42, voiceRate: 3 })).toMatchObject({
            voiceEnabled: true,
            voiceId: null,
            voiceRate: 0.9,
        });
    });

    it("sem nada salvo (ou lixo) devolve os padrões", () => {
        expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
        expect(mergeSettings("texto")).toEqual(DEFAULT_SETTINGS);
    });
});
