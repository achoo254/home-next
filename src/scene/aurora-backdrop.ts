/**
 * The living light behind the tiles: domain-warped noise drawn as slow
 * aurora silk, coloured by the mood of the current stage. It is drawn into
 * a low-resolution target once per frame and used as the scene background,
 * so the expensive noise runs on a fraction of the pixels while the glass
 * tiles (whose refraction pass also draws the background) still refract
 * it. Behind the copy it calms down to keep text readable: the left side on
 * wide screens, the bottom on phones.
 */
import {
	Color,
	HalfFloatType,
	LinearFilter,
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	type Texture,
	Vector2,
	WebGLRenderTarget,
	type WebGLRenderer,
} from "three";
import { AURORA_MOODS, type AuroraMood } from "./scene-palette";

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`;

// Simplex noise by Ashima Arts / Stefan Gustavson (MIT).
const fragmentShader = /* glsl */ `
	uniform float uTime;
	uniform float uAspect;
	uniform vec2 uShift;
	uniform float uCalmLeft;
	uniform float uCalmBottom;
	uniform vec3 uDeep;
	uniform vec3 uMid;
	uniform vec3 uGlow;
	uniform vec3 uAccent;
	varying vec2 vUv;

	vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

	float snoise(vec2 v) {
		const vec4 C = vec4(0.211324865405187, 0.366025403784439,
			-0.577350269189626, 0.024390243902439);
		vec2 i = floor(v + dot(v, C.yy));
		vec2 x0 = v - i + dot(i, C.xx);
		vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;
		i = mod(i, 289.0);
		vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
		vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
		m = m * m;
		m = m * m;
		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;
		m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
		vec3 g;
		g.x = a0.x * x0.x + h.x * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
	}

	float fbm(vec2 p) {
		float value = 0.0;
		float amplitude = 0.5;
		mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
		for (int i = 0; i < 3; i++) {
			value += amplitude * snoise(p);
			p = turn * p;
			amplitude *= 0.5;
		}
		return value;
	}

	void main() {
		vec2 screen = vUv;
		// uShift follows the camera a little, so the aurora keeps some depth.
		vec2 p = ((vUv - 0.5) * vec2(uAspect, 1.0) + uShift) * 0.65;
		float t = uTime * 0.035;

		// Gentle domain warping: broad drifting light, no busy marbling.
		vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
		vec2 r = vec2(
			fbm(p + 1.2 * q + vec2(1.7, 9.2) + t * 1.2),
			fbm(p + 1.2 * q + vec2(8.3, 2.8) - t * 0.8)
		);
		float f = fbm(p + 1.0 * r);

		vec3 colour = mix(uDeep, uMid, smoothstep(-0.55, 0.75, f));
		colour = mix(colour, uGlow, smoothstep(0.15, 0.9, length(q)) * 0.6);
		colour += uAccent * pow(clamp(r.x, 0.0, 1.0), 4.0) * 0.55;

		// One silk ribbon where the warped field crosses a single contour.
		float ribbon = 1.0 - smoothstep(0.0, 0.24, abs(f - 0.12 + 0.05 * sin(t * 3.0)));
		colour += mix(uGlow, uAccent, 0.6) * ribbon * ribbon * 0.14 * smoothstep(-0.3, 0.4, r.y);

		float calm = 1.0;
		calm *= mix(1.0, 0.16 + 0.84 * smoothstep(0.12, 0.7, screen.x), uCalmLeft);
		calm *= mix(1.0, 0.2 + 0.8 * smoothstep(0.05, 0.62, screen.y), uCalmBottom);
		colour *= calm;

		vec2 centre = screen - 0.5;
		colour *= 1.0 - 0.6 * dot(centre, centre) * 2.0;

		gl_FragColor = vec4(colour, 1.0);
		#include <colorspace_fragment>
	}
`;

export interface AuroraBackdrop {
	/** The aurora as a texture, for `scene.background`. */
	readonly texture: Texture;
	/** Draws the aurora into its texture; call once per frame. */
	render(renderer: WebGLRenderer): void;
	/** Blends the moods of the two stages around `stage`. */
	setStage(stage: number): void;
	setTime(seconds: number): void;
	/** Camera offset, so the aurora drifts slightly against the tiles. */
	setShift(x: number, y: number): void;
	/** Drawing buffer size and the share of it the aurora is drawn at. */
	setSize(width: number, height: number, scale: number, compact: boolean): void;
	dispose(): void;
}

function moodAt(index: number): AuroraMood {
	const mood =
		AURORA_MOODS[Math.min(AURORA_MOODS.length - 1, Math.max(0, index))];
	if (!mood) throw new Error("aurora: no moods defined");
	return mood;
}

export function createAuroraBackdrop(): AuroraBackdrop {
	const geometry = new PlaneGeometry(2, 2);
	const uniforms = {
		uTime: { value: 0 },
		uAspect: { value: 1 },
		uShift: { value: new Vector2() },
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
	// The noise is smooth, so a small target scaled up with linear filtering
	// looks the same as drawing it at full size.
	const target = new WebGLRenderTarget(1, 1, {
		type: HalfFloatType,
		minFilter: LinearFilter,
		magFilter: LinearFilter,
		depthBuffer: false,
	});

	const from = new Color();
	const to = new Color();
	function blend(
		into: Color,
		key: keyof AuroraMood,
		a: AuroraMood,
		b: AuroraMood,
		t: number,
	): void {
		into.copy(from.setHex(a[key])).lerp(to.setHex(b[key]), t);
	}

	return {
		texture: target.texture,
		render(renderer) {
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
		setTime(seconds) {
			uniforms.uTime.value = seconds;
		},
		setShift(x, y) {
			uniforms.uShift.value.set(x, y);
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
			geometry.dispose();
			material.dispose();
			target.dispose();
		},
	};
}
