/**
 * The 3D scene's colours. three.js takes sRGB hex, so the values live here
 * once, matched by eye to the CSS tokens in `src/styles/tokens.css`: the
 * stars take the violet and pink of the logo.
 */
export const SCENE_PALETTE = {
	background: 0x0d0a17,
	dust: 0xc9b8ff,
	dustAccent: 0xf3a9f6,
} as const;

/**
 * The aurora behind the tiles changes mood with each stage of the page, so
 * every app chapter has its own light: four colours from the deepest shadow
 * to the brightest wisp.
 */
export interface AuroraMood {
	readonly deep: number;
	readonly mid: number;
	readonly glow: number;
	readonly accent: number;
}

/** One mood per stage: hero, Chat, KnowFlow, Web Nhanh, account, workshop. */
export const AURORA_MOODS: readonly AuroraMood[] = [
	{ deep: 0x07051a, mid: 0x1d1550, glow: 0x6e56cf, accent: 0xe796f3 },
	{ deep: 0x060619, mid: 0x1a1b5c, glow: 0x5b6cff, accent: 0x8874d8 },
	{ deep: 0x06041a, mid: 0x261060, glow: 0x7c3aed, accent: 0x5ec8f0 },
	{ deep: 0x10051a, mid: 0x34104e, glow: 0xb15ad8, accent: 0xf3a9f6 },
	{ deep: 0x0a0620, mid: 0x2b1a6e, glow: 0x8874d8, accent: 0xffc6f5 },
	{ deep: 0x06040f, mid: 0x120c30, glow: 0x3a2c80, accent: 0x6e56cf },
];
