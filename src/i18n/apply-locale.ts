import {
	type PreferenceOptions,
	readPreferences,
	writePreference,
} from "@achoo254/app-shell/preferences";
import { LOCALES, type Locale, STRINGS, isStringKey } from "./strings";

/**
 * The language is the `hd_lang` cookie every hoandat.com app shares, so a
 * choice made here or in another app holds everywhere. The page's own older
 * key is still read until the visitor picks again.
 */
const PREFERENCE_OPTIONS: PreferenceOptions = {
	domain: "hoandat.com",
	legacyLangKey: "hoandat-home-locale",
};

export function isLocale(value: string | null): value is Locale {
	return value !== null && (LOCALES as readonly string[]).includes(value);
}

/**
 * The saved choice wins; otherwise the first browser language the page has
 * (any Chinese tag reads Simplified Chinese), English for everyone else.
 */
export function pickInitialLocale(
	saved: string | null,
	browserLanguages: readonly string[],
): Locale {
	if (isLocale(saved)) return saved;
	for (const tag of browserLanguages) {
		const language = tag.toLowerCase().split("-")[0];
		if (language === "vi") return "vi";
		if (language === "en") return "en";
		if (language === "zh") return "zh-CN";
	}
	return "en";
}

export function readSavedLocale(): string | null {
	return readPreferences(PREFERENCE_OPTIONS).lang ?? null;
}

export function saveLocale(locale: Locale): void {
	writePreference("lang", locale, PREFERENCE_OPTIONS);
}

/**
 * Swaps every `data-i18n` text and every `data-i18n-<attr>` attribute.
 * Unknown keys are left as shipped so a typo never blanks the page.
 */
export function applyLocale(root: Document, locale: Locale): void {
	const strings = STRINGS[locale];
	root.documentElement.lang = locale;

	for (const element of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
		// getAttribute rather than dataset: the build runs this on linkedom too (locale-page.ts).
		const key = element.getAttribute("data-i18n") ?? "";
		if (isStringKey(key)) element.textContent = strings[key];
	}

	for (const attribute of ["aria-label", "alt", "content"] as const) {
		const dataName = `data-i18n-${attribute}`;
		for (const element of root.querySelectorAll(`[${dataName}]`)) {
			const key = element.getAttribute(dataName) ?? "";
			if (isStringKey(key)) element.setAttribute(attribute, strings[key]);
		}
	}

	// One switch per language, each written in its own language; the one of
	// the page shown is hidden.
	// toggleAttribute rather than .hidden: the build runs this on linkedom too.
	for (const button of root.querySelectorAll("[data-locale-switch]")) {
		button.toggleAttribute(
			"hidden",
			button.getAttribute("data-locale-switch") === locale,
		);
	}

	root.title = strings["meta.title"];
}

/**
 * Wires every language switch of the page: a pick is stored in the shared
 * `hd_lang` cookie, the page swaps to it and `onChange` hears it (address,
 * guide bot).
 */
export function mountLocaleSwitches(
	root: Document,
	initial: Locale,
	onChange: (locale: Locale) => void,
): void {
	let current = initial;
	for (const button of root.querySelectorAll("[data-locale-switch]")) {
		button.addEventListener("click", () => {
			const picked = button.getAttribute("data-locale-switch");
			if (!isLocale(picked) || picked === current) return;
			current = picked;
			saveLocale(picked);
			applyLocale(root, picked);
			onChange(picked);
		});
	}
}

/** Where each language's page lives: English at the root, the others under their tag. */
export const LOCALE_PATHS: Readonly<Record<Locale, string>> = {
	en: "/",
	vi: "/vi/",
	"zh-CN": "/zh-CN/",
};

/** The language of the page at `pathname`: /vi/ and /zh-CN/ are their own, everything else English. */
export function localeFromPath(pathname: string): Locale {
	for (const locale of LOCALES) {
		const path = LOCALE_PATHS[locale];
		if (path === "/") continue;
		if (pathname === path.slice(0, -1) || pathname.startsWith(path)) {
			return locale;
		}
	}
	return "en";
}

export function pathOfLocale(locale: Locale): string {
	return LOCALE_PATHS[locale];
}
