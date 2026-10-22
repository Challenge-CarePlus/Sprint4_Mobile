import { Alert, Platform } from "react-native";

/** Pergunta sim/não antes de uma ação destrutiva (Alert.alert não funciona na web). */
export function confirmAction(title: string, message: string, confirmLabel = "Excluir"): Promise<boolean> {
    if (Platform.OS === "web") {
        return Promise.resolve(typeof window !== "undefined" && window.confirm(`${title}\n${message}`));
    }

    return new Promise((resolve) => {
        Alert.alert(
            title,
            message,
            [
                { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) }
        );
    });
}
