import { describe, expect, it } from "vitest";
import {
	LAST_STAGE,
	STOP_COUNT,
	createRouteCurve,
	routeCentre,
	stageToCurve,
} from "./flight-path";

const curve = createRouteCurve();

describe("flight path", () => {
	it("passes through every stop at its stage", () => {
		for (let stop = 0; stop < STOP_COUNT; stop++) {
			const point = curve.getPoint(stageToCurve(stop));
			expect(point.distanceTo(routeCentre(stop))).toBeLessThan(1e-6);
		}
	});

	it("clamps stages outside the route", () => {
		expect(stageToCurve(-3)).toBe(stageToCurve(0));
		expect(stageToCurve(99)).toBe(stageToCurve(LAST_STAGE));
	});

	it("always flies forward, into the screen", () => {
		for (let stage = 0; stage <= LAST_STAGE; stage += 0.25) {
			expect(curve.getTangent(stageToCurve(stage)).z).toBeLessThan(0);
		}
	});
});
