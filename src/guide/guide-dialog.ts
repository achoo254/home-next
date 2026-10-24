/**
 * The guide bot's speech bubble and the route map. Both follow the section
 * at the middle of the viewport: the bubble types Nav's line for that stop,
 * the route marks it as current. They run without WebGL, so the narration
 * and the route still work when the 3D scene is missing.
 *
 * The bubble is hidden from assistive tech: each line repeats the chapter
 * beside it, and announcing it on every scroll would only add noise.
 */
import { type Locale, STRINGS, isStringKey } from "../i18n/strings";
import { measureAnchors, stageAt } from "../scroll/stage-progress";

/** Milliseconds per character while typing. */
const TYPE_SPEED = 22;
/** Last stop of the route: after its line the bubble steps aside, so it
 * does not cover the reading matter below. */
const LAST_STOP = 6;
/** How long the last line stays before the bubble steps aside. */
const REST_AFTER_MS = 3500;

export interface GuideDialog {
	setLocale(locale: Locale): void;
}

export function mountGuideDialog(options: {
	readonly stageSections: readonly HTMLElement[];
	readonly locale: Locale;
	readonly reducedMotion: boolean;
}): GuideDialog | null {
	const foundBubble = document.querySelector<HTMLElement>("[data-guide]");
	const foundTyped = document.querySelector<HTMLElement>("[data-guide-typed]");
	const routeLinks = [
		...document.querySelectorAll<HTMLAnchorElement>("[data-route]"),
	];
	if (!foundBubble || !foundTyped) return null;
	const bubble: HTMLElement = foundBubble;
	const typed: HTMLElement = foundTyped;
	bubble.classList.add("is-ready");

	const { stageSections, reducedMotion } = options;
	let locale = options.locale;
	let anchors = measureAnchors(stageSections);
	let current = -1;
	let typingTimer = 0;
	let restTimer = 0;
	let scheduled = false;

	function lineFor(stop: number): string {
		const key = `guide.${stop}`;
		return isStringKey(key) ? STRINGS[locale][key] : "";
	}

	function restLater(stop: number): void {
		window.clearTimeout(restTimer);
		bubble.classList.remove("is-resting");
		if (stop < LAST_STOP) return;
		restTimer = window.setTimeout(() => {
			bubble.classList.add("is-resting");
		}, REST_AFTER_MS);
	}

	function say(stop: number): void {
		const line = lineFor(stop);
		restLater(stop);
		window.clearInterval(typingTimer);
		bubble.classList.add("is-talking");
		if (reducedMotion) {
			typed.textContent = line;
			bubble.classList.remove("is-talking");
			return;
		}
		let shown = 0;
		typed.textContent = "";
		typingTimer = window.setInterval(() => {
			shown++;
			typed.textContent = line.slice(0, shown);
			if (shown >= line.length) {
				window.clearInterval(typingTimer);
				bubble.classList.remove("is-talking");
			}
		}, TYPE_SPEED);
	}

	function markRoute(stop: number): void {
		for (const link of routeLinks) {
			const isCurrent = Number(link.dataset.route) === stop;
			if (isCurrent) link.setAttribute("aria-current", "location");
			else link.removeAttribute("aria-current");
		}
	}

	function check(): void {
		scheduled = false;
		const stage = stageAt(window.scrollY + window.innerHeight / 2, anchors);
		const stop = Math.round(stage);
		if (stop === current) return;
		current = stop;
		bubble.dataset.stop = String(stop);
		markRoute(stop);
		say(stop);
	}

	function schedule(): void {
		if (scheduled) return;
		scheduled = true;
		requestAnimationFrame(check);
	}

	new ResizeObserver(() => {
		anchors = measureAnchors(stageSections);
		schedule();
	}).observe(document.body);
	window.addEventListener("scroll", schedule, { passive: true });
	check();

	return {
		setLocale(next) {
			locale = next;
			if (current >= 0) say(current);
		},
	};
}
