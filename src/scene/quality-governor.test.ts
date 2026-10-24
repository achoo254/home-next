import { describe, expect, it } from "vitest";
import { QUALITY_LEVELS, QualityGovernor } from "./quality-governor";

function run(governor: QualityGovernor, frames: number, dt: number): number {
	let steps = 0;
	for (let index = 0; index < frames; index++) {
		if (governor.record(dt)) steps++;
	}
	return steps;
}

describe("QualityGovernor", () => {
	it("keeps the top level on a fast device", () => {
		const governor = new QualityGovernor();
		expect(run(governor, 1000, 1 / 120)).toBe(0);
		expect(governor.current).toBe(QUALITY_LEVELS[0]);
	});

	it("steps down one level per slow window and stops at the floor", () => {
		const governor = new QualityGovernor();
		expect(run(governor, 45, 1 / 30)).toBe(1);
		expect(governor.current).toBe(QUALITY_LEVELS[1]);
		run(governor, 10_000, 1 / 20);
		expect(governor.current).toBe(QUALITY_LEVELS[QUALITY_LEVELS.length - 1]);
		expect(governor.current.bloom).toBe(false);
	});

	it("forgets a half-filled window on reset", () => {
		const governor = new QualityGovernor();
		run(governor, 40, 1 / 10);
		governor.reset();
		expect(run(governor, 40, 1 / 120)).toBe(0);
		expect(governor.current).toBe(QUALITY_LEVELS[0]);
	});

	it("starts lower when asked", () => {
		expect(new QualityGovernor(1).current).toBe(QUALITY_LEVELS[1]);
		expect(new QualityGovernor(99).current).toBe(
			QUALITY_LEVELS[QUALITY_LEVELS.length - 1],
		);
	});
});
