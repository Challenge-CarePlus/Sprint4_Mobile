type Params = Record<string, unknown> | undefined;

/**
 * Para onde o "Voltar" vai em cada tela. As telas do fluxo de exercício avançam com `replace`, então o
 * histórico não guarda a anterior: o destino é explícito.
 * - pop: volta uma tela na pilha (o rascunho do admin mora no DraftContext e sobrevive);
 * - replace: troca a tela atual (desmonta a câmera) pela de destino;
 * - popTo: volta até a tela (ou a abre, se ela não estiver na pilha).
 */
export type BackAction =
    | { type: "pop" }
    | { type: "replace"; name: string; params?: Params }
    | { type: "popTo"; name: string; params?: Params };

export function backTarget(routeName: string, params?: Params): BackAction {
    switch (routeName) {
        case "TRACK_SELECT":
        case "CYCLE_SUMMARY":
        case "EVOLUTION":
        case "TRAININGS":
        case "CONSENT":
            return { type: "popTo", name: "MAIN" };
        case "EXERCISE_PREVIEW":
            return { type: "popTo", name: "TRACK_SELECT" };
        case "CALIBRATION":
        case "EXERCISE_SESSION":
            return {
                type: "replace",
                name: "EXERCISE_PREVIEW",
                params: { trackId: params?.trackId, exerciseIndex: params?.exerciseIndex ?? 0 },
            };
        case "PATIENT":
            return { type: "popTo", name: "EVOLUTION" };
        case "EDIT_TRAINING":
            return { type: "popTo", name: "TRAININGS" };
        case "EDIT_EXERCISE":
        case "PICK_PATIENTS":
            return { type: "popTo", name: "EDIT_TRAINING" };
        // Configurações e o teste do admin voltam para a tela de onde vieram.
        default:
            return { type: "pop" };
    }
}
