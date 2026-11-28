import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Locale, STRINGS } from "./strings";

const html = readFileSync(
	fileURLToPath(new URL("../../index.html", import.meta.url)),
	"utf8",
);

/** The browser globals the shared preferences read: a cookie jar on hoandat.com. */
function stubBrowser(): string[] {
	const written: string[] = [];
	vi.stubGlobal("location", { protocol: "https:", hostname: "hoandat.com" });
	vi.stubGlobal("document", {
		get cookie(): string {
			return written.map((cookie) => cookie.split(";")[0]).join("; ");
		},
		set cookie(value: string) {
			written.push(value);
		},
	});
	return written;
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe("language switch", () => {
	it("turns the page Chinese on 中文 and keeps hd_lang=zh-CN for every app", async () => {
		const cookies = stubBrowser();
		// Fresh module: the shared preferences cache the page environment.
		const { mountLocaleSwitches } = await import("./apply-locale");
		const { document: page, Event } = parseHTML(html) as unknown as {
			document: Document;
			Event: typeof globalThis.Event;
		};
		const heard: Locale[] = [];
		mountLocaleSwitches(page, "en", (locale) => heard.push(locale));

		const chinese = page.querySelector('[data-locale-switch="zh-CN"]');
		expect(chinese?.textContent).toBe("中文");
		chinese?.dispatchEvent(new Event("click"));

		expect(heard).toEqual(["zh-CN"]);
		expect(page.documentElement.getAttribute("lang")).toBe("zh-CN");
		expect(page.querySelector('[data-i18n="hero.title"]')?.textContent).toBe(
			STRINGS["zh-CN"]["hero.title"],
		);
		expect(
			page
				.querySelector('[data-locale-switch="zh-CN"]')
				?.hasAttribute("hidden"),
		).toBe(true);
		expect(
			page.querySelector('[data-locale-switch="en"]')?.hasAttribute("hidden"),
		).toBe(false);
		expect(cookies.join("\n")).toMatch(/hd_lang=zh-CN;.*Domain=hoandat\.com/i);
	});

	it("reads back 中文 picked here or in another app from the shared cookie", async () => {
		const cookies = stubBrowser();
		cookies.push("hd_lang=zh-CN; Domain=hoandat.com; Path=/");
		const { readSavedLocale } = await import("./apply-locale");
		expect(readSavedLocale()).toBe("zh-CN");
	});

	it("ignores a switch to the language already shown", async () => {
		stubBrowser();
		const { mountLocaleSwitches } = await import("./apply-locale");
		const { document: page, Event } = parseHTML(html) as unknown as {
			document: Document;
			Event: typeof globalThis.Event;
		};
		const heard: Locale[] = [];
		mountLocaleSwitches(page, "en", (locale) => heard.push(locale));
		page
			.querySelector('[data-locale-switch="en"]')
			?.dispatchEvent(new Event("click"));
		expect(heard).toEqual([]);
	});
});
