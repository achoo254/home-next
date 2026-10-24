/**
 * The page's 3D layer: a fixed full-viewport canvas behind the copy.
 *
 * Four glass tiles (the logo, one per app) float in front of a living
 * aurora. Scroll position picks the stage (see `tile-poses.ts`): each app
 * chapter pulls its tile forward and lights the glyph inside it, the account
 * section assembles the logo and lights the ring, and the aurora changes
 * mood with every stage. Each tile follows its target on its own spring, so
 * the motion has weight.
 *
 * Loaded lazily after first paint; the HTML poster stands in until it is
 * ready, whenever the WebGL context is lost, and when WebGL is missing.
 */
import {
	ACESFilmicToneMapping,
	DirectionalLight,
	Group,
	PMREMGenerator,
	PerspectiveCamera,
	PointLight,
	SRGBColorSpace,
	Scene,
	type Texture,
	WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { measureAnchors, stageAt } from "../scroll/stage-progress";
import { createAuroraBackdrop } from "./aurora-backdrop";
import { DampedTransform } from "./damped-transform";
import { createGlassTiles } from "./glass-tiles";
import { createKeyRing } from "./key-ring";
import { createPostEffects } from "./post-effects";
import { QualityGovernor } from "./quality-governor";
import { SCENE_PALETTE } from "./scene-palette";
import { createStarDust } from "./star-dust";
import {
	type Frame,
	assembledWeight,
	focusWeight,
	formationPose,
	isCompact,
	poseBetweenStages,
	tilePose,
	visibleHalf,
} from "./tile-poses";

export interface TilesSceneOptions {
	readonly canvas: HTMLCanvasElement;
	/** Sections whose centres mark stages 0..6, in page order. */
	readonly stageSections: readonly HTMLElement[];
	readonly reducedMotion: boolean;
	/** Called with false when the WebGL context is lost, true when drawn again. */
	readonly onShownChange: (shown: boolean) => void;
}

export interface TilesScene {
	dispose(): void;
}

const FOV = 35;
const CAMERA_Z = 9;
/** Depth of the plane the cursor light moves on, in front of the tiles. */
const POINTER_LIGHT_Z = 2.6;
/** How fast colours and glyph light follow the scroll (per second). */
const MOOD_RATE = 2.4;
/** Spring rate of the formation; each tile adds its own lag on top. */
const FORMATION_RATE = 3.2;
const TILE_RATES = [2.6, 3.1, 2.3, 2.8];
/** Reduced motion freezes the aurora at a moment that reads well. */
const STILL_TIME = 18;

function createEnvironment(renderer: WebGLRenderer): Texture {
	const pmrem = new PMREMGenerator(renderer);
	const room = new RoomEnvironment();
	const texture = pmrem.fromScene(room, 0.04).texture;
	room.dispose();
	pmrem.dispose();
	return texture;
}

/**
 * Throws when the browser cannot give us a WebGL context, or only a slow
 * software one: the poster is the better page then.
 */
export function mountTilesScene(options: TilesSceneOptions): TilesScene {
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
	let environment = createEnvironment(renderer);
	scene.environment = environment;
	scene.environmentIntensity = 0.9;

	const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
	camera.position.set(0, 0, CAMERA_Z);

	const rim = new DirectionalLight(SCENE_PALETTE.violetLight, 2.6);
	rim.position.set(-5, 4, 1);
	const accentLight = new PointLight(SCENE_PALETTE.accent, 14, 14, 2);
	accentLight.position.set(3.5, -2, 3);
	const pointerLight = new PointLight(SCENE_PALETTE.keyLight, 0, 7, 2);
	pointerLight.position.set(0, 0, POINTER_LIGHT_Z);
	scene.add(rim, accentLight, pointerLight);

	// Drawn at low resolution into a texture; the refraction pass draws the
	// background too, so the glass still bends the aurora behind it.
	const aurora = createAuroraBackdrop();
	scene.background = aurora.texture;

	const compactAtStart = window.innerWidth / window.innerHeight < 0.9;
	// Phones and tablets, in either orientation, start one quality step down.
	const touchFirst = window.matchMedia("(pointer: coarse)").matches;
	const dust = createStarDust(compactAtStart ? 320 : 820);
	scene.add(dust.points);

	const glass = createGlassTiles();
	const ring = createKeyRing();
	const formation = new Group();
	formation.add(...glass.tiles.map((tile) => tile.group), ring.mesh);
	scene.add(formation);

	const formationFollower = new DampedTransform();
	const tileFollowers = glass.tiles.map(() => new DampedTransform());

	const governor = new QualityGovernor(compactAtStart || touchFirst ? 1 : 0);
	const post = createPostEffects(
		renderer,
		scene,
		camera,
		Math.min(window.devicePixelRatio, governor.current.maxPixelRatio),
	);

	let frame: Frame = { aspect: 1, fovDeg: FOV, cameraZ: CAMERA_Z };
	let anchors: number[] = [];
	let width = 0;
	let height = 0;
	let pixelRatioSeen = 0;
	/** Reduced motion: the stage last drawn, so scrolling within it is free. */
	let drawnStage = Number.NaN;
	let mood = 0;
	let pointerX = 0;
	let pointerY = 0;
	let pointerActive = false;
	let lastTime = performance.now();
	let elapsed = reducedMotion ? STILL_TIME : 0;
	let frameId = 0;
	let running = false;
	let contextLost = false;

	function measure(): void {
		anchors = measureAnchors(stageSections);
		requestDraw(true);
	}

	function applyQuality(): void {
		const quality = governor.current;
		const pixelRatio = Math.min(window.devicePixelRatio, quality.maxPixelRatio);
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(width, height, false);
		renderer.transmissionResolutionScale = quality.refractionScale;
		post.setSize(width, height, pixelRatio);
		post.setBloomEnabled(quality.bloom);
		dust.setPixelRatio(pixelRatio);
		aurora.setSize(
			width * pixelRatio,
			height * pixelRatio,
			quality.auroraScale,
			isCompact(frame),
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
		frame = { aspect: camera.aspect, fovDeg: FOV, cameraZ: CAMERA_Z };
		applyQuality();
		// A resize stalls a few frames; they say nothing about the device.
		governor.reset();
		measure();
	}

	/**
	 * Reduced motion snaps to the nearest section's stage: the scene changes
	 * between sections without travelling along with the scroll.
	 */
	function targetStage(): number {
		const stage = stageAt(window.scrollY + window.innerHeight / 2, anchors);
		return reducedMotion ? Math.round(stage) : stage;
	}

	function update(dt: number): void {
		const target = targetStage();
		mood = reducedMotion
			? target
			: mood + (target - mood) * (1 - Math.exp(-dt * MOOD_RATE));

		formationFollower.follow(
			poseBetweenStages(target, (stage) => formationPose(stage, frame)),
			FORMATION_RATE,
			dt,
			reducedMotion,
		);
		formationFollower.applyTo(formation);

		const assembled = assembledWeight(mood);
		const drift = reducedMotion ? 0 : 1 - assembled * 0.75;

		glass.tiles.forEach((tile, index) => {
			const follower = tileFollowers[index];
			if (!follower) return;
			follower.follow(
				poseBetweenStages(target, (stage) => tilePose(stage, index, frame)),
				TILE_RATES[index] ?? FORMATION_RATE,
				dt,
				reducedMotion,
			);
			follower.applyTo(tile.group);

			// A slow float on top of the spring, different for every tile.
			const phase = elapsed * 0.55 + index * 1.7;
			tile.group.position.y += Math.sin(phase) * 0.07 * drift;
			tile.group.rotateX(Math.sin(phase * 0.8) * 0.06 * drift);
			tile.group.rotateY(Math.cos(phase * 0.7) * 0.08 * drift);

			// The key lights the glyphs one after another as the logo closes.
			const keyLight = Math.min(1, Math.max(0, assembled * 1.8 - index * 0.2));
			tile.glyph.update(elapsed, Math.max(focusWeight(mood, index), keyLight));
		});

		ring.setStrength(assembled, elapsed);
		aurora.setStage(mood);
		aurora.setTime(elapsed);
		aurora.setShift(camera.position.x * 0.04, camera.position.y * 0.04);
		dust.setTime(elapsed);
		dust.points.position.y = mood * 0.6;
		post.setTime(reducedMotion ? 0 : elapsed);

		const follow = Math.min(1, dt * 3);
		const lightPlane = visibleHalf(frame, POINTER_LIGHT_Z);
		pointerLight.position.x +=
			(pointerX * lightPlane.w - pointerLight.position.x) * follow;
		pointerLight.position.y +=
			(pointerY * lightPlane.h - pointerLight.position.y) * follow;
		const lightTarget = pointerActive && !reducedMotion ? 10 : 0;
		pointerLight.intensity += (lightTarget - pointerLight.intensity) * follow;

		const parallax = reducedMotion ? 0 : 1;
		camera.position.x +=
			(pointerX * 0.35 * parallax - camera.position.x) * follow;
		camera.position.y +=
			(pointerY * 0.22 * parallax - camera.position.y) * follow;
		camera.lookAt(0, 0, 0);
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
		pointerActive = true;
		pointerX = (event.clientX / window.innerWidth) * 2 - 1;
		pointerY = -((event.clientY / window.innerHeight) * 2 - 1);
	};
	const onPointerLeave = () => {
		pointerActive = false;
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
		// three rebuilds programs and buffers; the PMREM texture must be redone.
		environment.dispose();
		environment = createEnvironment(renderer);
		scene.environment = environment;
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
	document.documentElement.addEventListener("pointerleave", onPointerLeave);
	document.addEventListener("visibilitychange", onVisibility);
	canvas.addEventListener("webglcontextlost", onContextLost);
	canvas.addEventListener("webglcontextrestored", onContextRestored);

	resize();
	mood = targetStage();
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
			document.documentElement.removeEventListener(
				"pointerleave",
				onPointerLeave,
			);
			document.removeEventListener("visibilitychange", onVisibility);
			canvas.removeEventListener("webglcontextlost", onContextLost);
			canvas.removeEventListener("webglcontextrestored", onContextRestored);
			glass.dispose();
			ring.dispose();
			dust.dispose();
			aurora.dispose();
			post.dispose();
			environment.dispose();
			renderer.dispose();
		},
	};
}
