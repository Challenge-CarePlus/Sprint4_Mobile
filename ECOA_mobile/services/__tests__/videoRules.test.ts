import { MAX_VIDEO_BYTES, guessVideoMime, validateVideo } from "../videoRules";

describe("validateVideo", () => {
    const ok = { size: 5 * 1024 * 1024, mime: "video/mp4", durationSeconds: 20 };

    it("aceita vídeo dentro dos limites", () => {
        expect(validateVideo(ok)).toBeNull();
        expect(validateVideo({ ...ok, mime: "video/webm" })).toBeNull();
        expect(validateVideo({ ...ok, mime: "video/quicktime", durationSeconds: undefined })).toBeNull();
    });

    it("recusa tipo inválido", () => {
        expect(validateVideo({ ...ok, mime: "image/png" })).toContain("Formato");
        expect(validateVideo({ ...ok, mime: "" })).toContain("Formato");
    });

    it("recusa mais de 30 MB, citando o tamanho", () => {
        const message = validateVideo({ ...ok, size: MAX_VIDEO_BYTES + 1024 * 1024 });
        expect(message).toContain("30 MB");
        expect(message).toContain("31,0 MB");
    });

    it("recusa mais de 60 s, mas aceita exatamente 60", () => {
        expect(validateVideo({ ...ok, durationSeconds: 61 })).toContain("60 s");
        expect(validateVideo({ ...ok, durationSeconds: 60 })).toBeNull();
    });

    it("recusa arquivo vazio", () => {
        expect(validateVideo({ ...ok, size: 0 })).toContain("ler");
    });
});

describe("guessVideoMime", () => {
    it("prefere o tipo declarado e cai na extensão", () => {
        expect(guessVideoMime("a.mp4", "video/webm")).toBe("video/webm");
        expect(guessVideoMime("clip.MOV", "")).toBe("video/quicktime");
        expect(guessVideoMime("x.txt", null)).toBe("");
    });
});
