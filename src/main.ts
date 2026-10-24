import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/main.css";
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

async function startScene(): Promise<void> {
	const canvas = document.querySelector<HTMLCanvasElement>("#stage");
	const stageSections = [
		...document.querySelectorAll<HTMLElement>("[data-stage]"),
	];
	if (!canvas || stageSections.length === 0) return;
	try {
		const { mountTilesScene } = await import("./scene/tiles-scene");
		mountTilesScene({
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
