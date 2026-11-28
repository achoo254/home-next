/**
 * The sky behind the tiles: one AI-painted deep-space panorama per stage
 * (`public/sky-<set>-<stage>-<width>.webp`), cross-faded as the ship flies from
 * stop to stop. Each panorama is framed a little larger than the screen and
 * slides past while the ship travels, so leaving a chapter feels like flying
 * on. A light colour grade from the stage's mood ties the six skies to the
 * page. It is drawn into a render target once per frame and used as the
 * scene background, so the glass tiles (whose refraction pass also draws the
 * background) still refract it. Behind the copy it calms down to keep text
 * readable: the left side on wide screens, the bottom on phones.
 */
import {
	Color,
	HalfFloatType,
	LinearFilter,
	MathUtils,
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	SRGBColorSpace,
	Scene,
	ShaderMaterial,
	type Texture,
	TextureLoader,
	Vector2,
	WebGLRenderTarget,
	type WebGLRenderer,
} from "three";
import { SKY_MOODS, type SkyMood } from "./scene-palette";

/**
 * Screens that get the 2560 px panoramas; the rest get 1440 px. main.css
 * uses the same query for the stand-in, so the first sky downloads once.
 */
const LARGE_SKY_QUERY = "(min-width: 1000px), (min-resolution: 2dppx)";

/**
 * Name of the current set of skies. Browsers and the CDN keep each image
 * for hours under its URL, so replacing a sky means a new set name (files
 * renamed to match, and the stand-in in main.css), never new bytes under
 * an old name.
 */
const SKY_SET = "glossy2";

/** The panorama for one stage, sized for this screen. */
function skyImageUrl(stage: number, large: boolean): string {
	return `/sky-${SKY_SET}-${stage}-${large ? 2560 : 1440}.webp`;
}

/** Width over height of every panorama. */
const SKY_IMAGE_ASPECT = 16 / 9;
/**
 * How far the panorama is zoomed past covering the screen, leaving a little
 * room to slide through. Kept close to 1: the 2560 px skies then land about
 * one image pixel per screen pixel on a 2K display, so the stars stay sharp.
 */
const SKY_ZOOM = 1.03;
/** How long a panorama takes to fade in once it has loaded. */
const FADE_IN_MS = 900;

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	uniform sampler2D uSkyA;
	uniform sampler2D uSkyB;
	uniform float uReadyA;
	uniform float uReadyB;
	uniform vec2 uPanA;
	uniform vec2 uPanB;
	uniform float uMix;
	uniform float uImageAspect;
	uniform float uAspect;
	uniform float uZoom;
	uniform float uCalmLeft;
	uniform float uCalmBottom;
	uniform vec3 uDeep;
	uniform vec3 uMid;
	uniform vec3 uGlow;
	uniform vec3 uAccent;
	varying vec2 vUv;

	vec3 normalised(vec3 c) {
		return c / max(max(c.r, c.g), max(c.b, 1e-4));
	}

	// Covers the screen with a panorama, zoomed in so there is room left on
	// every side; pan -1..1 slides across that room.
	vec3 sampleSky(sampler2D sky, vec2 pan) {
		vec2 extent = uAspect > uImageAspect
			? vec2(1.0, uImageAspect / uAspect)
			: vec2(uAspect / uImageAspect, 1.0);
		extent /= uZoom;
		vec2 margin = 0.5 - 0.5 * extent;
		vec2 uv = 0.5 + (vUv - 0.5) * extent + clamp(pan, -1.0, 1.0) * margin;
		return texture2D(sky, uv).rgb;
	}

	void main() {
		vec3 a = mix(uDeep, sampleSky(uSkyA, uPanA), uReadyA);
		vec3 b = mix(uDeep, sampleSky(uSkyB, uPanB), uReadyB);
		vec3 sky = mix(a, b, uMix);

		// A light grade towards the stage's mood, so six different photos
		// still read as one journey.
		float lum = dot(sky, vec3(0.2126, 0.7152, 0.0722));
		vec3 tint = normalised(mix(uMid, uGlow, smoothstep(0.02, 0.35, lum)));
		vec3 colour = mix(sky, lum * tint * 1.5, 0.14);
		colour += uAccent * smoothstep(0.3, 0.9, lum) * 0.05;

		vec2 screen = vUv;
		float calm = 1.0;
		calm *= mix(1.0, 0.3 + 0.7 * smoothstep(0.12, 0.6, screen.x), uCalmLeft);
		calm *= mix(1.0, 0.32 + 0.68 * smoothstep(0.05, 0.58, screen.y), uCalmBottom);
		colour *= calm;
		// Stay under the bloom threshold: only the flying stars glow.
		colour = min(colour, vec3(0.86));

		vec2 centre = screen - 0.5;
		colour *= 1.0 - 0.35 * dot(centre, centre) * 2.0;

		gl_FragColor = vec4(colour, 1.0);
		#include <colorspace_fragment>
	}
