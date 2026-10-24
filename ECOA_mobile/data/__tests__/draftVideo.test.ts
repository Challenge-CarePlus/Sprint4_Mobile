import { CustomExercise, Training, draftFromTraining, inputFromDraft } from "../training";

const video = { url: "/media/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4", name: "x.mp4", size: 10, mime: "video/mp4" };

function training(): Training {
    const ex: CustomExercise = {
        id: "srv-1",
        name: "Abrir a boca",
        steps: ["Abra"],
        repetitions: 3,
        holdSeconds: 3,
        relaxSeconds: 2,
        video,
        validation: { movement: "jawOpen", sensitivity: "normal" },
    };
    return {
        id: "t1",
        name: "Treino",
        audience: { all: true, ids: [] },
        exercises: [ex],
        createdAt: "",
        updatedAt: "",
        createdBy: "a1",
    };
}

describe("vídeo no rascunho e no corpo do PUT", () => {
    it("o rascunho copia o vídeo e remover não altera o treino original", () => {
        const t = training();
        const draft = draftFromTraining(t);
        draft.exercises[0] = { ...draft.exercises[0], video: null };
        expect(t.exercises[0].video).toEqual(video);
    });

    it("sem vídeo o corpo leva video:null explícito (JSON.stringify não descarta)", () => {
        const draft = draftFromTraining(training());
        draft.exercises[0] = { ...draft.exercises[0], video: null };
        const body = JSON.parse(JSON.stringify(inputFromDraft(draft)));
        expect(body.exercises[0]).toHaveProperty("video", null);
    });

    it("com vídeo mantém o vídeo e reenvia o id do servidor", () => {
        const body = inputFromDraft(draftFromTraining(training()));
        expect(body.exercises[0].video).toEqual(video);
        expect(body.exercises[0].id).toBe("srv-1");
    });

    it("exercício criado com vídeo undefined ainda sai como null", () => {
        const draft = draftFromTraining(training());
        draft.exercises[0] = { ...draft.exercises[0], video: undefined as unknown as null };
        const body = JSON.parse(JSON.stringify(inputFromDraft(draft)));
        expect(body.exercises[0].video).toBeNull();
    });
});
