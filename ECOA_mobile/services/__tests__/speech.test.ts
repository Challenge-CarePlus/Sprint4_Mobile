jest.mock("expo-speech", () => ({
    speak: jest.fn(),
    stop: jest.fn(),
}));

function loadSpeechModule() {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Speech = require("expo-speech");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const speechService = require("../speech");
    return { Speech, speechService };
}

describe("services/speech", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("não fala a mesma frase duas vezes em sequência", () => {
        const { Speech, speechService } = loadSpeechModule();

        speechService.speak("Abra mais a boca");
        Speech.speak.mock.calls[0][1].onDone();

        speechService.speak("Abra mais a boca");

        expect(Speech.speak).toHaveBeenCalledTimes(1);
    });

    it("libera a próxima fala assim que onDone dispara", () => {
        const { Speech, speechService } = loadSpeechModule();

        speechService.speak("Abra mais a boca");
        Speech.speak.mock.calls[0][1].onDone();

        speechService.speak("Ótimo!");

        expect(Speech.speak).toHaveBeenCalledTimes(2);
    });

    it("não trava a fala para sempre quando o navegador nunca dispara onDone", () => {
        // Reproduz o que foi observado: a Web Speech API inicia a fala mas o
        // evento de término não chega — sem o timeout de segurança, isSpeaking
        // ficaria preso em true e nenhuma instrução seguinte seria falada.
        const { Speech, speechService } = loadSpeechModule();

        speechService.speak("Relaxe o rosto. Vamos calibrar por 3 segundos.");
        // onDone/onStopped/onError nunca são chamados pelo mock aqui de propósito.

        speechService.speak("Abra mais a boca");
        expect(Speech.speak).toHaveBeenCalledTimes(1); // ainda bloqueada, dentro do timeout

        jest.advanceTimersByTime(8000);

        speechService.speak("Abra mais a boca");
        expect(Speech.speak).toHaveBeenCalledTimes(2); // recuperou sozinha
    });

    it("resetSpeechDedup permite repetir a última frase de novo", () => {
        const { Speech, speechService } = loadSpeechModule();

        speechService.speak("Posicione o rosto na câmera");
        Speech.speak.mock.calls[0][1].onDone();

        speechService.resetSpeechDedup();
        speechService.speak("Posicione o rosto na câmera");

        expect(Speech.speak).toHaveBeenCalledTimes(2);
    });
});
