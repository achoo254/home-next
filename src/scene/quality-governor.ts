/**
 * Watches frame times and steps the render quality down when a device
 * cannot keep up, so a slow laptop or phone gets a smooth scene rather than
 * a beautiful slideshow. It never steps back up: a page visit is short, and
 * flipping quality back and forth is more visible than staying lower.
 */

export interface QualityLevel {
	/** Upper bound for the device pixel ratio. */
	readonly maxPixelRatio: number;
	/** Share of the canvas resolution the glass refraction is drawn at. */
	readonly refractionScale: number;
	/** Share of the canvas resolution the aurora noise is drawn at. */
	readonly auroraScale: number;
	readonly bloom: boolean;
}

export const QUALITY_LEVELS: readonly QualityLevel[] = [
	{ maxPixelRatio: 2, refractionScale: 0.85, auroraScale: 0.5, bloom: true },
	{ maxPixelRatio: 1.5, refractionScale: 0.6, auroraScale: 0.4, bloom: true },
	{ maxPixelRatio: 1, refractionScale: 0.5, auroraScale: 0.33, bloom: true },
	{ maxPixelRatio: 1, refractionScale: 0.4, auroraScale: 0.25, bloom: false },
];

/** Frames per sample window: short, so a slow device recovers in seconds. */
const WINDOW = 45;
/** Average frame time above which we step down: under ~45 fps. */
const BUDGET_SECONDS = 1 / 45;

export class QualityGovernor {
	private level: number;
	private frames = 0;
	private total = 0;

	constructor(startLevel = 0) {
		this.level = Math.min(QUALITY_LEVELS.length - 1, Math.max(0, startLevel));
	}

	get current(): QualityLevel {
		const level = QUALITY_LEVELS[this.level];
		if (!level) throw new Error("quality-governor: no levels");
		return level;
	}

	/** Records one frame; returns true when the level just stepped down. */
	record(dt: number): boolean {
		if (this.level >= QUALITY_LEVELS.length - 1) return false;
		this.frames++;
		this.total += dt;
		if (this.frames < WINDOW) return false;
		const average = this.total / this.frames;
		this.frames = 0;
		this.total = 0;
		if (average <= BUDGET_SECONDS) return false;
		this.level++;
		return true;
	}

	/** Forgets the current window, e.g. after the tab was hidden. */
	reset(): void {
		this.frames = 0;
		this.total = 0;
	}
}
