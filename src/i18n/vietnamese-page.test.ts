import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { localeFromPath, pathOfLocale } from "./apply-locale";
import { STRINGS } from "./strings";
import { vietnamesePage } from "./vietnamese-page";

const html = readFileSync(
	fileURLToPath(new URL("../../index.html", import.meta.url)),
	"utf8",
);

describe("Vietnamese page", () => {
	const page = vietnamesePage(html);

	it("is Vietnamese without running JS", () => {
		expect(page).toMatch(/^<!doctype html>\n<html lang="vi"/);
		expect(page).toContain(`<title>${STRINGS.vi["meta.title"]}</title>`);
		expect(page).toContain(`>${STRINGS.vi["hero.title"]}<`);
		expect(page).not.toContain(`>${STRINGS.en["hero.title"]}<`);
	});

	it("has its own address, and both pages point at each other", () => {
		expect(page).toContain(
			'<link rel="canonical" href="https://hoandat.com/vi/">',
		);
		expect(page).toContain(
			'<meta property="og:url" content="https://hoandat.com/vi/">',
		);
		for (const source of [html, page]) {
			expect(source).toMatch(/hreflang="en" href="https:\/\/hoandat\.com\/"/);
			expect(source).toMatch(
				/hreflang="vi" href="https:\/\/hoandat\.com\/vi\/"/,
			);
			expect(source).toMatch(
				/hreflang="x-default" href="https:\/\/hoandat\.com\/"/,
			);
		}
	});
});

describe("locale and address", () => {
	it("reads the language from the path", () => {
		expect(localeFromPath("/vi/")).toBe("vi");
		expect(localeFromPath("/vi")).toBe("vi");
		expect(localeFromPath("/")).toBe("en");
		expect(localeFromPath("/video")).toBe("en");
	});

	it("puts each language at its own path", () => {
		expect(pathOfLocale("vi")).toBe("/vi/");
		expect(pathOfLocale("en")).toBe("/");
	});
});
