/**
 * The page's 3D layer: a fixed full-viewport canvas behind the copy, seen
 * from the seat of a small ship. Scrolling flies the ship along a route
 * (`flight-path.ts`), one stop per chapter: stars streak when the ship
 * moves fast, and the nebula changes mood with every stop. The apps' art
 * and Nav, the guide bot, are images in the HTML over it.
 *
 * Loaded lazily after first paint; the plain background stands in until it
 * is ready, whenever the WebGL context is lost, and when WebGL is missing.
 */
import {
	ACESFilmicToneMapping,
	MathUtils,
	PerspectiveCamera,
	SRGBColorSpace,
	Scene,
	Vector3,
	WebGLRenderer,
} from "three";
import { measureAnchors, stageAt } from "../scroll/stage-progress";
import { createAuroraBackdrop } from "./aurora-backdrop";
import {
	LAST_STAGE,
	type StopFrame,
	createRouteCurve,
	stageToCurve,
	stopFrame,
	stopLookTarget,
} from "./flight-path";
import { createPostEffects } from "./post-effects";
import { QualityGovernor } from "./quality-governor";
import { SCENE_PALETTE } from "./scene-palette";
import { createStarDust } from "./star-dust";
import { createWarpStars } from "./warp-stars";

export interface FlightSceneOptions {
	readonly canvas: HTMLCanvasElement;
	/** Sections whose centres mark stages 0..6, in page order. */
	readonly stageSections: readonly HTMLElement[];
	readonly reducedMotion: boolean;
	/** Called with false when the WebGL context is lost, true when drawn again. */
	readonly onShownChange: (shown: boolean) => void;
}

export interface FlightScene {
	dispose(): void;
}

const FOV = 38;
/** How fast the ship follows the scroll (per second). */
const FLIGHT_RATE = 2.4;
/** How fast the nebula's colours follow the scroll (per second). */
const MOOD_RATE = 2.2;
/** Reduced motion freezes the nebula at a moment that reads well. */
const STILL_TIME = 18;
/**
 * Throws when the browser cannot give us a WebGL context, or only a slow
 * software one: the poster is the better page then.
 */
