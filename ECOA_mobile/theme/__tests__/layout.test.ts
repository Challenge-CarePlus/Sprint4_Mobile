import { MAX_APP_WIDTH, MAX_APP_WIDTH_WIDE, appWidthFor } from "../layout";

describe("appWidthFor", () => {
    it("celulares e tablet em pé usam a largura toda (até 840)", () => {
        expect(appWidthFor(360)).toBe(360);
        expect(appWidthFor(712)).toBe(712);
        expect(appWidthFor(800)).toBe(800);
        expect(appWidthFor(999)).toBe(MAX_APP_WIDTH);
    });

    it("tablet na horizontal (Tab S6, ~1280) e monitores usam a coluna larga", () => {
        expect(appWidthFor(1280)).toBe(MAX_APP_WIDTH_WIDE);
        expect(appWidthFor(1440)).toBe(MAX_APP_WIDTH_WIDE);
        expect(appWidthFor(1000)).toBe(1000);
    });
});
