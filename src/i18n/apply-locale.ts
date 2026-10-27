import { LOCALES, type Locale, STRINGS, isStringKey } from "./strings";

const STORAGE_KEY = "hoandat-home-locale";

function isLocale(value: string | null): value is Locale {
	return value !== null && (LOCALES as readonly string[]).includes(value);
}

/**
 * The saved choice wins; otherwise Vietnamese for a browser that lists a
 * Vietnamese language first among the ones we have, English for everyone else.
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
	}
	return "en";
}

export function readSavedLocale(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

export function saveLocale(locale: Locale): void {
	try {
		localStorage.setItem(STORAGE_KEY, locale);
	} catch {
		// Private mode or blocked storage: the choice lasts for this visit only.
	}
}

/**
 * Swaps every `data-i18n` text and every `data-i18n-<attr>` attribute.
 * Unknown keys are left as shipped so a typo never blanks the page.
 */
export function applyLocale(root: Document, locale: Locale): void {
	const strings = STRINGS[locale];
	root.documentElement.lang = locale;

	for (const element of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
		// getAttribute rather than dataset: the build runs this on linkedom too (vietnamese-page.ts).
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

	// The switch is written in the language it switches to.
	for (const button of root.querySelectorAll<HTMLElement>(
		"[data-locale-switch]",
	)) {
		button.lang = otherLocale(locale);
	}

	root.title = strings["meta.title"];
}

/** The language of the page at `pathname`: /vi/ is the Vietnamese page, everything else the English one. */
export function localeFromPath(pathname: string): Locale {
	return pathname === "/vi" || pathname.startsWith("/vi/") ? "vi" : "en";
}

/** Where each language's page lives. */
export function pathOfLocale(locale: Locale): string {
	return locale === "vi" ? "/vi/" : "/";
}

export function otherLocale(locale: Locale): Locale {
	return locale === "en" ? "vi" : "en";
}
