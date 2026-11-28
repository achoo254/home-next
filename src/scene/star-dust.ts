/**
 * Glints of light drifting through the scene, in the glossy style of the
 * page's art: one draw call of points, each a soft round glow with a halo,
 * and the larger ones a four-pointed sparkle whose rays pulse slowly, like
 * the glints painted in the skies. Fewer and larger than film-grain dust,
 * so the scene reads clean; nearer glints are larger, for depth.
 */
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	Points,
	ShaderMaterial,
} from "three";
import { SCENE_PALETTE } from "./scene-palette";
import { scatterAroundRoute, seededRandom } from "./warp-stars";

const vertexShader = /* glsl */ `
	uniform float uTime;
	uniform float uPixelRatio;
	attribute float aSeed;
	attribute float aSize;
	varying float vSeed;
	varying float vFade;
	varying float vSparkle;
	void main() {
		vec3 p = position;
		p.x += sin(uTime * 0.21 + aSeed * 6.2831) * 0.35;
		p.y += cos(uTime * 0.17 + aSeed * 4.1) * 0.3;
		vec4 view = modelViewMatrix * vec4(p, 1.0);
		gl_Position = projectionMatrix * view;
		float size = aSize * uPixelRatio * (26.0 / -view.z);
		// Never below a few pixels (a single pixel shimmers like grain), and
		// capped, so a glint right past the lens does not bloom into a cloud.
		gl_PointSize = clamp(size, 3.0 * uPixelRatio, 30.0 * uPixelRatio);
		vSeed = aSeed;
		// Only glints drawn large enough show their rays.
		vSparkle = smoothstep(9.0, 16.0, size / uPixelRatio);
		// Fade the glints far ahead, and those about to pass the lens.
		vFade = smoothstep(-90.0, -40.0, view.z) * (1.0 - smoothstep(-8.0, -2.0, view.z));
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uTime;
	uniform vec3 uColour;
	uniform vec3 uAccent;
	varying float vSeed;
	varying float vFade;
	varying float vSparkle;
	void main() {
		vec2 c = gl_PointCoord - 0.5;
		float d2 = dot(c, c);
		// Round core and a wide soft halo.
		float core = exp(-d2 * 160.0);
		float halo = exp(-d2 * 26.0) * 0.35;
		// Four thin rays that taper to points.
		vec2 a = abs(c);
		float rays = exp(-a.x * 90.0) * (1.0 - smoothstep(0.0, 0.5, a.y))
			+ exp(-a.y * 90.0) * (1.0 - smoothstep(0.0, 0.5, a.x));
		float pulse = 0.6 + 0.4 * sin(uTime * (0.6 + vSeed * 0.9) + vSeed * 40.0);
		float shape = core + halo + rays * vSparkle * pulse * 0.8;
		float twinkle = 0.75 + 0.25 * sin(uTime * (0.9 + vSeed * 1.2) + vSeed * 23.0);
		vec3 colour = mix(uColour, uAccent, step(0.8, vSeed));
		colour = mix(colour, vec3(1.0), core * 0.6);
		float strength = shape * twinkle * vFade;
		// The largest sparkles are bright enough to bloom.
		strength *= mix(0.85, 1.8, vSparkle * step(0.7, fract(vSeed * 7.0)));
		// Additive blending multiplies by alpha once; alpha caps at 1, so the
		// blooming glints carry their extra brightness in the colour.
		gl_FragColor = vec4(colour * max(1.0, strength), min(strength, 1.0));
	}
`;

export interface StarDust {
	readonly points: Points<BufferGeometry, ShaderMaterial>;
	setTime(seconds: number): void;
	setPixelRatio(ratio: number): void;
	dispose(): void;
}

export function createStarDust(count: number): StarDust {
	const random = seededRandom(20261025);
	const positions = scatterAroundRoute(
		count,
		random,
		new Float32Array(count * 3),
	);
	const seeds = new Float32Array(count);
	const sizes = new Float32Array(count);
	for (let index = 0; index < count; index++) {
		seeds[index] = random();
		// Mostly small glints, a few large sparkles.
		sizes[index] = 1.4 + random() ** 4 * 7.5;
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new BufferAttribute(positions, 3));
	geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
	geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));

	const uniforms = {
		uTime: { value: 0 },
		uPixelRatio: { value: 1 },
		uColour: { value: new Color(SCENE_PALETTE.dust) },
		uAccent: { value: new Color(SCENE_PALETTE.dustAccent) },
	};
	const material = new ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
	});
	const points = new Points(geometry, material);
	// The glints span the whole route; never cull them as one small box.
	points.frustumCulled = false;

	return {
		points,
		setTime(seconds) {
			uniforms.uTime.value = seconds;
		},
		setPixelRatio(ratio) {
			uniforms.uPixelRatio.value = ratio;
		},
		dispose() {
			geometry.dispose();
			material.dispose();
		},
	};
}
