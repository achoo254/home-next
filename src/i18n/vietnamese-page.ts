import { parseHTML } from "linkedom";
import { applyLocale } from "./apply-locale";
import { STRINGS } from "./strings";

export const SITE_ORIGIN = "https://hoandat.com";
export const VIETNAMESE_PATH = "/vi/";

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
 * The Vietnamese page (/vi/) written at build time from the built index.html:
 * the same swap the browser makes (applyLocale), plus the head tags search
 * engines and link previews read, so the page is Vietnamese without running JS.
 */
export function vietnamesePage(indexHtml: string): string {
	const { document } = parseHTML(indexHtml) as unknown as {
		document: Document;
	};
	applyLocale(document, "vi");
	const strings = STRINGS.vi;
	const url = `${SITE_ORIGIN}${VIETNAMESE_PATH}`;
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
