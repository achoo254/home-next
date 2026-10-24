/**
 * Fine light dust drifting through the scene: one draw call of soft round
 * points that twinkle and sway. Brighter specks cross the bloom threshold
 * and sparkle; nearer ones are larger, so the dust gives the scene depth.
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
	void main() {
		vec3 p = position;
		p.x += sin(uTime * 0.21 + aSeed * 6.2831) * 0.35;
		p.y += cos(uTime * 0.17 + aSeed * 4.1) * 0.3;
		vec4 view = modelViewMatrix * vec4(p, 1.0);
		gl_Position = projectionMatrix * view;
		// Capped: a speck that drifts right past the lens would otherwise
		// grow to hundreds of pixels and bloom into a white cloud.
		gl_PointSize = min(aSize * uPixelRatio * (22.0 / -view.z), 14.0 * uPixelRatio);
		vSeed = aSeed;
		// Fade the dust far ahead, and the dust about to pass the lens.
		vFade = smoothstep(-90.0, -40.0, view.z) * (1.0 - smoothstep(-8.0, -2.0, view.z));
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uTime;
	uniform vec3 uColour;
	uniform vec3 uAccent;
	varying float vSeed;
	varying float vFade;
	void main() {
		float d = length(gl_PointCoord - 0.5);
		float core = 1.0 - smoothstep(0.0, 0.5, d);
		float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + vSeed * 1.6) + vSeed * 40.0);
		vec3 colour = mix(uColour, uAccent, step(0.86, vSeed));
		float strength = core * core * twinkle * vFade;
		// A few specks are bright enough to bloom.
		strength *= mix(0.9, 2.4, step(0.94, fract(vSeed * 7.0)));
		// Additive blending multiplies by alpha once; alpha caps at 1, so the
		// blooming specks carry their extra brightness in the colour.
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
		sizes[index] = 0.6 + random() ** 3 * 3.2;
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
	// The dust spans the whole route; never cull it as one small box.
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
