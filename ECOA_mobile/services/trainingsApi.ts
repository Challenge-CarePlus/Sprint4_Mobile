import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "../config/apiConfig";
import { Patient, Training, TrainingInput, newLocalId } from "../data/training";
import api from "./api";

/**
 * Cliente de /trainings e /patients (contrato real do back-end v3). Com
 * EXPO_PUBLIC_API_MOCK=true usa um armazenamento local — só para desenvolver sem back-end.
 */
export const API_MOCK = process.env.EXPO_PUBLIC_API_MOCK?.trim().toLowerCase() === "true";

export interface TrainingsApi {
    listTrainings(): Promise<Training[]>;
    getTraining(id: string): Promise<Training>;
    createTraining(input: TrainingInput): Promise<Training>;
    updateTraining(id: string, input: TrainingInput): Promise<Training>;
    deleteTraining(id: string): Promise<void>;
    listPatients(): Promise<Patient[]>;
    getPatient(id: string): Promise<Patient>;
}

/** Mensagem amigável de um erro de rede/API (o servidor manda `{ success:false, message }`). */
export function apiErrorMessage(error: unknown, fallback = "Não foi possível falar com o servidor. Tente de novo."): string {
    const e = error as { response?: { data?: { message?: unknown } }; message?: string };
    const message = e?.response?.data?.message;
    return typeof message === "string" && message ? message : fallback;
}

