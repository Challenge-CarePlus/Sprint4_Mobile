import { Router } from "express";
import { requireRole } from "../middleware/auth";
import { listTrainings } from "../db/trainingStore";
import { MOCK_USERS, PATIENT_EVOLUTION } from "../data/seed";

const router = Router();

router.use(...requireRole("admin"));

async function buildPatients() {
    const trainings = await listTrainings();

    return MOCK_USERS.filter((u) => u.role === "patient").map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        trail: u.trail,
        ...PATIENT_EVOLUTION[u.id],
        // Evolução é fixa de exemplo (não há registro real de sessões nesta fase).
        sample: true,
        trainings: trainings
            .filter((t) => t.audience.all || t.audience.ids.includes(u.id))
            .map((t) => ({ id: t.id, name: t.name })),
    }));
}

router.get("/", async (_req, res) => {
    res.json({ success: true, patients: await buildPatients() });
});

router.get("/:id", async (req, res) => {
    const patient = (await buildPatients()).find((p) => p.id === req.params.id);

    if (!patient) {
        return res.status(404).json({ success: false, message: "Paciente não encontrado" });
    }

    res.json({ success: true, patient });
});

export default router;
