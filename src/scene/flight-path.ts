/**
 * The route of the ship: a smooth curve through seven stops, one per stage
 * of the page (0 launch, 1-4 one app each, 5 the key, 6 the workshop). The
 * scroll stage maps straight onto the curve, so stage 2 is exactly the
 * Scribe stop.
 */
import { CatmullRomCurve3, Vector3 } from "three";

export const STOP_COUNT = 7;
export const LAST_STAGE = STOP_COUNT - 1;
/** Distance between two stops along the route. */
export const STOP_SPACING = 34;

const UP = new Vector3(0, 1, 0);

/** The centre of the route at a continuous stop index (may be fractional). */
export function routeCentre(stop: number, into = new Vector3()): Vector3 {
	return into.set(
		Math.sin(stop * 1.1) * 5,
		Math.cos(stop * 0.8) * 2.2 - 2.2,
		-stop * STOP_SPACING,
	);
}

/**
 * The curve passes through every stop, with one extra point before the first
 * and after the last so the ends have a natural direction.
 */
export function createRouteCurve(): CatmullRomCurve3 {
	const points: Vector3[] = [];
	for (let stop = -1; stop <= STOP_COUNT; stop++)
		points.push(routeCentre(stop));
	return new CatmullRomCurve3(points, false, "centripetal");
}

/** Curve parameter (0..1) of a stage; stage k lands exactly on stop k. */
export function stageToCurve(stage: number): number {
	const clamped = Math.min(LAST_STAGE, Math.max(0, stage));
	return (clamped + 1) / (STOP_COUNT + 1);
}

export interface StopFrame {
	readonly position: Vector3;
	readonly forward: Vector3;
	readonly right: Vector3;
	readonly up: Vector3;
}

/** Where the ship rests at a stop, and which way it faces. */
export function stopFrame(curve: CatmullRomCurve3, stop: number): StopFrame {
	const t = stageToCurve(stop);
	const position = curve.getPoint(t);
	const forward = curve.getTangent(t).normalize();
	const right = new Vector3().crossVectors(forward, UP).normalize();
	const up = new Vector3().crossVectors(right, forward).normalize();
	return { position, forward, right, up };
}

/**
 * The point the camera looks at while resting at a stop: ahead, nudged
 * away from the copy, so the nebula's brightest part sits beside it.
 */
export function stopLookTarget(
	frame: StopFrame,
	compact: boolean,
	into = new Vector3(),
): Vector3 {
	into.copy(frame.position).addScaledVector(frame.forward, 10);
	if (compact) into.addScaledVector(frame.up, 0.35);
	else into.addScaledVector(frame.right, 1.1);
	return into;
}
