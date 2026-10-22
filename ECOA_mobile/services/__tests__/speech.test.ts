jest.mock("expo-speech", () => ({
    speak: jest.fn(),
    stop: jest.fn(),
    getAvailableVoicesAsync: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

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

describe("services/speech — configuração da voz", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("não fala com a voz desligada, mas fala no 'Testar voz' mesmo assim", () => {
        const { Speech, speechService } = loadSpeechModule();

        speechService.configureVoice({ enabled: false });
        speechService.speak("Muito bem");
        expect(Speech.speak).not.toHaveBeenCalled();

        speechService.testVoice();
        expect(Speech.speak).toHaveBeenCalledTimes(1);
        expect(Speech.speak.mock.calls[0][0]).toBe(speechService.TEST_VOICE_PHRASE);
    });

    it("aplica ritmo, tom suave e idioma pt-BR (padrão: Calma 0,9)", () => {
        const { Speech, speechService } = loadSpeechModule();

        speechService.speak("Muito bem");

        expect(Speech.speak.mock.calls[0][1]).toMatchObject({ language: "pt-BR", rate: 0.9 });
        expect(Speech.speak.mock.calls[0][1].pitch).toBeLessThan(1);
    });

    it("usa o ritmo escolhido e o ajuste da trilha (idosos -0,05)", () => {
        const { Speech, speechService } = loadSpeechModule();

        speechService.configureVoice({ rate: 0.8 });
        speechService.speak("Muito bem", { rateOffset: -0.05 });

        expect(Speech.speak.mock.calls[0][1].rate).toBeCloseTo(0.75, 5);
    });

    it("escolhe a voz automática entre as pt-BR já carregadas", async () => {
        const { Speech, speechService } = loadSpeechModule();
        Speech.getAvailableVoicesAsync.mockResolvedValue([
            { identifier: "en", name: "Samantha", language: "en-US", quality: "Default" },
            { identifier: "pt", name: "Luciana", language: "pt-BR", quality: "Default" },
        ]);

        await speechService.loadVoices();
        speechService.speak("Muito bem");

        expect(Speech.speak.mock.calls[0][1].voice).toBe("pt");
    });

    it("respeita a voz escolhida quando ela existe", async () => {
        const { Speech, speechService } = loadSpeechModule();
        Speech.getAvailableVoicesAsync.mockResolvedValue([
            { identifier: "a", name: "Luciana", language: "pt-BR", quality: "Default" },
            { identifier: "b", name: "Voz Genérica", language: "pt-BR", quality: "Default" },
        ]);

        await speechService.loadVoices();
        speechService.configureVoice({ voiceId: "b" });
        speechService.speak("Muito bem");

        expect(Speech.speak.mock.calls[0][1].voice).toBe("b");
    });

    it("no navegador, sem 'onstart' em 1,5 s marca a voz como bloqueada e libera a fila", () => {
        jest.doMock("react-native", () => ({ Platform: { OS: "web" } }));
        const speakOnWeb = jest.fn();
        (global as any).window = { speechSynthesis: { speak: speakOnWeb, cancel: jest.fn(), getVoices: () => [{}], speaking: false } };
        (global as any).SpeechSynthesisUtterance = function (this: any, text: string) {
            this.text = text;
        };

        const { speechService } = loadSpeechModule();
        const statuses: string[] = [];
        speechService.subscribeSpeechStatus((s: string) => statuses.push(s));

        speechService.speak("Muito bem");
        expect(speakOnWeb).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1500);
        expect(statuses).toContain("blocked");
        expect(speechService.getSpeechStatus()).toBe("blocked");

        // a fila foi liberada: o toque da pessoa ("ativar a voz") fala de novo
        speechService.unlockSpeech();
        expect(speakOnWeb).toHaveBeenCalledTimes(2);

        jest.dontMock("react-native");
        delete (global as any).window;
        delete (global as any).SpeechSynthesisUtterance;
    });

    it("no navegador, com 'onstart' o estado fica ok", () => {
        jest.doMock("react-native", () => ({ Platform: { OS: "web" } }));
        let utterance: any;
        (global as any).window = {
            speechSynthesis: { speak: (u: any) => (utterance = u), cancel: jest.fn(), getVoices: () => [{}], speaking: false },
        };
        (global as any).SpeechSynthesisUtterance = function (this: any, text: string) {
            this.text = text;
        };

        const { speechService } = loadSpeechModule();
        speechService.speak("Muito bem");
        utterance.onstart();
        jest.advanceTimersByTime(1500);

        expect(speechService.getSpeechStatus()).toBe("ok");

        jest.dontMock("react-native");
        delete (global as any).window;
        delete (global as any).SpeechSynthesisUtterance;
    });
});
