import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LAST_STAGE } from "../scene/flight-path";
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

	it("has one route stop and, before the last stop, one guide line per stage", () => {
		const stops = html.match(/\sdata-route="/g) ?? [];
		expect(stops).toHaveLength(LAST_STAGE + 1);
		for (let stop = 0; stop <= LAST_STAGE; stop++) {
			expect(isStringKey(`route.${stop}`), `route.${stop}`).toBe(true);
		}
		for (let stop = 0; stop < LAST_STAGE; stop++) {
			expect(isStringKey(`guide.${stop}`), `guide.${stop}`).toBe(true);
		}
		expect(isStringKey(`route.${LAST_STAGE + 1}`)).toBe(false);
	});

	it("opens on the three apps to start with and the sign-up button", () => {
		const hero = html.slice(
			html.indexOf('<section id="launch"'),
			html.indexOf('<section id="apps"'),
		);
		const apps = [...hero.matchAll(/class="hero-app" href="([^"]+)"/g)].map(
			(match) => new URL((match[1] ?? "").replaceAll("&amp;", "&")).host,
		);
		expect(apps).toEqual([
			"tuvi.hoandat.com",
			"miu.hoandat.com",
			"webnhanh.hoandat.com",
		]);
		expect(hero).toMatch(
			/href="https:\/\/auth\.hoandat\.com\/account\?signup=1" data-i18n="hero\.cta\.signup"/,
		);
	});
});

describe("developer tools", () => {
	const section = html.slice(
		html.indexOf('<section id="developers"'),
		html.indexOf('<section class="made"'),
	);
	const hostsIn = (part: string): string[] =>
		[...part.matchAll(/href="(https:\/\/[^"]+)"/g)].map(
			(match) => new URL((match[1] ?? "").replaceAll("&amp;", "&")).host,
		);

	it("lists Scribe, Localman and Tunelo in their own section", () => {
		expect(section).toContain('data-i18n="dev.title"');
		expect(hostsIn(section)).toEqual([
			"scribe.hoandat.com",
			"localman.hoandat.com",
			"tunnel.hoandat.com",
		]);
	});

	it("keeps them out of the hero, the app stops and the route", () => {
		const main = html.slice(
			html.indexOf('<section id="launch"'),
			html.indexOf('<section id="developers"'),
		);
		const route = html.slice(html.indexOf('<nav class="route"'));
		for (const host of [
			"scribe.hoandat.com",
			"localman.hoandat.com",
			"tunnel.hoandat.com",
		]) {
			expect(hostsIn(main), host).not.toContain(host);
		}
		expect(route).not.toMatch(/Scribe|Localman|Tunelo/);
		expect(section).not.toContain("data-stage=");
	});

	it("names the section for each language", () => {
		expect(STRINGS.en["dev.title"]).toBe("For developers");
		expect(STRINGS.vi["dev.title"]).toBe("Công cụ cho lập trình viên");
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
