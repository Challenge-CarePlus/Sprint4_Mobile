import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";

import { apiErrorMessage } from "../services/trainingsApi";

export type LoadState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
};

/**
 * Carrega dados (API) sempre que a tela ganha foco — ao voltar de uma edição a lista já
 * aparece atualizada. Guarda o último resultado enquanto recarrega (sem piscar).
 */
export function useLoad<T>(loader: () => Promise<T>): LoadState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loaderRef = useRef(loader);
    loaderRef.current = loader;
    const alive = useRef(true);

    const run = useCallback(() => {
        setLoading(true);
        setError(null);
        loaderRef.current()
            .then((result) => {
                if (alive.current) setData(result);
            })
            .catch((e) => {
                if (alive.current) setError(apiErrorMessage(e));
            })
            .finally(() => {
                if (alive.current) setLoading(false);
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            alive.current = true;
            run();
            return () => {
                alive.current = false;
            };
        }, [run])
    );

    return { data, loading, error, reload: run };
}
