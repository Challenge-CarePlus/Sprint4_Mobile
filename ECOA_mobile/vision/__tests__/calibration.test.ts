import { CalibrationCollector } from "../calibration";
import type { Blendshape } from "../FaceLandmarkerBridge";

function bs(name: string, score: number): Blendshape {
    return { name, score };
}

describe("CalibrationCollector", () => {
    it("calcula a média de cada blendshape ao longo das amostras", () => {
        const collector = new CalibrationCollector();

        collector.addSample([bs("jawOpen", 0.1), bs("mouthPucker", 0.2)]);
        collector.addSample([bs("jawOpen", 0.3), bs("mouthPucker", 0.4)]);

        const baseline = collector.buildBaseline();

        expect(baseline.jawOpen).toBeCloseTo(0.2);
        expect(baseline.mouthPucker).toBeCloseTo(0.3);
    });

    it("conta o número de amostras recebidas", () => {
        const collector = new CalibrationCollector();

        expect(collector.sampleCount).toBe(0);

        collector.addSample([bs("jawOpen", 0.1)]);
        collector.addSample([bs("jawOpen", 0.2)]);
        collector.addSample([bs("jawOpen", 0.3)]);

        expect(collector.sampleCount).toBe(3);
    });

    it("lida com blendshapes que não aparecem em todas as amostras", () => {
        const collector = new CalibrationCollector();

        collector.addSample([bs("jawOpen", 0.2)]);
        collector.addSample([bs("jawOpen", 0.4), bs("tongueOut", 0.1)]);

        const baseline = collector.buildBaseline();

        expect(baseline.jawOpen).toBeCloseTo(0.3);
        expect(baseline.tongueOut).toBeCloseTo(0.1);
    });
});
