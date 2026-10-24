/**
 * The ring of light that binds the assembled logo: the one account that
 * opens every app. Brighter than white so the bloom pass gives it a halo.
 */
import {
	Color,
	DoubleSide,
	Mesh,
	MeshBasicMaterial,
	TorusGeometry,
} from "three";
import { SCENE_PALETTE } from "./scene-palette";

export interface KeyRing {
	readonly mesh: Mesh<TorusGeometry, MeshBasicMaterial>;
	/** 0 hidden .. 1 fully lit. */
	setStrength(strength: number, time: number): void;
	dispose(): void;
}

export function createKeyRing(): KeyRing {
	const geometry = new TorusGeometry(1.75, 0.01, 12, 200);
	const base = new Color(SCENE_PALETTE.accent);
	const material = new MeshBasicMaterial({
		color: base.clone(),
		transparent: true,
		opacity: 0,
		toneMapped: false,
		depthWrite: false,
		side: DoubleSide,
	});
	const mesh = new Mesh(geometry, material);
	return {
		mesh,
		setStrength(strength, time) {
			mesh.visible = strength > 0.001;
			material.opacity = strength;
			material.color.copy(base).multiplyScalar(1.2 + strength * 1.6);
			mesh.scale.setScalar(0.82 + strength * 0.18);
			mesh.rotation.z = time * 0.25;
		},
		dispose() {
			geometry.dispose();
			material.dispose();
		},
	};
}
