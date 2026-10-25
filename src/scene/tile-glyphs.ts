/**
 * The light inside each glass tile: a glyph of the app it stands for.
 * Chat a speech bubble, Scribe a live sound meter, Localman the braces of a
 * JSON body, Tunelo the rings of a tunnel. They are brighter than white, so
 * the bloom pass makes them glow; `energy` (0..1) turns a glyph up while its
 * chapter is on screen.
 *
 * They are drawn in the transparent pass, after the glass, rather than seen
 * through it: the refraction is sampled from a lower-resolution, roughened
 * copy of the scene, which left the glyphs soft and colour-split.
 */
import {
	AdditiveBlending,
	CapsuleGeometry,
	CatmullRomCurve3,
	Color,
	ExtrudeGeometry,
	Group,
	Mesh,
	MeshBasicMaterial,
	type Object3D,
	Shape,
	TorusGeometry,
	TubeGeometry,
	Vector3,
} from "three";
import { SCENE_PALETTE } from "./scene-palette";

export interface TileGlyph {
	readonly object: Object3D;
	/** `time` in seconds; `energy` 0 (resting) .. 1 (its chapter is shown). */
	update(time: number, energy: number): void;
	dispose(): void;
}

/**
 * The bloom threshold is 0.88: a lit white glyph, added onto the bright glass,
 * crosses it for a soft halo; the pink Scribe glyph reads by colour.
 */
const REST_BRIGHTNESS = 0.4;
const FULL_BRIGHTNESS = 0.92;

function glowMaterial(hex: number): {
	material: MeshBasicMaterial;
	setEnergy(energy: number): void;
} {
	const base = new Color(hex);
	const material = new MeshBasicMaterial({
		color: base.clone(),
		toneMapped: false,
		transparent: true,
		// Added onto the glass rather than painted over it, so the glass's
		// highlights still run across the glyph and it sits inside the block.
		blending: AdditiveBlending,
	});
	return {
		material,
		setEnergy(energy) {
			const level =
				REST_BRIGHTNESS + (FULL_BRIGHTNESS - REST_BRIGHTNESS) * energy;
			material.color.copy(base).multiplyScalar(level);
		},
	};
}

function chatBubble(): TileGlyph {
	const width = 0.5;
	const height = 0.34;
	const radius = 0.11;
	const left = -width / 2;
	const bottom = -height / 2;
	const shape = new Shape();
	shape.moveTo(left + radius, bottom);
	shape.lineTo(left + 0.16, bottom);
	// The tail, low on the left like a sent message.
	shape.lineTo(left + 0.06, bottom - 0.09);
	shape.lineTo(left + 0.09, bottom);
	shape.lineTo(-left - radius, bottom);
	shape.quadraticCurveTo(-left, bottom, -left, bottom + radius);
	shape.lineTo(-left, -bottom - radius);
	shape.quadraticCurveTo(-left, -bottom, -left - radius, -bottom);
	shape.lineTo(left + radius, -bottom);
	shape.quadraticCurveTo(left, -bottom, left, -bottom - radius);
	shape.lineTo(left, bottom + radius);
	shape.quadraticCurveTo(left, bottom, left + radius, bottom);
	for (const x of [-0.12, 0, 0.12]) {
		const dot = new Shape();
		dot.absarc(x, 0, 0.034, 0, Math.PI * 2, true);
		shape.holes.push(dot);
	}
	const geometry = new ExtrudeGeometry(shape, {
		depth: 0.05,
		bevelEnabled: true,
		bevelSize: 0.012,
		bevelThickness: 0.012,
		bevelSegments: 3,
		curveSegments: 16,
	});
	geometry.center();
	const glow = glowMaterial(SCENE_PALETTE.glyph);
	const mesh = new Mesh(geometry, glow.material);
	mesh.position.y = 0.03;
	return {
		object: mesh,
		update(time, energy) {
			glow.setEnergy(energy);
			// A slow breath, a little livelier while it is the chapter's tile.
			mesh.scale.setScalar(1 + Math.sin(time * 2.2) * 0.025 * (0.4 + energy));
		},
		dispose() {
			geometry.dispose();
			glow.material.dispose();
		},
	};
}

