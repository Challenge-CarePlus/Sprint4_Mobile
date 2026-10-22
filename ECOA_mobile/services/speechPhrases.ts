import { AgeGroup } from "../data/types";
import { speak } from "./speech";

/**
 * Frases FALADAS — curtas, gentis, sem imperativo seco nem exclamação em excesso. O texto mostrado na
 * tela continua o do protótipo; aqui só muda o que a voz diz. Um lugar só para o tom das falas.
 */
export type PhraseKind =
    | "calibrate-start"
    | "no-face"
    | "prompt"
    | "holding"
    | "release"
    | "relax"
    | "complete"
    | "test-ready"
    | "test-complete";

type Phrases = Record<Exclude<PhraseKind, "prompt">, string>;

const ADULT: Phrases = {
    "calibrate-start": "Vamos calibrar. Relaxe o rosto e olhe para a câmera, são só três segundinhos.",
    "no-face": "Não consegui ver seu rosto. Fique de frente para a câmera, com calma.",
    holding: "Isso, mantenha assim… você está indo bem.",
    release: "Muito bem.",
    relax: "Agora relaxe, respire com calma.",
    complete: "Pronto, exercício concluído. Muito bem.",
    "test-ready": "Agora faça o exercício, com calma.",
    "test-complete": "Muito bem. A câmera reconheceu o exercício.",
};

/** Infantil: calorosa e animada, mas ainda suave. */
const KIDS: Phrases = {
    ...ADULT,
    "calibrate-start": "Vamos começar! Relaxe o rostinho e olhe para a câmera, é rapidinho.",
    holding: "Isso! Mantenha assim, você está indo muito bem.",
    release: "Muito bem, que legal.",
    relax: "Agora relaxe e respire fundinho.",
    complete: "Pronto, terminamos esse! Parabéns.",
};

/** Idosos: frases mais curtas (e o ritmo é um pouco mais lento, ver `rateOffsetFor`). */
const ELDERLY: Phrases = {
    ...ADULT,
    "calibrate-start": "Relaxe o rosto e olhe para a câmera. São só três segundos.",
    "no-face": "Não vi seu rosto. Fique de frente para a câmera.",
    holding: "Isso, mantenha assim.",
    relax: "Agora relaxe e respire com calma.",
    complete: "Pronto, exercício concluído. Muito bem.",
};

/** Versões gentis das mensagens de incentivo dos movimentos (a tela mostra o texto original). */
const GENTLE_PROMPTS: Record<string, string> = {
    "Abra mais a boca": "Quando quiser, abra um pouquinho mais a boca",
    "Faça mais bico com os lábios": "Quando quiser, faça um biquinho com os lábios",
    "Sorria mais": "Se puder, sorria um pouquinho mais",
    "Encha mais as bochechas": "Se puder, encha um pouquinho mais as bochechas",
    "Pressione os lábios com firmeza": "Aperte os lábios com calma, sem exagerar",
    "Alterne: sorria e depois faça bico": "Quando quiser, sorria e depois faça um biquinho",
    "Fale as vogais A, E, I, O, U, abrindo bem a boca": "Quando quiser, fale as vogais A, E, I, O, U, abrindo bem a boca",
};

function lowerFirst(text: string): string {
    return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Frase gentil para uma mensagem de incentivo (conhecida ou escrita pelo admin). */
export function gentlePrompt(message: string, ageGroup: AgeGroup = "adults"): string {
    const trimmed = message.trim().replace(/[.!]+$/, "");
    const known = GENTLE_PROMPTS[trimmed];

    if (ageGroup === "children") {
        return `Vamos lá, ${lowerFirst((known ?? trimmed).replace(/^(Quando quiser|Se puder), /, ""))}`;
    }

    return known ?? `Quando quiser, ${lowerFirst(trimmed)}`;
}

/** Texto falado para cada momento do exercício, no tom da trilha. */
export function phraseFor(kind: PhraseKind, ageGroup: AgeGroup = "adults", message = ""): string {
    if (kind === "prompt") return gentlePrompt(message, ageGroup);

    const table = ageGroup === "children" ? KIDS : ageGroup === "elderly" ? ELDERLY : ADULT;
    return table[kind];
}

/** Idosos: um pouco mais devagar (−0,05 sobre o ritmo escolhido). */
export function rateOffsetFor(ageGroup: AgeGroup): number {
    return ageGroup === "elderly" ? -0.05 : 0;
}

/** Fala o momento `kind` no tom e no ritmo da faixa etária. */
export function say(kind: PhraseKind, ageGroup: AgeGroup = "adults", message = ""): void {
    speak(phraseFor(kind, ageGroup, message), { rateOffset: rateOffsetFor(ageGroup) });
}
