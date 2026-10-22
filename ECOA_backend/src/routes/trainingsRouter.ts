import { randomUUID } from "crypto";
import { Router } from "express";
import { AuthPayload, optionalAuth, requireRole } from "../middleware/auth";
import {
    createTraining,
    deleteTraining,
    findTraining,
    listTrainings,
    replaceTraining,
} from "../db/trainingStore";
import { allVideosExist, removeOrphanVideos, videoUrlsOf } from "../media";
import { Training } from "../models/training";
import { validateTrainingInput } from "../validation/training";

const router = Router();

const VIDEO_MISSING = "Vídeo não encontrado, envie de novo";

const isVisibleTo = (training: Training, user?: AuthPayload) =>
    user?.role === "admin" ||
    training.audience.all ||
    (!!user && training.audience.ids.includes(user.id));

// Pacientes só precisam saber se o treino é pra eles: a lista de quem mais o vê é do admin.
const present = (training: Training, user?: AuthPayload): Training =>
    user?.role === "admin"
        ? training
        : { ...training, audience: { all: training.audience.all, ids: [] } };

router.get("/", optionalAuth, async (_req, res) => {
    const user = res.locals.user as AuthPayload | undefined;
    const trainings = (await listTrainings()).filter((t) => isVisibleTo(t, user));

    res.json({ success: true, trainings: trainings.map((t) => present(t, user)) });
});

router.get("/:id", optionalAuth, async (req, res) => {
    const user = res.locals.user as AuthPayload | undefined;
    const training = await findTraining(String(req.params.id));

    // 404 (e não 403) pra treino que o usuário não vê: não confirma que ele existe.
    if (!training || !isVisibleTo(training, user)) {
        return res.status(404).json({ success: false, message: "Treino não encontrado" });
    }

    res.json({ success: true, training: present(training, user) });
});

router.post("/", ...requireRole("admin"), async (req, res) => {
    const parsed = validateTrainingInput(req.body);
    if (!parsed.ok) {
        return res.status(400).json({ success: false, message: parsed.message });
    }

    if (!(await allVideosExist(parsed.value.exercises))) {
        return res.status(400).json({ success: false, message: VIDEO_MISSING });
    }

    const now = new Date().toISOString();
    const training = await createTraining({
        id: randomUUID(),
        ...parsed.value,
        createdAt: now,
        updatedAt: now,
        createdBy: (res.locals.user as AuthPayload).id,
    });

    res.status(201).json({ success: true, training });
});

router.put("/:id", ...requireRole("admin"), async (req, res) => {
    const parsed = validateTrainingInput(req.body);
    if (!parsed.ok) {
        return res.status(400).json({ success: false, message: parsed.message });
    }

    if (!(await allVideosExist(parsed.value.exercises))) {
        return res.status(400).json({ success: false, message: VIDEO_MISSING });
    }

    const replaced = await replaceTraining(String(req.params.id), (previous) => ({
        ...previous,
        ...parsed.value,
        updatedAt: new Date().toISOString(),
    }));

    if (!replaced) {
        return res.status(404).json({ success: false, message: "Treino não encontrado" });
    }

    // Vídeo trocado ou removido num exercício deixa o arquivo antigo sem dono.
    await removeOrphanVideos(videoUrlsOf(replaced.previous));

    res.json({ success: true, training: replaced.current });
});

router.delete("/:id", ...requireRole("admin"), async (req, res) => {
    const removed = await deleteTraining(String(req.params.id));

    if (!removed) {
        return res.status(404).json({ success: false, message: "Treino não encontrado" });
    }

    await removeOrphanVideos(videoUrlsOf(removed));

    res.json({ success: true });
});

export default router;