`;

export interface GalaxyBackdrop {
	/** The graded sky as a texture, for `scene.background`. */
	readonly texture: Texture;
	/** Draws the sky into its texture; call once per frame. */
	render(renderer: WebGLRenderer): void;
	/**
	 * Shows the skies of the two stages around `stage`, cross-faded, each
	 * slid by how far the ship is from its stop; `nudgeX`/`nudgeY` (-1..1)
	 * add a small parallax, and `seconds` a slow drift (hold it still for
	 * reduced motion).
	 */
	setStage(
		stage: number,
		nudgeX: number,
		nudgeY: number,
		seconds: number,
	): void;
	/** Drawing buffer size and the share of it the sky is drawn at. */
	setSize(width: number, height: number, scale: number, compact: boolean): void;
	dispose(): void;
}

export interface GalaxyBackdropOptions {
	/** Show each panorama at once instead of fading it in (reduced motion). */
	readonly instant: boolean;
	/** Called whenever a panorama has loaded, so a still scene can redraw. */
	readonly onLoad: () => void;
}

function moodAt(index: number): SkyMood {
	const mood = SKY_MOODS[MathUtils.clamp(index, 0, SKY_MOODS.length - 1)];
	if (!mood) throw new Error("galaxy-backdrop: no moods defined");
	return mood;
}

/** How far a panorama slides, as a share of its room, per stage travelled. */
const SLIDE = new Vector2(0.5, -0.3);
/** Pointer parallax, as a share of the room left to slide through. */
const NUDGE = 0.06;
/**
 * The sky's slow drift while the page rests: a wandering loop over a few
 * minutes, at most this share of the room (a few dozen pixels on a 2K
 * screen), so it reads as floating, never as scrolling.
 */
const DRIFT = 0.4;

export function createGalaxyBackdrop(
	options: GalaxyBackdropOptions,
): GalaxyBackdrop {
	const geometry = new PlaneGeometry(2, 2);
	const uniforms = {
		uSkyA: { value: null as Texture | null },
		uSkyB: { value: null as Texture | null },
		uReadyA: { value: 0 },
		uReadyB: { value: 0 },
		uPanA: { value: new Vector2() },
		uPanB: { value: new Vector2() },
		uMix: { value: 0 },
		uImageAspect: { value: SKY_IMAGE_ASPECT },
		uAspect: { value: 1 },
		uZoom: { value: SKY_ZOOM },
		uCalmLeft: { value: 1 },
		uCalmBottom: { value: 0 },
		uDeep: { value: new Color() },
		uMid: { value: new Color() },
		uGlow: { value: new Color() },
		uAccent: { value: new Color() },
	};
	const material = new ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader,
		depthTest: false,
		depthWrite: false,
	});
	const quad = new Scene();
	quad.add(new Mesh(geometry, material));
	const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const target = new WebGLRenderTarget(1, 1, {
		type: HalfFloatType,
		minFilter: LinearFilter,
		magFilter: LinearFilter,
		depthBuffer: false,
	});

	// One panorama per stage, loaded in page order: the launch sky first,
	// the next one only after the previous arrived, so they never compete
	// with the first paint.
	const large = window.matchMedia(LARGE_SKY_QUERY).matches;
	const skies: (Texture | null)[] = SKY_MOODS.map(() => null);
	const loadedAt: number[] = SKY_MOODS.map(() => Number.NaN);
	const loader = new TextureLoader();
	let disposed = false;
	function loadSky(stage: number): void {
		if (stage >= skies.length) return;
		const texture = loader.load(
			skyImageUrl(stage, large),
			() => {
				if (disposed) {
					texture.dispose();
					return;
				}
				skies[stage] = texture;
				loadedAt[stage] = options.instant ? 0 : performance.now();
				options.onLoad();
				loadSky(stage + 1);
			},
			undefined,
			// A missing sky leaves the mood colour; the rest still load.
			() => loadSky(stage + 1),
		);
		texture.colorSpace = SRGBColorSpace;
	}
	loadSky(0);

	let lower = 0;
	function readiness(stage: number, now: number): number {
		const at = loadedAt[stage];
		if (at === undefined || Number.isNaN(at)) return 0;
		return MathUtils.clamp((now - at) / FADE_IN_MS, 0, 1);
	}

	const from = new Color();
	const to = new Color();
	function blend(
		into: Color,
		key: keyof SkyMood,
		a: SkyMood,
		b: SkyMood,
		t: number,
	): void {
		into.copy(from.setHex(a[key])).lerp(to.setHex(b[key]), t);
	}

	return {
		texture: target.texture,
		render(renderer) {
			const upper = Math.min(lower + 1, skies.length - 1);
			const now = performance.now();
			uniforms.uSkyA.value = skies[lower] ?? null;
			uniforms.uSkyB.value = skies[upper] ?? null;
			uniforms.uReadyA.value = readiness(lower, now);
			uniforms.uReadyB.value = readiness(upper, now);
			const previous = renderer.getRenderTarget();
			renderer.setRenderTarget(target);
			renderer.render(quad, camera);
			renderer.setRenderTarget(previous);
		},
		setStage(stage, nudgeX, nudgeY, seconds) {
			const last = skies.length - 1;
			const clamped = MathUtils.clamp(stage, 0, last);
			lower = Math.min(Math.floor(clamped), Math.max(0, last - 1));
			const t = clamped - lower;
			// The fade happens mid-flight, so each stop shows one clear sky.
			uniforms.uMix.value = MathUtils.smoothstep(t, 0.25, 0.75);
			const offset = {
				x: nudgeX * NUDGE + Math.sin(seconds * 0.021) * DRIFT,
				y: nudgeY * NUDGE + Math.cos(seconds * 0.016) * DRIFT * 0.6,
			};
			uniforms.uPanA.value.copy(SLIDE).multiplyScalar(t).add(offset);
			uniforms.uPanB.value
				.copy(SLIDE)
				.multiplyScalar(t - 1)
				.add(offset);
			const a = moodAt(Math.floor(clamped));
			const b = moodAt(Math.floor(clamped) + 1);
			const moodT = clamped - Math.floor(clamped);
			blend(uniforms.uDeep.value, "deep", a, b, moodT);
			blend(uniforms.uMid.value, "mid", a, b, moodT);
			blend(uniforms.uGlow.value, "glow", a, b, moodT);
			blend(uniforms.uAccent.value, "accent", a, b, moodT);
		},
		setSize(width, height, scale, compact) {
			target.setSize(
				Math.max(1, Math.round(width * scale)),
				Math.max(1, Math.round(height * scale)),
			);
			uniforms.uAspect.value = width / height;
			uniforms.uCalmLeft.value = compact ? 0 : 1;
			uniforms.uCalmBottom.value = compact ? 1 : 0;
		},
		dispose() {
			disposed = true;
			geometry.dispose();
			material.dispose();
			for (const sky of skies) sky?.dispose();
			target.dispose();
		},
	};
}
