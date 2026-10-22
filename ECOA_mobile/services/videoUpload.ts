import { Platform } from "react-native";

import { ExerciseVideo } from "../data/training";
import api from "./api";

/** Arquivo escolhido: no navegador o `File`; no app, o que o seletor devolve (uri, nome, tipo). */
export type PickedVideo =
    | { kind: "web"; file: File }
    | { kind: "native"; uri: string; name: string; mime: string };

/** POST /uploads/video (admin, multipart campo `file`) → { url, name, size, mime } (url relativa). */
export async function uploadVideo(picked: PickedVideo): Promise<ExerciseVideo> {
    const form = new FormData();

    if (picked.kind === "web") {
        form.append("file", picked.file, picked.file.name);
    } else {
        // No React Native o FormData aceita { uri, name, type } no lugar de um Blob.
        form.append("file", { uri: picked.uri, name: picked.name, type: picked.mime } as unknown as Blob);
    }

    const response = await api.post("/uploads/video", form, {
        // O navegador monta o boundary sozinho; no app o cabeçalho precisa ser dito.
        headers: Platform.OS === "web" ? undefined : { "Content-Type": "multipart/form-data" },
        timeout: 120000,
    });

    const { url, name, size, mime } = response.data;
    return { url, name, size, mime };
}
