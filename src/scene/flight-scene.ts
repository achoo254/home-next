/**
 * The page's 3D layer: a fixed full-viewport canvas behind the copy, seen
 * from the seat of a small ship. Scrolling flies the ship along a route
 * (`flight-path.ts`) past one glass station per live app, to the hub: the
 * orbit mark in 3D, a pink core (the one account) with app tiles riding its
 * ring, as many as there are apps. Nav,
 * the guide bot, rides along in the corner of the view and turns to look at
 * each station; stars streak when the ship moves fast; the nebula behind
 * changes mood with every stop.
 *
 * Loaded lazily after first paint; the HTML poster stands in until it is
 * ready, whenever the WebGL context is lost, and when WebGL is missing.
 */
import {
	ACESFilmicToneMapping,
	Color,
	DirectionalLight,
	Group,
	MathUtils,
	Mesh,
	MeshPhysicalMaterial,
	PerspectiveCamera,
	PointLight,
	Quaternion,
	SRGBColorSpace,
	Scene,
	SphereGeometry,
	Vector3,
	WebGLRenderer,
} from "three";
import { measureAnchors, stageAt } from "../scroll/stage-progress";
import { createAuroraBackdrop } from "./aurora-backdrop";
import {
	HUB_STAGE,
	LAST_STAGE,
	type StopFrame,
	createRouteCurve,
	stageToCurve,
	stationPosition,
	stopFrame,
	stopLookTarget,
} from "./flight-path";
import { createGlassTiles } from "./glass-tiles";
import { createGuideBot } from "./guide-bot";
import { type KeyRing, createKeyRing } from "./key-ring";
import { createPostEffects } from "./post-effects";
import { QualityGovernor } from "./quality-governor";
import { SCENE_PALETTE } from "./scene-palette";
import { createStarDust } from "./star-dust";
import { createStudioEnvironment } from "./studio-environment";
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
/** How fast colours and glyph light follow the scroll (per second). */
const MOOD_RATE = 2.2;
/** Reduced motion freezes the nebula at a moment that reads well. */
const STILL_TIME = 18;
/** Radius of the hub orbit, the key ring, in hub units. */
const ORBIT_RADIUS = 1.75;
/** Where the app tiles wait before they join the orbit. */
const ORBIT_START_RADIUS = 5;
/** Tilt of the orbit, matching the orbit mark (seen from the front, -22 degrees). */
const ORBIT_TILT_X = 1.18;
const ORBIT_TILT_Z = -0.38;

/** Bot placement in screen terms: NDC position, depth and size. */
interface BotSpot {
	readonly x: number;
	readonly y: number;
	readonly depth: number;
	readonly scale: number;
}
const BOT_SPOTS = {
	heroWide: { x: 0.42, y: -0.02, depth: 6, scale: 1.25 },
	rideWide: { x: 0.8, y: -0.36, depth: 4.6, scale: 0.42 },
	heroTall: { x: 0.42, y: 0.42, depth: 6, scale: 0.62 },
	rideTall: { x: 0.62, y: 0.64, depth: 4.6, scale: 0.34 },
} satisfies Record<string, BotSpot>;

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

