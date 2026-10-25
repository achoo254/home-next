/**
 * Nav's rocket: a small metal bell nozzle firing a plasma jet. The jet is
 * two nested plumes drawn by one shader, a narrow white-hot core inside a
 * wider pink-to-violet sheath, with shock diamonds near the nozzle and
 * flickering noise further out. Sparks stream from the exit and a soft heat
 * glow sits under the body. `thrust` (0 hover .. 1 full burn) lengthens the
 * jet and speeds the sparks, so the bot burns harder while the ship flies.
 *
 * The jet, sparks and glow are additive and brighter than white, so the
 * bloom pass makes them glow; only the metal bell is lit.
 */
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	Color,
	CylinderGeometry,
	DoubleSide,
	Group,
	LatheGeometry,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	Points,
	ShaderMaterial,
	Sprite,
	SpriteMaterial,
	TorusGeometry,
	Vector2,
} from "three";
import { SCENE_PALETTE } from "./scene-palette";
import { seededRandom } from "./warp-stars";

export interface BotThruster {
	/** Hang under the body; the jet points down its local -y. */
	readonly group: Group;
	/** `still`: reduced motion, one calm frame with no flicker. */
	update(time: number, dt: number, thrust: number, still: boolean): void;
	/** Drawing-buffer height in pixels, for the size of the sparks. */
	setViewportHeight(pixels: number): void;
	dispose(): void;
}

const SPARK_COUNT = 70;
/** Jet length in the bot's units, hovering and at full burn. */
const HOVER_LENGTH = 0.6;
const BURN_LENGTH = 1.7;
/**
 * Shader clocks wrap here: past about an hour a float clock loses the
 * precision the noise needs, and on mediump GPUs it would overflow. The
 * wrap reshuffles the flame once every few minutes, which nobody notices.
 */
const CLOCK_WRAP = 512;

const plumeVertex = /* glsl */ `
	uniform float uLength;
	uniform float uRadius;
	uniform float uTime;
	varying float vAlong;
	varying float vFacing;
	varying vec2 vUv;

	void main() {
		// 0 at the nozzle, 1 at the tip of the jet.
		float along = 1.0 - uv.y;
		// Swells just past the nozzle, then tapers to a point.
		float swell = 1.0 + 0.4 * sin(along * 2.6);
		float taper = pow(max(1.0 - along, 0.0), 0.6);
		float flutter = 1.0 + 0.08 * sin(uTime * 37.0 + along * 11.0) * along;
		float radius = uRadius * swell * taper * flutter;
		vec3 shaped = vec3(position.x * radius, -along * uLength, position.z * radius);
		vec4 view = modelViewMatrix * vec4(shaped, 1.0);
		// Facing the viewer: bright through the middle of the jet, soft at
		// its silhouette, which reads as a glowing volume, not a cone.
		vec3 normalView = normalize(normalMatrix * vec3(normal.x, 0.0, normal.z));
		vFacing = abs(normalView.z);
		vAlong = along;
		vUv = uv;
		gl_Position = projectionMatrix * view;
	}
`;

const plumeFragment = /* glsl */ `
	uniform vec3 uHot;
	uniform vec3 uMid;
	uniform vec3 uCool;
	uniform float uTime;
	uniform float uIntensity;
	uniform float uDiamonds;
	varying float vAlong;
	varying float vFacing;
	varying vec2 vUv;

	float hash(vec2 p) {
		vec3 p3 = fract(vec3(p.xyx) * 0.1031);
		p3 += dot(p3, p3.yzx + 33.33);
		return fract((p3.x + p3.y) * p3.z);
	}

	float noise(vec2 p) {
		vec2 cell = floor(p);
		vec2 f = fract(p);
		vec2 u = f * f * (3.0 - 2.0 * f);
		return mix(
			mix(hash(cell), hash(cell + vec2(1.0, 0.0)), u.x),
			mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), u.x),
			u.y
		);
	}

	void main() {
		float along = vAlong;
		// pow() of a negative number is NaN, and bloom spreads one NaN pixel
		// into a black block, so every base is clamped.
		float body = pow(clamp(vFacing, 0.0, 1.0), 1.6);
		// Turbulence that streams away from the nozzle.
		float turbulence = noise(vec2(vUv.x * 9.0, along * 6.0 - uTime * 11.0));
		turbulence = 0.55 * turbulence + 0.45 * noise(vec2(vUv.x * 17.0, along * 13.0 - uTime * 19.0));
		float fade = pow(max(1.0 - along, 0.0), 1.5) * smoothstep(0.0, 0.05, along + 0.01);
		// Shock diamonds: bright knots that stand still in the jet.
		float knots = pow(max(0.5 + 0.5 * cos(along * uDiamonds * 6.2832 - uTime * 1.2), 0.0), 7.0);
		knots *= (1.0 - smoothstep(0.15, 0.75, along)) * pow(clamp(vFacing, 0.0, 1.0), 3.0);
		float glow = body * fade * (0.55 + 0.7 * turbulence) + knots * 1.1;
		vec3 colour = mix(uHot, uMid, smoothstep(0.02, 0.38, along));
		colour = mix(colour, uCool, smoothstep(0.38, 0.95, along));
		gl_FragColor = vec4(colour * glow * uIntensity, 1.0);
	}
`;

