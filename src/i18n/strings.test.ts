import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LAST_STAGE } from "../scene/tile-poses";
import { pickInitialLocale } from "./apply-locale";
import { LOCALES, STRINGS, isStringKey } from "./strings";

const html = readFileSync(
	fileURLToPath(new URL("../../index.html", import.meta.url)),
	"utf8",
);

describe("strings", () => {
	it("has a string for every key the page uses", () => {
		const used = [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(
			(match) => match[1] ?? "",
		);
		expect(used.length).toBeGreaterThan(20);
		for (const key of used) expect(isStringKey(key), key).toBe(true);
	});

	it("ships the English text in the HTML", () => {
		for (const match of html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]+)</g)) {
			const key = match[1] ?? "";
			const text = (match[2] ?? "").replace(/\s+/g, " ").trim();
			if (isStringKey(key)) expect(text, key).toBe(STRINGS.en[key]);
		}
	});

	it("keeps em-dashes and empty strings out of the copy", () => {
		for (const locale of LOCALES) {
			for (const [key, text] of Object.entries(STRINGS[locale])) {
				expect(text, `${locale} ${key}`).not.toContain("—");
				expect(text.trim(), `${locale} ${key}`).not.toBe("");
			}
		}
	});
});

describe("page structure", () => {
	it("has one data-stage section per 3D stage", () => {
		const stages = html.match(/\sdata-stage="/g) ?? [];
		expect(stages).toHaveLength(LAST_STAGE + 1);
	});
});

describe("pickInitialLocale", () => {
	it("prefers a saved choice", () => {
		expect(pickInitialLocale("vi", ["en-US"])).toBe("vi");
		expect(pickInitialLocale("en", ["vi-VN"])).toBe("en");
	});

	it("follows the first browser language we have", () => {
		expect(pickInitialLocale(null, ["vi-VN", "en"])).toBe("vi");
		expect(pickInitialLocale(null, ["fr-FR", "en-GB", "vi"])).toBe("en");
		expect(pickInitialLocale(null, ["ja"])).toBe("en");
		expect(pickInitialLocale("de", [])).toBe("en");
	});
});
