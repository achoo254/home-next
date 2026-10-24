/**
 * Turns the scroll position into a continuous "stage" number: 0 at the hero,
 * 1 at the first app chapter, and so on. Between two sections the value eases,
 * and it holds still while a section sits in the middle of the viewport so the
 * 3D scene rests on each chapter instead of drifting through it.
 */

/** Share of the gap between two anchors, at each end, where the stage holds. */
export const STAGE_HOLD = 0.2;

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
	return value * value * (3 - 2 * value);
}

/**
 * @param viewportCenter page y of the middle of the viewport
 * @param anchors page y of the middle of each stage section, ascending
 */
export function stageAt(
	viewportCenter: number,
	anchors: readonly number[],
): number {
	const last = anchors.length - 1;
	if (last < 0) return 0;
	const first = anchors[0] ?? 0;
	if (viewportCenter <= first) return 0;

	for (let index = 0; index < last; index++) {
		const from = anchors[index] ?? 0;
		const to = anchors[index + 1] ?? from;
		if (viewportCenter < to) {
			const span = to - from;
			const share = span > 0 ? (viewportCenter - from) / span : 1;
			const moving = clamp01((share - STAGE_HOLD) / (1 - 2 * STAGE_HOLD));
			return index + smoothstep(moving);
		}
	}
	return last;
}

/** Page y of the middle of each element, measured now. */
export function measureAnchors(elements: readonly HTMLElement[]): number[] {
	return elements.map((element) => {
		const box = element.getBoundingClientRect();
		return box.top + window.scrollY + box.height / 2;
	});
}
