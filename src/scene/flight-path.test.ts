import type { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
	LAST_STAGE,
	STOP_COUNT,
	createRouteCurve,
	routeCentre,
	stageToCurve,
	stationPosition,
	stopFrame,
	stopLookTarget,
} from "./flight-path";

const curve = createRouteCurve();

/** Horizontal angle of `point` seen from the frame, positive to the right. */
function sideAngle(
	frame: ReturnType<typeof stopFrame>,
	look: Vector3,
	point: Vector3,
): number {
	const toLook = look.clone().sub(frame.position);
	const toPoint = point.clone().sub(frame.position);
	const lookSide = Math.atan2(
		toLook.dot(frame.right),
		toLook.dot(frame.forward),
	);
	const pointSide = Math.atan2(
		toPoint.dot(frame.right),
		toPoint.dot(frame.forward),
	);
	return pointSide - lookSide;
}

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

	it("puts stations right of the view on desktop and above it on phones", () => {
		for (let stop = 1; stop <= 4; stop++) {
			const frame = stopFrame(curve, stop);
			const wide = stationPosition(frame, false);
			const lookWide = stopLookTarget(frame, false);
			const angle = sideAngle(frame, lookWide, wide);
			// Right of centre, yet inside a 35 degree vertical FOV at 16:9.
			expect(angle).toBeGreaterThan(0.1);
			expect(angle).toBeLessThan(0.4);

			const tall = stationPosition(frame, true);
			const lookTall = stopLookTarget(frame, true);
			expect(tall.clone().sub(lookTall).dot(frame.up)).toBeGreaterThan(0.5);
		}
	});
});
