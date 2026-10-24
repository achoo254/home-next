import { describe, expect, it } from "vitest";
import {
	type Frame,
	LAST_STAGE,
	STAGE_ACCOUNT,
	TILE_COUNT,
	assembledWeight,
	focusWeight,
	formationPose,
	poseBetweenStages,
	tilePose,
	visibleHalf,
} from "./tile-poses";

const desktop: Frame = { aspect: 16 / 9, fovDeg: 35, cameraZ: 9 };
const phone: Frame = { aspect: 375 / 812, fovDeg: 35, cameraZ: 9 };

describe("tile poses", () => {
	it("assembles the logo grid at the account stage", () => {
		const poses = [0, 1, 2, 3].map((tile) =>
			tilePose(STAGE_ACCOUNT, tile, desktop),
		);
		const xs = new Set(poses.map((pose) => pose.x.toFixed(2)));
		const ys = new Set(poses.map((pose) => pose.y.toFixed(2)));
		expect(xs.size).toBe(2);
		expect(ys.size).toBe(2);
		for (const pose of poses) expect(pose.z).toBe(0);
	});

	it("brings exactly the chapter's tile to the front", () => {
		for (let chapter = 1; chapter <= TILE_COUNT; chapter++) {
			const depths = [0, 1, 2, 3].map(
				(tile) => tilePose(chapter, tile, desktop).z,
			);
			const front = Math.max(...depths);
			expect(depths.indexOf(front)).toBe(chapter - 1);
			expect(depths.filter((z) => z === front)).toHaveLength(1);
		}
	});

	it("keeps the focused tile inside the visible frame on desktop and phone", () => {
		for (const frame of [desktop, phone]) {
			for (let tile = 0; tile < TILE_COUNT; tile++) {
				const pose = tilePose(tile + 1, tile, frame);
				const half = visibleHalf(frame, pose.z);
				expect(Math.abs(pose.x) + pose.s / 2).toBeLessThan(half.w);
				expect(Math.abs(pose.y) + pose.s / 2).toBeLessThan(half.h);
			}
		}
	});

	it("puts the scene beside the copy on desktop and above it on a phone", () => {
		expect(formationPose(0, desktop).x).toBeGreaterThan(0);
		expect(formationPose(0, phone).x).toBe(0);
		expect(formationPose(0, phone).y).toBeGreaterThan(0);
	});

	it("interpolates between stages and clamps outside them", () => {
		const halfway = poseBetweenStages(0.5, (stage) =>
			formationPose(stage, desktop),
		);
		const start = formationPose(0, desktop);
		const end = formationPose(1, desktop);
		expect(halfway.x).toBeCloseTo((start.x + end.x) / 2, 5);
		expect(
			poseBetweenStages(99, (stage) => formationPose(stage, desktop)),
		).toEqual(formationPose(LAST_STAGE, desktop));
	});

	it("weights focus and assembly around their own stage only", () => {
		expect(focusWeight(1, 0)).toBe(1);
		expect(focusWeight(2, 0)).toBe(0);
		expect(focusWeight(1.5, 0)).toBeCloseTo(0.5);
		expect(assembledWeight(STAGE_ACCOUNT)).toBe(1);
		expect(assembledWeight(STAGE_ACCOUNT - 1)).toBe(0);
	});
});
