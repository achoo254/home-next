/**
 * The stars along the route. At rest they are soft points; while the ship
 * moves, each also draws a streak behind it, as long as the ship is fast,
 * so a quick scroll feels like a jump to hyperspace.
 */
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	LineSegments,
	ShaderMaterial,
	Vector3,
} from "three";
import { LAST_STAGE, STOP_SPACING, routeCentre } from "./flight-path";
import { SCENE_PALETTE } from "./scene-palette";

const vertexShader = /* glsl */ `
	uniform vec3 uVelocity;
	uniform float uStretch;
	attribute float aTail;
	attribute float aSeed;
	varying float vSeed;
	varying float vTail;
	void main() {
		vec3 p = position - uVelocity * uStretch * aTail * (0.6 + aSeed * 0.8);
		gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
		vSeed = aSeed;
		vTail = aTail;
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uSpeed;
	uniform vec3 uColour;
	uniform vec3 uAccent;
	varying float vSeed;
	varying float vTail;
	void main() {
		vec3 colour = mix(uColour, uAccent, step(0.82, vSeed));
		// Bright at the star, fading along the streak.
		float alpha = (1.0 - vTail) * uSpeed * (0.35 + vSeed * 0.65);
		gl_FragColor = vec4(colour * 1.6, alpha);
	}
`;

export interface WarpStars {
	readonly lines: LineSegments<BufferGeometry, ShaderMaterial>;
	/** World velocity of the camera, units per second. */
	setVelocity(velocity: Vector3): void;
	dispose(): void;
}

/** Deterministic pseudo-random numbers so every visit gets the same sky. */
export function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

/**
 * Scatters points in a hollow tube around the route, from behind the start
 * to past the last stop, so there are stars wherever the ship looks.
 */
export function scatterAroundRoute(
	count: number,
	random: () => number,
	into: Float32Array,
): Float32Array {
	const centre = new Vector3();
	for (let index = 0; index < count; index++) {
		const stop = -1 + random() * (LAST_STAGE + 3);
		routeCentre(stop, centre);
		const angle = random() * Math.PI * 2;
		const radius = 5 + random() ** 0.7 * 34;
		into[index * 3] = centre.x + Math.cos(angle) * radius;
		into[index * 3 + 1] = centre.y + Math.sin(angle) * radius * 0.7;
		into[index * 3 + 2] = centre.z + (random() - 0.5) * STOP_SPACING;
	}
	return into;
}

export function createWarpStars(count: number): WarpStars {
	const random = seededRandom(7121);
	const heads = scatterAroundRoute(count, random, new Float32Array(count * 3));
	const positions = new Float32Array(count * 6);
	const tails = new Float32Array(count * 2);
	const seeds = new Float32Array(count * 2);
	for (let index = 0; index < count; index++) {
		for (let end = 0; end < 2; end++) {
			const vertex = index * 2 + end;
			positions[vertex * 3] = heads[index * 3] ?? 0;
			positions[vertex * 3 + 1] = heads[index * 3 + 1] ?? 0;
			positions[vertex * 3 + 2] = heads[index * 3 + 2] ?? 0;
			tails[vertex] = end;
		}
		const seed = random();
		seeds[index * 2] = seed;
		seeds[index * 2 + 1] = seed;
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new BufferAttribute(positions, 3));
	geometry.setAttribute("aTail", new BufferAttribute(tails, 1));
	geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));

	const uniforms = {
		uVelocity: { value: new Vector3() },
		uStretch: { value: 0.09 },
		uSpeed: { value: 0 },
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
	const lines = new LineSegments(geometry, material);
	// The stars span the whole route; never cull them as one small box.
	lines.frustumCulled = false;

	return {
		lines,
		setVelocity(velocity) {
			uniforms.uVelocity.value.copy(velocity);
			uniforms.uSpeed.value = Math.min(1, velocity.length() / 25);
		},
		dispose() {
			geometry.dispose();
			material.dispose();
		},
	};
}
