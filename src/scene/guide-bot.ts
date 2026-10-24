/**
 * Nav, the guide bot that rides along: a small pearl robot with a dark
 * visor, two light-bar eyes that blink, an antenna that pulses while it
 * talks, a halo ring and a soft thruster glow. It lives in camera space (a
 * child of the camera), turns its head towards the station ahead, and bobs
 * gently as the ship flies.
 */
import {
	AdditiveBlending,
	CapsuleGeometry,
	Color,
	ConeGeometry,
	CylinderGeometry,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	Quaternion,
	SphereGeometry,
	TorusGeometry,
	type Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { SCENE_PALETTE } from "./scene-palette";

export interface GuideBot {
	/** Add to the camera; position and scale it there. */
	readonly root: Group;
	/**
	 * @param lookAt world point the head turns towards
	 * @param talk 0..1, how much it is "speaking" (antenna pulse)
	 */
	update(
		time: number,
		dt: number,
		lookAt: Vector3,
		talk: number,
		still: boolean,
	): void;
	dispose(): void;
}

function glow(hex: number, strength: number): MeshBasicMaterial {
	return new MeshBasicMaterial({
		color: new Color(hex).multiplyScalar(strength),
		toneMapped: false,
	});
}

export function createGuideBot(): GuideBot {
	const pearl = new MeshPhysicalMaterial({
		color: 0xd9d2f2,
		roughness: 0.34,
		metalness: 0.05,
		clearcoat: 1,
		clearcoatRoughness: 0.12,
		sheen: 0.6,
		sheenColor: new Color(SCENE_PALETTE.violetLight),
		iridescence: 0.25,
	});
	const visorMaterial = new MeshPhysicalMaterial({
		color: 0x0b0820,
		roughness: 0.08,
		metalness: 0.2,
		clearcoat: 1,
		clearcoatRoughness: 0.02,
	});
	const eyeMaterial = glow(0xc9b8ff, 2.2);
	const antennaMaterial = glow(SCENE_PALETTE.accent, 2);
	const haloMaterial = glow(SCENE_PALETTE.accent, 1.6);
	const thrusterMaterial = new MeshBasicMaterial({
		color: new Color(SCENE_PALETTE.violetLight).multiplyScalar(1.8),
		transparent: true,
		opacity: 0.55,
		blending: AdditiveBlending,
		depthWrite: false,
		toneMapped: false,
	});

	const headGeometry = new RoundedBoxGeometry(0.92, 0.66, 0.66, 6, 0.24);
	const visorGeometry = new RoundedBoxGeometry(0.74, 0.44, 0.12, 4, 0.1);
	const eyeGeometry = new CapsuleGeometry(0.05, 0.1, 4, 10);
	const bodyGeometry = new CapsuleGeometry(0.3, 0.3, 8, 20);
	const stalkGeometry = new CylinderGeometry(0.018, 0.018, 0.22, 8);
	const tipGeometry = new SphereGeometry(0.06, 16, 12);
	const haloGeometry = new TorusGeometry(0.52, 0.012, 8, 96);
	const thrusterGeometry = new ConeGeometry(0.2, 0.55, 24, 1, true);

	const root = new Group();
	const bob = new Group();
	root.add(bob);

	const body = new Mesh(bodyGeometry, pearl);
	body.position.y = -0.55;
	bob.add(body);

	const halo = new Mesh(haloGeometry, haloMaterial);
	halo.position.y = -0.5;
	halo.rotation.x = Math.PI / 2.3;
	bob.add(halo);

	const thruster = new Mesh(thrusterGeometry, thrusterMaterial);
	thruster.position.y = -1.08;
	thruster.rotation.x = Math.PI;
	bob.add(thruster);

	const head = new Group();
	head.position.y = 0.08;
	bob.add(head);
	head.add(new Mesh(headGeometry, pearl));
	const visor = new Mesh(visorGeometry, visorMaterial);
	visor.position.z = 0.3;
	head.add(visor);
	const eyes = [-0.15, 0.15].map((x) => {
		const eye = new Mesh(eyeGeometry, eyeMaterial);
		eye.position.set(x, 0.02, 0.37);
		head.add(eye);
		return eye;
	});
	const stalk = new Mesh(stalkGeometry, pearl);
	stalk.position.y = 0.43;
	head.add(stalk);
	const tip = new Mesh(tipGeometry, antennaMaterial);
	tip.position.y = 0.56;
	head.add(tip);

	const tipBase = new Color(SCENE_PALETTE.accent);
	const turn = new Quaternion();
	let nextBlink = 2.5;

	return {
		root,
		update(time, dt, lookAt, talk, still) {
			const motion = still ? 0 : 1;
			bob.position.y = Math.sin(time * 1.6) * 0.06 * motion;
			bob.rotation.z = Math.sin(time * 1.1) * 0.05 * motion;

			// Turn the head towards the station, smoothly and only part way.
			const previous = turn.copy(head.quaternion);
			head.lookAt(lookAt);
			head.quaternion.slerp(new Quaternion(), 0.45);
			const target = head.quaternion.clone();
			head.quaternion
				.copy(previous)
				.slerp(target, still ? 1 : Math.min(1, dt * 4));

			// Blink: a quick squash of both eyes every few seconds.
			const sinceBlink = time - nextBlink;
			const closing = sinceBlink > 0 && sinceBlink < 0.14 && !still;
			for (const eye of eyes) eye.scale.y = closing ? 0.15 : 1;
			if (sinceBlink > 0.14) nextBlink = time + 2.5 + ((time * 7.31) % 2.5);

			const pulse = 0.6 + talk * (0.7 + Math.sin(time * 14) * 0.5);
			antennaMaterial.color.copy(tipBase).multiplyScalar(1 + pulse);
			halo.rotation.z = time * 0.6 * motion;
			thruster.scale.y = 0.9 + Math.sin(time * 23) * 0.08 * motion;
		},
		dispose() {
			for (const geometry of [
				headGeometry,
				visorGeometry,
				eyeGeometry,
				bodyGeometry,
				stalkGeometry,
				tipGeometry,
				haloGeometry,
				thrusterGeometry,
			]) {
				geometry.dispose();
			}
			for (const material of [
				pearl,
				visorMaterial,
				eyeMaterial,
				antennaMaterial,
				haloMaterial,
				thrusterMaterial,
			]) {
				material.dispose();
			}
		},
	};
}