/** 1 while the ship rests at `stop`, fading to 0 one stop away. */
function nearness(stage: number, stop: number): number {
	return clamp01(1 - Math.abs(stage - stop));
}

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
	let environment = createStudioEnvironment(renderer);
	scene.environment = environment;
	scene.environmentIntensity = 0.9;

	const camera = new PerspectiveCamera(FOV, 1, 0.1, 400);
	scene.add(camera);

	const rim = new DirectionalLight(SCENE_PALETTE.violetLight, 2.4);
	rim.position.set(-6, 5, 4);
	scene.add(rim);
	// No point light rides with the ship: the glass is nearly a mirror, and a
	// point light's reflection on it blooms into a white blot. The cursor
	// light is kept faint for the same reason.
	const pointerLight = new PointLight(SCENE_PALETTE.keyLight, 0, 10, 2);
	camera.add(pointerLight);

	// Drawn at low resolution into a texture; the refraction pass draws the
	// background too, so the glass still bends the nebula behind it.
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

	// Four stations, one per app, each with a slow orbit ring.
	const stationTiles = createGlassTiles();
	const stationRings: KeyRing[] = [];
	const stations = stationTiles.tiles.map((tile) => {
		const station = new Group();
		const ring = createKeyRing();
		stationRings.push(ring);
		const ringHolder = new Group();
		ringHolder.scale.setScalar(0.62);
		ringHolder.rotation.x = 1.2;
		ringHolder.add(ring.mesh);
		station.add(tile.group, ringHolder);
		scene.add(station);
		return station;
	});

	// The hub: the orbit mark in 3D. A pink core (the one account), a tilted
	// ring (the key), and app tiles that fly in and ride the ring.
	const coreGeometry = new SphereGeometry(0.72, 48, 32);
	const coreMaterial = new MeshPhysicalMaterial({
		color: SCENE_PALETTE.accent,
		roughness: 0.38,
		clearcoat: 0.6,
		clearcoatRoughness: 0.2,
		sheen: 0.5,
		sheenColor: new Color(SCENE_PALETTE.accent),
		emissive: new Color(SCENE_PALETTE.accent),
		emissiveIntensity: 0.05,
	});
	const core = new Mesh(coreGeometry, coreMaterial);
	const hubTiles = createGlassTiles();
	const hubRing = createKeyRing();
	const orbit = new Group();
	orbit.rotation.set(ORBIT_TILT_X, 0, ORBIT_TILT_Z);
	orbit.add(hubRing.mesh);
	const hub = new Group();
	hub.add(core, orbit);
	for (const tile of hubTiles.tiles) orbit.add(tile.group);
	scene.add(hub);
	const facingFront = new Quaternion();

	const bot = createGuideBot();
	camera.add(bot.root);

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
	let pointerActive = false;
	let lastTime = performance.now();
	let elapsed = reducedMotion ? STILL_TIME : 0;
	let frameId = 0;
	let running = false;
	let contextLost = false;
	/** Reduced motion: the stage last drawn, so scrolling within it is free. */
	let drawnStage = Number.NaN;
	/** The bot "talks" for a moment after each arrival. */
	let lastStop = -1;
	let talkUntil = 0;
	/** The bot's rocket, smoothed so it swells and dies down gently. */
	let thrust = 0;

	const shipPosition = new Vector3();
	const shipLook = new Vector3();
	const previousShip = new Vector3();
	const velocity = new Vector3();
	const targetPosition = new Vector3();
	const targetLook = new Vector3();
	const lookFrom = new Vector3();
	const lookTo = new Vector3();
	const botTarget = new Vector3();
	const viewRight = new Vector3();
	const viewUp = new Vector3();
	const stationPositions = stops.map(() => new Vector3());
	let started = false;

	/** Stations sit beside the copy on wide screens, above it on phones. */
	function placeStations(): void {
		stations.forEach((station, index) => {
			const frame = stopAt(index + 1);
			const position = stationPositions[index + 1];
			if (!position) return;
			stationPosition(frame, compact, position);
			station.position.copy(position);
			station.scale.setScalar(compact ? 1.55 : 2.2);
			station.lookAt(frame.position);
		});
		const hubFrame = stopAt(HUB_STAGE);
		const hubPosition = stationPositions[HUB_STAGE];
		if (hubPosition) {
			stationPosition(hubFrame, compact, hubPosition);
			hub.position.copy(hubPosition);
			hub.scale.setScalar(compact ? 1.05 : 1.45);
			hub.lookAt(hubFrame.position);
		}
	}

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
		bot.setViewportHeight(height * pixelRatio);
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
		placeStations();
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

	/**
	 * @param heroWeight 1 at launch (big, beside the title), 0 riding along
	 * @param away 0 riding along, 1 gone: past the last stop the page is
	 *   reading matter, and the co-pilot flies off so it covers nothing
	 */
	function placeBot(heroWeight: number, away: number): void {
		const hero = compact ? BOT_SPOTS.heroTall : BOT_SPOTS.heroWide;
		const ride = compact ? BOT_SPOTS.rideTall : BOT_SPOTS.rideWide;
		const t = MathUtils.smootherstep(heroWeight, 0, 1);
		const x =
			MathUtils.lerp(ride.x, hero.x, t) +
			MathUtils.smootherstep(away, 0, 1) * 0.9;
		const y = MathUtils.lerp(ride.y, hero.y, t);
		const depth = MathUtils.lerp(ride.depth, hero.depth, t);
		const halfHeight = Math.tan(MathUtils.degToRad(FOV / 2)) * depth;
		bot.root.position.set(
			x * halfHeight * camera.aspect,
			y * halfHeight,
			-depth,
		);
		bot.root.scale.setScalar(MathUtils.lerp(ride.scale, hero.scale, t));
		// Facing the viewer, turned slightly towards the middle of the view.
		bot.root.rotation.set(0, -x * 0.5, 0);
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

		// Stations: a slow tumble, and the glyph lights up on arrival.
		stationTiles.tiles.forEach((tile, index) => {
			const near = nearness(mood, index + 1);
			const motion = reducedMotion ? 0 : 1;
			// Only the stations around the current stop are drawn: far ones
			// would sit behind the copy as clutter.
			const shown = MathUtils.smootherstep(
				1.15 - Math.abs(mood - (index + 1)),
				0,
				1,
			);
			const station = stations[index];
			if (station) {
				// Hidden until it is well on its way in: a crisp glyph a few
				// pixels wide would sit on the copy as a stray icon.
				station.visible = shown > 0.08;
				station.scale.setScalar((compact ? 1.55 : 2.2) * (0.35 + 0.65 * shown));
			}
			tile.group.rotation.set(
				Math.sin(elapsed * 0.4 + index) * 0.18 * motion,
				Math.cos(elapsed * 0.33 + index * 2) * 0.28 * motion - 0.25,
				Math.sin(elapsed * 0.25 + index) * 0.05 * motion,
			);
			tile.glyph.update(elapsed, near);
			stationRings[index]?.setStrength(
				(0.15 + near * 0.3) * shown,
				elapsed * (0.5 + index * 0.1),
			);
		});

		// The hub: the app tiles fly in, settle on the orbit and keep riding
		// it; the core glows brighter as the ring closes.
		const assembled = MathUtils.smootherstep(
			nearness(mood, HUB_STAGE) * 1.25,
			0,
			1,
		);
		const count = hubTiles.tiles.length;
		// Tiles face the viewer whatever the orbit's tilt.
		facingFront.copy(orbit.quaternion).invert();
		hubTiles.tiles.forEach((tile, index) => {
			const angle = elapsed * 0.22 + (index / count) * Math.PI * 2;
			const radius = MathUtils.lerp(
				ORBIT_START_RADIUS,
				ORBIT_RADIUS,
				assembled,
			);
			tile.group.position.set(
				Math.cos(angle) * radius,
				Math.sin(angle) * radius,
				0,
			);
			tile.group.quaternion.copy(facingFront);
			tile.group.scale.setScalar(0.5);
			// The key lights the glyphs one after another as they join.
			tile.glyph.update(elapsed, clamp01(assembled * 1.8 - index * 0.2));
		});
		coreMaterial.emissiveIntensity = 0.05 + assembled * 0.12;
		// Shown only around its stop: flying on to the last stop, the ship
		// passes where the hub floats and would cut through its tiles.
		hub.visible = mood > HUB_STAGE - 1.2 && mood < HUB_STAGE + 0.2;
		core.rotation.y = elapsed * 0.1;
		hubRing.setStrength(assembled, elapsed);

		// The bot: big beside the title at launch, then a small co-pilot.
		const stop = Math.round(mood);
		if (stop !== lastStop) {
			lastStop = stop;
			talkUntil = elapsed + 2.6;
		}
		placeBot(1 - clamp01(mood), clamp01((mood - (LAST_STAGE - 0.6)) / 0.6));
		if (stop === 0) botTarget.copy(camera.position);
		else
			botTarget.copy(
				stationPositions[Math.min(HUB_STAGE, stop)] ?? camera.position,
			);
		// The rocket burns harder while the ship flies, and at full power
		// as the bot leaves past the last stop.
		const burnTarget = Math.max(
			clamp01(velocity.length() / 25),
			clamp01((mood - (LAST_STAGE - 0.6)) / 0.6),
		);
		thrust += (burnTarget - thrust) * Math.min(1, dt * 4);
		bot.update({
			time: elapsed,
			dt,
			lookAt: botTarget,
			talk: elapsed < talkUntil ? 1 : 0,
			thrust: reducedMotion ? 0 : thrust,
			still: reducedMotion,
		});

		const lightFollow = Math.min(1, dt * 3);
		pointerLight.position.x +=
			(pointerX * 3 - pointerLight.position.x) * lightFollow;
		pointerLight.position.y +=
			(pointerY * 2 - pointerLight.position.y) * lightFollow;
		pointerLight.position.z = -3;
		const lightTarget = pointerActive && !reducedMotion ? 3 : 0;
		pointerLight.intensity +=
			(lightTarget - pointerLight.intensity) * lightFollow;
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
		environment = createStudioEnvironment(renderer);
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
			stationTiles.dispose();
			hubTiles.dispose();
			coreGeometry.dispose();
			coreMaterial.dispose();
			for (const ring of stationRings) ring.dispose();
			hubRing.dispose();
			bot.dispose();
			warp.dispose();
			dust.dispose();
			aurora.dispose();
			post.dispose();
			environment.dispose();
			renderer.dispose();
		},
	};
}