const sparkVertex = /* glsl */ `
	attribute float aSeed;
	attribute vec2 aDirection;
	// Advanced on the CPU by dt * rate: scaling a clock by a rate that
	// changes every frame would make every spark jump along the jet.
	uniform float uPhase;
	uniform float uLength;
	uniform float uSize;
	uniform float uHalfHeight;
	varying float vLife;

	void main() {
		float life = fract(uPhase * (0.7 + 0.6 * aSeed) + aSeed * 7.13);
		float spread = 0.03 + life * 0.34;
		vec3 drift = vec3(aDirection.x * spread, -life * uLength * 1.35, aDirection.y * spread);
		drift.x += sin(life * 9.0 + aSeed * 40.0) * 0.04 * life;
		vec4 view = modelViewMatrix * vec4(drift, 1.0);
		gl_Position = projectionMatrix * view;
		// World size to pixels, including the bot's own scale.
		float scale = length(modelViewMatrix[0].xyz);
		float size = uSize * scale * projectionMatrix[1][1] * uHalfHeight / -view.z * (1.0 - life * 0.75);
		gl_PointSize = min(size, 24.0);
		vLife = life;
	}
`;

const sparkFragment = /* glsl */ `
	uniform vec3 uHot;
	uniform vec3 uMid;
	uniform vec3 uCool;
	varying float vLife;

	void main() {
		float distanceFromCentre = length(gl_PointCoord - 0.5);
		float disc = smoothstep(0.5, 0.0, distanceFromCentre);
		vec3 colour = mix(uHot, uMid, smoothstep(0.0, 0.3, vLife));
		colour = mix(colour, uCool, smoothstep(0.3, 1.0, vLife));
		gl_FragColor = vec4(colour * disc * (1.0 - vLife), 1.0);
	}
`;

function bright(hex: number, strength: number): Color {
	return new Color(hex).multiplyScalar(strength);
}

/** A white radial falloff, tinted by the sprite material. */
function createGlowTexture(): CanvasTexture {
	const size = 64;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext("2d");
	if (context) {
		const gradient = context.createRadialGradient(
			size / 2,
			size / 2,
			0,
			size / 2,
			size / 2,
			size / 2,
		);
		gradient.addColorStop(0, "rgba(255,255,255,1)");
		gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
		gradient.addColorStop(1, "rgba(255,255,255,0)");
		context.fillStyle = gradient;
		context.fillRect(0, 0, size, size);
	}
	return new CanvasTexture(canvas);
}

function createPlumeMaterial(
	radius: number,
	intensity: number,
	diamonds: number,
	hot: Color,
	mid: Color,
	cool: Color,
): ShaderMaterial {
	return new ShaderMaterial({
		uniforms: {
			uLength: { value: HOVER_LENGTH },
			uRadius: { value: radius },
			uTime: { value: 0 },
			uIntensity: { value: intensity },
			uDiamonds: { value: diamonds },
			uHot: { value: hot },
			uMid: { value: mid },
			uCool: { value: cool },
		},
		vertexShader: plumeVertex,
		fragmentShader: plumeFragment,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
	});
}

