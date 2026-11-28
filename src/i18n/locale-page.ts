import { parseHTML } from "linkedom";
import { LOCALE_PATHS, applyLocale } from "./apply-locale";
import { LOCALES, type Locale, STRINGS } from "./strings";

export const SITE_ORIGIN = "https://hoandat.com";

/** The languages written as their own page at build time; English is index.html itself. */
export const PRERENDERED_LOCALES: readonly Exclude<Locale, "en">[] =
	LOCALES.filter((locale): locale is Exclude<Locale, "en"> => locale !== "en");

function setAttribute(
	document: Document,
	selector: string,
	name: string,
	value: string,
): void {
	const element = document.querySelector(selector);
	if (!element) throw new Error(`index.html has no ${selector}`);
	element.setAttribute(name, value);
}

/**
 * The page of one language (/vi/, /zh-CN/) written at build time from the
 * built index.html: the same swap the browser makes (applyLocale), plus the
 * head tags search engines and link previews read, so the page is in that
 * language without running JS.
 */
export function localePage(indexHtml: string, locale: Locale): string {
	const { document } = parseHTML(indexHtml) as unknown as {
		document: Document;
	};
	applyLocale(document, locale);
	const strings = STRINGS[locale];
	const url = `${SITE_ORIGIN}${LOCALE_PATHS[locale]}`;
	setAttribute(document, 'link[rel="canonical"]', "href", url);
	setAttribute(document, 'meta[property="og:url"]', "content", url);
	setAttribute(
		document,
		'meta[property="og:title"]',
		"content",
		strings["meta.title"],
	);
	setAttribute(
		document,
		'meta[property="og:description"]',
		"content",
		strings["meta.description"],
	);
	return `<!doctype html>\n${document.documentElement.outerHTML}\n`;
}
