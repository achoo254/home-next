/**
 * The reflections the glass and the bot see: a violet gradient sky with a
 * few soft light cards, baked once into a PMREM texture. three's
 * RoomEnvironment uses very bright light boxes; on near-mirror glass one of
 * them filled a whole tile face with white whenever the tile turned towards
 * it. These cards are bright enough to draw crisp edge highlights and dim
 * enough never to blow out a face.
 */
import {
	BackSide,
	Color,
	Mesh,
	MeshBasicMaterial,
	PMREMGenerator,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	SphereGeometry,
	type Texture,
	type WebGLRenderer,
} from "three";
import { SCENE_PALETTE } from "./scene-palette";

/** Light cards: position, size and brightness (above 1 for highlights). */
const CARDS = [
	{ position: [-6, 7, 4], size: [6, 3], brightness: 2.6 },
	{ position: [8, 2, 2], size: [3, 6], brightness: 1.6 },
	{ position: [0, -6, -6], size: [8, 2], brightness: 0.9 },
] as const;

export function createStudioEnvironment(renderer: WebGLRenderer): Texture {
	const scene = new Scene();

	const skyGeometry = new SphereGeometry(20, 32, 16);
	const skyMaterial = new ShaderMaterial({
		side: BackSide,
		depthWrite: false,
		uniforms: {
			uLow: { value: new Color(0x0c0822) },
			uHigh: {
				value: new Color(SCENE_PALETTE.violetLight).multiplyScalar(0.55),
			},
			uAccent: { value: new Color(SCENE_PALETTE.accent).multiplyScalar(0.35) },
		},
		vertexShader: /* glsl */ `
			varying vec3 vDirection;
			void main() {
				vDirection = normalize(position);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: /* glsl */ `
			uniform vec3 uLow;
			uniform vec3 uHigh;
			uniform vec3 uAccent;
			varying vec3 vDirection;
			void main() {
				vec3 colour = mix(uLow, uHigh, smoothstep(-0.4, 0.9, vDirection.y));
				// A warm pink band low on one side, for coloured rim light.
				colour += uAccent * smoothstep(0.4, 1.0, vDirection.x) * (1.0 - abs(vDirection.y));
				gl_FragColor = vec4(colour, 1.0);
			}
		`,
	});
	scene.add(new Mesh(skyGeometry, skyMaterial));

	const cardGeometry = new PlaneGeometry(1, 1);
	const cardMaterials = CARDS.map((card) => {
		const material = new MeshBasicMaterial({
			color: new Color(SCENE_PALETTE.keyLight).multiplyScalar(card.brightness),
		});
		const mesh = new Mesh(cardGeometry, material);
		const [x, y, z] = card.position;
		mesh.position.set(x, y, z);
		mesh.scale.set(card.size[0], card.size[1], 1);
		mesh.lookAt(0, 0, 0);
		scene.add(mesh);
		return material;
	});

	const pmrem = new PMREMGenerator(renderer);
	const texture = pmrem.fromScene(scene, 0.03).texture;
	pmrem.dispose();
	skyGeometry.dispose();
	skyMaterial.dispose();
	cardGeometry.dispose();
	for (const material of cardMaterials) material.dispose();
	return texture;
}
