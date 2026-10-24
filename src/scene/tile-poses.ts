/**
 * Where the four logo tiles sit at each stage of the page. Pure math, no
 * three.js, so the choreography is testable and readable on its own.
 *
 * Stages: 0 hero, 1-4 one app chapter each, 5 account (the tiles assemble
 * into the logo), 6 workshop and everything below (the logo drifts away).
 * Tile order follows the logo grid: Chat top-left, Scribe top-right (the
 * round accent tile, like a record button), Localman bottom-left, Tunelo
 * bottom-right.
 */

export interface Pose {
	readonly x: number;
	readonly y: number;
	readonly z: number;
	readonly rx: number;
	readonly ry: number;
	readonly rz: number;
	readonly s: number;
}

export interface Frame {
	readonly aspect: number;
	readonly fovDeg: number;
	readonly cameraZ: number;
}

export const TILE_COUNT = 4;
export const STAGE_ACCOUNT = 5;
export const LAST_STAGE = 6;

/** Depth of the plane a focused tile flies to, in front of the formation. */
const FOCUS_Z = 2.2;
/** Depth the unfocused tiles fall back to during a chapter. */
const BACK_Z = -3.5;
/** Centre distance between two tiles of the assembled logo (tile 1 + gap 0.2). */
const GRID_STEP = 1.2;

/** Narrow screens stack the scene above the copy instead of beside it. */
export function isCompact(frame: Frame): boolean {
	return frame.aspect < 0.9;
}

/** Half the visible width and height at depth `z`. */
export function visibleHalf(frame: Frame, z: number): { w: number; h: number } {
	const h = Math.tan((frame.fovDeg * Math.PI) / 360) * (frame.cameraZ - z);
	return { w: h * frame.aspect, h };
}

function pose(
	x: number,
	y: number,
	z: number,
	rx = 0,
	ry = 0,
	rz = 0,
	s = 1,
): Pose {
	return { x, y, z, rx, ry, rz, s };
}

/** The loose hero cluster, relative to the formation centre. */
const SCATTER: readonly Pose[] = [
	pose(-1.25, 0.85, 0.2, 0.25, -0.55, 0.12),
	pose(1.15, 1.05, -0.8, -0.3, 0.6, -0.2),
	pose(-0.95, -1.05, -1.2, 0.4, 0.35, 0.25),
	pose(1.05, -0.8, 0.5, -0.2, -0.4, -0.15),
];

const GRID: readonly Pose[] = [
	pose(-GRID_STEP / 2, GRID_STEP / 2, 0),
	pose(GRID_STEP / 2, GRID_STEP / 2, 0),
	pose(-GRID_STEP / 2, -GRID_STEP / 2, 0),
	pose(GRID_STEP / 2, -GRID_STEP / 2, 0),
];

const IDENTITY = pose(0, 0, 0);

function at<T>(list: readonly T[], index: number): T {
	const item = list[index % list.length];
	if (item === undefined) throw new Error(`tile-poses: no entry ${index}`);
	return item;
}

/** Pose of the group that holds all four tiles. */
export function formationPose(stage: number, frame: Frame): Pose {
	const compact = isCompact(frame);
	const near = visibleHalf(frame, 0);

	if (stage <= 0) {
		return compact
			? pose(0, near.h * 0.36, 0, 0.1, -0.25, 0, 0.62)
			: pose(near.w * 0.42, 0.05, 0, 0.1, -0.25, 0, 1);
	}
	if (stage < STAGE_ACCOUNT) return IDENTITY;
	if (stage === STAGE_ACCOUNT) {
		return compact
			? pose(0, near.h * 0.38, 0, 0.16, -0.42, 0.04, 0.6)
			: pose(near.w * 0.45, 0, 0, 0.16, -0.42, 0.04, 1.05);
	}
	// Narrow screens have no empty column, so the logo leaves through the top.
	return compact
		? pose(0, near.h * 2.2, -5, 0.4, -0.9, 0.1, 0.6)
		: pose(near.w * 0.62, near.h * 0.95, -5, 0.4, -0.9, 0.1, 0.9);
}

/** Pose of one tile inside the formation group. */
export function tilePose(stage: number, tile: number, frame: Frame): Pose {
	if (stage <= 0) return at(SCATTER, tile);
	if (stage >= STAGE_ACCOUNT) return at(GRID, tile);

	const compact = isCompact(frame);
	const focused = stage - 1 === tile;
	if (focused) {
		const plane = visibleHalf(frame, FOCUS_Z);
		return compact
			? pose(0, plane.h * 0.52, FOCUS_Z, 0.14, -0.38, 0.05, 0.78)
			: pose(plane.w * 0.48, 0, FOCUS_Z, 0.14, -0.38, 0.05, 1.2);
	}

	const scattered = at(SCATTER, tile);
	const back = visibleHalf(frame, BACK_Z);
	const centreX = compact ? 0 : back.w * 0.45;
	const centreY = compact ? back.h * 0.5 : 0;
	const spread = compact ? 0.8 : 1.3;
	return pose(
		centreX + scattered.x * spread,
		centreY + scattered.y * spread,
		BACK_Z + scattered.z,
		scattered.rx,
		scattered.ry,
		scattered.rz,
		0.75,
	);
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
	const mix = (from: number, to: number) => from + (to - from) * t;
	return {
		x: mix(a.x, b.x),
		y: mix(a.y, b.y),
		z: mix(a.z, b.z),
		rx: mix(a.rx, b.rx),
		ry: mix(a.ry, b.ry),
		rz: mix(a.rz, b.rz),
		s: mix(a.s, b.s),
	};
}

/** Interpolates a stage function at a fractional stage value. */
export function poseBetweenStages(
	stageValue: number,
	poseOf: (stage: number) => Pose,
): Pose {
	const clamped = Math.min(LAST_STAGE, Math.max(0, stageValue));
	const lower = Math.floor(clamped);
	const upper = Math.min(LAST_STAGE, lower + 1);
	return lerpPose(poseOf(lower), poseOf(upper), clamped - lower);
}

/** 1 while a tile's chapter is centred, fading to 0 one stage away. */
export function focusWeight(stageValue: number, tile: number): number {
	return Math.max(0, 1 - Math.abs(stageValue - (tile + 1)));
}

/** 1 when the logo is assembled at the account stage, 0 one stage away. */
export function assembledWeight(stageValue: number): number {
	return Math.max(0, 1 - Math.abs(stageValue - STAGE_ACCOUNT));
}
