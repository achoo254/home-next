/**
 * The finishing pass: bloom on everything brighter than white (glyphs, the
 * key ring, the brightest dust), then the output pass that tone maps and
 * converts to sRGB, then a lens pass that adds a hint of chromatic fringing
 * towards the edges and fine film grain. Grain comes after tone mapping so
 * it is equally faint in shadows and highlights.
 */
import {
	type Camera,
	HalfFloatType,
	type Scene,
	Vector2,
	WebGLRenderTarget,
	type WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const LensShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTime: { value: 0 },
		uGrain: { value: 0.022 },
		uFringe: { value: 0.006 },
	},
	vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform float uTime;
		uniform float uGrain;
		uniform float uFringe;
		varying vec2 vUv;
		// Hash without sin(): sin of large arguments bands on some mobile GPUs.
		float hash(vec2 p) {
			vec3 p3 = fract(vec3(p.xyx) * 0.1031);
			p3 += dot(p3, p3.yzx + 33.33);
			return fract((p3.x + p3.y) * p3.z);
		}
		void main() {
			vec2 centre = vUv - 0.5;
			vec2 shift = centre * dot(centre, centre) * uFringe;
			vec3 colour = vec3(
				texture2D(tDiffuse, vUv + shift).r,
				texture2D(tDiffuse, vUv).g,
				texture2D(tDiffuse, vUv - shift).b
			);
			float frame = floor(fract(uTime) * 24.0);
			float noise = hash(gl_FragCoord.xy + frame * vec2(17.0, 13.0)) - 0.5;
			colour += noise * uGrain;
			gl_FragColor = vec4(colour, 1.0);
		}
	`,
};

export interface PostEffects {
	render(): void;
	setSize(width: number, height: number, pixelRatio: number): void;
	setTime(seconds: number): void;
	setBloomEnabled(enabled: boolean): void;
	dispose(): void;
}

export function createPostEffects(
	renderer: WebGLRenderer,
	scene: Scene,
	camera: Camera,
	pixelRatio: number,
): PostEffects {
	// The composer's own target has no multisampling, so the glass edges
	// would come out jagged. At a pixel ratio of 2 the extra pixels already
	// smooth them, and MSAA on two HalfFloat buffers would cost hundreds of
	// megabytes of GPU memory, so it is only used below that.
	const target = new WebGLRenderTarget(1, 1, {
		type: HalfFloatType,
		samples: pixelRatio < 2 ? 4 : 0,
	});
	const composer = new EffectComposer(renderer, target);
	// The size is set by composer.setSize; the bloom draws at half of it.
	const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.6, 0.55, 0.88);
	const output = new OutputPass();
	const lens = new ShaderPass(LensShader);
	const scenePass = new RenderPass(scene, camera);
	composer.addPass(scenePass);
	composer.addPass(bloom);
	composer.addPass(output);
	composer.addPass(lens);

	return {
		render() {
			composer.render();
		},
		setSize(width, height, pixelRatio) {
			composer.setPixelRatio(pixelRatio);
			composer.setSize(width, height);
		},
		setTime(seconds) {
			const uniform = lens.uniforms.uTime;
			if (uniform) uniform.value = seconds;
		},
		setBloomEnabled(enabled) {
			bloom.enabled = enabled;
		},
		dispose() {
			scenePass.dispose();
			bloom.dispose();
			output.dispose();
			lens.dispose();
			composer.dispose();
		},
	};
}
