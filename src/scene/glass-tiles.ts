/**
 * The four logo tiles as thick blocks of glass: three rounded squares and
 * one disc, with the proportions of `docs/brand/hoandat-apps-logo.svg`
 * (200 px tiles, 56 px corner radius, the accent tile fully round). They
 * refract the aurora behind them, split light into a faint rainbow at the
 * edges, and each holds its app's glyph (see `tile-glyphs.ts`).
 */
import {
	type BufferGeometry,
	Color,
	ExtrudeGeometry,
	Group,
	Mesh,
	MeshPhysicalMaterial,
	Shape,
} from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { SCENE_PALETTE } from "./scene-palette";
import { type TileGlyph, createTileGlyphs } from "./tile-glyphs";

const SIZE = 1;
const CORNER = 0.28;
/** Thick enough to read as a glass brick and to hold a glyph inside. */
const DEPTH = 0.26;
const BEVEL = 0.06;

const EXTRUDE = {
	depth: DEPTH,
	bevelEnabled: true,
	bevelSize: BEVEL,
	bevelThickness: BEVEL,
	bevelSegments: 8,
	curveSegments: 36,
} as const;

function roundedSquareShape(size: number, corner: number): Shape {
	const half = size / 2;
	const shape = new Shape();
	shape.moveTo(-half + corner, -half);
	shape.lineTo(half - corner, -half);
	shape.quadraticCurveTo(half, -half, half, -half + corner);
	shape.lineTo(half, half - corner);
	shape.quadraticCurveTo(half, half, half - corner, half);
	shape.lineTo(-half + corner, half);
	shape.quadraticCurveTo(-half, half, -half, half - corner);
	shape.lineTo(-half, -half + corner);
	shape.quadraticCurveTo(-half, -half, -half + corner, -half);
	return shape;
}

function discShape(radius: number): Shape {
	const shape = new Shape();
	shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
	return shape;
}

/**
 * Centres the block and smooths its normals across the bevel, keeping only
 * the hard edge between the bevel and the flat faces: without this the glass
 * shows every facet of the rounded corners.
 */
function centred(geometry: BufferGeometry): BufferGeometry {
	geometry.center();
	const smooth = toCreasedNormals(geometry, Math.PI / 5);
	geometry.dispose();
	return smooth;
}

function glassMaterial(tint: number): MeshPhysicalMaterial {
	return new MeshPhysicalMaterial({
		color: 0xffffff,
		metalness: 0,
		// Not a perfect mirror: a hint of roughness spreads the reflection of
		// the studio lights instead of letting it bloom into a white blot.
		roughness: 0.14,
		transmission: 1,
		thickness: 0.9,
		ior: 1.5,
		dispersion: 5,
		attenuationColor: new Color(tint),
		attenuationDistance: 1.4,
		clearcoat: 1,
		clearcoatRoughness: 0.18,
		iridescence: 0.4,
		iridescenceIOR: 1.3,
		iridescenceThicknessRange: [120, 480],
		specularIntensity: 0.6,
		envMapIntensity: 0.9,
	});
}

export interface GlassTile {
	/** Moves and turns as one: the glass block and the glyph inside it. */
	readonly group: Group;
	readonly glass: Mesh<BufferGeometry, MeshPhysicalMaterial>;
	readonly glyph: TileGlyph;
}

export interface GlassTiles {
	/** Logo grid order: Chat, Scribe (accent disc), Localman, Tunelo. */
	readonly tiles: readonly GlassTile[];
	dispose(): void;
}

export function createGlassTiles(): GlassTiles {
	// The bevel grows the outline, so each shape is drawn that much smaller.
	const square = centred(
		new ExtrudeGeometry(
			roundedSquareShape(SIZE - BEVEL * 2, CORNER - BEVEL),
			EXTRUDE,
		),
	);
	const disc = centred(
		new ExtrudeGeometry(discShape(SIZE / 2 - BEVEL), EXTRUDE),
	);
	const glyphs = createTileGlyphs();

	const tiles = glyphs.map((glyph, index): GlassTile => {
		const isAccent = index === 1;
		const glass = new Mesh(
			isAccent ? disc : square,
			glassMaterial(
				isAccent ? SCENE_PALETTE.glassTintAccent : SCENE_PALETTE.glassTint,
			),
		);
		const group = new Group();
		group.add(glyph.object, glass);
		return { group, glass, glyph };
	});

	return {
		tiles,
		dispose() {
			square.dispose();
			disc.dispose();
			for (const tile of tiles) {
				tile.glass.material.dispose();
				tile.glyph.dispose();
			}
		},
	};
}
