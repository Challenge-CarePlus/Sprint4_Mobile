import { Training } from "../models/training";

// Senha dos PACIENTES mockados (usuários de teste sem privilégio, só pra demonstração
// no evento). A senha do ADMIN não mora aqui nem em lugar nenhum do repositório:
// vem de ADMIN_PASSWORD (ver config/adminPassword.ts).
export const PATIENT_MOCK_PASSWORD = "ecoa2026";

export type MockUser = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "patient";
    /** Trilha atual — só pacientes (usada na tela de Evolução). */
    trail?: string;
};

export const MOCK_USERS: MockUser[] = [
    { id: "a1", name: "Equipe Ecoa", email: "ecoafono@email.com", role: "admin" },
    { id: "p1", name: "Ana Beatriz Lima", email: "ana.lima@ecoa.test", role: "patient", trail: "Infantil" },
    { id: "p2", name: "Pedro Henrique Souza", email: "pedro.souza@ecoa.test", role: "patient", trail: "Infantil" },
    { id: "p3", name: "Mariana Costa", email: "mariana.costa@ecoa.test", role: "patient", trail: "Dicção e oratória" },
    { id: "p4", name: "Lucas Almeida", email: "lucas.almeida@ecoa.test", role: "patient", trail: "Dicção e oratória" },
    { id: "p5", name: "Juliana Rocha", email: "juliana.rocha@ecoa.test", role: "patient", trail: "Dicção e oratória" },
    { id: "p6", name: "Antônio Ferreira", email: "antonio.ferreira@ecoa.test", role: "patient", trail: "Fortalecimento orofacial" },
    { id: "p7", name: "Helena Martins", email: "helena.martins@ecoa.test", role: "patient", trail: "Fortalecimento orofacial" },
    { id: "p8", name: "José Carlos Pereira", email: "jose.pereira@ecoa.test", role: "patient", trail: "Fortalecimento orofacial" },
];

export const PATIENT_IDS = MOCK_USERS.filter((u) => u.role === "patient").map((u) => u.id);

/** Dados de evolução de EXEMPLO (fixos, do protótipo) — a UI rotula como "dados de exemplo". */
export type PatientEvolution = {
    adherence: number; // % de adesão
    sessions: number;
    lastSession: string;
    week: number[]; // exercícios por dia, últimos 7 dias
};

export const PATIENT_EVOLUTION: Record<string, PatientEvolution> = {
    p1: { adherence: 86, sessions: 14, lastSession: "Hoje", week: [2, 3, 2, 3, 3, 1, 2] },
    p2: { adherence: 52, sessions: 7, lastSession: "Há 3 dias", week: [1, 0, 2, 0, 1, 0, 0] },
    p3: { adherence: 93, sessions: 18, lastSession: "Hoje", week: [3, 3, 3, 2, 3, 3, 2] },
    p4: { adherence: 68, sessions: 10, lastSession: "Ontem", week: [2, 1, 2, 0, 2, 1, 1] },
    p5: { adherence: 41, sessions: 5, lastSession: "Há 6 dias", week: [0, 1, 0, 0, 1, 0, 0] },
    p6: { adherence: 77, sessions: 12, lastSession: "Ontem", week: [2, 2, 1, 2, 2, 1, 0] },
    p7: { adherence: 89, sessions: 16, lastSession: "Hoje", week: [3, 2, 3, 3, 2, 2, 3] },
    p8: { adherence: 60, sessions: 9, lastSession: "Há 2 dias", week: [1, 2, 1, 1, 0, 2, 1] },
};

/** Ids FIXOS do treino padrão e dos exercícios dele (estáveis entre reinícios e redeploys). */
export const EXAMPLE_TRAINING_ID = "t-ex";
export const EXAMPLE_EXERCISE_IDS = ["e1", "e2"];

/** Treino de exemplo do protótipo, recriado quando trainings.json não existe. */
export function seedTrainings(): Training[] {
    const now = new Date().toISOString();
    return [
        {
            id: "t-ex",
            name: "Aquecimento para apresentações",
            example: true,
            audience: { all: false, ids: ["p3", "p4", "p5"] },
            exercises: [
                {
                    id: "e1",
                    name: "Vibração de lábios",
                    goal: "Aquece a musculatura antes de falar",
                    steps: [
                        "Junte os lábios sem apertar.",
                        "Sopre o ar fazendo os lábios vibrarem (brrr).",
                        "Mantenha por 5 segundos e descanse.",
                    ],
                    repetitions: 4,
                    holdSeconds: 5,
                    relaxSeconds: 2,
                    video: null,
                    validation: {
                        movement: "mouthPucker",
                        sensitivity: "normal",
                        note: "A câmera confirma os lábios projetados; não ouve a vibração.",
                    },
                },
                {
                    id: "e2",
                    name: "Sobrearticulação",
                    goal: "Clareza na pronúncia",
                    steps: [
                        "Leia uma frase curta em voz alta.",
                        "Exagere o movimento de cada sílaba.",
                        "Repita a frase em ritmo normal.",
                    ],
                    repetitions: 3,
                    holdSeconds: 0,
                    relaxSeconds: 2,
                    video: null,
                    validation: {
                        movement: "vowels",
                        sensitivity: "normal",
                        note: "A câmera confirma a abertura da boca nas vogais A-E-I-O-U.",
                    },
                },
            ],
            createdAt: now,
            updatedAt: now,
            createdBy: "a1",
        },
    ];
}
