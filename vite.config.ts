import { type Plugin, defineConfig } from "vite";
import { LOCALE_PATHS } from "./src/i18n/apply-locale";
import { PRERENDERED_LOCALES, localePage } from "./src/i18n/locale-page";

/** Writes /vi/index.html and /zh-CN/index.html, a page per language, from the built index.html. */
function localePagesPlugin(): Plugin {
	return {
		name: "home-locale-pages",
		apply: "build",
		enforce: "post",
		generateBundle(_options, bundle) {
			const index = bundle["index.html"];
			if (index?.type !== "asset" || typeof index.source !== "string") {
				throw new Error("no index.html in the bundle");
			}
			for (const locale of PRERENDERED_LOCALES) {
				this.emitFile({
					type: "asset",
					fileName: `${LOCALE_PATHS[locale].slice(1)}index.html`,
					source: localePage(index.source, locale),
				});
			}
		},
	};
}

export default defineConfig({
	plugins: [localePagesPlugin()],
	build: {
		target: "es2022",
		// three.js lands in its own lazy chunk; the first paint only needs the page.
		chunkSizeWarningLimit: 700,
	},
});
