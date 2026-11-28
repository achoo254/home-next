/**
 * The sky behind the tiles: an AI-painted Milky Way panorama
 * (`public/galaxy-backdrop.webp`), framed larger than the screen so the
 * flight can pan along the galactic band, one stretch per stage, and
 * colour-graded by the mood of the current stage. It is drawn into a
 * render target once per frame and used as the scene background, so the
 * glass tiles (whose refraction pass also draws the background) still
 * refract it. Behind the copy it calms down to keep text readable: the left
 * side on wide screens, the bottom on phones.
 */
import {
	Color,
	HalfFloatType,
	LinearFilter,
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

/** The panorama; also the CSS stand-in behind the canvas (main.css). */
export const GALAXY_IMAGE_URL = "/galaxy-backdrop.webp";
/** Width over height of the panorama, so it covers the screen undistorted. */
const GALAXY_IMAGE_ASPECT = 1664 / 928;
/** How long the panorama takes to fade in once it has loaded. */
const FADE_IN_MS = 900;

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	uniform sampler2D uImage;
	uniform float uImageAspect;
	uniform float uAspect;
	uniform float uZoom;
	uniform vec2 uPan;
	uniform float uReady;
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

	void main() {
		// Cover the screen with the panorama, then zoom in so there is room
		// left over on every side to pan into.
		vec2 extent = uAspect > uImageAspect
			? vec2(1.0, uImageAspect / uAspect)
			: vec2(uAspect / uImageAspect, 1.0);
		extent /= uZoom;
		vec2 margin = 0.5 - 0.5 * extent;
		vec2 uv = 0.5 + (vUv - 0.5) * extent + clamp(uPan, -1.0, 1.0) * margin;
		vec3 sky = texture2D(uImage, uv).rgb;

		// Grade the photo towards the stage's mood: shadows lean to the mid
		// colour, the bright band to the glow, the very brightest to the accent.
		float lum = dot(sky, vec3(0.2126, 0.7152, 0.0722));
		vec3 tint = normalised(mix(uMid, uGlow, smoothstep(0.02, 0.35, lum)));
		vec3 colour = mix(sky, lum * tint * 1.6, 0.32);
		colour += uAccent * smoothstep(0.25, 0.9, lum) * 0.12;
		colour += uDeep * 0.6;
		colour = mix(uDeep, colour, uReady);

		vec2 screen = vUv;
		float calm = 1.0;
		calm *= mix(1.0, 0.24 + 0.76 * smoothstep(0.12, 0.62, screen.x), uCalmLeft);
		calm *= mix(1.0, 0.28 + 0.72 * smoothstep(0.05, 0.6, screen.y), uCalmBottom);
		colour *= calm;
		// Stay under the bloom threshold: only the flying stars glow.
		colour = min(colour, vec3(0.82));

		vec2 centre = screen - 0.5;
		colour *= 1.0 - 0.5 * dot(centre, centre) * 2.0;

		gl_FragColor = vec4(colour, 1.0);
		#include <colorspace_fragment>
	}
`;

export interface GalaxyBackdrop {
	/** The graded sky as a texture, for `scene.background`. */
	readonly texture: Texture;
	/** Draws the sky into its texture; call once per frame. */
	render(renderer: WebGLRenderer): void;
	/** Blends the moods of the two stages around `stage`. */
	setStage(stage: number): void;
	/**
	 * Where the view sits in the panorama: -1..1 on each axis, from the left
	 * or bottom edge to the right or top edge of the room to pan into.
	 */
	setPan(x: number, y: number): void;
	/** Drawing buffer size and the share of it the sky is drawn at. */
	setSize(width: number, height: number, scale: number, compact: boolean): void;
	dispose(): void;
}

export interface GalaxyBackdropOptions {
	/** Show the panorama at once instead of fading it in (reduced motion). */
	readonly instant: boolean;
	/** Called once the panorama has loaded, so a still scene can redraw. */
	readonly onLoad: () => void;
}

function moodAt(index: number): SkyMood {
	const mood = SKY_MOODS[Math.min(SKY_MOODS.length - 1, Math.max(0, index))];
	if (!mood) throw new Error("galaxy-backdrop: no moods defined");
	return mood;
}

export function createGalaxyBackdrop(
	options: GalaxyBackdropOptions,
): GalaxyBackdrop {
	const geometry = new PlaneGeometry(2, 2);
	const uniforms = {
		uImage: { value: null as Texture | null },
		uImageAspect: { value: GALAXY_IMAGE_ASPECT },
		uAspect: { value: 1 },
		// Shows about 3/4 of the panorama, leaving the rest to pan through.
		uZoom: { value: 1.35 },
		uPan: { value: new Vector2() },
		uReady: { value: 0 },
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

	let loadedAt = Number.NaN;
	let disposed = false;
	const image = new TextureLoader().load(GALAXY_IMAGE_URL, () => {
		if (disposed) return;
		uniforms.uImage.value = image;
		loadedAt = performance.now();
		if (options.instant) uniforms.uReady.value = 1;
		options.onLoad();
	});
	image.colorSpace = SRGBColorSpace;

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
			if (!Number.isNaN(loadedAt) && uniforms.uReady.value < 1) {
				uniforms.uReady.value = Math.min(
					1,
					(performance.now() - loadedAt) / FADE_IN_MS,
				);
			}
			const previous = renderer.getRenderTarget();
			renderer.setRenderTarget(target);
			renderer.render(quad, camera);
			renderer.setRenderTarget(previous);
		},
		setStage(stage) {
			const lower = Math.floor(stage);
			const t = stage - lower;
			const a = moodAt(lower);
			const b = moodAt(lower + 1);
			blend(uniforms.uDeep.value, "deep", a, b, t);
			blend(uniforms.uMid.value, "mid", a, b, t);
			blend(uniforms.uGlow.value, "glow", a, b, t);
			blend(uniforms.uAccent.value, "accent", a, b, t);
		},
		setPan(x, y) {
			uniforms.uPan.value.set(x, y);
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
			image.dispose();
			target.dispose();
		},
	};
}