function soundMeter(): TileGlyph {
	const geometry = new CapsuleGeometry(0.028, 0.26, 6, 12);
	const glow = glowMaterial(SCENE_PALETTE.glyphAccent);
	const group = new Group();
	const bars = [-2, -1, 0, 1, 2].map((slot) => {
		const bar = new Mesh(geometry, glow.material);
		bar.position.x = slot * 0.085;
		group.add(bar);
		return bar;
	});
	return {
		object: group,
		update(time, energy) {
			glow.setEnergy(energy);
			const liveliness = 0.35 + energy * 0.65;
			bars.forEach((bar, index) => {
				// Two sines per bar so the meter never loops visibly.
				const wave =
					Math.abs(Math.sin(time * 3.1 + index * 1.3)) * 0.6 +
					Math.abs(Math.sin(time * 1.7 + index * 2.1)) * 0.4;
				const centreBoost = 1 - Math.abs(index - 2) * 0.18;
				bar.scale.y = 0.25 + wave * centreBoost * liveliness;
			});
		},
		dispose() {
			geometry.dispose();
			glow.material.dispose();
		},
	};
}

function brace(mirror: number): TubeGeometry {
	const points = [
		[0.05, 0.25],
		[-0.01, 0.23],
		[-0.025, 0.13],
		[-0.035, 0.035],
		[-0.09, 0],
		[-0.035, -0.035],
		[-0.025, -0.13],
		[-0.01, -0.23],
		[0.05, -0.25],
	].map(([x = 0, y = 0]) => new Vector3(x * mirror, y, 0));
	return new TubeGeometry(new CatmullRomCurve3(points), 64, 0.02, 10, false);
}

function jsonBraces(): TileGlyph {
	const left = brace(1);
	const right = brace(-1);
	const glow = glowMaterial(SCENE_PALETTE.glyph);
	const group = new Group();
	const open = new Mesh(left, glow.material);
	const close = new Mesh(right, glow.material);
	open.position.x = -0.12;
	close.position.x = 0.12;
	group.add(open, close);
	return {
		object: group,
		update(time, energy) {
			glow.setEnergy(energy);
			// The braces open a little, like a payload being filled.
			const spread =
				0.12 + (Math.sin(time * 1.6) * 0.5 + 0.5) * 0.025 * (0.3 + energy);
			open.position.x = -spread;
			close.position.x = spread;
		},
		dispose() {
			left.dispose();
			right.dispose();
			glow.material.dispose();
		},
	};
}

function tunnelRings(): TileGlyph {
	const glow = glowMaterial(SCENE_PALETTE.glyph);
	const group = new Group();
	// Each ring leaves a gap so its turning is visible.
	const geometries = [0.24, 0.17, 0.1].map(
		(radius) => new TorusGeometry(radius, 0.016, 10, 72, Math.PI * 1.7),
	);
	const rings = geometries.map((geometry, index) => {
		const ring = new Mesh(geometry, glow.material);
		ring.position.z = 0.05 - index * 0.05;
		group.add(ring);
		return ring;
	});
	return {
		object: group,
		update(time, energy) {
			glow.setEnergy(energy);
			const speed = 0.3 + energy * 0.9;
			rings.forEach((ring, index) => {
				const direction = index % 2 === 0 ? 1 : -1;
				ring.rotation.z = time * speed * (0.6 + index * 0.35) * direction;
				ring.rotation.x = Math.sin(time * 0.8 + index) * 0.25;
			});
		},
		dispose() {
			for (const geometry of geometries) geometry.dispose();
			glow.material.dispose();
		},
	};
}

/** In logo grid order: Chat, Scribe, Localman, Tunelo. */
export function createTileGlyphs(): TileGlyph[] {
	return [chatBubble(), soundMeter(), jsonBraces(), tunnelRings()];
}
