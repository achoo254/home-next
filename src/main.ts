import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/main.css";
import "./styles/cockpit-hud.css";
import { type GuideDialog, mountGuideDialog } from "./guide/guide-dialog";
import {
	applyLocale,
	localeFromPath,
	mountLocaleSwitches,
	pathOfLocale,
	pickInitialLocale,
	readSavedLocale,
} from "./i18n/apply-locale";

const root = document.documentElement;

// /vi/ and /zh-CN/ always show their language (search engines index them as
// such); on / the saved choice or the browser decides. The address then
// follows the language shown.
const shipped = localeFromPath(location.pathname);
let locale =
	shipped !== "en"
		? shipped
		: pickInitialLocale(readSavedLocale(), navigator.languages);
if (locale !== shipped) applyLocale(document, locale);
showLocaleInAddress(locale);

function showLocaleInAddress(shown: typeof locale): void {
	const path = pathOfLocale(shown);
	if (location.pathname !== path) {
		history.replaceState(null, "", `${path}${location.search}${location.hash}`);
	}
}

mountLocaleSwitches(document, locale, (picked) => {
	locale = picked;
	showLocaleInAddress(picked);
	guide?.setLocale(picked);
});

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
const touchFirst = window.matchMedia("(pointer: coarse)").matches;

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
			// Phones and tablets get the still scene of reduced motion: a
			// full-screen WebGL loop at 60 fps fought the page's own scrolling
			// there (stutter, scrolls that would not start). It redraws only
			// when the stage changes.
			reducedMotion: reducedMotion || touchFirst,
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
