import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { localeFromPath, pathOfLocale } from "./apply-locale";
import { PRERENDERED_LOCALES, localePage } from "./locale-page";
import { LOCALES, STRINGS } from "./strings";

const html = readFileSync(
	fileURLToPath(new URL("../../index.html", import.meta.url)),
	"utf8",
);

const switchOf = (page: string, locale: string): string =>
	page.match(
		new RegExp(`<button[^>]*data-locale-switch="${locale}"[^>]*>`),
	)?.[0] ?? "";

describe("page per language", () => {
	it("writes every language but English, the index itself", () => {
		expect(PRERENDERED_LOCALES).toEqual(["vi", "zh-CN"]);
	});

	for (const locale of PRERENDERED_LOCALES) {
		const page = localePage(html, locale);

		it(`is ${locale} without running JS`, () => {
			expect(page).toMatch(
				new RegExp(`^<!doctype html>\\n<html lang="${locale}"`),
			);
			expect(page).toContain(`<title>${STRINGS[locale]["meta.title"]}</title>`);
			expect(page).toContain(`>${STRINGS[locale]["hero.title"]}<`);
			expect(page).not.toContain(`>${STRINGS.en["hero.title"]}<`);
			expect(page).toContain(`>${STRINGS[locale]["hero.cta.signup"]}<`);
		});

		it(`has its own address at ${pathOfLocale(locale)}`, () => {
			const url = `https://hoandat.com${pathOfLocale(locale)}`;
			expect(page).toContain(`<link rel="canonical" href="${url}">`);
			expect(page).toContain(`<meta property="og:url" content="${url}">`);
			expect(page).toContain(
				`<meta property="og:title" content="${STRINGS[locale]["meta.title"]}">`,
			);
		});

		it(`offers the other languages, not ${locale} itself`, () => {
			for (const other of LOCALES) {
				const button = switchOf(page, other);
				expect(button, other).not.toBe("");
				expect(button.includes("hidden"), other).toBe(other === locale);
			}
		});
	}

	it("has the English page offer Vietnamese and Chinese", () => {
		expect(switchOf(html, "en")).toContain("hidden");
		expect(switchOf(html, "vi")).not.toContain("hidden");
		expect(switchOf(html, "zh-CN")).not.toContain("hidden");
		expect(html).toMatch(/data-locale-switch="zh-CN" lang="zh-CN"[^>]*>中文</);
	});

	it("has every page point at every language", () => {
		for (const source of [
			html,
			...PRERENDERED_LOCALES.map((l) => localePage(html, l)),
		]) {
			expect(source).toMatch(/hreflang="en" href="https:\/\/hoandat\.com\/"/);
			expect(source).toMatch(
				/hreflang="vi" href="https:\/\/hoandat\.com\/vi\/"/,
			);
			expect(source).toMatch(
				/hreflang="zh-CN" href="https:\/\/hoandat\.com\/zh-CN\/"/,
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
		expect(localeFromPath("/zh-CN/")).toBe("zh-CN");
		expect(localeFromPath("/zh-CN")).toBe("zh-CN");
		expect(localeFromPath("/")).toBe("en");
		expect(localeFromPath("/video")).toBe("en");
		expect(localeFromPath("/zh-CNx")).toBe("en");
	});

	it("puts each language at its own path", () => {
		expect(pathOfLocale("vi")).toBe("/vi/");
		expect(pathOfLocale("zh-CN")).toBe("/zh-CN/");
		expect(pathOfLocale("en")).toBe("/");
	});
});
