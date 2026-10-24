import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/main.css";
import "./styles/cockpit-hud.css";
import { type GuideDialog, mountGuideDialog } from "./guide/guide-dialog";
import {
	applyLocale,
	otherLocale,
	pickInitialLocale,
	readSavedLocale,
	saveLocale,
} from "./i18n/apply-locale";

const root = document.documentElement;

let locale = pickInitialLocale(readSavedLocale(), navigator.languages);
if (locale !== "en") applyLocale(document, locale);

for (const button of document.querySelectorAll<HTMLButtonElement>(
	"[data-locale-switch]",
)) {
	button.addEventListener("click", () => {
		locale = otherLocale(locale);
		saveLocale(locale);
		applyLocale(document, locale);
		guide?.setLocale(locale);
	});
}

// The header gains a solid backdrop once the hero top leaves the viewport.
const header = document.querySelector<HTMLElement>(".site-header");
const topSentinel = document.querySelector<HTMLElement>("[data-top-sentinel]");
if (header && topSentinel) {
	new IntersectionObserver(([entry]) => {
		header.classList.toggle("is-scrolled", !entry?.isIntersecting);
	}).observe(topSentinel);
}

const reducedMotion = window.matchMedia(
	"(prefers-reduced-motion: reduce)",
).matches;

const stageSections = [
	...document.querySelectorAll<HTMLElement>("[data-stage]"),
];
const guide: GuideDialog | null = mountGuideDialog({
	stageSections,
	locale,
	reducedMotion,
});

async function startScene(): Promise<void> {
	const canvas = document.querySelector<HTMLCanvasElement>("#stage");
	if (!canvas || stageSections.length === 0) return;
	try {
		const { mountFlightScene } = await import("./scene/flight-scene");
		mountFlightScene({
			canvas,
			stageSections,
			reducedMotion,
			onShownChange: (shown) => root.classList.toggle("scene-ready", shown),
		});
	} catch (error) {
		// No WebGL, only a software one, or the chunk failed: the poster stays.
		console.warn("hoandat home: 3D scene unavailable", error);
	}
}

// Let the page paint first; the 3D chunk is the heaviest thing here.
if ("requestIdleCallback" in window) {
	requestIdleCallback(() => void startScene(), { timeout: 1200 });
} else {
	setTimeout(() => void startScene(), 300);
}
