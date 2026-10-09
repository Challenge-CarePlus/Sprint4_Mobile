import { Track } from "./types";

export const TRACKS: Track[] = [
    {
        id: "track-children",
        ageGroup: "children",
        name: "Trilha infantil",
        description: "Praxias de lábios e língua, sopro e onomatopeias para destravar a fala.",
        exerciseIds: [
            "children-smile",
            "children-pucker",
            "children-tongue-out",
            "children-blow-balloon",
            "children-tongue-click",
        ],
    },
    {
        id: "track-adults",
        ageGroup: "adults",
        name: "Trilha de dicção e oratória",
        description: "Sobrearticulação, vibração labial, mobilidade e respiração para falar com mais clareza e confiança.",
        exerciseIds: [
            "adults-jaw-stretch",
            "adults-vowel-overarticulation",
            "adults-smile-pucker",
            "adults-lip-trill",
            "adults-diaphragmatic-breathing",
        ],
    },
    {
        id: "track-elderly",
        ageGroup: "elderly",
        name: "Trilha de fortalecimento orofacial",
        description: "Fortalecimento da musculatura da boca e apoio a uma deglutição mais segura.",
        exerciseIds: [
            "elderly-jaw-open-close",
            "elderly-pucker-hold",
            "elderly-smile-hold",
            "elderly-tongue-elevation",
            "elderly-effortful-swallow",
        ],
    },
];

export function getTrackByAgeGroup(ageGroup: Track["ageGroup"]): Track | undefined {
    return TRACKS.find((track) => track.ageGroup === ageGroup);
}
