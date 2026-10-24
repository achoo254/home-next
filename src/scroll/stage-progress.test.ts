import { describe, expect, it } from "vitest";
import { STAGE_HOLD, stageAt } from "./stage-progress";

const anchors = [500, 1500, 2500];

describe("stageAt", () => {
	it("is 0 above the first anchor and the last stage below the last one", () => {
		expect(stageAt(0, anchors)).toBe(0);
		expect(stageAt(9000, anchors)).toBe(2);
	});

	it("holds still near each anchor", () => {
		const nearStart = 500 + 1000 * STAGE_HOLD * 0.9;
		const nearEnd = 1500 - 1000 * STAGE_HOLD * 0.9;
		expect(stageAt(nearStart, anchors)).toBe(0);
		expect(stageAt(nearEnd, anchors)).toBe(1);
	});

	it("is halfway at the midpoint and rises monotonically", () => {
		expect(stageAt(1000, anchors)).toBeCloseTo(0.5, 5);
		let previous = -1;
		for (let y = 0; y <= 3000; y += 25) {
			const stage = stageAt(y, anchors);
			expect(stage).toBeGreaterThanOrEqual(previous);
			previous = stage;
		}
	});

	it("copes with no anchors and with anchors at the same place", () => {
		expect(stageAt(100, [])).toBe(0);
		expect(stageAt(600, [500, 500, 900])).toBeGreaterThanOrEqual(1);
	});
});
