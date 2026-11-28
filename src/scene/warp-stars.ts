/**
 * The stars along the route, streaking past while the ship moves: the
 * faster the ship, the longer and brighter the streak, so a quick scroll
 * feels like a jump to hyperspace. Each streak is a soft glowing ribbon a
 * few pixels wide, drawn as a screen-facing quad (WebGL lines are a hard
 * single pixel, which read as scratches), hot pink-white at the star and
 * fading to lavender along the tail, in the glossy style of the page's art.
 */
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	DoubleSide,
	Mesh,
	ShaderMaterial,
	Vector2,
	Vector3,
} from "three";
import { LAST_STAGE, STOP_SPACING, routeCentre } from "./flight-path";
import { SCENE_PALETTE } from "./scene-palette";

const vertexShader = /* glsl */ `
	uniform vec3 uVelocity;
	uniform float uStretch;
	uniform vec2 uResolution;
	uniform float uWidth;
	attribute float aTail;
	attribute float aSide;
	attribute float aSeed;
	varying float vSeed;
	varying float vTail;
	varying float vSide;
	void main() {
		vSeed = aSeed;
		vTail = aTail;
		vSide = aSide;
		vec3 tailOffset = uVelocity * uStretch * (0.6 + aSeed * 0.8);
		vec4 headView = modelViewMatrix * vec4(position, 1.0);
		vec4 tailView = modelViewMatrix * vec4(position - tailOffset, 1.0);
		// A streak touching the space behind the lens would project to
		// infinity: drop the whole ribbon outside the clip volume instead.
		if (max(headView.z, tailView.z) > -0.5) {
			gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
			return;
		}
		vec4 head = projectionMatrix * headView;
		vec4 tail = projectionMatrix * tailView;
		// The streak's direction on screen, in pixels.
		vec2 headPx = head.xy / head.w * uResolution;
		vec2 tailPx = tail.xy / tail.w * uResolution;
		vec2 along = tailPx - headPx;
		vec2 across = length(along) > 1e-3
			? normalize(vec2(-along.y, along.x))
			: vec2(0.0, 1.0);
		vec4 clip = mix(head, tail, aTail);
		// Thinner far away, never thinner than a soft pixel and a half.
		float width = max(1.5, uWidth * (0.6 + aSeed * 0.9) * (30.0 / max(head.w, 1.0)));
		clip.xy += across * aSide * width / uResolution * clip.w;
		gl_Position = clip;
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uSpeed;
	uniform vec3 uHead;
	uniform vec3 uTailColour;
	uniform vec3 uAccent;
	varying float vSeed;
	varying float vTail;
	varying float vSide;
	void main() {
		// A soft round profile across the ribbon with a hot core line.
		// Interpolation can overshoot 0..1 by a hair; pow() of a negative
		// number is NaN, and one NaN pixel through bloom blacks out the frame.
		float tailShare = clamp(vTail, 0.0, 1.0);
		float edge = clamp(1.0 - abs(vSide), 0.0, 1.0);
		float glow = edge * edge;
		float core = smoothstep(0.55, 1.0, edge);
		vec3 tint = mix(uHead, uTailColour, tailShare);
		tint = mix(tint, uAccent, step(0.8, vSeed) * (1.0 - tailShare) * 0.6);
		vec3 colour = tint * glow + vec3(1.0) * core * (1.0 - tailShare) * 0.6;
		// Bright at the star, easing out along the tail.
		float fade = pow(1.0 - tailShare, 1.6);
		float alpha = fade * uSpeed * (0.45 + vSeed * 0.55);
		gl_FragColor = vec4(colour * 1.4, alpha);
	}
`;

export interface WarpStars {
	readonly mesh: Mesh<BufferGeometry, ShaderMaterial>;
	/** World velocity of the camera, units per second. */
	setVelocity(velocity: Vector3): void;
	/** Drawing buffer size, so the ribbons keep their width in pixels. */
	setSize(width: number, height: number, pixelRatio: number): void;
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

/** The four corners of a ribbon: head/tail times either side. */
const CORNERS = [
	{ tail: 0, side: -1 },
	{ tail: 0, side: 1 },
	{ tail: 1, side: -1 },
	{ tail: 1, side: 1 },
] as const;

export function createWarpStars(count: number): WarpStars {
	const random = seededRandom(7121);
	const heads = scatterAroundRoute(count, random, new Float32Array(count * 3));
	const positions = new Float32Array(count * 4 * 3);
	const tails = new Float32Array(count * 4);
	const sides = new Float32Array(count * 4);
	const seeds = new Float32Array(count * 4);
	const indices = new Uint32Array(count * 6);
	for (let index = 0; index < count; index++) {
		const seed = random();
		CORNERS.forEach((corner, cornerIndex) => {
			const vertex = index * 4 + cornerIndex;
			positions[vertex * 3] = heads[index * 3] ?? 0;
			positions[vertex * 3 + 1] = heads[index * 3 + 1] ?? 0;
			positions[vertex * 3 + 2] = heads[index * 3 + 2] ?? 0;
			tails[vertex] = corner.tail;
			sides[vertex] = corner.side;
			seeds[vertex] = seed;
		});
		const first = index * 4;
		indices.set(
			[first, first + 1, first + 2, first + 2, first + 1, first + 3],
			index * 6,
		);
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new BufferAttribute(positions, 3));
	geometry.setAttribute("aTail", new BufferAttribute(tails, 1));
	geometry.setAttribute("aSide", new BufferAttribute(sides, 1));
	geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
	geometry.setIndex(new BufferAttribute(indices, 1));

	const uniforms = {
		uVelocity: { value: new Vector3() },
		uStretch: { value: 0.09 },
		uSpeed: { value: 0 },
		// Half the drawing buffer, so NDC times this is pixels from centre.
		uResolution: { value: new Vector2(1, 1) },
		// Ribbon half-width in pixels for a star 30 units away.
		uWidth: { value: 1.6 },
		uHead: { value: new Color(SCENE_PALETTE.streakHead) },
		uTailColour: { value: new Color(SCENE_PALETTE.dust) },
		uAccent: { value: new Color(SCENE_PALETTE.dustAccent) },
	};
	const material = new ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		// The ribbon's winding flips with the direction of flight.
		side: DoubleSide,
	});
	const mesh = new Mesh(geometry, material);
	// The stars span the whole route; never cull them as one small box.
	mesh.frustumCulled = false;

	return {
		mesh,
		setVelocity(velocity) {
			uniforms.uVelocity.value.copy(velocity);
			uniforms.uSpeed.value = Math.min(1, velocity.length() / 25);
		},
		setSize(width, height, pixelRatio) {
			uniforms.uResolution.value.set(
				(width * pixelRatio) / 2,
				(height * pixelRatio) / 2,
			);
			uniforms.uWidth.value = 1.6 * pixelRatio;
		},
		dispose() {
			geometry.dispose();
			material.dispose();
		},
	};
}