/** `/media/x.mp4` (relativa) → endereço completo na base da API. Já absolutas e blobs passam direto. */
export function resolveMediaUrl(url: string): string {
    if (/^(https?:|blob:|data:|file:)/i.test(url)) return url;
    return `${API_BASE_URL.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

const httpApi: TrainingsApi = {
    async listTrainings() {
        return (await api.get("/trainings")).data.trainings;
    },
    async getTraining(id) {
        return (await api.get(`/trainings/${encodeURIComponent(id)}`)).data.training;
    },
    async createTraining(input) {
        return (await api.post("/trainings", input)).data.training;
    },
    async updateTraining(id, input) {
        return (await api.put(`/trainings/${encodeURIComponent(id)}`, input)).data.training;
    },
    async deleteTraining(id) {
        await api.delete(`/trainings/${encodeURIComponent(id)}`);
    },
    async listPatients() {
        return (await api.get("/patients")).data.patients;
    },
    async getPatient(id) {
        return (await api.get(`/patients/${encodeURIComponent(id)}`)).data.patient;
    },
};

/* ---------------- fallback local (dev) ---------------- */

const MOCK_KEY = "@ecoa_mock_trainings";

const MOCK_PATIENTS: Omit<Patient, "trainings">[] = [
    { id: "p1", name: "Ana Beatriz Lima", email: "ana.lima@ecoa.test", trail: "Infantil", adherence: 86, sessions: 14, lastSession: "Hoje", week: [2, 3, 2, 3, 3, 1, 2], sample: true },
    { id: "p2", name: "Pedro Henrique Souza", email: "pedro.souza@ecoa.test", trail: "Infantil", adherence: 52, sessions: 7, lastSession: "Há 3 dias", week: [1, 0, 2, 0, 1, 0, 0], sample: true },
    { id: "p3", name: "Mariana Costa", email: "mariana.costa@ecoa.test", trail: "Dicção e oratória", adherence: 93, sessions: 18, lastSession: "Hoje", week: [3, 3, 3, 2, 3, 3, 2], sample: true },
    { id: "p4", name: "Lucas Almeida", email: "lucas.almeida@ecoa.test", trail: "Dicção e oratória", adherence: 68, sessions: 10, lastSession: "Ontem", week: [2, 1, 2, 0, 2, 1, 1], sample: true },
    { id: "p5", name: "Juliana Rocha", email: "juliana.rocha@ecoa.test", trail: "Dicção e oratória", adherence: 41, sessions: 5, lastSession: "Há 6 dias", week: [0, 1, 0, 0, 1, 0, 0], sample: true },
    { id: "p6", name: "Antônio Ferreira", email: "antonio.ferreira@ecoa.test", trail: "Fortalecimento orofacial", adherence: 77, sessions: 12, lastSession: "Ontem", week: [2, 2, 1, 2, 2, 1, 0], sample: true },
    { id: "p7", name: "Helena Martins", email: "helena.martins@ecoa.test", trail: "Fortalecimento orofacial", adherence: 89, sessions: 16, lastSession: "Hoje", week: [3, 2, 3, 3, 2, 2, 3], sample: true },
    { id: "p8", name: "José Carlos Pereira", email: "jose.pereira@ecoa.test", trail: "Fortalecimento orofacial", adherence: 60, sessions: 9, lastSession: "Há 2 dias", week: [1, 2, 1, 1, 0, 2, 1], sample: true },
];

function seedTrainings(): Training[] {
    const now = new Date().toISOString();
    const validation = { movement: "jawOpen" as const, sensitivity: "normal" as const };

    return [
        {
            id: "t-ex",
            name: "Aquecimento para apresentações",
            example: true,
            audience: { all: false, ids: ["p3", "p4", "p5"] },
            createdAt: now,
            updatedAt: now,
            createdBy: "a1",
            exercises: [
                { id: "e1", name: "Vibração de lábios", goal: "Aquece a musculatura antes de falar", steps: ["Junte os lábios sem apertar.", "Sopre o ar fazendo os lábios vibrarem (brrr).", "Mantenha por 5 segundos e descanse."], repetitions: 4, holdSeconds: 5, relaxSeconds: 2, video: null, validation: { movement: "mouthPucker", sensitivity: "normal" } },
                { id: "e2", name: "Sobrearticulação", goal: "Clareza na pronúncia", steps: ["Leia uma frase curta em voz alta.", "Exagere o movimento de cada sílaba.", "Repita a frase em ritmo normal."], repetitions: 3, holdSeconds: 0, relaxSeconds: 2, video: null, validation },
            ],
        },
    ];
}

async function readMock(): Promise<Training[]> {
    try {
        const stored = await AsyncStorage.getItem(MOCK_KEY);
        if (stored) return JSON.parse(stored) as Training[];
    } catch {
        // cai no seed
    }
    const seed = seedTrainings();
    await AsyncStorage.setItem(MOCK_KEY, JSON.stringify(seed));
    return seed;
}

const writeMock = (list: Training[]) => AsyncStorage.setItem(MOCK_KEY, JSON.stringify(list));

const mockApi: TrainingsApi = {
    listTrainings: readMock,
    async getTraining(id) {
        const found = (await readMock()).find((t) => t.id === id);
        if (!found) throw new Error("Treino não encontrado");
        return found;
    },
    async createTraining(input) {
        const now = new Date().toISOString();
        const training: Training = {
            ...input,
            id: newLocalId("t"),
            createdAt: now,
            updatedAt: now,
            createdBy: "a1",
            exercises: input.exercises.map((e) => ({ ...e, id: newLocalId("e") })),
        };
        await writeMock([training, ...(await readMock())]);
        return training;
    },
    async updateTraining(id, input) {
        const list = await readMock();
        const current = list.find((t) => t.id === id);
        if (!current) throw new Error("Treino não encontrado");
        const updated: Training = {
            ...current,
            ...input,
            example: false,
            updatedAt: new Date().toISOString(),
            exercises: input.exercises.map((e) => ({ ...e, id: newLocalId("e") })),
        };
        await writeMock(list.map((t) => (t.id === id ? updated : t)));
        return updated;
    },
    async deleteTraining(id) {
        await writeMock((await readMock()).filter((t) => t.id !== id));
    },
    async listPatients() {
        const trainings = await readMock();
        return MOCK_PATIENTS.map((p) => ({
            ...p,
            trainings: trainings
                .filter((t) => t.audience.all || t.audience.ids.includes(p.id))
                .map((t) => ({ id: t.id, name: t.name })),
        }));
    },
    async getPatient(id) {
        const found = (await mockApi.listPatients()).find((p) => p.id === id);
        if (!found) throw new Error("Paciente não encontrado");
        return found;
    },
};

export const trainingsApi: TrainingsApi = API_MOCK ? mockApi : httpApi;
