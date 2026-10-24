/**
 * Follows a target pose with exponential damping: position and scale ease,
 * rotation slerps. Each tile gets its own follow rate, so when the stage
 * changes the four tiles move like objects with weight, one slightly after
 * another, instead of sliding in lockstep with the scroll.
 */
import { Euler, type Object3D, Quaternion, Vector3 } from "three";
import type { Pose } from "./tile-poses";

export class DampedTransform {
	readonly position = new Vector3();
	readonly quaternion = new Quaternion();
	scale = 1;
	private started = false;
	private readonly targetPosition = new Vector3();
	private readonly targetQuaternion = new Quaternion();
	private readonly euler = new Euler();

	/**
	 * @param rate how fast it follows (per second); higher is snappier
	 * @param snap jump straight to the target (first frame, reduced motion)
	 */
	follow(pose: Pose, rate: number, dt: number, snap: boolean): void {
		this.targetPosition.set(pose.x, pose.y, pose.z);
		this.euler.set(pose.rx, pose.ry, pose.rz);
		this.targetQuaternion.setFromEuler(this.euler);

		if (snap || !this.started) {
			this.position.copy(this.targetPosition);
			this.quaternion.copy(this.targetQuaternion);
			this.scale = pose.s;
			this.started = true;
			return;
		}
		const amount = 1 - Math.exp(-rate * dt);
		this.position.lerp(this.targetPosition, amount);
		this.quaternion.slerp(this.targetQuaternion, amount);
		this.scale += (pose.s - this.scale) * amount;
	}

	applyTo(object: Object3D): void {
		object.position.copy(this.position);
		object.quaternion.copy(this.quaternion);
		object.scale.setScalar(this.scale);
	}
}
