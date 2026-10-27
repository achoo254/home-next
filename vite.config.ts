import { type Plugin, defineConfig } from "vite";
import { VIETNAMESE_PATH, vietnamesePage } from "./src/i18n/vietnamese-page";

/** Writes /vi/index.html, the Vietnamese page, from the built index.html. */
function vietnamesePagePlugin(): Plugin {
	return {
		name: "home-vietnamese-page",
		apply: "build",
		enforce: "post",
		generateBundle(_options, bundle) {
			const index = bundle["index.html"];
			if (index?.type !== "asset" || typeof index.source !== "string") {
				throw new Error("no index.html in the bundle");
			}
			this.emitFile({
				type: "asset",
				fileName: `${VIETNAMESE_PATH.slice(1)}index.html`,
				source: vietnamesePage(index.source),
			});
		},
	};
}

export default defineConfig({
	plugins: [vietnamesePagePlugin()],
	build: {
		target: "es2022",
		// three.js lands in its own lazy chunk; the first paint only needs the page.
		chunkSizeWarningLimit: 700,
	},
});