export function mountFlightScene(options: FlightSceneOptions): FlightScene {
	const { canvas, stageSections, reducedMotion, onShownChange } = options;

	const renderer = new WebGLRenderer({
		canvas,
		antialias: false,
		failIfMajorPerformanceCaveat: true,
	});
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.1;
	renderer.setClearColor(SCENE_PALETTE.background, 1);

	const scene = new Scene();

	const camera = new PerspectiveCamera(FOV, 1, 0.1, 400);
	scene.add(camera);

	// Drawn at low resolution into a texture.
	const aurora = createAuroraBackdrop();
	scene.background = aurora.texture;

	const compactAtStart = window.innerWidth / window.innerHeight < 0.9;
	// Phones and tablets, in either orientation, start one quality step down.
	const touchFirst = window.matchMedia("(pointer: coarse)").matches;
	const dust = createStarDust(compactAtStart ? 900 : 2200);
	const warp = createWarpStars(compactAtStart ? 500 : 1300);
	scene.add(dust.points, warp.lines);

	const curve = createRouteCurve();
	const stops: StopFrame[] = [];
	for (let stop = 0; stop <= LAST_STAGE; stop++)
		stops.push(stopFrame(curve, stop));
	function stopAt(index: number): StopFrame {
		const frame = stops[Math.min(LAST_STAGE, Math.max(0, index))];
		if (!frame) throw new Error("flight-scene: no stop frames");
		return frame;
	}

	const governor = new QualityGovernor(compactAtStart || touchFirst ? 1 : 0);
	const post = createPostEffects(
		renderer,
		scene,
		camera,
		Math.min(window.devicePixelRatio, governor.current.maxPixelRatio),
	);

	let compact = compactAtStart;
	let anchors: number[] = [];
	let width = 0;
	let height = 0;
	let pixelRatioSeen = 0;
	let mood = 0;
	let pointerX = 0;
	let pointerY = 0;
	let lastTime = performance.now();
	let elapsed = reducedMotion ? STILL_TIME : 0;
	let frameId = 0;
	let running = false;
	let contextLost = false;
	/** Reduced motion: the stage last drawn, so scrolling within it is free. */
	let drawnStage = Number.NaN;

	const shipPosition = new Vector3();
	const shipLook = new Vector3();
	const previousShip = new Vector3();
	const velocity = new Vector3();
	const targetPosition = new Vector3();
	const targetLook = new Vector3();
	const lookFrom = new Vector3();
	const lookTo = new Vector3();
	const viewRight = new Vector3();
	const viewUp = new Vector3();
	let started = false;

	function measure(): void {
		anchors = measureAnchors(stageSections);
		requestDraw(true);
	}

	function applyQuality(): void {
		const quality = governor.current;
		const pixelRatio = Math.min(window.devicePixelRatio, quality.maxPixelRatio);
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(width, height, false);
		post.setSize(width, height, pixelRatio);
		post.setBloomEnabled(quality.bloom);
		dust.setPixelRatio(pixelRatio);
		aurora.setSize(
			width * pixelRatio,
			height * pixelRatio,
			quality.auroraScale,
			compact,
		);
	}

	/**
	 * Sizes the drawing buffer to the canvas as CSS lays it out (100lvh tall,
	 * not innerHeight, which changes with the mobile toolbar) and to the
	 * current pixel ratio; does nothing when neither changed.
	 */
	function resize(): void {
		const nextWidth = canvas.clientWidth || window.innerWidth;
		const nextHeight = canvas.clientHeight || window.innerHeight;
		const nextRatio = window.devicePixelRatio;
		if (
			nextWidth === width &&
			nextHeight === height &&
			nextRatio === pixelRatioSeen
		) {
			return;
		}
		width = nextWidth;
		height = nextHeight;
		pixelRatioSeen = nextRatio;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		compact = camera.aspect < 0.9;
		applyQuality();
		// A resize stalls a few frames; they say nothing about the device.
		governor.reset();
		measure();
	}

	/**
	 * Reduced motion snaps to the nearest section's stage: the ship jumps
	 * between stops instead of flying along with the scroll.
	 */
	function targetStage(): number {
		const stage = stageAt(window.scrollY + window.innerHeight / 2, anchors);
		return reducedMotion ? Math.round(stage) : stage;
	}

	/** The camera's aim between two stops, eased so it settles on each. */
	function lookTargetAt(stage: number, into: Vector3): Vector3 {
		const lower = Math.floor(MathUtils.clamp(stage, 0, LAST_STAGE));
		const upper = Math.min(LAST_STAGE, lower + 1);
		const t = MathUtils.smootherstep(stage - lower, 0, 1);
		stopLookTarget(stopAt(lower), compact, lookFrom);
		stopLookTarget(stopAt(upper), compact, lookTo);
		return into.copy(lookFrom).lerp(lookTo, t);
	}

	function update(dt: number): void {
		const target = targetStage();
		const follow =
			reducedMotion || !started ? 1 : 1 - Math.exp(-dt * FLIGHT_RATE);
		mood =
			reducedMotion || !started
				? target
				: mood + (target - mood) * (1 - Math.exp(-dt * MOOD_RATE));

		curve.getPoint(stageToCurve(target), targetPosition);
		lookTargetAt(target, targetLook);
		previousShip.copy(shipPosition);
		shipPosition.lerp(targetPosition, follow);
		shipLook.lerp(targetLook, follow);
		if (!started) {
			shipPosition.copy(targetPosition);
			shipLook.copy(targetLook);
			previousShip.copy(shipPosition);
			started = true;
		}
		velocity
			.copy(shipPosition)
			.sub(previousShip)
			.divideScalar(Math.max(dt, 1e-3));
		if (reducedMotion) velocity.set(0, 0, 0);

		// A slow sway, as if the ship floated rather than ran on rails.
		const sway = reducedMotion ? 0 : 1;
		camera.position.copy(shipPosition);
		camera.position.y += Math.sin(elapsed * 0.5) * 0.08 * sway;
		const lowerStop = stopAt(Math.floor(mood));
		const upperStop = stopAt(Math.ceil(mood));
		const between = mood - Math.floor(mood);
		viewRight
			.lerpVectors(lowerStop.right, upperStop.right, between)
			.normalize();
		viewUp.lerpVectors(lowerStop.up, upperStop.up, between).normalize();
		const lookParallax = reducedMotion ? 0 : 0.9;
		lookTo
			.copy(shipLook)
			.addScaledVector(viewRight, pointerX * lookParallax)
			.addScaledVector(viewUp, pointerY * lookParallax * 0.6);
		camera.lookAt(lookTo);
		// Bank into turns, a touch, from the sideways speed.
		const sideways = velocity.dot(viewRight);
		camera.rotateZ(MathUtils.clamp(-sideways * 0.012, -0.12, 0.12) * sway);

		warp.setVelocity(velocity);
		aurora.setStage(mood);
		aurora.setTime(elapsed);
		aurora.setShift(shipLook.x * 0.015, shipLook.y * 0.015 - mood * 0.08);
		dust.setTime(elapsed);
		post.setTime(reducedMotion ? 0 : elapsed);
	}

	function draw(dt: number): void {
		update(dt);
		aurora.render(renderer);
		post.render();
	}

	function tick(now: number): void {
		const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
		lastTime = now;
		elapsed += dt;
		draw(dt);
		if (governor.record(dt)) applyQuality();
		// Scheduled after drawing, so an error stops the loop instead of repeating.
		if (running) frameId = requestAnimationFrame(tick);
	}

	/**
	 * Reduced motion has no loop: it draws once when the snapped stage
	 * changes, or when `force` says the layout or the context changed.
	 */
	function requestDraw(force = false): void {
		if (!reducedMotion || contextLost || frameId !== 0) return;
		if (!force && targetStage() === drawnStage) return;
		frameId = requestAnimationFrame(() => {
			frameId = 0;
			drawnStage = targetStage();
			draw(0);
		});
	}

	function start(): void {
		if (reducedMotion) {
			requestDraw(true);
			return;
		}
		if (running || contextLost) return;
		running = true;
		lastTime = performance.now();
		governor.reset();
		frameId = requestAnimationFrame(tick);
	}

	function stop(): void {
		running = false;
		cancelAnimationFrame(frameId);
		frameId = 0;
	}

	const onScroll = () => requestDraw();
	const onPointer = (event: PointerEvent) => {
		if (event.pointerType !== "mouse") return;
		pointerX = (event.clientX / window.innerWidth) * 2 - 1;
		pointerY = -((event.clientY / window.innerHeight) * 2 - 1);
	};
	const onVisibility = () => {
		if (document.hidden) stop();
		else start();
	};
	const onContextLost = (event: Event) => {
		// Asking for a restore; until then the poster takes over.
		event.preventDefault();
		contextLost = true;
		stop();
		onShownChange(false);
	};
	const onContextRestored = () => {
		contextLost = false;
		// three rebuilds programs and buffers on the next draw.
		draw(0);
		onShownChange(true);
		if (!document.hidden) start();
	};
	// Fonts and images change section heights after load: re-measure anchors.
	const layoutObserver = new ResizeObserver(measure);
	layoutObserver.observe(document.body);
	const canvasObserver = new ResizeObserver(resize);
	canvasObserver.observe(canvas);

	window.addEventListener("resize", resize);
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("pointermove", onPointer, { passive: true });
	document.addEventListener("visibilitychange", onVisibility);
	canvas.addEventListener("webglcontextlost", onContextLost);
	canvas.addEventListener("webglcontextrestored", onContextRestored);

	resize();
	draw(0);
	onShownChange(true);
	start();

	return {
		dispose() {
			stop();
			layoutObserver.disconnect();
			canvasObserver.disconnect();
			window.removeEventListener("resize", resize);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("pointermove", onPointer);
			document.removeEventListener("visibilitychange", onVisibility);
			canvas.removeEventListener("webglcontextlost", onContextLost);
			canvas.removeEventListener("webglcontextrestored", onContextRestored);
			warp.dispose();
			dust.dispose();
			aurora.dispose();
			post.dispose();
			renderer.dispose();
		},
	};
}
