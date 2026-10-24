import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback } from "react";

import { stopSpeaking } from "../services/speech";
import { backTarget } from "../services/backTarget";

/** Ação de voltar da tela atual, com o destino de `backTarget` (a câmera some junto com a tela). */
export function useBack(): () => void {
    const navigation = useNavigation<any>();
    const route = useRoute();

    return useCallback(() => {
        const target = backTarget(route.name, route.params as Record<string, unknown> | undefined);
        stopSpeaking();

        if (target.type === "replace") navigation.replace(target.name, target.params);
        else if (target.type === "popTo") navigation.popTo(target.name, target.params);
        else if (navigation.canGoBack()) navigation.goBack();
        else navigation.popTo("MAIN");
    }, [navigation, route.name, route.params]);
}
