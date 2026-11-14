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

describe("apps by kind", () => {
	const section = html.slice(
		html.indexOf('<section id="groups"'),
		html.indexOf('<section class="made"'),
	);
	const hostsIn = (part: string): string[] =>
		[...part.matchAll(/href="(https:\/\/[^"]+)"/g)].map(
			(match) => new URL((match[1] ?? "").replaceAll("&amp;", "&")).host,
		);
	// Each group starts at its own id and ends where the next group starts.
	const hostsOf = (id: string): string[] => {
		const start = section.indexOf(`id="group-${id}"`);
		const next = section.indexOf('class="group"', start);
		return hostsIn(section.slice(start, next === -1 ? undefined : next));
	};

	it("lists every app under Tools, Entertainment or Learning", () => {
		expect(hostsOf("tools")).toEqual([
			"webnhanh.hoandat.com",
			"chat.hoandat.com",
			"tieude.hoandat.com",
			"scribe.hoandat.com",
			"localman.hoandat.com",
			"tunnel.hoandat.com",
		]);
		expect(hostsOf("fun")).toEqual([
			"tuvi.hoandat.com",
			"clip.hoandat.com",
			"truyen.hoandat.com",
			"lockin.hoandat.com",
		]);
		expect(hostsOf("learn")).toEqual(["miu.hoandat.com", "kb.hoandat.com"]);
	});

	it("keeps the section out of the app stops and the route", () => {
		const route = html.slice(html.indexOf('<nav class="route"'));
		expect(route).not.toMatch(/Scribe|Localman|Tunelo/);
		expect(section).not.toContain("data-stage=");
	});

	it("names the three kinds for each language", () => {
		expect(STRINGS.en["group.tools.title"]).toBe("Tools");
		expect(STRINGS.en["group.fun.title"]).toBe("Entertainment");
		expect(STRINGS.en["group.learn.title"]).toBe("Learning");
		expect(STRINGS.vi["group.tools.title"]).toBe("Công cụ");
		expect(STRINGS.vi["group.fun.title"]).toBe("Giải trí");
		expect(STRINGS.vi["group.learn.title"]).toBe("Học tập");
	});

	it("never mentions developers on the page", () => {
		expect(html).not.toMatch(/developer|lập trình viên/i);
		for (const locale of ["en", "vi"] as const) {
			for (const text of Object.values(STRINGS[locale])) {
				expect(text).not.toMatch(/developer|lập trình viên/i);
			}
		}
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