export function createBotThruster(): BotThruster {
	const group = new Group();

	// The bell: a dark metal nozzle with a glowing lip.
	const bellGeometry = new LatheGeometry(
		[
			new Vector2(0.07, 0.07),
			new Vector2(0.09, 0.04),
			new Vector2(0.105, 0),
			new Vector2(0.13, -0.06),
			new Vector2(0.16, -0.12),
		],
		40,
	);
	const bellMaterial = new MeshPhysicalMaterial({
		color: 0x3b3456,
		metalness: 0.85,
		roughness: 0.3,
		clearcoat: 0.6,
		clearcoatRoughness: 0.2,
		side: DoubleSide,
	});
	const bell = new Mesh(bellGeometry, bellMaterial);
	group.add(bell);

	const lipGeometry = new TorusGeometry(0.158, 0.012, 8, 48);
	const lipMaterial = new MeshBasicMaterial({
		color: bright(SCENE_PALETTE.accent, 2.4),
		toneMapped: false,
	});
	const lip = new Mesh(lipGeometry, lipMaterial);
	lip.position.y = -0.12;
	lip.rotation.x = Math.PI / 2;
	group.add(lip);

	// The jet starts inside the bell, so its root hides behind the metal.
	// The cylinder's seam is turned to the back, away from the viewer.
	const plumeGeometry = new CylinderGeometry(1, 1, 1, 32, 48, true, Math.PI);
	const hot = new Color(1, 0.94, 1).multiplyScalar(2.2);
	const sheath = createPlumeMaterial(
		0.17,
		1.2,
		3.2,
		bright(SCENE_PALETTE.flame, 1.8),
		bright(SCENE_PALETTE.flame, 1.2),
		bright(SCENE_PALETTE.flameDeep, 1.1),
	);
	const core = createPlumeMaterial(
		0.05,
		0.9,
		4,
		hot,
		bright(SCENE_PALETTE.flame, 1.9),
		bright(SCENE_PALETTE.violetLight, 1.2),
	);
	const sheathMesh = new Mesh(plumeGeometry, sheath);
	const coreMesh = new Mesh(plumeGeometry, core);
	for (const plume of [sheathMesh, coreMesh]) {
		plume.position.y = -0.04;
		// The shader moves every vertex; the bounds of the unit cylinder
		// would cull the jet at the edge of the view.
		plume.frustumCulled = false;
		group.add(plume);
	}
	// Core over sheath, both after the opaque body.
	sheathMesh.renderOrder = 3;
	coreMesh.renderOrder = 4;

	// Sparks: each one loops from the nozzle down the jet, on the GPU.
	const sparkGeometry = new BufferGeometry();
	const random = seededRandom(4207);
	const seeds = new Float32Array(SPARK_COUNT);
	const directions = new Float32Array(SPARK_COUNT * 2);
	for (let index = 0; index < SPARK_COUNT; index++) {
		seeds[index] = random();
		const angle = random() * Math.PI * 2;
		const reach = 0.3 + random() * 0.7;
		directions[index * 2] = Math.cos(angle) * reach;
		directions[index * 2 + 1] = Math.sin(angle) * reach;
	}
	sparkGeometry.setAttribute(
		"position",
		new BufferAttribute(new Float32Array(SPARK_COUNT * 3), 3),
	);
	sparkGeometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
	sparkGeometry.setAttribute("aDirection", new BufferAttribute(directions, 2));
	const sparkMaterial = new ShaderMaterial({
		uniforms: {
			uPhase: { value: 0 },
			uLength: { value: HOVER_LENGTH },
			uSize: { value: 0.07 },
			uHalfHeight: { value: 500 },
			uHot: { value: hot },
			uMid: { value: bright(SCENE_PALETTE.flame, 2.0) },
			uCool: { value: bright(SCENE_PALETTE.flameDeep, 1.2) },
		},
		vertexShader: sparkVertex,
		fragmentShader: sparkFragment,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
	});
	const sparks = new Points(sparkGeometry, sparkMaterial);
	sparks.position.y = -0.1;
	sparks.frustumCulled = false;
	sparks.renderOrder = 5;
	group.add(sparks);

	// Heat glow: a soft light at the exit that also washes the body above.
	const glowTexture = createGlowTexture();
	const glowMaterial = new SpriteMaterial({
		map: glowTexture,
		color: bright(SCENE_PALETTE.flame, 0.9),
		blending: AdditiveBlending,
		depthWrite: false,
		toneMapped: false,
	});
	const glow = new Sprite(glowMaterial);
	glow.position.y = -0.16;
	glow.renderOrder = 6;
	group.add(glow);

	const plumeMaterials = [sheath, core];
	const glowBase = bright(SCENE_PALETTE.flame, 0.9);
	let sparkPhase = 0;

	return {
		group,
		update(time, dt, thrust, still) {
			const burn = Math.min(1, Math.max(0, thrust));
			const clock = time % CLOCK_WRAP;
			// A fast, irregular flicker of the jet's length and glow.
			const flicker = still
				? 1
				: 1 + (Math.sin(clock * 41) * 0.5 + Math.sin(clock * 67) * 0.5) * 0.06;
			const length =
				(HOVER_LENGTH + (BURN_LENGTH - HOVER_LENGTH) * burn) * flicker;
			for (const material of plumeMaterials) {
				const uniforms = material.uniforms;
				if (uniforms.uLength) uniforms.uLength.value = length;
				if (uniforms.uTime) uniforms.uTime.value = clock;
			}
			const sparkUniforms = sparkMaterial.uniforms;
			sparkPhase = (sparkPhase + dt * (0.9 + burn * 1.4)) % CLOCK_WRAP;
			if (sparkUniforms.uPhase) sparkUniforms.uPhase.value = sparkPhase;
			if (sparkUniforms.uLength) sparkUniforms.uLength.value = length;
			glow.scale.setScalar((0.5 + burn * 0.3) * flicker);
			glowMaterial.color.copy(glowBase).multiplyScalar(0.8 + burn * 0.6);
		},
		setViewportHeight(pixels) {
			const uniform = sparkMaterial.uniforms.uHalfHeight;
			if (uniform) uniform.value = pixels / 2;
		},
		dispose() {
			for (const geometry of [
				bellGeometry,
				lipGeometry,
				plumeGeometry,
				sparkGeometry,
			]) {
				geometry.dispose();
			}
			for (const material of [
				bellMaterial,
				lipMaterial,
				sheath,
				core,
				sparkMaterial,
				glowMaterial,
			]) {
				material.dispose();
			}
			glowTexture.dispose();
		},
	};
}
