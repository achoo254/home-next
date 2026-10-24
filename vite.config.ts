import { defineConfig } from "vite";

export default defineConfig({
	build: {
		target: "es2022",
		// three.js lands in its own lazy chunk; the first paint only needs the page.
		chunkSizeWarningLimit: 700,
	},
});
