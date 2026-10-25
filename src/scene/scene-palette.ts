/**
 * The 3D scene's colours. three.js takes sRGB hex, so the values live here
 * once, matched by eye to the CSS tokens in `src/styles/tokens.css`:
 * `violet` = the logo gradient (#8874d8 -> #5a47aa, primary #6e56cf),
 * `accent` = the logo's round tile (#e796f3).
 */
export const SCENE_PALETTE = {
	background: 0x0d0a17,
	violet: 0x6e56cf,
	violetLight: 0x8874d8,
	accent: 0xe796f3,
	keyLight: 0xfff4fb,
	glassTint: 0xdcd2ff,
	glassTintAccent: 0xf6c4fb,
	glyph: 0xf3eeff,
	glyphAccent: 0xffd1f7,
	dust: 0xc9b8ff,
	dustAccent: 0xf3a9f6,
	// Nav's rocket: a deeper pink and violet than the accent, which turns
	// almost white once it is bright enough to bloom.
	flame: 0xff5ad9,
	flameDeep: 0x7a4cff,
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

/** One mood per stage: hero, Chat, Scribe, Localman, Tunelo, account, workshop. */
export const AURORA_MOODS: readonly AuroraMood[] = [
	{ deep: 0x07051a, mid: 0x1d1550, glow: 0x6e56cf, accent: 0xe796f3 },
	{ deep: 0x060619, mid: 0x1a1b5c, glow: 0x5b6cff, accent: 0x8874d8 },
	{ deep: 0x12061a, mid: 0x3a1250, glow: 0xc56be0, accent: 0xffb3f2 },
	{ deep: 0x050a1c, mid: 0x0d1b48, glow: 0x3352b8, accent: 0x6079cc },
	{ deep: 0x0b061c, mid: 0x2a1060, glow: 0x8a4dff, accent: 0xe796f3 },
	{ deep: 0x0a0620, mid: 0x2b1a6e, glow: 0x8874d8, accent: 0xffc6f5 },
	{ deep: 0x06040f, mid: 0x120c30, glow: 0x3a2c80, accent: 0x6e56cf },
];
