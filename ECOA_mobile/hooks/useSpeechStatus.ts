import { useEffect, useState } from "react";

import { getSpeechStatus, SpeechStatus, subscribeSpeechStatus } from "../services/speech";

/** Estado da fala (ok / bloqueada pelo navegador / sem síntese), atualizado quando muda. */
export function useSpeechStatus(): SpeechStatus {
    const [status, setStatus] = useState<SpeechStatus>(getSpeechStatus());

    useEffect(() => {
        setStatus(getSpeechStatus());
        return subscribeSpeechStatus(setStatus);
    }, []);

    return status;
}
