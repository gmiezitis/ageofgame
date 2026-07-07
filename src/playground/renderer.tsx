import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
    Bug,
    Crosshair,
    Flame,
    Hand,
    Hammer as HammerIcon,
    Image as ImageIcon,
    RotateCcw,
    Save,
    Skull,
    Volume2,
    VolumeX,
    Waves,
    X,
    Zap,
} from "lucide-react";
import type { ScreenPlaygroundInitPayload, ScreenPlaygroundSource } from "./preload";
import "./types";
import dragonFireballSheetSrc from "../assets/playground/dragon-fireball-sheet.png";
import dragonEmberParticleSheetSrc from "../assets/playground/dragon-ember-particle-sheet.png";
import dragonHeadSheetSrc from "../assets/playground/dragon-head-sheet.png";
import dragonImpactFlameSheetSrc from "../assets/playground/dragon-impact-flame-sheet.png";
import glassArrowCrackSrc from "../assets/playground/glass-arrow-crack.png";
import laserHiltSrc from "../assets/playground/laser-hilt.png";
import realisticBurnScorchSrc from "../assets/playground/realistic-burn-scorch.png";
import realisticHammerSrc from "../assets/playground/realistic-hammer-reference.png";
import hammerPigletRunSheetSrc from "../assets/playground/hammer-piglet-run-sheet.png";
import realisticSkeletonSrc from "../assets/playground/realistic-skeleton-walk-sheet.png";
import realisticSpiderSrc from "../assets/playground/realistic-spider-reference.png";
import realisticTickSrc from "../assets/playground/realistic-tick.png";
import mackerelFishSheetSrc from "../assets/playground/mackerel-fish-sheet.png";
import slingerEggSheetSrc from "../assets/playground/slinger-egg-sheet.png";
import slingerFrameSrc from "../assets/playground/slinger-frame.png";
import slingerStrawberrySheetSrc from "../assets/playground/slinger-strawberry-sheet.png";
import slingerTomatoSheetSrc from "../assets/playground/slinger-tomato-sheet.png";
import slingerWatermelonSheetSrc from "../assets/playground/slinger-watermelon-sheet.png";
import splashPressurePistolSrc from "../assets/playground/splash-pressure-pistol.png";
import splashTopCraneSrc from "../assets/playground/splash-top-crane.png";
import splashWaterVideoSrc from "../assets/playground/splash-water.mp4";
import customArrowSrc from "../assets/playground/custom-arrow-reference.png";
import tickEatenTraceSrc from "../assets/playground/tick-eaten-trace.png";
import {
    createCreature,
    createImpact,
    createParticlesForTool,
    drawImpact,
    drawParticle,
    Creature,
    Impact,
    Particle,
    PlaygroundToolId,
    stepCreaturesMutable,
    stepParticlesMutable,
} from "./engine";
import { playDragonFlameReleaseSound, playDragonHeatSelectSound, playToolSound } from "./sound";
import { SkeletonController } from "./SkeletonController";

const TOOLS: Array<{ id: PlaygroundToolId; label: string; detail: string; hotkey: string; cursor: string; icon: React.ReactNode }> = [
    { id: "hammer", label: "Hammer", detail: "Simple strike", hotkey: "1", cursor: "", icon: <HammerIcon size={14} strokeWidth={2.4} /> },
    { id: "burn", label: "Heat", detail: "Scorch marks", hotkey: "2", cursor: "FX", icon: <Flame size={14} strokeWidth={2.4} /> },
    { id: "scatter", label: "Shot", detail: "Arrow shot", hotkey: "3", cursor: "", icon: <Crosshair size={14} strokeWidth={2.4} /> },
    { id: "glyph", label: "Ticks", detail: "Screen-eating swarm", hotkey: "4", cursor: "", icon: <Bug size={14} strokeWidth={2.4} /> },
    { id: "skeleton", label: "Bones", detail: "Walking skeleton", hotkey: "5", cursor: "SK", icon: <Skull size={14} strokeWidth={2.4} /> },
    { id: "spider", label: "Spider", detail: "Shadow crawler", hotkey: "s", cursor: "SP", icon: <Bug size={14} strokeWidth={2.4} /> },
    { id: "laser", label: "Laser", detail: "Neon beam", hotkey: "6", cursor: "LZ", icon: <Zap size={14} strokeWidth={2.4} /> },
    { id: "throw", label: "Slinger", detail: "Drag back farther for more power", hotkey: "7", cursor: "", icon: <Hand size={14} strokeWidth={2.4} /> },
    { id: "splash", label: "Splash", detail: "Pressure sprayer", hotkey: "8", cursor: "", icon: <Waves size={14} strokeWidth={2.4} /> },
];

import {
    closeAlphaMask,
    traceRoundRect,
    drawReferenceSpider,
    drawSpider,
    drawSpiderWeb,
    drawSpiderLiftLine,
    drawChromaImage,
    drawFishSpriteFrame,
    drawHammerPiglet,
    drawSplashVideoFrame,
    drawGlassPunctureDot,
    drawImpactGlassDepression,
    drawSlingerFoodFrame,
    drawSlingerFoodObject,
    drawFoodObject,
    drawTomatoGlassCracks,
    drawTomatoSlice,
    drawTomatoSplat,
    drawWatermelonRindChunks,
    drawWatermelonFlesh,
    drawWatermelonSplat,
    drawSplatShape,
    drawFruitSplat,
    drawFruitProjectile,
    drawSlingerFrameSprite,
    drawSlinger,
    drawSlingerSafely,
    drawDragonHeadFrame,
    drawDragonHeadSequence,
    drawIdleDragonHead,
    drawDragonBreath,
    drawLiveFlame,
    drawPlaygroundParticle,
    drawBurnResidue,
    drawSkeletonShard,
    drawDetailedArrow,
    drawLiveArrow,
    drawScreenTick,
    drawDyingSpider,
    drawLaserDrillBurst,
    drawSplashSpray,
    drawSplashFlood,
    drawSplashAimMarker,
    drawScreenHitPulse,
    drawSplashRig,
    getChromaKeyedCanvas,
    getFishSheetCanvas,
    getSplashCraneLayout,
    getSplashPistolPose,
    getCanvasPoint,
    getBackgroundDrawRect,
    getHammerTopLeftForContact,
    getSlingerFoodSheet,
    getSlingerFoodTimeline,
    getSlingerSplatFrame,
    getSlingerShot,
    getDockedDragonLayout,
    getCleanDragonHeadFrame,
    getDragonSilhouette,
    easeOutCubic,
    
    // Types
    ThrowFoodId,
    FruitProfile,
    PlaygroundSpriteKey,
    PlaygroundSprites,
    SplashState,
    SplashRigState,
    ActiveWeb,
    ActiveSpiderLift,
    FruitSplat,
    FruitProjectile,
    SlingerState,
    ActiveFlame,
    ActiveDragonBreath,
    DragonHeadLayout,
    ActiveBurnResidue,
    ActiveWaterFish,
    ActiveHammerPiglet,
    ScreenHitPulse,
    ActiveArrow,
    ScreenTick,
    SkeletonShard,
    ActiveLaserDrill,
    ActiveSplashSpray,
    DyingSkeleton,
    DyingSpider,

    // Constants
    SPLASH_FISH_MIN_WATER_LEVEL,
    SPLASH_FISH_SHEET_COLS,
    SPLASH_FISH_SHEET_ROWS,
    SPLASH_FISH_FRAME_SEQUENCE,
    SPLASH_FISH_FRAME_CROP_X,
    SPLASH_FISH_FRAME_CROP_Y,
    HAMMER_PIGLET_SHEET_COLS,
    HAMMER_PIGLET_SHEET_ROWS,
    HAMMER_PIGLET_RUN_FRAMES,
    HAMMER_PIGLET_LOOK_FRAMES,
    HAMMER_PIGLET_FRAME_CROPS,
    SLINGER_MAX_PULL,
    SLINGER_MIN_PULL_TO_LAUNCH,
    SLINGER_POWER_DEADZONE,
    SLINGER_SPRITE_SPLAT_LIFE_MULTIPLIER,
    HAMMER_CURSOR_WIDTH,
    HAMMER_CURSOR_HEIGHT,
    HAMMER_HEAD_CONTACT_X,
    HAMMER_HEAD_CONTACT_Y,
    HAMMER_HAND_PIVOT_X,
    HAMMER_HAND_PIVOT_Y,
    HAMMER_TARGET_OFFSET_X,
    HAMMER_TARGET_OFFSET_Y,
    HAMMER_IDLE_ROTATION,
    HAMMER_WINDUP_ROTATION,
    HAMMER_IMPACT_ROTATION,
    HAMMER_CONTACT_ROTATION,
    HAMMER_SWING_MS,
    HAMMER_WINDUP_T,
    HAMMER_IMPACT_T,
    HAMMER_CONTACT_PROGRESS,
    HAMMER_CONTACT_T,
    HAMMER_IMPACT_DELAY_MS,
    HEAVY_HAMMER_SWING_MS,
    HEAVY_HAMMER_IMPACT_DELAY_MS,
    HEAVY_HAMMER_IMPACT_SCALE,
    SLINGER_PROJECTILE_DEPTH,
    SLINGER_GRAVITY,
    TOMATO_CONTACT_MS,
    TOMATO_BURST_MS,
    TOMATO_SETTLE_MS,
    WATERMELON_CONTACT_MS,
    WATERMELON_BURST_MS,
    WATERMELON_SETTLE_MS,
    DRAGON_MOUTH_X,
    DRAGON_MOUTH_Y,
    DRAGON_DOCK_VISIBLE_RATIO,
    DRAGON_SHEET_FRAMES,
    DRAGON_BREATH_FLAME_SHEET_FRAMES,
    DRAGON_IMPACT_FLAME_SHEET_FRAMES,
    EMBER_PARTICLE_SHEET_FRAMES,
    DRAGON_FRAME_ASPECT,
    DRAGON_RENDER_DPR_CAP,
    SPLASH_EMIT_MS,
    SPLASH_FAUCET_EMIT_MS,
    SPLASH_HOLD_ARM_MS,
    SPLASH_OVERFLOW_AFTER_MS,
    SPLASH_PISTOL_OFFSET_X,
    SPLASH_PISTOL_OFFSET_Y,
    SPLASH_PISTOL_NOZZLE_X,
    SPLASH_PISTOL_NOZZLE_Y,
    SPLASH_PISTOL_HOSE_X,
    SPLASH_PISTOL_HOSE_Y,
    TICK_TRACE_STAMP_MS,
    TICK_SPRITE_FORWARD_ANGLE,
    ARROW_FLIGHT_MS,
    ARROW_IMPACT_MS,
    ARROW_FADE_MS,
    ARROW_LIFE_MS,
    HEAVY_ARROW_LIFE_MS,
    HEAVY_ARROW_IMPACT_SCALE,
    THROW_FOODS,
    flameNoise,
    foodStyle,
    clampSlingerPull,
    clampValue,
    drawJaggedShape,
    smoothStep,
    luminance,
    saturation,
    colorDistance,
    updateWaterFish,
    createWaterFish,
    updateHammerPiglet,
    scheduleNextHammerPigletSpawn,
    createHammerPiglet,
    createFruitBurstParticles,
    createSkeletonShards,
    createDragonBreath,
} from "./drawingHelpers";

const MAX_ACTIVE_ARROWS = 24;

const easeInCubic = (value: number) => value ** 3;

const MAX_IMPACTS = 96;
const MAX_PARTICLES = 48;
const MAX_ENTITIES = 40;
const MAX_LETTER_KNOCK_QUEUE = 6;
const TICKS_PER_CLICK = 5;
const MAX_SCREEN_TICKS = 60;
const TICK_LIFE_MS = 16000;
const RENDER_DPR_CAP = 1;
const IMPACT_COUNT_UPDATE_MS = 90;
const MIN_DRAG_IMPACT_DISTANCE = 30;
const MIN_DRAG_IMPACT_MS = 60;
const LASER_HOLD_CUT_MS = 22;
const LASER_TIP_RESISTANCE = 0.085;
const LASER_ANGLE_FOLLOW = 0.18;
const LASER_FRESH_GLOW_MS = 3000;
const LASER_DRILL_MS = 620;
const LASER_CURSOR_IDLE_LENGTH = 258;
const LASER_CURSOR_HOLD_GROW = 126;
const LASER_CURSOR_DRILL_GROW = 48;
const SPLASH_RESET_MIN_MS = 110;
const SPLASH_RESET_MIN_DISTANCE = 34;
const SPLASH_RESET_MIN_ANGLE = 0.18;
const SPLASH_FLOOD_DRAIN_PER_MS = 0.000014;
const SPLASH_FLOOD_FILL_PER_MS = 0.000052;
const SPLASH_FISH_MAX = 7;
const SPLASH_FISH_SPAWN_MS = 820;
const HAMMER_PIGLET_MIN_SPAWN_MS = 14000;
const HAMMER_PIGLET_MAX_SPAWN_MS = 26000;
const HAMMER_PIGLET_MAX_ACTIVE = 1;

type AddImpactOptions = {
    commitHammerImpact?: boolean;
    heavyHammer?: boolean;
    heavyArrow?: boolean;
    hugeFireball?: boolean;
    impactScale?: number;
    skipSuppress?: boolean;
    toolOverride?: PlaygroundToolId;
};

type PendingScreenExtraction = {
    x: number;
    y: number;
    radius: number;
    patchBackground: boolean;
    spawnEntity: boolean;
    initVx?: number;
    initVy?: number;
    shakeLife?: number;
    detailOnly?: boolean;
    dueAt: number;
};

type IdleDeadlineLike = {
    didTimeout: boolean;
    timeRemaining: () => number;
};

type HammerExtractionSchedule = {
    id: number;
    type: "idle" | "timeout";
};

type HammerExtractionWindow = Window & {
    requestIdleCallback?: (callback: (deadline: IdleDeadlineLike) => void, options?: { timeout?: number }) => number;
    cancelIdleCallback?: (id: number) => void;
};

const createSplashState = (): SplashState => ({
    active: false,
    pointerId: null,
    startX: -999,
    startY: -999,
    x: -999,
    y: -999,
    lastX: -999,
    lastY: -999,
    angle: 0,
    startedAt: 0,
    lastEmitAt: 0,
    pressure: 0,
});

const createSplashRigState = (): SplashRigState => ({
    hoseConnected: true,
    faucetOn: false,
    waterLevel: 0,
    lastLeakAt: 0,
});

const MAX_PENDING_HAMMER_IMPACTS = 2;
const HAMMER_EXTRACTION_MIN_DELAY_MS = 34;
const HAMMER_EXTRACTION_IDLE_TIMEOUT_MS = 180;
const HAMMER_EXTRACTION_MIN_IDLE_MS = 9;
const SCREEN_CRACK_PULSE_MS = 760;
const MAX_SCREEN_CRACK_PULSES = 10;


type ScreenEntity = {
    id: string;
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
    rotation: number;
    spin: number;
    life: number;
    maxLife: number;
    gravity?: number;
    grabbedUntil?: number;
    grabAnchorX?: number;
    grabAnchorY?: number;
    shakeLife?: number;
    laserBurnStartedAt?: number;
    laserBurnLife?: number;
    originalX?: number;
    originalY?: number;
    bounces?: number;
};

type ScreenCrackPulse = {
    id: string;
    x: number;
    y: number;
    radius: number;
    rotation: number;
    createdAt: number;
    life: number;
    heavy: boolean;
    tool: "hammer" | "scatter";
};

type LaserCutState = {
    active: boolean;
    pointerId: number | null;
    holdStartAt: number;
    targetX: number;
    targetY: number;
    tipX: number;
    tipY: number;
    lastTipX: number;
    lastTipY: number;
    lastEmitAt: number;
    lastShardAt: number;
    angle: number;
    initialized: boolean;
};

type LaserTrailSegment = {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    angle: number;
    width: number;
    createdAt: number;
    life: number;
};

type LaserSpark = {
    id: string;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    vx: number;
    vy: number;
    width: number;
    createdAt: number;
    life: number;
    bounces: number;
};

const createLaserCutState = (): LaserCutState => ({
    active: false,
    pointerId: null,
    holdStartAt: 0,
    targetX: -999,
    targetY: -999,
    tipX: -999,
    tipY: -999,
    lastTipX: -999,
    lastTipY: -999,
    lastEmitAt: 0,
    lastShardAt: 0,
    angle: -0.62,
    initialized: false,
});

const createSlingerState = (): SlingerState => ({
    active: false,
    pointerId: null,
    anchorX: -999,
    anchorY: -999,
    pullX: -999,
    pullY: -999,
    targetPullX: -999,
    targetPullY: -999,
    chargeStartAt: 0,
    seed: 0,
});

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

const loadVideo = (src: string): Promise<HTMLVideoElement> => new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => resolve(video);
    video.onerror = reject;
    video.src = src;
    video.load();
});

const appendCapped = <T,>(target: T[], items: T[], cap: number): T[] => {
    if (items.length === 0) return target;
    if (items.length >= cap) {
        target.length = 0;
        target.push(...items.slice(items.length - cap));
        return target;
    }
    const overflow = target.length + items.length - cap;
    if (overflow > 0) target.splice(0, overflow);
    target.push(...items);
    return target;
};

const ScreenPlayground: React.FC = () => {
    const [payload, setPayload] = useState<ScreenPlaygroundInitPayload | null>(null);
    const [tool, setTool] = useState<PlaygroundToolId>("hammer");
    const [muted, setMuted] = useState(false);
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
    const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
    const [throwFood, setThrowFood] = useState<ThrowFoodId>("tomato");
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [impactCount, setImpactCount] = useState(0);
    const [confirmQuitOpen, setConfirmQuitOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const hammerAimRef = useRef<HTMLDivElement | null>(null);
    const backgroundImageRef = useRef<HTMLImageElement | null>(null);
    const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const workingContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const effectsCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const effectsContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const impactsRef = useRef<Impact[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const creaturesRef = useRef<Creature[]>([]);
    const entitiesRef = useRef<ScreenEntity[]>([]);
    const dragonBreathsRef = useRef<ActiveDragonBreath[]>([]);
    const activeFlamesRef = useRef<ActiveFlame[]>([]);
    const burnResiduesRef = useRef<ActiveBurnResidue[]>([]);
    const splashSpraysRef = useRef<ActiveSplashSpray[]>([]);
    const activeWaterFishRef = useRef<ActiveWaterFish[]>([]);
    const lastWaterFishSpawnRef = useRef(0);
    const lastSplashResetRef = useRef({ x: -999, y: -999, angle: 0, at: 0 });
    const activeHammerPigletsRef = useRef<ActiveHammerPiglet[]>([]);
    const nextHammerPigletSpawnAtRef = useRef(0);
    const screenHitPulsesRef = useRef<ScreenHitPulse[]>([]);
    const activeArrowsRef = useRef<ActiveArrow[]>([]);
    const activeTicksRef = useRef<ScreenTick[]>([]);
    const activeWebsRef = useRef<ActiveWeb[]>([]);
    const activeSpiderLiftsRef = useRef<ActiveSpiderLift[]>([]);
    const spiderLiftCooldownsRef = useRef<Map<string, number>>(new Map());
    const skeletonShardsRef = useRef<SkeletonShard[]>([]);
    const dyingSkeletonsRef = useRef<DyingSkeleton[]>([]);
    const dyingSpidersRef = useRef<DyingSpider[]>([]);
    const fruitProjectilesRef = useRef<FruitProjectile[]>([]);
    const fruitSplatsRef = useRef<FruitSplat[]>([]);
    const laserTrailRef = useRef<LaserTrailSegment[]>([]);
    const laserSparksRef = useRef<LaserSpark[]>([]);
    const laserDrillsRef = useRef<ActiveLaserDrill[]>([]);
    const laserDrillCursorRef = useRef<ActiveLaserDrill | null>(null);
    const rafRef = useRef<number | null>(null);
    const animationClockRef = useRef(performance.now());
    const toolRef = useRef(tool);
    const throwFoodRef = useRef(throwFood);
    const mutedRef = useRef(muted);
    const pointerRef = useRef({ x: -999, y: -999, smoothX: -999, smoothY: -999 });
    const imageCacheRef = useRef<{ data: ImageData; cropX: number; cropY: number; timestamp: number } | null>(null);
    const lastDragImpactRef = useRef({ x: -999, y: -999, at: 0 });
    const lastImpactRef = useRef({ x: -999, y: -999, at: 0, tool: "hammer" as PlaygroundToolId });
    const lastLaserCutRef = useRef({ x: -999, y: -999, angle: -0.62 });
    const lastLetterKnockRef = useRef({ splash: 0, hammer: 0, scatter: 0, laser: 0 });
    const lastSoundAtRef = useRef(0);
    const lastLaserSoundAtRef = useRef(0);
    const lastDragonHeatSoundAtRef = useRef(0);
    const lastImpactCountUpdateRef = useRef(0);
    const impactCountRef = useRef(0);
    const impactCountFlushRef = useRef<number | null>(null);
    const screenShakeRef = useRef({ intensity: 0 });
    const hammerSwingRef = useRef(0);
    const heavyHammerSwingRef = useRef({ active: false, startedAt: 0, x: -999, y: -999 });
    const hammerImpactTimeoutsRef = useRef<number[]>([]);
    const hammerExtractionQueueRef = useRef<PendingScreenExtraction[]>([]);
    const hammerExtractionScheduleRef = useRef<HammerExtractionSchedule | null>(null);
    const slingerRef = useRef<SlingerState>(createSlingerState());
    const laserCutRef = useRef<LaserCutState>(createLaserCutState());
    const splashRef = useRef<SplashState>(createSplashState());
    const splashRigRef = useRef<SplashRigState>(createSplashRigState());
    const laserFragmentActionRef = useRef<((x: number, y: number, angle: number, travel: number) => void) | null>(null);
    const laserContactActionRef = useRef<((x: number, y: number, angle: number, travel: number) => void) | null>(null);
    const applySplashPressureRef = useRef<((x: number, y: number, angle: number, pressure?: number) => string | undefined) | null>(null);
    const stampBurnScorchRef = useRef<((flame: ActiveFlame) => void) | null>(null);
    const skeletonControllersRef = useRef<Map<string, SkeletonController>>(new Map());
    const spritesRef = useRef<PlaygroundSprites>({});
    const splashVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => { toolRef.current = tool; }, [tool]);
    useEffect(() => { throwFoodRef.current = throwFood; }, [throwFood]);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    const queueImpactCount = useCallback((nextValue: number | ((count: number) => number)) => {
        const next = typeof nextValue === "function"
            ? (nextValue as (count: number) => number)(impactCountRef.current)
            : nextValue;
        impactCountRef.current = next;
        if (impactCountFlushRef.current !== null) return;
        impactCountFlushRef.current = window.requestAnimationFrame(() => {
            impactCountFlushRef.current = null;
            setImpactCount(impactCountRef.current);
        });
    }, []);

    const setImpactCountImmediate = useCallback((next: number) => {
        if (impactCountFlushRef.current !== null) {
            window.cancelAnimationFrame(impactCountFlushRef.current);
            impactCountFlushRef.current = null;
        }
        impactCountRef.current = next;
        setImpactCount(next);
    }, []);

    const clearPendingHammerImpacts = useCallback(() => {
        hammerImpactTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        hammerImpactTimeoutsRef.current = [];
    }, []);

    const clearPendingHammerShockwaves = useCallback(() => {
        hammerExtractionQueueRef.current = [];
        const schedule = hammerExtractionScheduleRef.current;
        if (schedule) {
            const idleWindow = window as HammerExtractionWindow;
            if (schedule.type === "idle") {
                idleWindow.cancelIdleCallback?.(schedule.id);
            } else {
                window.clearTimeout(schedule.id);
            }
            hammerExtractionScheduleRef.current = null;
        }
    }, []);

    const trackHammerImpactTimeout = useCallback((timeoutId: number) => {
        hammerImpactTimeoutsRef.current = [
            ...hammerImpactTimeoutsRef.current,
            timeoutId,
        ];
        while (hammerImpactTimeoutsRef.current.length > MAX_PENDING_HAMMER_IMPACTS) {
            const staleTimeoutId = hammerImpactTimeoutsRef.current.shift();
            if (staleTimeoutId !== undefined) window.clearTimeout(staleTimeoutId);
        }
    }, []);

    const addScreenHitPulse = useCallback((x: number, y: number, angle: number, source: ScreenHitPulse["source"]) => {
        const now = performance.now();
        screenHitPulsesRef.current = [
            ...screenHitPulsesRef.current.slice(-22),
            {
                id: `hit-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                x,
                y,
                angle,
                source,
                createdAt: now,
                life: source === "splash" ? 420 : 330,
            },
        ];
    }, []);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            loadImage(customArrowSrc).then((image) => ["arrow", image] as const),
            loadImage(realisticBurnScorchSrc).then((image) => ["burnScorch", image] as const),
            loadImage(dragonHeadSheetSrc).then((image) => ["dragon", image] as const),
            loadImage(dragonEmberParticleSheetSrc).then((image) => ["emberParticle", image] as const),
            loadImage(dragonFireballSheetSrc).then((image) => ["flame", image] as const),
            loadImage(glassArrowCrackSrc).then((image) => ["glassCrack", image] as const),
            loadImage(dragonImpactFlameSheetSrc).then((image) => ["impactFlame", image] as const),
            loadImage(realisticHammerSrc).then((image) => ["hammer", image] as const),
            loadImage(hammerPigletRunSheetSrc).then((image) => ["pigletRunSheet", image] as const),
            loadImage(realisticSkeletonSrc).then((image) => ["skeleton", image] as const),
            loadImage(realisticSpiderSrc).then((image) => ["spider", image] as const),
            loadImage(realisticTickSrc).then((image) => ["tick", image] as const),
            loadImage(tickEatenTraceSrc).then((image) => ["tickTrace", image] as const),
            loadImage(mackerelFishSheetSrc).then((image) => ["fishSheet", image] as const),
            loadImage(splashPressurePistolSrc).then((image) => ["splashPistol", image] as const),
            loadImage(splashTopCraneSrc).then((image) => ["splashCrane", image] as const),
            loadImage(slingerEggSheetSrc).then((image) => ["eggSheet", image] as const),
            loadImage(slingerFrameSrc).then((image) => ["slingerFrame", image] as const),
            loadImage(slingerStrawberrySheetSrc).then((image) => ["strawberrySheet", image] as const),
            loadImage(slingerTomatoSheetSrc).then((image) => ["tomatoSheet", image] as const),
            loadImage(slingerWatermelonSheetSrc).then((image) => ["watermelonSheet", image] as const),
        ])
        .then((entries) => {
            if (cancelled) return;
            spritesRef.current = Object.fromEntries(entries) as PlaygroundSprites;
        })
            .catch((error) => console.error("[ScreenPlayground] Failed to load reference object sprites", error));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        loadVideo(splashWaterVideoSrc)
            .then((video) => {
                if (cancelled) return;
                splashVideoRef.current = video;
                void video.play().catch((): void => undefined);
            })
            .catch((error) => console.error("[ScreenPlayground] Failed to load splash video", error));
        return () => {
            cancelled = true;
            const video = splashVideoRef.current;
            if (video) {
                video.pause();
                splashVideoRef.current = null;
            }
        };
    }, []);

    const restoreDefaultCreatures = useCallback((_width: number, _height: number) => {
        creaturesRef.current = [];
        dyingSkeletonsRef.current = [];
        skeletonControllersRef.current.clear();
    }, []);

    const prepareWorkingCanvas = useCallback((image: HTMLImageElement) => {
        const workingCanvas = document.createElement("canvas");
        workingCanvas.width = image.naturalWidth || image.width;
        workingCanvas.height = image.naturalHeight || image.height;
        const workingCtx = workingCanvas.getContext("2d", { willReadFrequently: true });
        workingCtx?.drawImage(image, 0, 0, workingCanvas.width, workingCanvas.height);
        workingCanvasRef.current = workingCanvas;
        workingContextRef.current = workingCtx;
    }, []);

    const loadSourceImage = useCallback((source: Pick<ScreenPlaygroundSource, "dataUrl">) => {
        loadImage(source.dataUrl)
            .then((image) => {
                backgroundImageRef.current = image;
                prepareWorkingCanvas(image);
            })
            .catch((error) => console.error("[ScreenPlayground] Failed to load screenshot", error));
    }, [prepareWorkingCanvas]);

    const getEffectsContext = useCallback((width: number, height: number, dpr: number) => {
        let effectsCanvas = effectsCanvasRef.current;
        if (!effectsCanvas) {
            effectsCanvas = document.createElement("canvas");
            effectsCanvasRef.current = effectsCanvas;
            effectsContextRef.current = null;
        }

        const targetWidth = Math.max(1, Math.round(width * dpr));
        const targetHeight = Math.max(1, Math.round(height * dpr));
        const resized = effectsCanvas.width !== targetWidth || effectsCanvas.height !== targetHeight;
        if (resized) {
            effectsCanvas.width = targetWidth;
            effectsCanvas.height = targetHeight;
        }

        const effectsCtx = effectsContextRef.current ?? effectsCanvas.getContext("2d");
        if (!effectsCtx) return null;
        effectsContextRef.current = effectsCtx;

        effectsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (resized && impactsRef.current.length > 0) {
            effectsCtx.clearRect(0, 0, width, height);
            impactsRef.current.forEach((impact) => drawImpact(effectsCtx, impact));
        }

        return effectsCtx;
    }, []);

    const clearEffects = useCallback(() => {
        const effectsCanvas = effectsCanvasRef.current;
        const effectsCtx = effectsContextRef.current ?? effectsCanvas?.getContext("2d");
        if (!effectsCanvas || !effectsCtx) return;
        effectsContextRef.current = effectsCtx;
        effectsCtx.setTransform(1, 0, 0, 1, 0, 0);
        effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    }, []);

    const cacheImpact = useCallback((impact: Impact) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const dragonVisible = toolRef.current === "burn" || dragonBreathsRef.current.length > 0;
        const dpr = Math.min(dragonVisible ? DRAGON_RENDER_DPR_CAP : RENDER_DPR_CAP, window.devicePixelRatio || 1);
        const effectsCtx = getEffectsContext(width, height, dpr);
        if (!effectsCtx) return;

        drawImpact(effectsCtx, impact);
    }, [getEffectsContext]);

    const spawnScreenTicks = useCallback((x: number, y: number) => {
        const now = performance.now();
        const nextTicks: ScreenTick[] = [];
        for (let index = 0; index < TICKS_PER_CLICK; index += 1) {
            const seed = Math.floor(now * 31 + x * 17 + y * 13 + index * 997);
            const angle = (Math.PI * 2 * index) / TICKS_PER_CLICK + (flameNoise(seed, 1.1) - 0.5) * 1.18;
            const distance = 6 + flameNoise(seed, 2.4) * 22;
            const speed = 0.38 + flameNoise(seed, 3.7) * 0.34;
            const spawnX = x + Math.cos(angle) * distance;
            const spawnY = y + Math.sin(angle) * distance;
            nextTicks.push({
                id: `tick-${seed.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                x: spawnX,
                y: spawnY,
                prevX: spawnX,
                prevY: spawnY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                angle,
                size: 7.4 + flameNoise(seed, 4.2) * 3.6,
                seed,
                createdAt: now,
                life: TICK_LIFE_MS + flameNoise(seed, 5.6) * 4200,
                nextTurnAt: now + 260 + flameNoise(seed, 6.8) * 740,
                lastTraceAt: now - TICK_TRACE_STAMP_MS + flameNoise(seed, 7.4) * 120,
            });
        }
        activeTicksRef.current = [
            ...activeTicksRef.current.slice(-(MAX_SCREEN_TICKS - TICKS_PER_CLICK)),
            ...nextTicks,
        ];
    }, []);

    const stampTickBite = useCallback((tick: ScreenTick, traceSprite?: HTMLImageElement, withTraceDecal = false) => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (tick.x - rect.x) / rect.scale;
        const imageY = (tick.y - rect.y) / rect.scale;
        const prevImageX = (tick.prevX - rect.x) / rect.scale;
        const prevImageY = (tick.prevY - rect.y) / rect.scale;
        if (
            imageX < -20 || imageY < -20 || imageX > workingCanvas.width + 20 || imageY > workingCanvas.height + 20
            || prevImageX < -32 || prevImageY < -32 || prevImageX > workingCanvas.width + 32 || prevImageY > workingCanvas.height + 32
        ) {
            return;
        }

        const size = tick.size / rect.scale;
        const forwardX = Math.cos(tick.angle);
        const forwardY = Math.sin(tick.angle);
        const sideX = Math.cos(tick.angle + Math.PI / 2);
        const sideY = Math.sin(tick.angle + Math.PI / 2);
        const biteX = imageX + forwardX * size * 0.62;
        const biteY = imageY + forwardY * size * 0.62;

        workingCtx.save();
        workingCtx.lineCap = "round";
        workingCtx.lineJoin = "round";
        workingCtx.globalCompositeOperation = "multiply";
        const traceWidth = Math.max(3.2, size * 0.82);
        workingCtx.strokeStyle = "rgba(0,0,0,0.9)";
        workingCtx.lineWidth = traceWidth;
        workingCtx.beginPath();
        workingCtx.moveTo(prevImageX, prevImageY);
        workingCtx.quadraticCurveTo(
            (prevImageX + imageX) * 0.5 + sideX * size * 0.18,
            (prevImageY + imageY) * 0.5 + sideY * size * 0.18,
            imageX,
            imageY,
        );
        workingCtx.stroke();

        workingCtx.globalCompositeOperation = "source-over";
        if (withTraceDecal && traceSprite?.complete && traceSprite.naturalWidth > 0) {
            const decalWidth = size * (7.8 + flameNoise(tick.seed, tick.x * 0.006) * 2.4);
            const decalHeight = decalWidth * (traceSprite.naturalHeight / traceSprite.naturalWidth);
            workingCtx.save();
            workingCtx.translate((prevImageX + imageX) * 0.5, (prevImageY + imageY) * 0.5);
            workingCtx.rotate(tick.angle + (flameNoise(tick.seed, tick.y * 0.007) - 0.5) * 0.28);
            workingCtx.globalAlpha = 0.82;
            workingCtx.drawImage(traceSprite, -decalWidth / 2, -decalHeight / 2, decalWidth, decalHeight);
            workingCtx.restore();
        }

        workingCtx.fillStyle = "rgba(0,0,0,0.96)";
        workingCtx.beginPath();
        workingCtx.ellipse(biteX, biteY, size * 0.56, size * 0.38, tick.angle, 0, Math.PI * 2);
        workingCtx.fill();

        workingCtx.fillStyle = "rgba(3,7,18,0.82)";
        for (let notch = 0; notch < 3; notch += 1) {
            const notchAngle = tick.angle + (notch - 1) * 0.72 + (flameNoise(tick.seed, notch + tick.x * 0.01) - 0.5) * 0.32;
            const notchDistance = size * (0.28 + notch * 0.13);
            workingCtx.beginPath();
            workingCtx.arc(
                biteX + Math.cos(notchAngle) * notchDistance,
                biteY + Math.sin(notchAngle) * notchDistance,
                size * (0.18 + notch * 0.035),
                0,
                Math.PI * 2,
            );
            workingCtx.fill();
        }

        workingCtx.globalCompositeOperation = "screen";
        workingCtx.strokeStyle = "rgba(255,255,255,0.09)";
        workingCtx.lineWidth = Math.max(0.5, size * 0.08);
        workingCtx.beginPath();
        workingCtx.ellipse(biteX - sideX * size * 0.1, biteY - sideY * size * 0.1, size * 0.68, size * 0.42, tick.angle, 0, Math.PI * 2);
        workingCtx.stroke();
        workingCtx.restore();
    }, []);

    const stampLaserSeam = useCallback((segment: LaserTrailSegment) => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const startX = (segment.startX - rect.x) / rect.scale;
        const startY = (segment.startY - rect.y) / rect.scale;
        const endX = (segment.endX - rect.x) / rect.scale;
        const endY = (segment.endY - rect.y) / rect.scale;
        if (
            endX < 0 || endY < 0 || endX >= workingCanvas.width || endY >= workingCanvas.height
            || startX < -64 || startY < -64 || startX > workingCanvas.width + 64 || startY > workingCanvas.height + 64
        ) {
            return;
        }

        const edgeX = Math.cos(segment.angle + Math.PI / 2);
        const edgeY = Math.sin(segment.angle + Math.PI / 2);
        const width = Math.max(1.4, segment.width / rect.scale);
        const controlX = (startX + endX) * 0.5 + edgeX * Math.min(10 / rect.scale, width * 0.28);
        const controlY = (startY + endY) * 0.5 + edgeY * Math.min(10 / rect.scale, width * 0.28);
        const tracePath = (ctx: CanvasRenderingContext2D, offset = 0) => {
            ctx.beginPath();
            ctx.moveTo(startX + edgeX * offset, startY + edgeY * offset);
            ctx.quadraticCurveTo(controlX + edgeX * offset, controlY + edgeY * offset, endX + edgeX * offset, endY + edgeY * offset);
        };

        workingCtx.save();
        workingCtx.lineCap = "round";
        workingCtx.lineJoin = "round";
        workingCtx.globalCompositeOperation = "multiply";
        workingCtx.strokeStyle = "rgba(0,0,0,0.92)";
        workingCtx.lineWidth = width * 1.22;
        tracePath(workingCtx);
        workingCtx.stroke();

        workingCtx.strokeStyle = "rgba(8,8,8,0.98)";
        workingCtx.lineWidth = Math.max(0.9, width * 0.48);
        tracePath(workingCtx);
        workingCtx.stroke();

        workingCtx.globalCompositeOperation = "source-over";
        workingCtx.strokeStyle = "rgba(20,20,20,0.62)";
        workingCtx.lineWidth = Math.max(0.6, width * 0.16);
        tracePath(workingCtx, width * 0.62);
        workingCtx.stroke();
        tracePath(workingCtx, -width * 0.62);
        workingCtx.stroke();
        workingCtx.restore();
    }, []);

    const stampLaserDrillImpact = useCallback((x: number, y: number, angle: number, seed: number) => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const impactX = (x - rect.x) / rect.scale;
        const impactY = (y - rect.y) / rect.scale;
        if (impactX < 0 || impactY < 0 || impactX >= workingCanvas.width || impactY >= workingCanvas.height) return;

        const radius = Math.max(14, 34 / rect.scale);
        workingCtx.save();
        workingCtx.translate(impactX, impactY);
        workingCtx.rotate(angle);
        workingCtx.lineCap = "round";
        workingCtx.lineJoin = "round";

        workingCtx.globalCompositeOperation = "multiply";
        const socket = workingCtx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.15);
        socket.addColorStop(0, "rgba(0,0,0,0.94)");
        socket.addColorStop(0.26, "rgba(4,4,5,0.78)");
        socket.addColorStop(0.58, "rgba(88,28,14,0.28)");
        socket.addColorStop(1, "rgba(0,0,0,0)");
        workingCtx.fillStyle = socket;
        workingCtx.beginPath();
        workingCtx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
        workingCtx.fill();

        workingCtx.strokeStyle = "rgba(0,0,0,0.86)";
        workingCtx.lineWidth = Math.max(1.1, radius * 0.08);
        for (let groove = 0; groove < 4; groove += 1) {
            workingCtx.beginPath();
            workingCtx.arc(0, 0, radius * (0.28 + groove * 0.18), seed * 0.02 + groove * 0.9, seed * 0.02 + groove * 0.9 + Math.PI * 1.32);
            workingCtx.stroke();
        }

        workingCtx.globalCompositeOperation = "screen";
        workingCtx.strokeStyle = "rgba(255,255,255,0.2)";
        workingCtx.lineWidth = Math.max(0.6, radius * 0.035);
        for (let glint = 0; glint < 7; glint += 1) {
            const theta = (Math.PI * 2 * glint) / 7 + flameNoise(seed + 71, glint) * 0.5;
            const inner = radius * (0.16 + flameNoise(seed + 83, glint) * 0.12);
            const outer = radius * (0.72 + flameNoise(seed + 97, glint) * 0.34);
            workingCtx.beginPath();
            workingCtx.moveTo(Math.cos(theta) * inner, Math.sin(theta) * inner);
            workingCtx.lineTo(Math.cos(theta) * outer, Math.sin(theta) * outer);
            workingCtx.stroke();
        }
        workingCtx.restore();
    }, []);

    const emitLaserSparks = useCallback((x: number, y: number, angle: number, now: number) => {
        const count = 5 + Math.floor(Math.random() * 6);
        const sparks: LaserSpark[] = [];
        for (let index = 0; index < count; index += 1) {
            const side = index % 2 === 0 ? 1 : -1;
            const theta = angle + side * (Math.PI / 2) + (Math.random() - 0.5) * 1.18;
            const speed = 0.22 + Math.random() * 0.58;
            sparks.push({
                id: `laser-spark-${now.toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
                x,
                y,
                prevX: x,
                prevY: y,
                vx: Math.cos(theta) * speed,
                vy: Math.sin(theta) * speed - (0.08 + Math.random() * 0.26),
                width: 0.9 + Math.random() * 1.6,
                createdAt: now,
                life: 500 + Math.random() * 1000,
                bounces: 0,
            });
        }
        laserSparksRef.current = [...laserSparksRef.current, ...sparks].slice(-60);
    }, []);

    const commitLaserTrail = useCallback((startX: number, startY: number, endX: number, endY: number, angle: number, now: number) => {
        const travel = Math.hypot(endX - startX, endY - startY);
        if (travel < 0.35) return;

        const segment: LaserTrailSegment = {
            id: `laser-trail-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            startX,
            startY,
            endX,
            endY,
            angle,
            width: Math.max(8, Math.min(18, 8 + travel * 0.18)),
            createdAt: now,
            life: 1850,
        };
        laserTrailRef.current = [...laserTrailRef.current, segment].slice(-72);
        stampLaserSeam(segment);
        emitLaserSparks(endX, endY, angle, now);
        laserContactActionRef.current?.(endX, endY, angle, travel);
        laserFragmentActionRef.current?.(endX, endY, angle, travel);
    }, [emitLaserSparks, stampLaserSeam]);

    const spawnFruitSplat = useCallback((projectile: FruitProjectile, now: number) => {
        const profile = foodStyle(projectile.food);
        const hitAngle = Math.atan2(projectile.vy, projectile.vx || 0.001);
        const radius = profile.radius * profile.splatScale * (0.9 + flameNoise(projectile.seed, 10.2) * 0.28);
        
        const depthScale = projectile.food === "tomato" ? 2.08 : 1.9;
        const initialDrawnRadius = projectile.radius * depthScale;
        const initialRotation = projectile.rotation * 0.1;

        fruitSplatsRef.current = [
            ...fruitSplatsRef.current.slice(-15),
            {
                id: `splat-${projectile.id}`,
                food: projectile.food,
                x: projectile.x,
                y: projectile.y,
                originY: projectile.y,
                radius,
                rotation: hitAngle + (flameNoise(projectile.seed, 21.7) - 0.5) * 0.95,
                scaleX: 0.86 + flameNoise(projectile.seed, 31.3) * 0.48,
                scaleY: 0.72 + flameNoise(projectile.seed, 41.9) * 0.36,
                slideSpeed: profile.slideSpeed[0] + flameNoise(projectile.seed, 52.5) * (profile.slideSpeed[1] - profile.slideSpeed[0]),
                seed: projectile.seed,
                createdAt: now,
                life: ((projectile.food === "watermelon" ? 5200 : 4200) + flameNoise(projectile.seed, 61.1) * 1200) * SLINGER_SPRITE_SPLAT_LIFE_MULTIPLIER,
                initialDrawnRadius,
                initialRotation,
            },
        ];

        // Spawn juicy and seed debris particles on impact
        const burstParticles = createFruitBurstParticles(projectile.food, projectile.x, projectile.y, hitAngle, projectile.seed);
        appendCapped(particlesRef.current, burstParticles, MAX_PARTICLES);

        queueImpactCount((count) => count + 1);
        if (!mutedRef.current && now - lastSoundAtRef.current > 42) {
            lastSoundAtRef.current = now;
            playToolSound("throw");
        }
    }, [queueImpactCount]);

    useEffect(() => {
        const cleanup = window.screenPlaygroundAPI?.onInit((nextPayload) => {
            setPayload(nextPayload);
            const initialSource = nextPayload.sources[0] ?? {
                id: "primary-screen",
                name: "Primary Screen",
                kind: "screen" as const,
                dataUrl: nextPayload.screenshotDataUrl,
            };
            setSelectedSourceId(initialSource.id);
            restoreDefaultCreatures(nextPayload.display.width, nextPayload.display.height);
            loadSourceImage(initialSource);
        });

        return () => cleanup?.();
    }, [loadSourceImage, restoreDefaultCreatures]);

    const drawFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let ctx = canvasContextRef.current;
        if (!ctx) {
            ctx = canvas.getContext("2d", { alpha: false });
            canvasContextRef.current = ctx;
        }
        if (!ctx) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const dpr = Math.min(RENDER_DPR_CAP, window.devicePixelRatio || 1);
        const targetWidth = Math.max(1, Math.round(width * dpr));
        const targetHeight = Math.max(1, Math.round(height * dpr));
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
        }

        ctx.save();
        ctx.scale(dpr, dpr);

        const shake = screenShakeRef.current;
        if (shake.intensity > 0.05) {
            const dx = (Math.random() - 0.5) * shake.intensity;
            const dy = (Math.random() - 0.5) * shake.intensity;
            ctx.translate(dx, dy);
        }

        ctx.clearRect(0, 0, width, height);
        const background = workingCanvasRef.current ?? backgroundImageRef.current;
        if (background) {
            const rect = getBackgroundDrawRect(width, height, background.width, background.height);
            ctx.drawImage(background, rect.x, rect.y, rect.width, rect.height);
        } else {
            ctx.fillStyle = "#05070d";
            ctx.fillRect(0, 0, width, height);
        }

        ctx.fillStyle = "rgba(2,6,23,0.06)";
        ctx.fillRect(0, 0, width, height);
        const effectsCtx = getEffectsContext(width, height, dpr);
        if (effectsCtx && effectsCanvasRef.current) {
            ctx.drawImage(effectsCanvasRef.current, 0, 0, width, height);
        }
        const now = performance.now();
        const deltaMs = Math.max(8, Math.min(40, now - animationClockRef.current || 16));
        const deltaScale = deltaMs / 16;
        animationClockRef.current = now;

        if (shake.intensity > 0) {
            shake.intensity = Math.max(0, shake.intensity - 0.88 * deltaScale);
        }
        const slinger = slingerRef.current;
        if (slinger.active) {
            const pullEase = 1 - Math.exp(-deltaMs / 34);
            slinger.pullX += ((Number.isFinite(slinger.targetPullX) ? slinger.targetPullX : slinger.pullX) - slinger.pullX) * pullEase;
            slinger.pullY += ((Number.isFinite(slinger.targetPullY) ? slinger.targetPullY : slinger.pullY) - slinger.pullY) * pullEase;
        }
        const splash = splashRef.current;
        const splashRig = splashRigRef.current;
        const splashVisible = toolRef.current === "splash" || splash.active || splashRig.faucetOn || splashRig.waterLevel > 0.003;
        if (toolRef.current === "splash" && splash.active) {
            const holdAge = now - splash.startedAt;
            splash.pressure = Math.max(
                splash.pressure * 0.94,
                Math.max(0.48, Math.min(1, 0.42 + holdAge / SPLASH_HOLD_ARM_MS)),
            );
            if (now - splash.lastEmitAt >= SPLASH_EMIT_MS) {
                splash.lastEmitAt = now;
                const power = Math.min(1, splash.pressure + Math.min(0.24, holdAge / 2400));
                if (holdAge > SPLASH_OVERFLOW_AFTER_MS) {
                    splashRig.waterLevel = Math.min(1, splashRig.waterLevel + (deltaMs * SPLASH_FLOOD_FILL_PER_MS * (0.55 + power)));
                }
                const pose = getSplashPistolPose(splash.x, splash.y, splash.angle, power);
                splash.angle = pose.angle;
                splashSpraysRef.current = [
                    ...splashSpraysRef.current.slice(-8),
                    {
                        id: `splash-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                        startX: pose.nozzle.x,
                        startY: pose.nozzle.y,
                        x: splash.x,
                        y: splash.y,
                        impactX: splash.x,
                        impactY: splash.y,
                        angle: pose.angle,
                        power,
                        seed: Math.floor(now * 13 + splash.x * 7 + splash.y * 11),
                        createdAt: now,
                        life: 360,
                    },
                ];
                applySplashPressureRef.current?.(splash.x, splash.y, pose.angle, power);
                if (!mutedRef.current && now - lastSoundAtRef.current > 130) {
                    lastSoundAtRef.current = now;
                    playToolSound("splash");
                }
            }
            splash.lastX = splash.x;
            splash.lastY = splash.y;
        }
        if (splashRig.faucetOn) {
            const crane = getSplashCraneLayout(width);
            splashRig.waterLevel = Math.min(1, splashRig.waterLevel + deltaMs * SPLASH_FLOOD_FILL_PER_MS * 1.6);
            if (now - splashRig.lastLeakAt >= SPLASH_FAUCET_EMIT_MS) {
                splashRig.lastLeakAt = now;
                const leakX = crane.nozzleX + Math.sin(now * 0.006) * 7;
                const leakY = height - Math.max(12, height * splashRig.waterLevel);
                applySplashPressureRef.current?.(leakX, leakY, Math.PI / 2, splashRig.hoseConnected ? 0.22 : 0.36);
                appendCapped(particlesRef.current, createParticlesForTool("splash", leakX, leakY, undefined, Math.PI / 2), MAX_PARTICLES);
                if (!mutedRef.current && now - lastSoundAtRef.current > 180) {
                    lastSoundAtRef.current = now;
                    playToolSound("splash");
                }
            }
        } else if (!splash.active) {
            splashRig.waterLevel = Math.max(0, splashRig.waterLevel - deltaMs * SPLASH_FLOOD_DRAIN_PER_MS);
        }

        const canSpawnWaterFish = splashRig.waterLevel >= SPLASH_FISH_MIN_WATER_LEVEL;
        activeWaterFishRef.current = activeWaterFishRef.current
            .map((fish) => updateWaterFish(fish, width, height, splashRig.waterLevel, now, deltaMs))
            .filter((fish): fish is ActiveWaterFish => !!fish && (canSpawnWaterFish || fish.opacity > 0.025));

        if (canSpawnWaterFish && now - lastWaterFishSpawnRef.current >= SPLASH_FISH_SPAWN_MS) {
            lastWaterFishSpawnRef.current = now;
            const targetFishCount = Math.min(
                SPLASH_FISH_MAX,
                2 + Math.floor((splashRig.waterLevel - SPLASH_FISH_MIN_WATER_LEVEL) * 8),
            );
            if (activeWaterFishRef.current.length < targetFishCount) {
                activeWaterFishRef.current = [
                    ...activeWaterFishRef.current,
                    createWaterFish(width, height, splashRig.waterLevel, now, activeWaterFishRef.current.length),
                ];
            }
        }

        activeHammerPigletsRef.current = activeHammerPigletsRef.current
            .map((piglet) => updateHammerPiglet(piglet, width, now, deltaMs))
            .filter((piglet): piglet is ActiveHammerPiglet => piglet !== null);

        if (toolRef.current === "hammer") {
            if (nextHammerPigletSpawnAtRef.current <= 0) {
                nextHammerPigletSpawnAtRef.current = scheduleNextHammerPigletSpawn(now);
            }
            if (
                now >= nextHammerPigletSpawnAtRef.current
                && activeHammerPigletsRef.current.length < HAMMER_PIGLET_MAX_ACTIVE
            ) {
                activeHammerPigletsRef.current = [
                    ...activeHammerPigletsRef.current,
                    createHammerPiglet(width, height, now),
                ];
                nextHammerPigletSpawnAtRef.current = scheduleNextHammerPigletSpawn(now);
            }
        } else {
            nextHammerPigletSpawnAtRef.current = 0;
        }

        activeTicksRef.current = activeTicksRef.current
            .map((tick) => {
                const age = now - tick.createdAt;
                if (age >= tick.life) return null;

                let nextVx = tick.vx;
                let nextVy = tick.vy;
                let nextTurnAt = tick.nextTurnAt;
                if (now >= tick.nextTurnAt) {
                    const turn = (flameNoise(tick.seed, now * 0.002) - 0.5) * 1.42;
                    const currentAngle = Math.atan2(nextVy, nextVx) + turn;
                    const speed = clampValue(Math.hypot(nextVx, nextVy) * (0.9 + flameNoise(tick.seed, now * 0.003) * 0.26), 0.28, 0.82);
                    nextVx = Math.cos(currentAngle) * speed;
                    nextVy = Math.sin(currentAngle) * speed;
                    nextTurnAt = now + 360 + flameNoise(tick.seed, now * 0.004) * 940;
                }

                let nextX = tick.x + nextVx * deltaScale;
                let nextY = tick.y + nextVy * deltaScale;
                const margin = tick.size * 0.85;
                if (nextX < margin || nextX > width - margin) {
                    nextVx *= -0.92;
                    nextX = clampValue(nextX, margin, width - margin);
                }
                if (nextY < margin || nextY > height - margin) {
                    nextVy *= -0.92;
                    nextY = clampValue(nextY, margin, height - margin);
                }

                const nextTick: ScreenTick = {
                    ...tick,
                    prevX: tick.x,
                    prevY: tick.y,
                    x: nextX,
                    y: nextY,
                    vx: nextVx,
                    vy: nextVy,
                    angle: Math.atan2(nextVy, nextVx),
                    nextTurnAt,
                    lastTraceAt: now - tick.lastTraceAt >= TICK_TRACE_STAMP_MS ? now : tick.lastTraceAt,
                };
                stampTickBite(nextTick, spritesRef.current.tickTrace, now - tick.lastTraceAt >= TICK_TRACE_STAMP_MS);
                drawScreenTick(ctx, nextTick, now, spritesRef.current.tick);
                return nextTick;
            })
            .filter((tick): tick is ScreenTick => tick !== null);

        laserTrailRef.current = laserTrailRef.current.filter((segment) => now - segment.createdAt < segment.life);
        if (laserTrailRef.current.length > 0) {
            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.globalCompositeOperation = "lighter";
            laserTrailRef.current.forEach((segment) => {
                const age = now - segment.createdAt;
                const t = Math.max(0, Math.min(1, age / segment.life));
                const freshness = 1 - t;
                const cooling = Math.max(0, 1 - age / LASER_FRESH_GLOW_MS);
                
                const edgeX = Math.cos(segment.angle + Math.PI / 2);
                const edgeY = Math.sin(segment.angle + Math.PI / 2);
                const controlX = (segment.startX + segment.endX) * 0.5 + edgeX * segment.width * 0.22;
                const controlY = (segment.startY + segment.endY) * 0.5 + edgeY * segment.width * 0.22;
                
                const drawTrail = (widthValue: number, stroke: string, blur: number) => {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = widthValue;
                    if (blur > 0) {
                        ctx.shadowColor = stroke;
                        ctx.shadowBlur = blur;
                    } else {
                        ctx.shadowBlur = 0;
                    }
                    ctx.beginPath();
                    ctx.moveTo(segment.startX, segment.startY);
                    ctx.quadraticCurveTo(controlX, controlY, segment.endX, segment.endY);
                    ctx.stroke();
                };

                // Molten outer glow (Orange/Red)
                drawTrail(
                    segment.width * (1.25 + cooling * 0.42),
                    `rgba(185,28,28,${0.38 * cooling})`,
                    18 * cooling
                );
                
                // Heat core (Orange/Yellow)
                drawTrail(
                    segment.width * (0.86 + cooling * 0.18),
                    `rgba(249,115,22,${0.54 * freshness})`,
                    8 * cooling
                );

                // Incandescent center (White/Yellow)
                if (cooling > 0.15) {
                    drawTrail(
                        Math.max(2, segment.width * (0.24 + cooling * 0.12)),
                        `rgba(254,240,138,${0.92 * cooling})`,
                        4 * cooling
                    );
                }
            });
            ctx.restore();
        }

        laserDrillsRef.current = laserDrillsRef.current.filter((drill) => now - drill.createdAt < drill.life);
        laserDrillsRef.current.forEach((drill) => drawLaserDrillBurst(ctx, drill, now));

        if (toolRef.current === "laser" && laserCutRef.current.active && laserCutRef.current.initialized) {
            const cut = laserCutRef.current;
            const bloom = ctx.createRadialGradient(cut.tipX, cut.tipY, 0, cut.tipX, cut.tipY, 42);
            bloom.addColorStop(0, "rgba(255,255,255,0.94)");
            bloom.addColorStop(0.16, "rgba(254,240,138,0.74)");
            bloom.addColorStop(0.42, "rgba(249,115,22,0.42)");
            bloom.addColorStop(1, "rgba(0,0,0,0)");
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = bloom;
            drawJaggedShape(ctx, cut.tipX, cut.tipY, 42, 7, Math.random());
            ctx.fill();
            ctx.restore();
        }

        laserSparksRef.current = laserSparksRef.current
            .map((spark) => {
                const nextAge = now - spark.createdAt;
                if (nextAge >= spark.life) return null;
                let nextVy = spark.vy + 0.00135 * deltaMs;
                let nextVx = spark.vx * 0.996;
                let nextX = spark.x + nextVx * deltaMs;
                let nextY = spark.y + nextVy * deltaMs;
                let nextBounces = spark.bounces;
                if (nextY > height - 2 && nextBounces < 2) {
                    nextY = height - 2;
                    nextVy *= -0.34;
                    nextVx *= 0.76;
                    nextBounces += 1;
                }
                return {
                    ...spark,
                    prevX: spark.x,
                    prevY: spark.y,
                    x: nextX,
                    y: nextY,
                    vx: nextVx,
                    vy: nextVy,
                    bounces: nextBounces,
                };
            })
            .filter((spark): spark is LaserSpark => spark !== null);

        if (laserSparksRef.current.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.lineCap = "round";
            laserSparksRef.current.forEach((spark) => {
                const age = now - spark.createdAt;
                const alpha = Math.max(0, 1 - age / spark.life);
                const speed = Math.hypot(spark.vx, spark.vy);
                const length = 2 + speed * 4.2;
                const angle = Math.atan2(spark.vy, spark.vx);
                
                ctx.strokeStyle = `rgba(255,248,196,${0.96 * alpha})`;
                ctx.lineWidth = spark.width;
                ctx.shadowColor = `rgba(251,191,36,${0.82 * alpha})`;
                ctx.shadowBlur = 10 * alpha;
                
                ctx.beginPath();
                ctx.moveTo(spark.x - Math.cos(angle) * length, spark.y - Math.sin(angle) * length);
                ctx.lineTo(spark.x, spark.y);
                ctx.stroke();
            });
            ctx.restore();
        }

        // 1. Update Projectiles (to detect and spawn splats in the current frame before we draw them!)
        const nextProjectiles: FruitProjectile[] = [];
        fruitProjectilesRef.current.forEach((projectile) => {
            const profile = foodStyle(projectile.food);
            const nextProjectile = {
                ...projectile,
                x: projectile.x + projectile.vx * deltaMs,
                y: projectile.y + projectile.vy * deltaMs,
                z: projectile.z + projectile.vz * deltaMs,
                vy: projectile.vy + SLINGER_GRAVITY * deltaMs * profile.mass,
                rotation: projectile.rotation + projectile.spin * deltaMs,
            };
            if (nextProjectile.z <= 0) {
                spawnFruitSplat(nextProjectile, now);
            } else if (
                nextProjectile.x > -100
                && nextProjectile.x < width + 100
                && nextProjectile.y > -140
                && nextProjectile.y < height + 140
            ) {
                nextProjectiles.push(nextProjectile);
            }
        });
        fruitProjectilesRef.current = nextProjectiles.slice(-18);

        // 2. Update and Draw Splats (including any newly spawned splats from step 1!)
        fruitSplatsRef.current = fruitSplatsRef.current
            .map((splat) => ({
                ...splat,
                y: splat.y + splat.slideSpeed * deltaMs,
            }))
            .filter((splat) => now - splat.createdAt < splat.life && splat.y - splat.radius < height + 80);
        fruitSplatsRef.current.forEach((splat) => drawFruitSplat(ctx, splat, now, spritesRef.current));

        // 3. Draw remaining flying projectiles (so they are rendered on top of the splats!)
        fruitProjectilesRef.current.forEach((projectile) => {
            drawFruitProjectile(ctx, projectile, spritesRef.current);
        });

        if (toolRef.current === "throw") {
            const fallbackX = pointerRef.current.smoothX > -100 ? Math.max(74, Math.min(width - 74, pointerRef.current.smoothX)) : width * 0.5;
            const fallbackY = pointerRef.current.smoothY > -100 ? Math.max(74, Math.min(height - 142, pointerRef.current.smoothY)) : height * 0.62;
            drawSlingerSafely(ctx, slingerRef.current, throwFoodRef.current, now, fallbackX, fallbackY, spritesRef.current);
        }

        dragonBreathsRef.current = dragonBreathsRef.current.filter((breath) => now - breath.createdAt < breath.life);
        if (toolRef.current === "burn" && dragonBreathsRef.current.length === 0) {
            const focusY = pointerRef.current.smoothY > -100 ? pointerRef.current.smoothY : height * 0.54;
            drawIdleDragonHead(ctx, width, height, focusY, now, spritesRef.current.dragon);
        }
        dragonBreathsRef.current.forEach((breath) => drawDragonBreath(ctx, breath, now, spritesRef.current.dragon, spritesRef.current.flame));

        const liveFlames: ActiveFlame[] = [];
        activeFlamesRef.current.forEach((flame) => {
            if (now - flame.createdAt < flame.life) {
                liveFlames.push(flame);
                return;
            }
            stampBurnScorchRef.current?.(flame);
            burnResiduesRef.current = [
                ...burnResiduesRef.current.slice(-10),
                {
                    id: `residue-${flame.id}`,
                    x: flame.x,
                    y: flame.y,
                    radius: flame.radius,
                    rotation: flame.rotation,
                    seed: flame.seed,
                    createdAt: now,
                    life: 1700,
                },
            ];
        });
        activeFlamesRef.current = liveFlames;
        activeFlamesRef.current.forEach((flame) => drawLiveFlame(ctx, flame, now, spritesRef.current.impactFlame));
        burnResiduesRef.current = burnResiduesRef.current.filter((residue) => now - residue.createdAt < residue.life);
        burnResiduesRef.current.forEach((residue) => drawBurnResidue(ctx, residue, now, spritesRef.current.burnScorch));
        splashSpraysRef.current = splashSpraysRef.current.filter((spray) => now - spray.createdAt < spray.life);
        splashSpraysRef.current.forEach((spray) => drawSplashSpray(ctx, spray, now, splashVideoRef.current));
        screenHitPulsesRef.current = screenHitPulsesRef.current.filter((pulse) => now - pulse.createdAt < pulse.life);
        screenHitPulsesRef.current.forEach((pulse) => drawScreenHitPulse(ctx, pulse, now));
        activeHammerPigletsRef.current.forEach((piglet) => drawHammerPiglet(ctx, piglet, now, spritesRef.current.pigletRunSheet));
        if (activeWaterFishRef.current.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = "source-over";
            activeWaterFishRef.current.forEach((fish) => {
                const frameSequenceIndex = Math.floor((now - fish.bornAt) / 90 + fish.seed) % SPLASH_FISH_FRAME_SEQUENCE.length;
                const frame = SPLASH_FISH_FRAME_SEQUENCE[frameSequenceIndex];
                const bob = Math.sin(now * 0.004 + fish.phase) * Math.min(8, fish.size * 0.06);
                const tilt = Math.sin(now * 0.0022 + fish.phase * 1.7) * 0.08;
                const fishWidth = fish.size;
                const fishHeight = fish.size * 0.42;
                drawFishSpriteFrame(
                    ctx,
                    spritesRef.current.fishSheet,
                    frame,
                    fish.x,
                    fish.y + bob,
                    fishWidth,
                    fishHeight,
                    fish.direction,
                    fish.opacity,
                    tilt,
                );
            });
            ctx.restore();
        }
        drawSplashFlood(ctx, splashRig.waterLevel, width, height, now);
        if (splashVisible) {
            drawSplashRig(ctx, splash, splashRig, pointerRef.current, width, height, now, spritesRef.current, splashVideoRef.current);
            if (toolRef.current === "splash" && (splash.active || (pointerRef.current.smoothX > -100 && pointerRef.current.smoothY > -100))) {
                const sourceX = splash.active ? splash.x : pointerRef.current.smoothX;
                const sourceY = splash.active ? splash.y : pointerRef.current.smoothY;
                const angle = splash.angle;
                const power = splash.active ? Math.max(0.28, splash.pressure) : 0.36;
                const pose = getSplashPistolPose(sourceX, sourceY, angle, power);
                drawSplashAimMarker(
                    ctx,
                    pose.nozzle.x,
                    pose.nozzle.y,
                    sourceX,
                    sourceY,
                    power,
                    now,
                );
            }
        }
        activeArrowsRef.current = activeArrowsRef.current.filter((arrow) => now - arrow.createdAt < arrow.life);
        activeArrowsRef.current.forEach((arrow) => drawLiveArrow(ctx, arrow, now, spritesRef.current.arrow));
        activeWebsRef.current = activeWebsRef.current.filter((web) => now - web.createdAt < web.life);
        activeWebsRef.current.forEach((web) => drawSpiderWeb(ctx, web, now));
        skeletonShardsRef.current = skeletonShardsRef.current
            .map((shard) => ({
                ...shard,
                x: shard.x + shard.vx * deltaScale,
                y: shard.y + shard.vy * deltaScale,
                vy: shard.vy + 0.075 * deltaScale,
                vx: shard.vx * 0.992,
                rotation: shard.rotation + shard.spin * deltaScale,
                spin: shard.spin * 0.994,
            }))
            .filter((shard) => now - shard.createdAt < shard.life && shard.y < height + 80);
        skeletonShardsRef.current.forEach((shard) => drawSkeletonShard(ctx, shard, now));
        dyingSkeletonsRef.current = dyingSkeletonsRef.current.filter((skeleton) => !skeleton.controller.isShotDeathComplete(now));
        dyingSkeletonsRef.current.forEach((skeleton) => skeleton.controller.draw(ctx, now, spritesRef.current.skeleton, spritesRef.current.arrow));
        dyingSpidersRef.current = dyingSpidersRef.current.filter((spider) => now - spider.startedAt < 1240);
        dyingSpidersRef.current.forEach((spider) => drawDyingSpider(ctx, spider, now, spritesRef.current.spider, spritesRef.current.arrow));
        particlesRef.current = stepParticlesMutable(particlesRef.current);
        const particleCount = particlesRef.current.length;
        particlesRef.current.forEach((particle, index) => {
            if (particleCount > 140 && particle.shape !== "spark" && index % 2 === 1) return;
            drawPlaygroundParticle(ctx, particle, spritesRef.current.emberParticle);
        });
        entitiesRef.current = entitiesRef.current
            .map((entity) => {
                const grabbed = (entity.grabbedUntil ?? 0) > now;
                const anchorX = entity.grabAnchorX ?? entity.x;
                const anchorY = entity.grabAnchorY ?? entity.y;
                
                let vx = entity.vx;
                let vy = entity.vy;
                let spin = entity.spin;
                
                if (entity.shakeLife && entity.shakeLife > 0) {
                    const nextShakeLife = entity.shakeLife - 1;
                    const jitterX = (Math.random() - 0.5) * 5.4;
                    const jitterY = (Math.random() - 0.5) * 5.4;
                    return {
                        ...entity,
                        x: (entity.originalX ?? entity.x) + jitterX,
                        y: (entity.originalY ?? entity.y) + jitterY,
                        shakeLife: nextShakeLife,
                        life: entity.life - 1,
                    };
                }
                
                if (!grabbed) {
                    activeArrowsRef.current.forEach((arrow) => {
                        const arrowAge = now - arrow.createdAt;
                        if (arrowAge < ARROW_FLIGHT_MS) {
                            const flightT = Math.min(1, arrowAge / ARROW_FLIGHT_MS);
                            const easedFlight = 1 - ((1 - flightT) ** 3);
                            const arrowX = arrow.startX + (arrow.x - arrow.startX) * easedFlight;
                            const arrowY = arrow.startY + (arrow.y - arrow.startY) * easedFlight;
                            
                            const dx = entity.x - arrowX;
                            const dy = entity.y - arrowY;
                            const dist = Math.hypot(dx, dy);
                            const collisionDist = Math.max(36, entity.width * 0.76);
                            if (dist < collisionDist) {
                                const pushSpeed = (arrow.heavy ? 8.5 : 4.5) * (1 - dist / collisionDist);
                                vx += Math.cos(arrow.rotation) * pushSpeed;
                                vy += Math.sin(arrow.rotation) * pushSpeed;
                                spin += (Math.random() - 0.5) * (arrow.heavy ? 0.5 : 0.22);
                            }
                        }
                    });
                }
                if (!grabbed && splashRig.waterLevel > 0.01) {
                    const waterLine = height - height * splashRig.waterLevel;
                    const submersion = Math.max(0, Math.min(1, (entity.y + entity.height * 0.28 - waterLine) / Math.max(12, entity.height * 0.9)));
                    if (submersion > 0) {
                        vx += Math.sin(now * 0.0028 + entity.x * 0.018) * submersion * 0.22;
                        vy -= submersion * (0.32 + splashRig.waterLevel * 0.42);
                        vx *= 1 - submersion * 0.08;
                        vy *= 1 - submersion * 0.18;
                        spin *= 1 - submersion * 0.08;
                    }
                }
                const laserBurnAge = entity.laserBurnStartedAt === undefined ? 0 : now - entity.laserBurnStartedAt;
                const laserBurning = entity.laserBurnStartedAt !== undefined && laserBurnAge < (entity.laserBurnLife ?? 620);
                const lifeLoss = laserBurning ? 5 : 1;

                let nextX = grabbed ? entity.x + (anchorX - entity.x) * 0.08 : entity.x + vx;
                let nextY = grabbed ? entity.y + (anchorY - entity.y) * 0.08 : entity.y + vy;
                let nextVx = grabbed ? entity.vx * 0.78 : vx * 0.988;
                let nextVy = grabbed ? entity.vy * 0.78 : (vy + (entity.gravity ?? 0.14)) * 0.992;
                let nextSpin = spin * (grabbed ? 0.92 : 0.992);
                let nextBounces = entity.bounces ?? 0;
                if (!grabbed) {
                    const floorY = height - Math.max(2, entity.height * 0.5);
                    if (nextY > floorY && nextVy > 0 && nextBounces < 10) {
                        const bounceStrength = nextBounces === 0 ? 0.68 : nextBounces === 1 ? 0.54 : nextBounces === 2 ? 0.42 : nextBounces === 3 ? 0.32 : nextBounces < 7 ? 0.24 : 0.16;
                        nextY = floorY;
                        nextVy *= -bounceStrength;
                        nextVx *= 0.91;
                        nextSpin *= 0.86;
                        nextBounces += 1;
                    } else if (nextY > floorY && nextBounces >= 10) {
                        nextY = floorY;
                        nextVy = 0;
                        nextVx *= 0.9;
                        nextSpin *= 0.72;
                    }
                }

                return {
                    ...entity,
                    x: nextX,
                    y: nextY,
                    vx: nextVx,
                    vy: nextVy,
                    rotation: entity.rotation + (grabbed ? spin * 0.16 : spin),
                    spin: nextSpin,
                    bounces: nextBounces,
                    life: entity.life - lifeLoss,
                };
            })
            .filter((entity) => entity.life > 0 && entity.y < height + entity.height * 2);
        entitiesRef.current.forEach((entity) => {
            const age = 1 - Math.max(0, Math.min(1, entity.life / entity.maxLife));
            const fadeIn = Math.min(1, age / 0.025);
            const fadeOut = Math.max(0, Math.min(1, entity.life / 42));
            const alpha = fadeIn * fadeOut;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(entity.x, entity.y);
            ctx.rotate(entity.rotation);
            ctx.drawImage(entity.canvas, -entity.width / 2, -entity.height / 2, entity.width, entity.height);
            if (entity.laserBurnStartedAt !== undefined) {
                const burnAge = now - entity.laserBurnStartedAt;
                const burnT = Math.max(0, Math.min(1, burnAge / (entity.laserBurnLife ?? 620)));
                const burnAlpha = Math.max(0, Math.sin((1 - burnT) * Math.PI)) * 0.52 + (1 - burnT) * 0.2;
                ctx.globalCompositeOperation = "source-atop";
                ctx.globalAlpha = alpha * burnAlpha;
                ctx.fillStyle = "rgb(239, 34, 34)";
                ctx.fillRect(-entity.width / 2, -entity.height / 2, entity.width, entity.height);
                ctx.globalCompositeOperation = "screen";
                ctx.globalAlpha = alpha * Math.max(0, 1 - burnT) * 0.48;
                const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(entity.width, entity.height) * 0.58);
                glow.addColorStop(0, "rgba(255,255,255,0.55)");
                glow.addColorStop(0.32, "rgba(248,113,113,0.38)");
                glow.addColorStop(1, "rgba(127,29,29,0)");
                ctx.fillStyle = glow;
                ctx.fillRect(-entity.width / 2, -entity.height / 2, entity.width, entity.height);
            }
            ctx.restore();
        });
        creaturesRef.current = stepCreaturesMutable(creaturesRef.current, width, height);
        const laserBurnedCreatures: Creature[] = [];
        creaturesRef.current = creaturesRef.current.filter((creature) => {
            if (creature.laserBurnStartedAt === undefined) return true;
            if (now - creature.laserBurnStartedAt <= (creature.laserBurnLife ?? 420)) return true;
            laserBurnedCreatures.push(creature);
            return false;
        });
        if (laserBurnedCreatures.length > 0) {
            laserBurnedCreatures.forEach((creature) => skeletonControllersRef.current.delete(creature.id));
            appendCapped(particlesRef.current, laserBurnedCreatures.flatMap((creature) => createParticlesForTool("burn", creature.x, creature.y, undefined, Math.atan2(creature.vy, creature.vx || 0.001))), MAX_PARTICLES);
        }
        
        activeSpiderLiftsRef.current = activeSpiderLiftsRef.current.filter((lift) => now - lift.createdAt < lift.duration);
        const controllers = skeletonControllersRef.current;
        creaturesRef.current.forEach((creature) => {
            if (creature.kind === "skeleton") {
                let controller = controllers.get(creature.id);
                if (!controller) {
                    controller = new SkeletonController(creature.x, creature.y, creature.size, creature.seed);
                    controllers.set(creature.id, controller);
                }
                controller.update(now, deltaMs, creature.vx, creature.vy, creature.size * (creature.mergeScale ?? 1));
                controller.draw(ctx, now, spritesRef.current.skeleton);
                creature.x = controller.x;
                creature.y = controller.y;
            } else if (creature.kind === "spider") {
                const activeLift = activeSpiderLiftsRef.current.find((lift) => lift.creatureId === creature.id);
                if (activeLift) {
                    const liftT = clampValue((now - activeLift.createdAt) / activeLift.duration, 0, 1);
                    const easedLift = 1 - Math.pow(1 - liftT, 3);
                    const sway = Math.sin(now * 0.009 + activeLift.seed) * Math.min(6, creature.size * 0.12);
                    creature.x = clampValue(activeLift.x + sway, creature.size * 0.5, width - creature.size * 0.5);
                    creature.y = activeLift.startY + (activeLift.targetY - activeLift.startY) * easedLift;
                    creature.vx *= 0.22;
                    creature.vy = -Math.max(0.2, Math.abs(creature.vy) * 0.38);
                    creature.heading = -Math.PI / 2;
                    drawSpiderLiftLine(ctx, activeLift, creature.x, creature.y, creature.size, now);
                } else {
                    const nextLiftAt = spiderLiftCooldownsRef.current.get(creature.id) ?? (now + 5200 + Math.random() * 9800);
                    if (!spiderLiftCooldownsRef.current.has(creature.id)) {
                        spiderLiftCooldownsRef.current.set(creature.id, nextLiftAt);
                    } else if (
                        now >= nextLiftAt
                        && creature.y > creature.size * 1.55
                        && activeSpiderLiftsRef.current.length < 5
                    ) {
                        activeSpiderLiftsRef.current = [
                            ...activeSpiderLiftsRef.current,
                            {
                                id: `spider-lift-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                                creatureId: creature.id,
                                x: creature.x,
                                startY: creature.y,
                                targetY: Math.max(18 + creature.size * 0.38, creature.size * 0.66),
                                createdAt: now,
                                duration: 1180 + Math.random() * 520,
                                seed: creature.seed + now * 0.01,
                            },
                        ];
                        spiderLiftCooldownsRef.current.set(creature.id, now + 12500 + Math.random() * 18500);
                    }
                }

                if ((creature.webCooldown ?? 1) <= 0 && Math.random() < 0.018) {
                    activeWebsRef.current = [
                        ...activeWebsRef.current.slice(-16),
                        {
                            id: `web-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                            x: creature.x - Math.cos(Math.atan2(creature.vy, creature.vx || 0.001)) * creature.size * 0.28,
                            y: creature.y - Math.sin(Math.atan2(creature.vy, creature.vx || 0.001)) * creature.size * 0.28,
                            radius: creature.size * (0.78 + Math.random() * 0.48),
                            rotation: Math.random() * Math.PI * 2,
                            seed: creature.seed + now,
                            createdAt: now,
                            life: 9200 + Math.random() * 6800,
                        },
                    ];
                    creature.webCooldown = 520 + Math.random() * 980;
                }
                drawSpider(ctx, creature, now, spritesRef.current.spider);
            }
            if (creature.laserBurnStartedAt !== undefined) {
                const burnAge = now - creature.laserBurnStartedAt;
                const burnT = Math.max(0, Math.min(1, burnAge / (creature.laserBurnLife ?? 420)));
                const pulse = 0.5 + Math.sin(now * 0.042 + creature.seed) * 0.16;
                const radius = creature.size * (creature.kind === "skeleton" ? 0.68 : 0.54) * (1.05 - burnT * 0.16);
                ctx.save();
                ctx.globalCompositeOperation = "screen";
                ctx.globalAlpha = Math.max(0, 1 - burnT) * pulse;
                const glow = ctx.createRadialGradient(creature.x, creature.y, 0, creature.x, creature.y, radius);
                glow.addColorStop(0, "rgba(255,255,255,0.46)");
                glow.addColorStop(0.18, "rgba(248,113,113,0.6)");
                glow.addColorStop(0.68, "rgba(220,38,38,0.3)");
                glow.addColorStop(1, "rgba(127,29,29,0)");
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(creature.x, creature.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        const creatureIds = new Set(creaturesRef.current.map(c => c.id));
        for (const id of controllers.keys()) {
            if (!creatureIds.has(id)) controllers.delete(id);
        }
        for (const id of spiderLiftCooldownsRef.current.keys()) {
            if (!creatureIds.has(id)) spiderLiftCooldownsRef.current.delete(id);
        }
        activeSpiderLiftsRef.current = activeSpiderLiftsRef.current.filter((lift) => creatureIds.has(lift.creatureId));

        ctx.restore();

        const pointer = pointerRef.current;
        pointer.smoothX += (pointer.x - pointer.smoothX) * 0.42;
        pointer.smoothY += (pointer.y - pointer.smoothY) * 0.42;

        const cursor = cursorRef.current;
        if (cursor) {
            const frameNow = performance.now();
            const laserCut = laserCutRef.current;
            const isLaserTool = toolRef.current === "laser";
            const laserDrill = laserDrillCursorRef.current;
            const drillElapsed = laserDrill ? frameNow - laserDrill.createdAt : Number.POSITIVE_INFINITY;
            const drillActive = isLaserTool && !!laserDrill && drillElapsed >= 0 && drillElapsed < laserDrill.life;
            if (laserDrill && drillElapsed >= laserDrill.life) {
                laserDrillCursorRef.current = null;
            }
            const drillT = drillActive && laserDrill ? Math.max(0, Math.min(1, drillElapsed / laserDrill.life)) : 0;
            const drillWindup = Math.max(0, Math.min(1, drillT / 0.28));
            const drillBite = Math.max(0, Math.min(1, (drillT - 0.2) / 0.36));
            const drillRecover = Math.max(0, Math.min(1, (drillT - 0.56) / 0.44));
            const drillTwist = drillActive
                ? (-150 * easeOutCubic(drillWindup)) + (720 * easeOutCubic(drillBite)) - (210 * easeOutCubic(drillRecover))
                : 0;
            const holdDepth = isLaserTool && laserCut.active
                ? easeOutCubic(Math.min(1, Math.max(0, (frameNow - laserCut.holdStartAt) / 560)))
                : 0;
            if (isLaserTool && laserCut.active && laserCut.initialized) {
                const previousTipX = laserCut.tipX;
                const previousTipY = laserCut.tipY;
                laserCut.tipX += (laserCut.targetX - laserCut.tipX) * LASER_TIP_RESISTANCE;
                laserCut.tipY += (laserCut.targetY - laserCut.tipY) * LASER_TIP_RESISTANCE;
                const travel = Math.hypot(laserCut.tipX - previousTipX, laserCut.tipY - previousTipY);
                if (travel > 0.22) {
                    const nextAngle = Math.atan2(laserCut.tipY - previousTipY, laserCut.tipX - previousTipX);
                    laserCut.angle += (nextAngle - laserCut.angle) * LASER_ANGLE_FOLLOW;
                    lastLaserCutRef.current = { x: laserCut.tipX, y: laserCut.tipY, angle: laserCut.angle };
                    if (frameNow - laserCut.lastEmitAt >= LASER_HOLD_CUT_MS) {
                        commitLaserTrail(previousTipX, previousTipY, laserCut.tipX, laserCut.tipY, laserCut.angle, frameNow);
                        laserCut.lastEmitAt = frameNow;
                    }
                    if (!mutedRef.current && frameNow - lastLaserSoundAtRef.current > 115) {
                        lastLaserSoundAtRef.current = frameNow;
                        playToolSound("laser");
                    }
                }
                laserCut.lastTipX = laserCut.tipX;
                laserCut.lastTipY = laserCut.tipY;
            }

            const isHammerTool = toolRef.current === "hammer";
            const bladeAngle = isLaserTool
                ? drillActive && laserDrill
                    ? laserDrill.angle
                    : laserCut.angle
                : lastLaserCutRef.current.angle;
            const bladeLength = LASER_CURSOR_IDLE_LENGTH + holdDepth * LASER_CURSOR_HOLD_GROW + (drillActive ? Math.sin(Math.min(1, drillBite) * Math.PI) * LASER_CURSOR_DRILL_GROW : 0);
            const plunge = holdDepth * 22 + (drillActive ? easeOutCubic(drillBite) * 62 - easeOutCubic(drillRecover) * 28 : 0);
            const heavyHammer = heavyHammerSwingRef.current;
            const heavyElapsed = frameNow - heavyHammer.startedAt;
            const heavyActive = isHammerTool && heavyHammer.active && heavyElapsed >= 0 && heavyElapsed < HEAVY_HAMMER_SWING_MS;
            if (heavyHammer.active && heavyElapsed >= HEAVY_HAMMER_SWING_MS) {
                heavyHammer.active = false;
            }
            const heavyFlightT = heavyActive ? Math.min(1, heavyElapsed / HEAVY_HAMMER_IMPACT_DELAY_MS) : 1;
            const heavySpin = easeInCubic(heavyFlightT);
            const heavyLandingBounce = heavyActive && heavyFlightT > 0.9 ? Math.sin(((heavyFlightT - 0.9) / 0.1) * Math.PI) : 0;
            const heavyRecoveryT = heavyActive && heavyElapsed > HEAVY_HAMMER_IMPACT_DELAY_MS
                ? Math.min(1, (heavyElapsed - HEAVY_HAMMER_IMPACT_DELAY_MS) / (HEAVY_HAMMER_SWING_MS - HEAVY_HAMMER_IMPACT_DELAY_MS))
                : 0;
            const heavyRebound = heavyRecoveryT > 0 ? Math.sin(heavyRecoveryT * Math.PI) * 8 : 0;
            const holdPress = isLaserTool && (laserCut.active || drillActive) ? 1 : 0;
            const hammerElapsed = frameNow - hammerSwingRef.current;
            const hammerT = hammerElapsed < HAMMER_SWING_MS ? Math.min(1, hammerElapsed / HAMMER_SWING_MS) : 1;
            const hammerWindup = hammerT < HAMMER_WINDUP_T ? easeOutCubic(hammerT / HAMMER_WINDUP_T) : 1;
            const hammerAttack = hammerT < HAMMER_WINDUP_T
                ? 0
                : hammerT < HAMMER_IMPACT_T
                    ? easeInCubic((hammerT - HAMMER_WINDUP_T) / (HAMMER_IMPACT_T - HAMMER_WINDUP_T))
                    : 1;
            const hammerRecover = hammerT < HAMMER_IMPACT_T ? 0 : easeOutCubic((hammerT - HAMMER_IMPACT_T) / (1 - HAMMER_IMPACT_T));
            const hammerSnap = hammerT > HAMMER_IMPACT_T && hammerT < HAMMER_IMPACT_T + 0.18
                ? Math.sin(((hammerT - HAMMER_IMPACT_T) / 0.18) * Math.PI)
                : 0;
            const hammerSwingRotation = hammerT < HAMMER_WINDUP_T
                ? HAMMER_IDLE_ROTATION + (HAMMER_WINDUP_ROTATION - HAMMER_IDLE_ROTATION) * hammerWindup
                : hammerT < HAMMER_IMPACT_T
                    ? HAMMER_WINDUP_ROTATION + (HAMMER_IMPACT_ROTATION - HAMMER_WINDUP_ROTATION) * hammerAttack
                    : HAMMER_IMPACT_ROTATION + (HAMMER_IDLE_ROTATION - HAMMER_IMPACT_ROTATION) * hammerRecover + hammerSnap * 6;
            const hammerRotation = isHammerTool
                ? heavyActive
                    ? HAMMER_IDLE_ROTATION + ((HAMMER_IMPACT_ROTATION + 360) - HAMMER_IDLE_ROTATION) * heavySpin + heavyLandingBounce * 7 - heavyRebound
                    : hammerSwingRotation
                : 0;
            const finalRotation = isLaserTool ? bladeAngle * (180 / Math.PI) + 90 + drillTwist : hammerRotation;
            const finalScale = isLaserTool
                ? 1 + holdDepth * 0.04 + (drillActive ? Math.sin(Math.min(1, drillT) * Math.PI) * 0.08 : 0)
                : isHammerTool ? (heavyActive ? 1.02 + heavyLandingBounce * 0.05 - heavyRebound * 0.005 : 1) : 1;
            const hammerTargetX = heavyActive ? heavyHammer.x : pointer.x + HAMMER_TARGET_OFFSET_X;
            const hammerTargetY = heavyActive ? heavyHammer.y : pointer.y + HAMMER_TARGET_OFFSET_Y;
            const hammerTopLeft = isHammerTool
                ? getHammerTopLeftForContact(hammerTargetX, hammerTargetY, HAMMER_CONTACT_ROTATION, finalScale)
                : { x: pointer.smoothX, y: pointer.smoothY };
            const cursorBaseX = isLaserTool && drillActive && laserDrill
                ? laserDrill.x
                : isLaserTool && laserCut.initialized
                ? laserCut.tipX
                : isHammerTool
                    ? hammerTopLeft.x
                    : pointer.smoothX;
            const cursorBaseY = isLaserTool && drillActive && laserDrill
                ? laserDrill.y
                : isLaserTool && laserCut.initialized
                ? laserCut.tipY
                : isHammerTool
                    ? hammerTopLeft.y
                    : pointer.smoothY;
            const finalOffset = "-10px";

            cursor.style.setProperty("--laser-blade-length", `${bladeLength}px`);
            cursor.style.setProperty("--laser-plunge", `${plunge}px`);
            cursor.style.setProperty("--laser-heat", `${0.72 + holdDepth * 0.46}`);
            cursor.style.setProperty("--laser-drill", `${drillActive ? 1 - smoothStep(0.68, 1, drillT) : 0}`);
            cursor.style.setProperty("--laser-twist", `${drillTwist * 0.18}deg`);
            cursor.style.setProperty("--hammer-shadow-opacity", "0");
            cursor.style.setProperty("--hammer-shadow-scale", "0");
            cursor.style.setProperty("--hammer-shock-opacity", "0");
            cursor.style.transform = isHammerTool
                ? `translate3d(${cursorBaseX}px, ${cursorBaseY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})`
                : `translate3d(${cursorBaseX}px, ${cursorBaseY}px, 0) translate(-50%, ${finalOffset}) rotate(${finalRotation}deg) scale(${finalScale})`;
            cursor.classList.toggle("laser-pressing", holdPress > 0);
            cursor.classList.toggle("laser-drilling", drillActive);
            cursor.classList.toggle("throwing", false);
        }
        const hammerAim = hammerAimRef.current;
        if (hammerAim) {
            const heavyHammer = heavyHammerSwingRef.current;
            const heavyAimElapsed = now - heavyHammer.startedAt;
            const heavyAimActive = heavyHammer.active && heavyAimElapsed >= 0 && heavyAimElapsed < HEAVY_HAMMER_SWING_MS;
            const visible = toolRef.current === "hammer" && (heavyAimActive || (pointer.x > -100 && pointer.y > -100));
            const aimT = heavyAimActive
                ? Math.min(1, heavyAimElapsed / HEAVY_HAMMER_IMPACT_DELAY_MS)
                : now - hammerSwingRef.current < HAMMER_SWING_MS ? Math.min(1, (now - hammerSwingRef.current) / HAMMER_SWING_MS) : 1;
            const preImpactT = Math.max(0, Math.min(1, aimT / HAMMER_CONTACT_T));
            const postImpactT = Math.max(0, Math.min(1, (aimT - HAMMER_CONTACT_T) / (1 - HAMMER_CONTACT_T)));
            const aimStrike = heavyAimActive
                ? easeOutCubic(aimT)
                : aimT < HAMMER_CONTACT_T ? easeOutCubic(preImpactT) : Math.max(0, 1 - easeOutCubic(postImpactT));
            const strikeAlpha = heavyAimActive ? 0.3 + aimStrike * 0.62 : 0.24 + aimStrike * 0.5;
            const aimScale = 0.82 + aimStrike * (heavyAimActive ? 0.36 : 0.24);
            const targetX = heavyAimActive ? heavyHammer.x : pointer.x + HAMMER_TARGET_OFFSET_X;
            const targetY = heavyAimActive ? heavyHammer.y : pointer.y + HAMMER_TARGET_OFFSET_Y;
            hammerAim.style.setProperty("--hammer-aim-scale", `${aimScale}`);
            hammerAim.style.setProperty("--hammer-aim-impact", `${aimStrike}`);
            hammerAim.style.opacity = visible ? `${strikeAlpha}` : "0";
            hammerAim.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(${aimScale})`;
        }

        rafRef.current = window.requestAnimationFrame(drawFrame);
    }, [commitLaserTrail, getEffectsContext, spawnFruitSplat, stampTickBite]);

    useEffect(() => {
        rafRef.current = window.requestAnimationFrame(drawFrame);
        return () => {
            if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
            if (impactCountFlushRef.current !== null) {
                window.cancelAnimationFrame(impactCountFlushRef.current);
                impactCountFlushRef.current = null;
            }
            hammerImpactTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            hammerImpactTimeoutsRef.current = [];
            heavyHammerSwingRef.current.active = false;
            clearPendingHammerShockwaves();
        };
    }, [clearPendingHammerShockwaves, drawFrame]);

    const spawnScreenEntity = useCallback((entity: Omit<ScreenEntity, "id">) => {
        entitiesRef.current = [
            ...entitiesRef.current,
            {
                ...entity,
                id: `entity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            },
        ].slice(-MAX_ENTITIES);
    }, []);

    const spawnDirectScreenChip = useCallback((x: number, y: number, angle: number, strength = 1): string | undefined => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return undefined;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (x - rect.x) / rect.scale;
        const imageY = (y - rect.y) / rect.scale;
        if (imageX < 0 || imageY < 0 || imageX >= workingCanvas.width || imageY >= workingCanvas.height) return undefined;

        const screenSize = Math.max(18, Math.min(34, 21 + strength * 5));
        const sourceSize = Math.max(8, Math.min(42, screenSize / rect.scale));
        const sourceX = Math.max(0, Math.min(workingCanvas.width - sourceSize, imageX - sourceSize / 2));
        const sourceY = Math.max(0, Math.min(workingCanvas.height - sourceSize, imageY - sourceSize / 2));
        const chipWidth = Math.max(8, Math.min(sourceSize, workingCanvas.width - sourceX));
        const chipHeight = Math.max(8, Math.min(sourceSize, workingCanvas.height - sourceY));
        const sampleX = Math.max(0, Math.min(workingCanvas.width - 1, Math.round(imageX)));
        const sampleY = Math.max(0, Math.min(workingCanvas.height - 1, Math.round(imageY)));
        const sample = workingCtx.getImageData(sampleX, sampleY, 1, 1).data;

        const base = {
            r: sample[0],
            g: sample[1],
            b: sample[2],
        };

        const chipCanvas = document.createElement("canvas");
        chipCanvas.width = Math.ceil(chipWidth);
        chipCanvas.height = Math.ceil(chipHeight);
        const chipCtx = chipCanvas.getContext("2d");
        if (!chipCtx) return undefined;

        const chipSeed = Math.floor((imageX * 13) + (imageY * 17) + strength * 101);
        const chipPointCount = 6 + Math.floor(flameNoise(chipSeed, 1.7) * 4);
        const chipPoints = Array.from({ length: chipPointCount }, (_, index) => {
            const pointCount = chipPointCount;
            const theta = (Math.PI * 2 * index) / pointCount + (flameNoise(chipSeed + 11, index) - 0.5) * 0.42;
            const r = 0.34 + flameNoise(chipSeed + 23, index) * 0.28;
            return {
                x: chipWidth * (0.5 + Math.cos(theta) * r),
                y: chipHeight * (0.5 + Math.sin(theta) * r),
            };
        });
        const traceChipPath = (ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0) => {
            ctx.beginPath();
            chipPoints.forEach((point, index) => {
                const px = offsetX + point.x;
                const py = offsetY + point.y;
                if (index === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.closePath();
        };

        chipCtx.save();
        traceChipPath(chipCtx);
        chipCtx.clip();
        chipCtx.drawImage(workingCanvas, sourceX, sourceY, chipWidth, chipHeight, 0, 0, chipWidth, chipHeight);
        chipCtx.restore();

        workingCtx.save();
        workingCtx.fillStyle = `rgb(${base.r},${base.g},${base.b})`;
        traceChipPath(workingCtx, sourceX, sourceY);
        workingCtx.fill();
        workingCtx.globalAlpha = 0.18;
        workingCtx.strokeStyle = `rgba(${base.r},${base.g},${base.b},0.9)`;
        workingCtx.lineWidth = Math.max(1, 1.4 / rect.scale);
        traceChipPath(workingCtx, sourceX, sourceY);
        workingCtx.stroke();
        workingCtx.restore();

        const launch = 4.4 + Math.max(0.2, Math.min(2.4, strength)) * 2.0;
        spawnScreenEntity({
            canvas: chipCanvas,
            x,
            y,
            width: chipWidth * rect.scale,
            height: chipHeight * rect.scale,
            vx: Math.cos(angle) * 1.9 + (Math.random() - 0.5) * 2.8,
            vy: -launch,
            rotation: (Math.random() - 0.5) * 0.2,
            spin: (Math.random() - 0.5) * 0.26,
            life: 320,
            maxLife: 320,
            gravity: 0.2,
            bounces: 0,
        });

        return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
    }, [spawnScreenEntity]);

    const spawnFallbackShards = useCallback((
        x: number,
        y: number,
        imageX: number,
        imageY: number,
        rect: ReturnType<typeof getBackgroundDrawRect>,
        workingCanvas: HTMLCanvasElement,
        workingCtx: CanvasRenderingContext2D,
        base: { r: number; g: number; b: number },
        patchBackground: boolean,
        cleanPatch = false,
    ): string | undefined => {
        const shardSize = Math.max(10, Math.min(24, 17 / rect.scale));
        const sampleX = Math.max(0, Math.min(workingCanvas.width - 1, Math.round(imageX)));
        const sampleY = Math.max(0, Math.min(workingCanvas.height - 1, Math.round(imageY)));
        const sample = workingCtx.getImageData(sampleX, sampleY, 1, 1).data;
        const fallbackChance = patchBackground ? 1 : 0.18;
        if (Math.random() > fallbackChance) {
            return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
        }
        const placements = [
            { dx: 0, dy: 0, vx: (Math.random() - 0.5) * 2.4, vy: -3.8 - Math.random() * 1.4, spin: (Math.random() - 0.5) * 0.14 },
        ];

        for (const [index, placement] of placements.entries()) {
            const sourceX = Math.max(0, Math.min(workingCanvas.width - shardSize, imageX + placement.dx * shardSize));
            const sourceY = Math.max(0, Math.min(workingCanvas.height - shardSize, imageY + placement.dy * shardSize));
            const sourceSize = Math.max(8, Math.min(shardSize, workingCanvas.width - sourceX, workingCanvas.height - sourceY));
            const shardCanvas = document.createElement("canvas");
            shardCanvas.width = Math.ceil(sourceSize);
            shardCanvas.height = Math.ceil(sourceSize);
            const shardCtx = shardCanvas.getContext("2d");
            if (!shardCtx) continue;

            const drawShardPath = (ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0) => {
                ctx.beginPath();
                if (index === 0) {
                    ctx.moveTo(offsetX + sourceSize * 0.12, offsetY + sourceSize * 0.16);
                    ctx.lineTo(offsetX + sourceSize * 0.62, offsetY + sourceSize * 0.04);
                    ctx.lineTo(offsetX + sourceSize * 0.94, offsetY + sourceSize * 0.4);
                    ctx.lineTo(offsetX + sourceSize * 0.46, offsetY + sourceSize * 0.86);
                    ctx.lineTo(offsetX + sourceSize * 0.18, offsetY + sourceSize * 0.72);
                } else if (index === 1) {
                    ctx.moveTo(offsetX + sourceSize * 0.48, offsetY + sourceSize * 0.06);
                    ctx.lineTo(offsetX + sourceSize * 0.9, offsetY + sourceSize * 0.46);
                    ctx.lineTo(offsetX + sourceSize * 0.72, offsetY + sourceSize * 0.9);
                    ctx.lineTo(offsetX + sourceSize * 0.12, offsetY + sourceSize * 0.86);
                    ctx.lineTo(offsetX + sourceSize * 0.24, offsetY + sourceSize * 0.3);
                } else {
                    ctx.moveTo(offsetX + sourceSize * 0.08, offsetY + sourceSize * 0.32);
                    ctx.lineTo(offsetX + sourceSize * 0.66, offsetY + sourceSize * 0.1);
                    ctx.lineTo(offsetX + sourceSize * 0.92, offsetY + sourceSize * 0.62);
                    ctx.lineTo(offsetX + sourceSize * 0.58, offsetY + sourceSize * 0.92);
                    ctx.lineTo(offsetX + sourceSize * 0.2, offsetY + sourceSize * 0.78);
                }
                ctx.closePath();
            };

            shardCtx.save();
            drawShardPath(shardCtx);
            shardCtx.clip();
            shardCtx.drawImage(workingCanvas, sourceX, sourceY, sourceSize, sourceSize, 0, 0, sourceSize, sourceSize);
            shardCtx.globalCompositeOperation = "screen";
            shardCtx.strokeStyle = "rgba(255,255,255,0.24)";
            shardCtx.lineWidth = Math.max(0.7, sourceSize * 0.035);
            shardCtx.stroke();
            shardCtx.restore();

            if (patchBackground) {
                workingCtx.save();
                workingCtx.globalAlpha = cleanPatch ? 0.94 : 0.82;
                workingCtx.fillStyle = `rgb(${base.r},${base.g},${base.b})`;
                drawShardPath(workingCtx, sourceX, sourceY);
                workingCtx.fill();
                workingCtx.restore();
            }

            spawnScreenEntity({
                canvas: shardCanvas,
                x: x + placement.dx * shardSize * rect.scale,
                y: y + placement.dy * shardSize * rect.scale,
                width: sourceSize * rect.scale,
                height: sourceSize * rect.scale,
                vx: placement.vx,
                vy: placement.vy,
                rotation: (Math.random() - 0.5) * 0.34,
                spin: placement.spin,
                life: patchBackground ? 320 : 110,
                maxLife: patchBackground ? 320 : 110,
                gravity: patchBackground ? 0.17 : 0.14,
                bounces: 0,
            });
        }

        return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
    }, [spawnScreenEntity]);

    const primeImageCache = useCallback((x: number, y: number, radius: number) => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (x - rect.x) / rect.scale;
        const imageY = (y - rect.y) / rect.scale;

        const cropRadius = Math.ceil(radius / rect.scale) + 16;
        const cropX = Math.max(0, Math.floor(imageX - cropRadius));
        const cropY = Math.max(0, Math.floor(imageY - cropRadius));
        const cropRight = Math.min(workingCanvas.width, Math.ceil(imageX + cropRadius));
        const cropBottom = Math.min(workingCanvas.height, Math.ceil(imageY + cropRadius));
        const cropWidth = cropRight - cropX;
        const cropHeight = cropBottom - cropY;

        if (cropWidth <= 0 || cropHeight <= 0) return;

        try {
            const data = workingCtx.getImageData(cropX, cropY, cropWidth, cropHeight);
            imageCacheRef.current = {
                data,
                cropX,
                cropY,
                timestamp: performance.now()
            };
        } catch (e) {
            console.error("Failed to prime image cache", e);
        }
    }, []);

    const extractEntityAtImpact = useCallback((x: number, y: number, radius: number, patchBackground = true, spawnEntity = true, initVx?: number, initVy?: number, shakeLife?: number, cleanPatch = false, detailOnly = false): string | undefined => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return undefined;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (x - rect.x) / rect.scale;
        const imageY = (y - rect.y) / rect.scale;
        if (imageX < 0 || imageY < 0 || imageX >= workingCanvas.width || imageY >= workingCanvas.height) return undefined;

        const cropRadius = Math.max(18, Math.min(cleanPatch ? 132 : 48, radius / rect.scale));
        const cropX = Math.max(0, Math.floor(imageX - cropRadius));
        const cropY = Math.max(0, Math.floor(imageY - cropRadius));
        const cropRight = Math.min(workingCanvas.width, Math.ceil(imageX + cropRadius));
        const cropBottom = Math.min(workingCanvas.height, Math.ceil(imageY + cropRadius));
        const cropWidth = cropRight - cropX;
        const cropHeight = cropBottom - cropY;
        if (cropWidth < 6 || cropHeight < 6) return undefined;

        let imageData: ImageData | null = null;
        let cache = imageCacheRef.current;
        const now = performance.now();
        const hasCache = cache &&
            now - cache.timestamp < 1000 &&
            cropX >= cache.cropX &&
            cropY >= cache.cropY &&
            (cropX + cropWidth) <= (cache.cropX + cache.data.width) &&
            (cropY + cropHeight) <= (cache.cropY + cache.data.height);

        if (
            cache &&
            now - cache.timestamp < 1000 &&
            cropX >= cache.cropX &&
            cropY >= cache.cropY &&
            (cropX + cropWidth) <= (cache.cropX + cache.data.width) &&
            (cropY + cropHeight) <= (cache.cropY + cache.data.height)
        ) {
            try {
                imageData = workingCtx.createImageData(cropWidth, cropHeight);
                const sourceData = cache.data.data;
                const targetData = imageData.data;
                const cacheWidth = cache.data.width;
                const startX = cropX - cache.cropX;
                const startY = cropY - cache.cropY;
                for (let py = 0; py < cropHeight; py += 1) {
                    const sourceOffset = ((startY + py) * cacheWidth + startX) * 4;
                    const targetOffset = py * cropWidth * 4;
                    const length = cropWidth * 4;
                    targetData.set(sourceData.subarray(sourceOffset, sourceOffset + length), targetOffset);
                }
            } catch (e) {
                console.error("Failed to read from image cache", e);
                imageData = null;
            }
        }

        if (!imageData) {
            imageData = workingCtx.getImageData(cropX, cropY, cropWidth, cropHeight);
        }

        const data = imageData.data;
        let br = 0;
        let bg = 0;
        let bb = 0;
        let borderCount = 0;
        for (let py = 0; py < cropHeight; py += 1) {
            for (let px = 0; px < cropWidth; px += 1) {
                if (px !== 0 && py !== 0 && px !== cropWidth - 1 && py !== cropHeight - 1) continue;
                const offset = (py * cropWidth + px) * 4;
                br += data[offset];
                bg += data[offset + 1];
                bb += data[offset + 2];
                borderCount += 1;
            }
        }

        const base = {
            r: br / Math.max(1, borderCount),
            g: bg / Math.max(1, borderCount),
            b: bb / Math.max(1, borderCount),
        };
        const baseLum = luminance(base.r, base.g, base.b);
        const mask = new Uint8Array(cropWidth * cropHeight);
        const confidence = new Uint8Array(cropWidth * cropHeight);
        let minX = cropWidth;
        let minY = cropHeight;
        let maxX = -1;
        let maxY = -1;
        let kept = 0;
        const centerX = imageX - cropX;
        const centerY = imageY - cropY;

        for (let py = 0; py < cropHeight; py += 1) {
            for (let px = 0; px < cropWidth; px += 1) {
                const offset = (py * cropWidth + px) * 4;
                const r = data[offset];
                const g = data[offset + 1];
                const b = data[offset + 2];
                
                const dr = r - base.r;
                const dg = g - base.g;
                const db = b - base.b;
                const distSq = dr * dr + dg * dg + db * db;
                
                const centerFalloff = Math.max(0, 1 - (Math.hypot(px - centerX, py - centerY) / cropRadius));
                const threshold = 34 + (1 - centerFalloff) * 22;
                const thresholdSq = threshold * threshold;
                const localSaturation = saturation(r, g, b);
                const lumDelta = Math.abs(luminance(r, g, b) - baseLum);
                
                const strongPixel = distSq > thresholdSq || lumDelta > threshold * 0.82 || (localSaturation > 46 && distSq > 529);
                if (strongPixel) {
                    const dist = Math.sqrt(distSq);
                    const leftOffset = (py * cropWidth + Math.max(0, px - 1)) * 4;
                    const rightOffset = (py * cropWidth + Math.min(cropWidth - 1, px + 1)) * 4;
                    const upOffset = (Math.max(0, py - 1) * cropWidth + px) * 4;
                    const downOffset = (Math.min(cropHeight - 1, py + 1) * cropWidth + px) * 4;
                    const edge = Math.max(
                        Math.abs(luminance(data[leftOffset], data[leftOffset + 1], data[leftOffset + 2]) - luminance(data[rightOffset], data[rightOffset + 1], data[rightOffset + 2])),
                        Math.abs(luminance(data[upOffset], data[upOffset + 1], data[upOffset + 2]) - luminance(data[downOffset], data[downOffset + 1], data[downOffset + 2])),
                    );
                    const detailPixel = (dist > threshold || lumDelta > threshold * 0.82 || (localSaturation > 46 && dist > 23)) && (edge > 12 || centerFalloff > 0.56 || dist > threshold + 18);
                    if (detailPixel) {
                        const id = py * cropWidth + px;
                        mask[id] = 1;
                        confidence[id] = Math.max(1, Math.min(255, Math.round(dist + edge + lumDelta)));
                        minX = Math.min(minX, px);
                        minY = Math.min(minY, py);
                        maxX = Math.max(maxX, px);
                        maxY = Math.max(maxY, py);
                        kept += 1;
                    }
                }
            }
        }

        if (kept < 18 || maxX - minX < 3 || maxY - minY < 3) {
            if (detailOnly) return undefined;
            return spawnEntity
                ? spawnFallbackShards(x, y, imageX, imageY, rect, workingCanvas, workingCtx, base, patchBackground, cleanPatch)
                : undefined;
        }

        let seedId = -1;
        let seedDistance = Number.POSITIVE_INFINITY;
        for (let py = 0; py < cropHeight; py += 1) {
            for (let px = 0; px < cropWidth; px += 1) {
                const id = py * cropWidth + px;
                if (mask[id] !== 1) continue;
                const distance = Math.hypot(px - centerX, py - centerY);
                const score = distance - (confidence[id] / 255) * cropRadius * 0.34;
                if (score < seedDistance) {
                    seedDistance = score;
                    seedId = id;
                }
            }
        }
        const seedX = seedId % cropWidth;
        const seedY = Math.floor(seedId / cropWidth);
        if (seedId === -1 || Math.hypot(seedX - centerX, seedY - centerY) > cropRadius * 0.76) {
            if (detailOnly) return undefined;
            return spawnEntity
                ? spawnFallbackShards(x, y, imageX, imageY, rect, workingCanvas, workingCtx, base, patchBackground, cleanPatch)
                : undefined;
        }

        const connectedMask = new Uint8Array(cropWidth * cropHeight);
        const queue = [seedId];
        connectedMask[seedId] = 1;
        for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
            const id = queue[queueIndex];
            const px = id % cropWidth;
            const py = Math.floor(id / cropWidth);
            for (let dy = -1; dy <= 1; dy += 1) {
                for (let dx = -1; dx <= 1; dx += 1) {
                    if (dx === 0 && dy === 0) continue;
                    const nextX = px + dx;
                    const nextY = py + dy;
                    if (nextX < 0 || nextY < 0 || nextX >= cropWidth || nextY >= cropHeight) continue;
                    const nextId = nextY * cropWidth + nextX;
                    if (connectedMask[nextId] === 1 || mask[nextId] !== 1) continue;
                    connectedMask[nextId] = 1;
                    queue.push(nextId);
                }
            }
        }

        minX = cropWidth;
        minY = cropHeight;
        maxX = -1;
        maxY = -1;
        kept = 0;
        for (let py = 0; py < cropHeight; py += 1) {
            for (let px = 0; px < cropWidth; px += 1) {
                const id = py * cropWidth + px;
                mask[id] = connectedMask[id];
                if (mask[id] !== 1) continue;
                minX = Math.min(minX, px);
                minY = Math.min(minY, py);
                maxX = Math.max(maxX, px);
                maxY = Math.max(maxY, py);
                kept += 1;
            }
        }

        const componentWidth = maxX - minX + 1;
        const componentHeight = maxY - minY + 1;
        const componentArea = componentWidth * componentHeight;
        const componentFill = kept / Math.max(1, componentArea);
        const cropArea = cropWidth * cropHeight;
        const aspect = Math.max(componentWidth / Math.max(1, componentHeight), componentHeight / Math.max(1, componentWidth));
        const looksLikeBackgroundBlock = kept > cropArea * 0.2
            || componentWidth > cropRadius * 1.34
            || componentHeight > cropRadius * 1.34
            || (componentFill > 0.78 && componentArea > 420);
        const looksLikeClearDetail = !detailOnly
            || (
                kept >= 20
                && componentArea <= cropArea * 0.12
                && componentArea <= 2600
                && componentFill >= 0.08
                && componentFill <= 0.72
                && aspect <= 8.5
            );

        if (kept < 18 || componentWidth < 3 || componentHeight < 3 || looksLikeBackgroundBlock || !looksLikeClearDetail) {
            if (detailOnly) return undefined;
            return spawnEntity
                ? spawnFallbackShards(x, y, imageX, imageY, rect, workingCanvas, workingCtx, base, patchBackground, cleanPatch)
                : undefined;
        }

        const padding = detailOnly ? 0 : cleanPatch ? 4 : 1;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(cropWidth - 1, maxX + padding);
        maxY = Math.min(cropHeight - 1, maxY + padding);
        const sampleOffset = (Math.max(0, Math.min(cropHeight - 1, Math.round(centerY))) * cropWidth + Math.max(0, Math.min(cropWidth - 1, Math.round(centerX)))) * 4;
        const sampledColor = `rgb(${data[sampleOffset]},${data[sampleOffset + 1]},${data[sampleOffset + 2]})`;

        if (!spawnEntity) return sampledColor;

        const entityImageWidth = maxX - minX + 1;
        const entityImageHeight = maxY - minY + 1;
        const entityCanvas = document.createElement("canvas");
        entityCanvas.width = entityImageWidth;
        entityCanvas.height = entityImageHeight;
        const entityCtx = entityCanvas.getContext("2d");
        if (!entityCtx) return sampledColor;

        const entityData = entityCtx.createImageData(entityImageWidth, entityImageHeight);
        const patchData = patchBackground
            ? workingCtx.createImageData(entityImageWidth, entityImageHeight)
            : null;
        const softMask = new Uint8Array(entityImageWidth * entityImageHeight);
        let visiblePixels = 0;
        for (let py = 0; py < entityImageHeight; py += 1) {
            for (let px = 0; px < entityImageWidth; px += 1) {
                const sourceX = minX + px;
                const sourceY = minY + py;
                const sourceId = sourceY * cropWidth + sourceX;
                if (mask[sourceId] !== 1) continue;
                let neighbors = 0;
                for (let dy = -1; dy <= 1; dy += 1) {
                    for (let dx = -1; dx <= 1; dx += 1) {
                        const nextX = sourceX + dx;
                        const nextY = sourceY + dy;
                        if (nextX < 0 || nextY < 0 || nextX >= cropWidth || nextY >= cropHeight) continue;
                        neighbors += mask[nextY * cropWidth + nextX];
                    }
                }
                const localConfidence = confidence[sourceId] / 255;
                const alpha = neighbors >= 8 ? 255 : neighbors >= 6 ? 198 : neighbors >= 4 ? 118 : 0;
                const sourceOffset = sourceId * 4;
                const r = data[sourceOffset];
                const g = data[sourceOffset + 1];
                const b = data[sourceOffset + 2];
                const foregroundDistance = colorDistance(r, g, b, base);
                const foregroundLuma = Math.abs(luminance(r, g, b) - baseLum);
                const foregroundStrength = Math.max(
                    smoothStep(24, 72, foregroundDistance),
                    smoothStep(18, 58, foregroundLuma),
                    saturation(r, g, b) > 48 ? smoothStep(18, 48, foregroundDistance) : 0,
                    localConfidence,
                );
                const edgeNoise = ((Math.sin(((cropX + sourceX) * 12.9898) + ((cropY + sourceY) * 78.233)) * 43758.5453) % 1 + 1) % 1;
                const edgeDissolve = neighbors >= 8 ? 1 : edgeNoise > 0.26 ? 1 : 0.38;
                const rawAlpha = Math.round(alpha * Math.max(0, Math.min(1, foregroundStrength)) * edgeDissolve);
                const mattedAlpha = detailOnly && rawAlpha < 92 ? 0 : rawAlpha;
                softMask[py * entityImageWidth + px] = mattedAlpha;
                if (mattedAlpha > 28) visiblePixels += 1;
            }
        }

        if (visiblePixels < 10) {
            if (detailOnly) return undefined;
            return sampledColor;
        }

        const hasSoftMaskNeighbor = (px: number, py: number, radius: number): boolean => {
            const minCheckX = Math.max(0, px - radius);
            const maxCheckX = Math.min(entityImageWidth - 1, px + radius);
            const minCheckY = Math.max(0, py - radius);
            const maxCheckY = Math.min(entityImageHeight - 1, py + radius);
            for (let checkY = minCheckY; checkY <= maxCheckY; checkY += 1) {
                for (let checkX = minCheckX; checkX <= maxCheckX; checkX += 1) {
                    if (softMask[(checkY * entityImageWidth) + checkX] > 28) return true;
                }
            }
            return false;
        };

        for (let py = 0; py < entityImageHeight; py += 1) {
            for (let px = 0; px < entityImageWidth; px += 1) {
                const sourceX = minX + px;
                const sourceY = minY + py;
                const sourceId = sourceY * cropWidth + sourceX;
                const sourceOffset = sourceId * 4;
                const targetOffset = (py * entityImageWidth + px) * 4;
                const alpha = softMask[py * entityImageWidth + px];
                entityData.data[targetOffset] = data[sourceOffset];
                entityData.data[targetOffset + 1] = data[sourceOffset + 1];
                entityData.data[targetOffset + 2] = data[sourceOffset + 2];
                entityData.data[targetOffset + 3] = alpha;
                if (patchData) {
                    patchData.data[targetOffset] = data[sourceOffset];
                    patchData.data[targetOffset + 1] = data[sourceOffset + 1];
                    patchData.data[targetOffset + 2] = data[sourceOffset + 2];
                    patchData.data[targetOffset + 3] = data[sourceOffset + 3];
                }
                if ((alpha > 0 || (cleanPatch && hasSoftMaskNeighbor(px, py, 3))) && patchData) {
                    const blend = cleanPatch ? 1 : Math.min(0.86, alpha / 255);
                    patchData.data[targetOffset] = patchData.data[targetOffset] * (1 - blend) + base.r * blend;
                    patchData.data[targetOffset + 1] = patchData.data[targetOffset + 1] * (1 - blend) + base.g * blend;
                    patchData.data[targetOffset + 2] = patchData.data[targetOffset + 2] * (1 - blend) + base.b * blend;
                    patchData.data[targetOffset + 3] = 255;
                }
            }
        }

        entityCtx.putImageData(entityData, 0, 0);
        if (patchData) {
            workingCtx.putImageData(patchData, cropX + minX, cropY + minY);
            if (!cleanPatch) {
                workingCtx.save();
                workingCtx.globalAlpha = 0.16;
                workingCtx.filter = "blur(1.6px)";
                workingCtx.drawImage(workingCanvas, cropX + minX, cropY + minY, entityImageWidth, entityImageHeight, cropX + minX, cropY + minY, entityImageWidth, entityImageHeight);
                workingCtx.restore();
            }
        }
        const entityVisualScale = patchBackground ? 0.84 : 0.92;
        const entityWidth = entityImageWidth * rect.scale * entityVisualScale;
        const entityHeight = entityImageHeight * rect.scale * entityVisualScale;
        const initialX = rect.x + ((cropX + minX + entityImageWidth / 2) * rect.scale);
        const initialY = rect.y + ((cropY + minY + entityImageHeight / 2) * rect.scale);
        spawnScreenEntity({
            canvas: entityCanvas,
            x: initialX,
            y: initialY,
            width: entityWidth,
            height: entityHeight,
            vx: initVx !== undefined ? initVx + (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * (patchBackground ? 1.85 : 1.28),
            vy: initVy !== undefined ? initVy + (Math.random() - 0.5) * 0.8 : (patchBackground ? 0.05 : 0.12) + Math.random() * 0.38,
            rotation: 0,
            spin: (Math.random() - 0.5) * (patchBackground ? 0.055 : 0.038),
            life: (patchBackground ? 340 : 120) + (shakeLife ?? 0),
            maxLife: (patchBackground ? 340 : 120) + (shakeLife ?? 0),
            gravity: patchBackground ? 0.17 : 0.13,
            shakeLife,
            originalX: initialX,
            originalY: initialY,
            bounces: 0,
        });

        return sampledColor;
    }, [spawnFallbackShards, spawnScreenEntity]);

    const enqueueHammerExtraction = useCallback((task: Omit<PendingScreenExtraction, "dueAt">, delay = 0) => {
        while (hammerExtractionQueueRef.current.length >= MAX_LETTER_KNOCK_QUEUE) {
            hammerExtractionQueueRef.current.shift();
        }
        hammerExtractionQueueRef.current.push({
            ...task,
            dueAt: performance.now() + Math.max(delay, HAMMER_EXTRACTION_MIN_DELAY_MS),
        });

        const scheduleDrain = (waitMs = 0): void => {
            if (hammerExtractionScheduleRef.current !== null) return;

            const runDrain = (deadline?: IdleDeadlineLike): void => {
                hammerExtractionScheduleRef.current = null;
                const now = performance.now();
                const queue = hammerExtractionQueueRef.current;
                const dueIndex = queue.findIndex((item) => item.dueAt <= now);
                const hasBudget = !deadline || deadline.didTimeout || deadline.timeRemaining() >= HAMMER_EXTRACTION_MIN_IDLE_MS;
                if (dueIndex >= 0 && hasBudget) {
                    const [next] = queue.splice(dueIndex, 1);
                    extractEntityAtImpact(
                        next.x,
                        next.y,
                        next.radius,
                        next.patchBackground,
                        next.spawnEntity,
                        next.initVx,
                        next.initVy,
                        next.shakeLife,
                        false,
                        next.detailOnly,
                    );
                }

                if (queue.length > 0) {
                    const nextDueAt = queue.reduce((earliest, item) => Math.min(earliest, item.dueAt), Number.POSITIVE_INFINITY);
                    scheduleDrain(Math.max(0, Math.min(48, nextDueAt - performance.now())));
                }
            };

            if (waitMs > 0) {
                const id = window.setTimeout(() => {
                    hammerExtractionScheduleRef.current = null;
                    scheduleDrain();
                }, waitMs);
                hammerExtractionScheduleRef.current = { id, type: "timeout" };
                return;
            }

            const idleWindow = window as HammerExtractionWindow;
            if (idleWindow.requestIdleCallback) {
                const id = idleWindow.requestIdleCallback(runDrain, { timeout: HAMMER_EXTRACTION_IDLE_TIMEOUT_MS });
                hammerExtractionScheduleRef.current = { id, type: "idle" };
                return;
            }

            const id = window.setTimeout(() => runDrain(), 24);
            hammerExtractionScheduleRef.current = { id, type: "timeout" };
        };

        const queue = hammerExtractionQueueRef.current;
        const nextDueAt = queue.reduce((earliest, item) => Math.min(earliest, item.dueAt), Number.POSITIVE_INFINITY);
        scheduleDrain(Math.max(0, Math.min(48, nextDueAt - performance.now())));
    }, [extractEntityAtImpact]);

    const knockScreenLettersLoose = useCallback((
        x: number,
        y: number,
        angle: number,
        strength = 1,
        source: "splash" | "hammer" | "scatter" | "laser" = "hammer",
    ): void => {
        const now = performance.now();
        const minInterval = source === "splash" ? 96 : source === "laser" ? 82 : 72;
        if (now - lastLetterKnockRef.current[source] < minInterval) return;
        lastLetterKnockRef.current[source] = now;

        const power = clampValue(strength, 0.2, 2.4);
        const sideX = Math.cos(angle + Math.PI / 2);
        const sideY = Math.sin(angle + Math.PI / 2);
        const forwardX = Math.cos(angle);
        const forwardY = Math.sin(angle);
        const spread = source === "splash" ? 16 + power * 9 : 24 + power * 18;
        const count = source === "splash" ? 2 : source === "hammer" ? 2 : source === "scatter" ? 2 : 3;
        addScreenHitPulse(x, y, angle, source);
        if (source !== "splash") {
            spawnDirectScreenChip(x, y, angle, power);
        }

        for (let index = source === "splash" ? 0 : 1; index < count; index += 1) {
            const centered = index - (count - 1) / 2;
            const jitter = (Math.random() - 0.5) * spread * 0.32;
            const sampleX = x + sideX * (centered * spread + jitter) + forwardX * (index * 7);
            const sampleY = y + sideY * (centered * spread + jitter) + forwardY * (index * 7);
            const launch = source === "hammer"
                ? 3.8 + power * 2.8
                : source === "scatter"
                    ? 6.4 + power * 2.8
                    : source === "laser"
                        ? 3.2 + power * 2.5
                        : 4.7 + power * 3.6;
            if (source === "splash") {
                continue;
            }
            enqueueHammerExtraction({
                x: sampleX,
                y: sampleY,
                radius: 30 + power * 17,
                patchBackground: true,
                spawnEntity: true,
                initVx: forwardX * launch + sideX * centered * 0.8,
                initVy: forwardY * launch - (source === "hammer" ? 3.1 : 1.1) + Math.random() * 0.7,
                shakeLife: 0,
                detailOnly: true,
            }, index * 18);
        }
    }, [addScreenHitPulse, enqueueHammerExtraction, spawnDirectScreenChip]);

    const resetSplashArea = useCallback((x: number, y: number, angle: number, pressure = 0.5): void => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const background = backgroundImageRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface) return;

        const power = clampValue(pressure, 0, 1);
        const radiusX = 72 + power * 104;
        const radiusY = radiusX * 0.56;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const inSplash = (px: number, py: number, extra = 0): boolean => {
            const dx = px - x;
            const dy = py - y;
            const localX = dx * cos + dy * sin;
            const localY = -dx * sin + dy * cos;
            const rx = radiusX + extra;
            const ry = radiusY + extra * 0.56;
            return ((localX * localX) / (rx * rx)) + ((localY * localY) / (ry * ry)) <= 1;
        };

        if (workingCanvas && workingCtx && background) {
            const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
            const imageX = (x - rect.x) / rect.scale;
            const imageY = (y - rect.y) / rect.scale;
            if (imageX >= 0 && imageY >= 0 && imageX < workingCanvas.width && imageY < workingCanvas.height) {
                const sourceRadiusX = radiusX / rect.scale;
                const sourceRadiusY = radiusY / rect.scale;
                const pad = Math.ceil(Math.max(sourceRadiusX, sourceRadiusY) + 4);
                const patchX = Math.max(0, Math.floor(imageX - pad));
                const patchY = Math.max(0, Math.floor(imageY - pad));
                const patchRight = Math.min(workingCanvas.width, Math.ceil(imageX + pad));
                const patchBottom = Math.min(workingCanvas.height, Math.ceil(imageY + pad));
                const patchWidth = patchRight - patchX;
                const patchHeight = patchBottom - patchY;
                if (patchWidth > 2 && patchHeight > 2) {
                    workingCtx.save();
                    workingCtx.beginPath();
                    workingCtx.translate(imageX, imageY);
                    workingCtx.rotate(angle);
                    workingCtx.ellipse(0, 0, sourceRadiusX, sourceRadiusY, 0, 0, Math.PI * 2);
                    workingCtx.clip();
                    workingCtx.setTransform(1, 0, 0, 1, 0, 0);
                    workingCtx.drawImage(background, patchX, patchY, patchWidth, patchHeight, patchX, patchY, patchWidth, patchHeight);
                    workingCtx.restore();
                }
            }
        }

        const effectsCanvas = effectsCanvasRef.current;
        const effectsCtx = effectsContextRef.current;
        if (effectsCanvas && effectsCtx) {
            const dpr = effectsCanvas.width / Math.max(1, surface.clientWidth);
            effectsCtx.save();
            effectsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            effectsCtx.globalCompositeOperation = "destination-out";
            effectsCtx.translate(x, y);
            effectsCtx.rotate(angle);
            effectsCtx.beginPath();
            effectsCtx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
            effectsCtx.fillStyle = "rgba(0,0,0,1)";
            effectsCtx.fill();
            effectsCtx.restore();
        }

        const beforeImpacts = impactsRef.current.length;
        const beforeTicks = activeTicksRef.current.length;
        impactsRef.current = impactsRef.current.filter((impact) => !inSplash(impact.x, impact.y, impact.radius ?? 0));
        particlesRef.current = particlesRef.current.filter((particle) => !inSplash(particle.x, particle.y, 18));
        entitiesRef.current = entitiesRef.current.filter((entity) => !inSplash(entity.x, entity.y, Math.max(entity.width, entity.height) * 0.52));
        activeFlamesRef.current = activeFlamesRef.current.filter((flame) => !inSplash(flame.x, flame.y, flame.radius));
        burnResiduesRef.current = burnResiduesRef.current.filter((residue) => !inSplash(residue.x, residue.y, residue.radius));
        fruitSplatsRef.current = fruitSplatsRef.current.filter((splat) => !inSplash(splat.x, splat.y, splat.radius));
        fruitProjectilesRef.current = fruitProjectilesRef.current.filter((projectile) => !inSplash(projectile.x, projectile.y, projectile.radius));
        skeletonShardsRef.current = skeletonShardsRef.current.filter((shard) => !inSplash(shard.x, shard.y, Math.max(shard.length, shard.width)));
        activeArrowsRef.current = activeArrowsRef.current.filter((arrow) => !inSplash(arrow.x, arrow.y, arrow.radius));
        activeWebsRef.current = activeWebsRef.current.filter((web) => !inSplash(web.x, web.y, web.radius));
        screenHitPulsesRef.current = screenHitPulsesRef.current.filter((pulse) => !inSplash(pulse.x, pulse.y, 26));
        activeTicksRef.current = activeTicksRef.current.filter((tick) => !inSplash(tick.x, tick.y, tick.size * 1.8));
        laserSparksRef.current = laserSparksRef.current.filter((spark) => !inSplash(spark.x, spark.y, 16));
        laserDrillsRef.current = laserDrillsRef.current.filter((drill) => !inSplash(drill.x, drill.y, 28));
        laserTrailRef.current = laserTrailRef.current.filter((segment) => !inSplash((segment.startX + segment.endX) * 0.5, (segment.startY + segment.endY) * 0.5, segment.width + Math.hypot(segment.endX - segment.startX, segment.endY - segment.startY) * 0.2));
        hammerExtractionQueueRef.current = hammerExtractionQueueRef.current.filter((task) => !inSplash(task.x, task.y, task.radius));

        const removedCount = (beforeImpacts - impactsRef.current.length) + (beforeTicks - activeTicksRef.current.length);
        if (removedCount > 0 && performance.now() - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
            lastImpactCountUpdateRef.current = performance.now();
            queueImpactCount((count) => Math.max(0, count - removedCount));
        }
    }, [queueImpactCount]);

    const applySplashPressure = useCallback((x: number, y: number, angle: number, pressure = 0.5): string | undefined => {
        const power = Math.max(0, Math.min(1, pressure));
        const sample: string | undefined = undefined;
        const now = performance.now();
        const lastReset = lastSplashResetRef.current;
        const moved = Math.hypot(x - lastReset.x, y - lastReset.y);
        const angleChanged = Math.abs(Math.atan2(Math.sin(angle - lastReset.angle), Math.cos(angle - lastReset.angle)));
        const shouldReset = now - lastReset.at >= SPLASH_RESET_MIN_MS
            || moved >= SPLASH_RESET_MIN_DISTANCE
            || angleChanged >= SPLASH_RESET_MIN_ANGLE;

        if (shouldReset) {
            resetSplashArea(x, y, angle, power);
            knockScreenLettersLoose(x, y, angle, 0.5 + power, "splash");
            lastSplashResetRef.current = { x, y, angle, at: now };
        }

        const tickReach = 48 + power * 82;
        particlesRef.current = particlesRef.current.filter((particle) => {
            if (!particle.glyph) return true;
            return Math.hypot(particle.x - x, particle.y - y) > tickReach;
        });

        entitiesRef.current = entitiesRef.current.map((entity) => {
            const dx = entity.x - x;
            const dy = entity.y - y;
            const dist = Math.hypot(dx, dy);
            const reach = 110 + power * 110;
            if (dist > reach) return entity;
            const influence = 1 - dist / reach;
            return {
                ...entity,
                vx: entity.vx + Math.cos(angle) * influence * (2.8 + power * 4.6) + (Math.random() - 0.5) * influence * 1.4,
                vy: entity.vy + (Math.sin(angle) * 0.45 + 1.3) * influence * (2.2 + power * 4.2),
                spin: entity.spin + (Math.random() - 0.5) * influence * 0.18,
                life: Math.max(entity.life, 86),
                maxLife: Math.max(entity.maxLife, 86),
            };
        });

        if (shouldReset || now - lastReset.at > SPLASH_EMIT_MS * 0.9) {
            appendCapped(particlesRef.current, createParticlesForTool("splash", x, y, sample, angle).slice(0, 2), MAX_PARTICLES);
        }

        return sample;
    }, [knockScreenLettersLoose, resetSplashArea]);

    useEffect(() => {
        applySplashPressureRef.current = applySplashPressure;
        return () => {
            applySplashPressureRef.current = null;
        };
    }, [applySplashPressure]);

    const applyHammerImpactToScreen = useCallback((x: number, y: number, radius: number, heavy = false): string | undefined => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return undefined;
        clearPendingHammerShockwaves();
        screenShakeRef.current.intensity = 0;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        
        const imageX = (x - rect.x) / rect.scale;
        const imageY = (y - rect.y) / rect.scale;
        if (imageX < 0 || imageY < 0 || imageX >= workingCanvas.width || imageY >= workingCanvas.height) return undefined;

        const sampleX = Math.max(0, Math.min(workingCanvas.width - 1, Math.round(imageX)));
        const sampleY = Math.max(0, Math.min(workingCanvas.height - 1, Math.round(imageY)));
        const sample = workingCtx.getImageData(sampleX, sampleY, 1, 1).data;
        const crackSprite = spritesRef.current.glassCrack;
        const crackScreenSize = clampValue(radius * (heavy ? 6.35 : 3.05), heavy ? 430 : 126, heavy ? 720 : 230);
        const crackSize = crackScreenSize / rect.scale;

        workingCtx.save();
        if (crackSprite?.complete && crackSprite.naturalWidth > 0) {
            workingCtx.translate(imageX, imageY);
            workingCtx.rotate((heavy ? 0.05 : -0.08) + (Math.random() - 0.5) * 0.18);
            workingCtx.globalCompositeOperation = "source-over";
            workingCtx.globalAlpha = heavy ? 0.94 : 0.78;
            workingCtx.drawImage(crackSprite, -crackSize / 2, -crackSize / 2, crackSize, crackSize);
            workingCtx.globalAlpha = 1;
            workingCtx.setTransform(1, 0, 0, 1, 0, 0);
        }

        drawImpactGlassDepression(workingCtx, imageX, imageY, rect.scale, radius * (heavy ? 1.1 : 0.72), heavy, sample[0] + sample[1] * 3 + sample[2] * 7, -0.2);
        drawGlassPunctureDot(workingCtx, imageX, imageY, rect.scale, heavy);
        workingCtx.restore();

        // 1. Highly sensitive cropping with surrounding shake/fall effects (staggered for performance & wave aesthetics)
        if (!heavy) {
            if (Math.random() < 0.92) {
                enqueueHammerExtraction({
                    x,
                    y,
                    radius: radius * 0.48,
                    patchBackground: true,
                    spawnEntity: true,
                    shakeLife: 0,
                    detailOnly: true,
                });
            }
            const offsets = [
                { dx: -36, dy: -20, shake: 0, delay: 34 },
                { dx: 36, dy: 24, shake: 0, delay: 68 },
            ];
            offsets.forEach(({ dx, dy, shake, delay }) => {
                if (Math.random() < 0.82) {
                    enqueueHammerExtraction({
                        x: x + dx,
                        y: y + dy,
                        radius: radius * 0.38,
                        patchBackground: true,
                        spawnEntity: true,
                        shakeLife: shake,
                        detailOnly: true,
                    }, delay);
                }
            });
        } else {
            enqueueHammerExtraction({
                x,
                y,
                radius: Math.max(34, radius * 0.74),
                patchBackground: true,
                spawnEntity: true,
                shakeLife: 0,
                detailOnly: true,
            });
            const offsets = [
                { dx: -42, dy: -32, shake: 0, delay: 34 },
                { dx: 42, dy: 32, shake: 0, delay: 68 },
                { dx: -92, dy: -34, shake: 0, delay: 104 },
                { dx: 92, dy: 34, shake: 0, delay: 138 },
            ];
            offsets.forEach(({ dx, dy, shake, delay }) => {
                if (Math.random() < 0.88) {
                    enqueueHammerExtraction({
                        x: x + dx,
                        y: y + dy,
                        radius: radius * 0.44,
                        patchBackground: true,
                        spawnEntity: true,
                        shakeLife: shake,
                        detailOnly: true,
                    }, delay);
                }
            });
        }
        knockScreenLettersLoose(x, y, -Math.PI / 2 + (Math.random() - 0.5) * 0.44, heavy ? 1.75 : 1, "hammer");

        // 2. Dynamic explosive push on existing falling screen shards
        const forceRadius = radius * (heavy ? 3.5 : 1.8);
        entitiesRef.current = entitiesRef.current.map((entity) => {
            const dx = entity.x - x;
            const dy = entity.y - y;
            const dist = Math.hypot(dx, dy);
            if (dist < forceRadius) {
                const angle = Math.atan2(dy, dx || 0.001);
                const intensity = 1 - (dist / forceRadius);
                const pushForce = intensity * (heavy ? 18 : 8);
                return {
                    ...entity,
                    vx: entity.vx + Math.cos(angle) * pushForce,
                    vy: entity.vy + Math.sin(angle) * pushForce - (heavy ? 5 : 2),
                    spin: entity.spin + (Math.random() - 0.5) * intensity * (heavy ? 0.6 : 0.2),
                };
            }
            return entity;
        });

        return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
    }, [clearPendingHammerShockwaves, enqueueHammerExtraction, knockScreenLettersLoose]);

    const applyBoltImpact = useCallback((x: number, y: number, angle: number, radius: number, seed: number, heavy = false): string | undefined => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return undefined;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (x - rect.x) / rect.scale;
        const imageY = (y - rect.y) / rect.scale;
        if (imageX < 0 || imageY < 0 || imageX >= workingCanvas.width || imageY >= workingCanvas.height) return undefined;

        const sampleX = Math.max(0, Math.min(workingCanvas.width - 1, Math.round(imageX)));
        const sampleY = Math.max(0, Math.min(workingCanvas.height - 1, Math.round(imageY)));
        const sample = workingCtx.getImageData(sampleX, sampleY, 1, 1).data;
        const crackSprite = spritesRef.current.glassCrack;
        if (!crackSprite?.complete || crackSprite.naturalWidth <= 0) {
            return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
        }
        const crackScreenSize = clampValue(radius * (heavy ? 2.05 : 2.65), heavy ? 280 : 112, heavy ? 420 : 190);
        const crackSize = crackScreenSize / rect.scale;
        const crackRotation = angle * 0.08 + (flameNoise(seed + 301, 1.7) - 0.5) * 0.36;

        workingCtx.save();
        workingCtx.translate(imageX, imageY);
        workingCtx.rotate(crackRotation);
        workingCtx.globalCompositeOperation = "source-over";
        workingCtx.drawImage(crackSprite, -crackSize / 2, -crackSize / 2, crackSize, crackSize);
        workingCtx.restore();
        drawImpactGlassDepression(workingCtx, imageX, imageY, rect.scale, radius * (heavy ? 0.72 : 0.44), heavy, seed + sample[0], angle);
        drawGlassPunctureDot(workingCtx, imageX, imageY, rect.scale, heavy);

        // Pierce and crop/extract screen words/icons, launching them in the arrow flight direction!
        const arrowSpeed = heavy ? 11 : 6.5;
        const initVx = Math.cos(angle) * arrowSpeed;
        const initVy = Math.sin(angle) * arrowSpeed - (heavy ? 2 : 0.8);
        enqueueHammerExtraction({
            x,
            y,
            radius: radius * (heavy ? 0.62 : 0.38),
            patchBackground: true,
            spawnEntity: true,
            initVx,
            initVy,
            shakeLife: 0,
            detailOnly: true,
        }, heavy ? 8 : 0);
        knockScreenLettersLoose(x, y, angle, heavy ? 1.55 : 0.9, "scatter");

        return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
    }, [enqueueHammerExtraction, knockScreenLettersLoose]);

    const applyBurnTrace = useCallback((x: number, y: number, angle: number, radius: number): string | undefined => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return undefined;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (x - rect.x) / rect.scale;
        const imageY = (y - rect.y) / rect.scale;
        if (imageX < 0 || imageY < 0 || imageX >= workingCanvas.width || imageY >= workingCanvas.height) return undefined;

        const sampleX = Math.max(0, Math.min(workingCanvas.width - 1, Math.round(imageX)));
        const sampleY = Math.max(0, Math.min(workingCanvas.height - 1, Math.round(imageY)));
        const sample = workingCtx.getImageData(sampleX, sampleY, 1, 1).data;
        const burnRadius = Math.max(9, Math.min(28, radius * 0.42 / rect.scale));
        const sweep = burnRadius * 0.55;

        workingCtx.save();
        workingCtx.translate(imageX, imageY);
        workingCtx.rotate(angle);
        workingCtx.globalCompositeOperation = "multiply";

        for (let layer = 0; layer < 7; layer += 1) {
            const offsetX = (Math.random() - 0.5) * burnRadius * 0.22;
            const offsetY = (Math.random() - 0.5) * burnRadius * 0.16;
            const layerRadius = burnRadius * (0.32 + Math.random() * 0.34);
            const scorch = workingCtx.createRadialGradient(offsetX, offsetY, 0, offsetX, offsetY, layerRadius);
            scorch.addColorStop(0, "rgba(5,2,1,0.74)");
            scorch.addColorStop(0.28, "rgba(50,13,4,0.48)");
            scorch.addColorStop(0.68, "rgba(124,45,18,0.18)");
            scorch.addColorStop(1, "rgba(0,0,0,0)");
            workingCtx.fillStyle = scorch;
            workingCtx.save();
            workingCtx.translate(offsetX, offsetY);
            workingCtx.rotate(Math.random() * Math.PI);
            drawJaggedShape(workingCtx, 0, 0, layerRadius * 0.74, 6, Math.random());
            workingCtx.restore();
            workingCtx.fill();
        }

        workingCtx.globalCompositeOperation = "screen";
        const ember = workingCtx.createRadialGradient(0, 0, 0, 0, 0, burnRadius * 0.68);
        ember.addColorStop(0, "rgba(255,244,214,0.46)");
        ember.addColorStop(0.16, "rgba(251,191,36,0.3)");
        ember.addColorStop(0.48, "rgba(249,115,22,0.12)");
        ember.addColorStop(1, "rgba(0,0,0,0)");
        workingCtx.fillStyle = ember;
        workingCtx.beginPath();
        workingCtx.ellipse(0, 0, burnRadius * 0.42, burnRadius * 0.3, 0, 0, Math.PI * 2);
        workingCtx.fill();
        for (let spark = 0; spark < 12; spark += 1) {
            const a = Math.random() * Math.PI * 2;
            const d = burnRadius * (0.18 + Math.random() * 0.65);
            const s = Math.max(0.55, (0.7 + Math.random() * 1.2) / rect.scale);
            workingCtx.fillStyle = spark % 3 === 0 ? "rgba(254,240,138,0.56)" : "rgba(249,115,22,0.38)";
            workingCtx.beginPath();
            workingCtx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.58, s, 0, Math.PI * 2);
            workingCtx.fill();
        }
        workingCtx.restore();

        return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
    }, []);

    const stampBurnScorch = useCallback((flame: ActiveFlame): void => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingContextRef.current;
        if (!surface || !workingCanvas || !workingCtx) return;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (flame.x - rect.x) / rect.scale;
        const imageY = (flame.y - rect.y) / rect.scale;
        if (imageX < 0 || imageY < 0 || imageX >= workingCanvas.width || imageY >= workingCanvas.height) return;

        const sprite = spritesRef.current.burnScorch;
        if (!sprite?.complete || sprite.naturalWidth <= 0) {
            applyBurnTrace(flame.x, flame.y, flame.rotation, flame.radius);
            return;
        }

        const burnRadius = Math.max(28, flame.radius * 0.95 / rect.scale);
        const size = burnRadius * (1.82 + flameNoise(flame.seed + 23, 1.8) * 0.36);
        workingCtx.save();
        workingCtx.translate(imageX, imageY);
        workingCtx.rotate(flame.rotation + (Math.sin(flame.seed) * 0.26));
        
        workingCtx.save();
        workingCtx.beginPath();
        workingCtx.arc(0, 0, size * 0.46, 0, Math.PI * 2);
        workingCtx.clip();
        workingCtx.globalAlpha = 0.76;
        workingCtx.globalCompositeOperation = "multiply";
        workingCtx.drawImage(sprite, -size / 2, -size / 2, size * (0.9 + flameNoise(flame.seed + 41, 2.2) * 0.28), size);
        workingCtx.restore();

        workingCtx.globalCompositeOperation = "screen";
        workingCtx.globalAlpha = 0.16;
        const ember = workingCtx.createRadialGradient(0, 0, 0, 0, 0, size * 0.25);
        ember.addColorStop(0, "rgba(251,191,36,0.28)");
        ember.addColorStop(0.38, "rgba(249,115,22,0.14)");
        ember.addColorStop(1, "rgba(0,0,0,0)");
        workingCtx.fillStyle = ember;
        workingCtx.beginPath();
        workingCtx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        workingCtx.fill();
        workingCtx.restore();
    }, [applyBurnTrace]);

    useEffect(() => {
        stampBurnScorchRef.current = stampBurnScorch;
        return () => {
            stampBurnScorchRef.current = null;
        };
    }, [stampBurnScorch]);

    const applyLaserContact = useCallback((x: number, y: number, angle: number, travel: number) => {
        const now = performance.now();
        const contactRadius = Math.max(24, Math.min(78, 24 + travel * 4.4));
        let burnedSomething = false;

        entitiesRef.current = entitiesRef.current.map((entity) => {
            const dx = entity.x - x;
            const dy = entity.y - y;
            const collisionX = entity.width * 0.5 + contactRadius;
            const collisionY = entity.height * 0.5 + contactRadius;
            if (Math.abs(dx) > collisionX || Math.abs(dy) > collisionY) return entity;

            const normalized = Math.hypot(dx / Math.max(1, collisionX), dy / Math.max(1, collisionY));
            if (normalized > 1) return entity;

            burnedSomething = true;
            const heat = 1 - normalized;
            return {
                ...entity,
                laserBurnStartedAt: entity.laserBurnStartedAt ?? now,
                laserBurnLife: entity.laserBurnLife ?? 620,
                life: Math.min(entity.life, 46),
                vx: entity.vx + Math.cos(angle) * (0.9 + heat * 2.8),
                vy: entity.vy + Math.sin(angle) * (0.9 + heat * 2.8) - 0.35,
                spin: entity.spin + (Math.random() - 0.5) * (0.14 + heat * 0.22),
            };
        });

        const hitTick = activeTicksRef.current.find((tick) => Math.hypot(tick.x - x, tick.y - y) < Math.max(18, tick.size * 2.8 + contactRadius * 0.35));
        if (hitTick) {
            activeTicksRef.current = activeTicksRef.current.filter((tick) => tick.id !== hitTick.id);
            burnedSomething = true;
            appendCapped(particlesRef.current, createParticlesForTool("burn", hitTick.x, hitTick.y, undefined, angle), MAX_PARTICLES);
        }

        creaturesRef.current = creaturesRef.current.map((creature) => {
            const distance = Math.hypot(creature.x - x, creature.y - y);
            const hitRadius = contactRadius + creature.size * (creature.kind === "skeleton" ? 0.58 : 0.72);
            if (distance > hitRadius) return creature;

            burnedSomething = true;
            const heat = 1 - Math.min(1, distance / Math.max(1, hitRadius));
            return {
                ...creature,
                laserBurnStartedAt: creature.laserBurnStartedAt ?? now,
                laserBurnLife: creature.laserBurnLife ?? (creature.kind === "skeleton" ? 520 : 340),
                bumpReact: Math.max(creature.bumpReact ?? 0, 42),
                vx: creature.vx + Math.cos(angle) * (0.8 + heat * 1.8),
                vy: creature.vy + Math.sin(angle) * (0.8 + heat * 1.8),
            };
        });

        knockScreenLettersLoose(x, y, angle, Math.max(0.55, Math.min(1.6, travel * 0.08)), "laser");

        if (!burnedSomething) return;

        appendCapped(particlesRef.current, createParticlesForTool("burn", x, y, undefined, angle), MAX_PARTICLES);

        if (!mutedRef.current && now - lastDragonHeatSoundAtRef.current > 95) {
            lastDragonHeatSoundAtRef.current = now;
            playToolSound("burn");
        }
    }, [knockScreenLettersLoose]);

    useEffect(() => {
        laserContactActionRef.current = applyLaserContact;
        return () => {
            laserContactActionRef.current = null;
        };
    }, [applyLaserContact]);

    useEffect(() => {
        laserFragmentActionRef.current = (x, y, _angle, travel) => {
            const cut = laserCutRef.current;
            if (travel < 2.4) return;
            const now = performance.now();
            if (now - cut.lastShardAt < 110) return;
            cut.lastShardAt = now;
            if (Math.random() < 0.42) {
                extractEntityAtImpact(x, y, Math.max(16, Math.min(42, travel * 3.4)), true, true, undefined, undefined, 0, false, true);
                knockScreenLettersLoose(x, y, _angle, Math.max(0.6, Math.min(1.4, travel * 0.08)), "laser");
            }
        };
        return () => {
            laserFragmentActionRef.current = null;
        };
    }, [extractEntityAtImpact, knockScreenLettersLoose]);

    const hitCreatureAt = useCallback((x: number, y: number, currentTool: PlaygroundToolId, direction = 0, options: AddImpactOptions = {}) => {
        let hitIndex = -1;
        let hitCreature: Creature | null = null;
        creaturesRef.current.forEach((creature, index) => {
            const distance = Math.hypot(x - creature.x, y - creature.y);
            const hitRadius = creature.size * (creature.kind === "skeleton" ? 1.06 : 0.78);
            if (distance <= hitRadius && hitIndex === -1) {
                hitIndex = index;
                hitCreature = creature;
            }
        });

        if (hitIndex >= 0 && hitCreature) {
            if (hitCreature.kind === "skeleton") {
                let controller = skeletonControllersRef.current.get(hitCreature.id);
                if (!controller) {
                    controller = new SkeletonController(hitCreature.x, hitCreature.y, hitCreature.size, hitCreature.seed);
                    skeletonControllersRef.current.set(hitCreature.id, controller);
                }
                const damagingHit = currentTool === "hammer" || currentTool === "scatter";
                if (damagingHit) {
                    const nextDamage = (hitCreature.damage ?? 0) + 1;
                    if (currentTool === "scatter") {
                        const now = performance.now();
                        const isHeavy = options.heavyArrow === true;
                        const isDeadly = isHeavy || nextDamage >= 2;
                        if (isDeadly) {
                            controller.update(now, 16, hitCreature.vx, hitCreature.vy, hitCreature.size * (hitCreature.mergeScale ?? 1));
                            controller.startShotDeath(now, x, y, direction, nextDamage);
                            dyingSkeletonsRef.current = [
                                ...dyingSkeletonsRef.current.filter((skeleton) => skeleton.id !== hitCreature.id),
                                { id: hitCreature.id, controller },
                            ].slice(-8);
                            skeletonControllersRef.current.delete(hitCreature.id);
                            creaturesRef.current = creaturesRef.current.filter((_, index) => index !== hitIndex);
                            appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, undefined, direction), MAX_PARTICLES);
                            return "deadly";
                        } else {
                            controller.hit(nextDamage, true);
                            creaturesRef.current = creaturesRef.current.map((creature, index) => index === hitIndex
                                ? {
                                    ...creature,
                                    damage: nextDamage,
                                    bumpReact: Math.max(creature.bumpReact ?? 0, 34),
                                    vx: creature.vx + (creature.x - x) * 0.006,
                                    vy: creature.vy + (creature.y - y) * 0.006,
                                }
                                : creature);
                            appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, undefined, direction), MAX_PARTICLES);
                            return "hit";
                        }
                    } else if (nextDamage >= 3) {
                        controller.hit(nextDamage);
                        skeletonControllersRef.current.delete(hitCreature.id);
                        creaturesRef.current = creaturesRef.current.filter((_, index) => index !== hitIndex);
                        skeletonShardsRef.current = [
                            ...skeletonShardsRef.current,
                            ...createSkeletonShards(hitCreature, x, y, performance.now()),
                        ].slice(-90);
                        appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, undefined, direction), MAX_PARTICLES);
                    } else {
                        controller.hit(nextDamage);
                        creaturesRef.current = creaturesRef.current.map((creature, index) => index === hitIndex
                            ? {
                                ...creature,
                                damage: nextDamage,
                                bumpReact: Math.max(creature.bumpReact ?? 0, 34),
                                vx: creature.vx + (creature.x - x) * 0.006,
                                vy: creature.vy + (creature.y - y) * 0.006,
                            }
                            : creature);
                        appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, undefined, direction), MAX_PARTICLES);
                    }
                    return true;
                }
                controller.hit(hitCreature.damage ?? 0);
                return true;
            }
            if (hitCreature.kind === "spider" && (currentTool === "scatter" || currentTool === "hammer")) {
                const parentSplitLevel = hitCreature.splitLevel ?? 0;
                const shouldSplit = parentSplitLevel < 1;
                const parentScale = hitCreature.mergeScale ?? 1;
                const childSize = Math.max(18, hitCreature.size * parentScale * 0.46);
                const now = performance.now();
                const childSpiders = shouldSplit
                    ? Array.from({ length: 4 }, (_, childIndex) => {
                        const angle = direction + Math.PI + (Math.PI * 2 * childIndex) / 4 + (flameNoise(hitCreature.seed + 811, childIndex) - 0.5) * 0.7;
                        const distance = hitCreature.size * (0.24 + flameNoise(hitCreature.seed + 823, childIndex) * 0.22);
                        const child = createCreature(
                            "spider",
                            hitCreature.x + Math.cos(angle) * distance,
                            hitCreature.y + Math.sin(angle) * distance,
                        );
                        return {
                            ...child,
                            size: childSize,
                            splitLevel: parentSplitLevel + 1,
                            vx: Math.cos(angle) * (1.9 + flameNoise(hitCreature.seed + 829, childIndex) * 0.8),
                            vy: Math.sin(angle) * (1.9 + flameNoise(hitCreature.seed + 839, childIndex) * 0.8),
                            dartSpeed: 1.22 + flameNoise(hitCreature.seed + 853, childIndex) * 0.26,
                            heading: angle,
                            bumpReact: 28,
                            webCooldown: 760 + flameNoise(hitCreature.seed + 859, childIndex) * 900,
                            roamCooldown: 60 + flameNoise(hitCreature.seed + 863, childIndex) * 120,
                        } satisfies Creature;
                    })
                    : [];
                if (currentTool === "scatter") {
                    dyingSpidersRef.current = [
                        ...dyingSpidersRef.current.filter((spider) => spider.id !== hitCreature.id),
                        {
                            id: hitCreature.id,
                            creature: hitCreature,
                            hitX: x,
                            hitY: y,
                            shotAngle: direction,
                            startedAt: now,
                        },
                    ].slice(-12);
                }
                creaturesRef.current = [
                    ...creaturesRef.current.filter((_, index) => index !== hitIndex),
                    ...childSpiders,
                ].slice(-24);
                appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, undefined, direction), MAX_PARTICLES);
                appendCapped(particlesRef.current, createParticlesForTool("scatter", hitCreature.x, hitCreature.y, undefined, direction), MAX_PARTICLES);
                return true;
            }
            creaturesRef.current = creaturesRef.current.filter((_, index) => index !== hitIndex);
            appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, undefined, direction), MAX_PARTICLES);
            appendCapped(particlesRef.current, createParticlesForTool("scatter", hitCreature.x, hitCreature.y, undefined, direction), MAX_PARTICLES);
            return true;
        }

        creaturesRef.current = creaturesRef.current.map((creature) => {
            const dx = creature.x - x;
            const dy = creature.y - y;
            const distance = Math.hypot(dx, dy);
            if (distance > creature.size * 1.9 || distance < 1) return creature;
            const force = (1 - distance / (creature.size * 1.9)) * 1.35;
            return {
                ...creature,
                vx: creature.vx + (dx / distance) * force,
                vy: creature.vy + (dy / distance) * force,
            };
        });

        return false;
    }, []);

    const triggerLaserDrill = useCallback((x: number, y: number, angle: number) => {
        const now = performance.now();
        const seed = Math.floor(now * 1000) % 100000;
        const drill: ActiveLaserDrill = {
            id: `laser-drill-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            x,
            y,
            angle,
            seed,
            createdAt: now,
            life: LASER_DRILL_MS,
        };
        laserDrillCursorRef.current = drill;
        laserDrillsRef.current = [...laserDrillsRef.current.slice(-5), drill];

        const segments: LaserTrailSegment[] = [];
        for (let spoke = 0; spoke < 7; spoke += 1) {
            const spokeAngle = angle + (spoke - 3) * 0.28 + flameNoise(seed + 101, spoke) * 0.12;
            const sideAngle = spokeAngle + Math.PI / 2;
            const length = 42 + flameNoise(seed + 113, spoke) * 34;
            const offset = (spoke - 3) * 2.8;
            const startX = x - Math.cos(spokeAngle) * length * 0.78 + Math.cos(sideAngle) * offset;
            const startY = y - Math.sin(spokeAngle) * length * 0.78 + Math.sin(sideAngle) * offset;
            const endX = x + Math.cos(spokeAngle) * length * 0.24 - Math.cos(sideAngle) * offset * 0.28;
            const endY = y + Math.sin(spokeAngle) * length * 0.24 - Math.sin(sideAngle) * offset * 0.28;
            const segment: LaserTrailSegment = {
                id: `laser-drill-seam-${now.toString(36)}-${spoke}`,
                startX,
                startY,
                endX,
                endY,
                angle: spokeAngle,
                width: 10 + flameNoise(seed + 127, spoke) * 7,
                createdAt: now,
                life: 1550,
            };
            segments.push(segment);
            stampLaserSeam(segment);
        }
        laserTrailRef.current = [...laserTrailRef.current, ...segments].slice(-72);
        stampLaserDrillImpact(x, y, angle, seed);
        emitLaserSparks(x, y, angle, now);
        emitLaserSparks(x, y, angle + Math.PI * 0.66, now);
        laserContactActionRef.current?.(x, y, angle, 18);
        extractEntityAtImpact(x, y, 58, true, true, undefined, undefined, 0, false, true);
        lastLaserCutRef.current = { x, y, angle };
        if (!mutedRef.current && now - lastLaserSoundAtRef.current > 55) {
            lastLaserSoundAtRef.current = now;
            playToolSound("laser");
        }
        if (now - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
            lastImpactCountUpdateRef.current = now;
            queueImpactCount((count) => count + 1);
        }
    }, [emitLaserSparks, extractEntityAtImpact, queueImpactCount, stampLaserDrillImpact, stampLaserSeam]);

    const hitScreenTickAt = useCallback((x: number, y: number, currentTool: PlaygroundToolId, direction = 0) => {
        if (currentTool !== "hammer" && currentTool !== "scatter") return false;

        let hitIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;
        activeTicksRef.current.forEach((tick, index) => {
            const distance = Math.hypot(x - tick.x, y - tick.y);
            const hitRadius = currentTool === "hammer"
                ? Math.max(26, tick.size * 3.45)
                : Math.max(18, tick.size * 3.05);
            if (distance <= hitRadius && distance < bestDistance) {
                hitIndex = index;
                bestDistance = distance;
            }
        });

        if (hitIndex < 0) return false;

        const hitTick = activeTicksRef.current[hitIndex];
        activeTicksRef.current = activeTicksRef.current.filter((_, index) => index !== hitIndex);
        appendCapped(particlesRef.current, createParticlesForTool(currentTool, hitTick.x, hitTick.y, undefined, direction), MAX_PARTICLES);
        appendCapped(particlesRef.current, createParticlesForTool("glyph", hitTick.x, hitTick.y), MAX_PARTICLES);
        if (performance.now() - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
            lastImpactCountUpdateRef.current = performance.now();
            queueImpactCount((count) => Math.max(0, count - 1));
        }
        return true;
    }, [queueImpactCount]);

    const hitHammerPigletAt = useCallback((x: number, y: number, radius: number, now: number) => {
        let didHit = false;
        activeHammerPigletsRef.current = activeHammerPigletsRef.current.map((piglet) => {
            if (didHit || piglet.hitAt !== undefined) return piglet;
            const hitWidth = piglet.size * 0.68;
            const hitHeight = piglet.size * 0.42;
            const dx = x - piglet.x;
            const dy = y - (piglet.y - piglet.size * 0.04);
            const normalized = (dx * dx) / (hitWidth * hitWidth) + (dy * dy) / (hitHeight * hitHeight);
            const paddedRadius = Math.max(18, radius * 0.16);
            if (normalized > 1.15 && Math.hypot(dx, dy) > hitWidth + paddedRadius) return piglet;

            didHit = true;
            const away = x <= piglet.x ? 1 : -1;
            return {
                ...piglet,
                hitAt: now,
                hitVx: (0.34 + Math.random() * 0.26) * away,
                hitVy: -0.54 - Math.random() * 0.22,
                hitRotation: (Math.random() - 0.5) * 0.42,
                opacity: 1,
                life: Math.max(piglet.life, now - piglet.bornAt + 760),
            };
        });
        return didHit;
    }, []);

    const addImpact = useCallback((x: number, y: number, options: AddImpactOptions = {}) => {
        const currentTool = options.toolOverride ?? toolRef.current;
        if (currentTool === "laser") return;
        if (currentTool === "throw") return;
        const now = performance.now();
        const lastImpact = lastImpactRef.current;
        const suppressMs = 90;
        const suppressDistance = 10;
        if (
            !options.skipSuppress
            &&
            currentTool === lastImpact.tool
            && now - lastImpact.at < suppressMs
            && Math.hypot(x - lastImpact.x, y - lastImpact.y) < suppressDistance
        ) {
            return;
        }
        lastImpactRef.current = { x, y, at: now, tool: currentTool };

        if (currentTool === "hammer" && !options.commitHammerImpact) {
            hammerSwingRef.current = now;
            clearPendingHammerImpacts();
            const timeoutId = window.setTimeout(() => {
                hammerImpactTimeoutsRef.current = hammerImpactTimeoutsRef.current.filter((id) => id !== timeoutId);
                addImpact(x, y, {
                    commitHammerImpact: true,
                    skipSuppress: true,
                    toolOverride: "hammer",
                });
            }, HAMMER_IMPACT_DELAY_MS);
            trackHammerImpactTimeout(timeoutId);
            return;
        }

        if (currentTool === "skeleton" || currentTool === "spider") {
            creaturesRef.current = [
                ...creaturesRef.current.slice(-7),
                createCreature(currentTool, x, y),
            ];
            return;
        }

        if (currentTool === "glyph") {
            spawnScreenTicks(x, y);
            appendCapped(particlesRef.current, createParticlesForTool("hammer", x, y), MAX_PARTICLES);
            if (now - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
                lastImpactCountUpdateRef.current = now;
                queueImpactCount((count) => count + TICKS_PER_CLICK);
            }
            if (!mutedRef.current && now - lastSoundAtRef.current > 42) {
                lastSoundAtRef.current = now;
                playToolSound("glyph");
            }
            return;
        }

        const impact = createImpact(currentTool, x, y);
        if (options.impactScale) {
            impact.radius *= options.impactScale;
        }
        let shotStart: { x: number; y: number } | undefined;
        if (currentTool === "scatter") {
            const canvas = canvasRef.current;
            const width = canvas?.clientWidth ?? window.innerWidth;
            const height = canvas?.clientHeight ?? window.innerHeight;
            const margin = Math.max(120, Math.min(width, height) * 0.12);
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) shotStart = { x: -margin, y: Math.random() * height };
            else if (edge === 1) shotStart = { x: width + margin, y: Math.random() * height };
            else if (edge === 2) shotStart = { x: Math.random() * width, y: -margin };
            else shotStart = { x: Math.random() * width, y: height + margin };
            impact.rotation = Math.atan2(y - shotStart.y, x - shotStart.x);
        }
        if (currentTool === "burn") {
            impact.rotation = -Math.PI / 2 + (Math.random() - 0.5) * 0.38;
        }
        const hitResult = hitCreatureAt(x, y, currentTool, impact.rotation, options);
        const hitCreature = Boolean(hitResult);
        const hitTick = !hitCreature && hitScreenTickAt(x, y, currentTool, impact.rotation);
        const hitPiglet = currentTool === "hammer" && !hitCreature && !hitTick
            ? hitHammerPigletAt(x, y, impact.radius, now)
            : false;
        const shouldCacheImpactOverlay = currentTool !== "burn"
            && currentTool !== "scatter"
            && currentTool !== "hammer";
        if (shouldCacheImpactOverlay) {
            impactsRef.current = [
                ...impactsRef.current.slice(-(MAX_IMPACTS - 1)),
                impact,
            ];
            if (impactsRef.current.length === MAX_IMPACTS) {
                clearEffects();
                impactsRef.current.forEach(cacheImpact);
            } else {
                cacheImpact(impact);
            }
        }
        const sampledColor = currentTool === "scatter" && !hitCreature
            ? applyBoltImpact(x, y, impact.rotation, impact.radius, impact.seed, options.heavyArrow === true)
            : currentTool === "hammer"
                ? applyHammerImpactToScreen(x, y, impact.radius, options.heavyHammer)
                : undefined;
        const extractedColor: string | undefined = undefined;
        let playedDragonHeatSound = false;
        
        if (currentTool === "burn") {
            const canvas = canvasRef.current;
            const dragon = createDragonBreath(
                x,
                y,
                impact.radius,
                canvas?.clientWidth ?? window.innerWidth,
                canvas?.clientHeight ?? window.innerHeight,
                impact.seed,
                now
            );
            impact.rotation = Math.atan2(y - dragon.mouthY, x - dragon.mouthX);
            dragonBreathsRef.current = [dragon];
            const isHugeFireball = options.hugeFireball === true;
            activeFlamesRef.current = [
                ...activeFlamesRef.current.slice(-4),
                {
                    id: `flame-${impact.id}`,
                    startX: dragon.mouthX,
                    startY: dragon.mouthY,
                    x,
                    y: y + impact.radius * 0.05,
                    radius: impact.radius * (isHugeFireball ? 1.14 : 1),
                    rotation: impact.rotation,
                    seed: impact.seed,
                    createdAt: now,
                    life: isHugeFireball ? 2600 : 1900,
                },
            ];
            if (!mutedRef.current && now - lastDragonHeatSoundAtRef.current > 180) {
                lastDragonHeatSoundAtRef.current = now;
                playDragonFlameReleaseSound();
                playedDragonHeatSound = true;
            }
        }
        if (currentTool === "scatter") {
            const isDeadlyHit = hitResult === "deadly";
            activeArrowsRef.current = [
                ...activeArrowsRef.current.slice(-(MAX_ACTIVE_ARROWS - 1)),
                {
                    id: `arrow-${impact.id}`,
                    startX: shotStart?.x ?? (x - Math.cos(impact.rotation) * 260),
                    startY: shotStart?.y ?? (y - Math.sin(impact.rotation) * 260),
                    x,
                    y,
                    radius: impact.radius * (options.heavyArrow ? 1.08 : 0.78),
                    rotation: impact.rotation,
                    seed: impact.seed,
                    createdAt: now,
                    life: isDeadlyHit ? ARROW_FLIGHT_MS : (options.heavyArrow ? HEAVY_ARROW_LIFE_MS : ARROW_LIFE_MS),
                    heavy: options.heavyArrow === true,
                },
            ];
        }
        appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, sampledColor ?? extractedColor, currentTool === "scatter" || currentTool === "burn" ? impact.rotation : undefined), MAX_PARTICLES);
        if (options.heavyHammer || hitTick || hitPiglet) {
            appendCapped(particlesRef.current, createParticlesForTool(currentTool, x, y, sampledColor ?? extractedColor), MAX_PARTICLES);
        }
        if (now - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
            lastImpactCountUpdateRef.current = now;
            if (!shouldCacheImpactOverlay) queueImpactCount((count) => count + 1);
            else queueImpactCount(impactsRef.current.length);
        }
        if (!playedDragonHeatSound && !mutedRef.current && now - lastSoundAtRef.current > 42) {
            lastSoundAtRef.current = now;
            playToolSound(currentTool);
        }
    }, [applyBoltImpact, applyBurnTrace, applyHammerImpactToScreen, cacheImpact, clearEffects, clearPendingHammerImpacts, extractEntityAtImpact, hitCreatureAt, hitHammerPigletAt, hitScreenTickAt, queueImpactCount, spawnScreenTicks, trackHammerImpactTimeout]);

    const launchSlingerFruit = useCallback(() => {
        const state = slingerRef.current;
        if (!state.active) return;
        const now = performance.now();
        const profile = foodStyle(throwFoodRef.current);
        const releaseX = Number.isFinite(state.targetPullX) ? state.targetPullX : state.pullX;
        const releaseY = Number.isFinite(state.targetPullY) ? state.targetPullY : state.pullY;
        if (Math.hypot(releaseX - state.anchorX, releaseY - state.anchorY) < SLINGER_MIN_PULL_TO_LAUNCH) return;
        const shot = getSlingerShot(state.anchorX, state.anchorY, releaseX, releaseY, state.chargeStartAt, throwFoodRef.current, now);
        const seed = Math.floor(now * 31 + state.anchorX * 17 + state.anchorY * 13);

        fruitProjectilesRef.current = [
            ...fruitProjectilesRef.current.slice(-4),
            {
                id: `fruit-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                food: throwFoodRef.current,
                x: shot.startX,
                y: shot.startY,
                z: SLINGER_PROJECTILE_DEPTH,
                vx: shot.vx,
                vy: shot.vy,
                vz: -shot.depthSpeed,
                radius: profile.radius,
                rotation: shot.angle,
                spin: (0.008 + shot.punch * 0.028) * (flameNoise(seed, 1) > 0.5 ? 1 : -1),
                seed,
                createdAt: now,
            },
        ];

        if (!mutedRef.current && now - lastSoundAtRef.current > 42) {
            lastSoundAtRef.current = now;
            playToolSound("throw");
        }
    }, []);

    const getHammerContactPoint = useCallback((x: number, y: number) => ({
        x: x + HAMMER_TARGET_OFFSET_X,
        y: y + HAMMER_TARGET_OFFSET_Y,
    }), []);

    const startHeavyHammerStrike = useCallback((x: number, y: number) => {
        const now = performance.now();
        hammerSwingRef.current = now;
        heavyHammerSwingRef.current = { active: true, startedAt: now, x, y };
        lastImpactRef.current = { x, y, at: now, tool: "hammer" };
        clearPendingHammerImpacts();
        const timeoutId = window.setTimeout(() => {
            hammerImpactTimeoutsRef.current = hammerImpactTimeoutsRef.current.filter((id) => id !== timeoutId);
            addImpact(x, y, {
                commitHammerImpact: true,
                heavyHammer: true,
                impactScale: HEAVY_HAMMER_IMPACT_SCALE,
                skipSuppress: true,
                toolOverride: "hammer",
            });
        }, HEAVY_HAMMER_IMPACT_DELAY_MS);
        trackHammerImpactTimeout(timeoutId);
    }, [addImpact, clearPendingHammerImpacts, trackHammerImpactTimeout]);

    const addDragImpact = useCallback((x: number, y: number) => {
        const last = lastDragImpactRef.current;
        const now = performance.now();
        const distance = Math.hypot(x - last.x, y - last.y);
        const minDistance = MIN_DRAG_IMPACT_DISTANCE;
        const minMs = MIN_DRAG_IMPACT_MS;
        if (distance < minDistance || now - last.at < minMs) {
            return;
        }
        lastDragImpactRef.current = { x, y, at: now };
        addImpact(x, y);
    }, [addImpact]);

    const reset = useCallback(() => {
        impactsRef.current = [];
        particlesRef.current = [];
        entitiesRef.current = [];
        dragonBreathsRef.current = [];
        activeFlamesRef.current = [];
        burnResiduesRef.current = [];
        splashSpraysRef.current = [];
        activeWaterFishRef.current = [];
        lastWaterFishSpawnRef.current = 0;
        lastSplashResetRef.current = { x: -999, y: -999, angle: 0, at: 0 };
        activeHammerPigletsRef.current = [];
        nextHammerPigletSpawnAtRef.current = 0;
        screenHitPulsesRef.current = [];
        activeArrowsRef.current = [];
        activeTicksRef.current = [];
        activeWebsRef.current = [];
        activeSpiderLiftsRef.current = [];
        spiderLiftCooldownsRef.current.clear();
        skeletonShardsRef.current = [];
        dyingSpidersRef.current = [];
        fruitProjectilesRef.current = [];
        fruitSplatsRef.current = [];
        laserTrailRef.current = [];
        laserSparksRef.current = [];
        laserDrillsRef.current = [];
        laserDrillCursorRef.current = null;
        laserCutRef.current = createLaserCutState();
        lastLetterKnockRef.current = { splash: 0, hammer: 0, scatter: 0, laser: 0 };
        splashRef.current = createSplashState();
        splashRigRef.current = createSplashRigState();
        slingerRef.current = createSlingerState();
        clearEffects();
        const background = backgroundImageRef.current;
        if (background) prepareWorkingCanvas(background);
        const canvas = canvasRef.current;
        const width = canvas?.clientWidth || payload?.display.width || 1280;
        const height = canvas?.clientHeight || payload?.display.height || 720;
        restoreDefaultCreatures(width, height);
        setImpactCountImmediate(0);
    }, [clearEffects, payload, prepareWorkingCanvas, restoreDefaultCreatures, setImpactCountImmediate]);

    const chooseSource = useCallback((source: ScreenPlaygroundSource) => {
        setSelectedSourceId(source.id);
        setSourcePickerOpen(false);
        impactsRef.current = [];
        particlesRef.current = [];
        entitiesRef.current = [];
        dragonBreathsRef.current = [];
        activeFlamesRef.current = [];
        burnResiduesRef.current = [];
        splashSpraysRef.current = [];
        activeWaterFishRef.current = [];
        lastWaterFishSpawnRef.current = 0;
        lastSplashResetRef.current = { x: -999, y: -999, angle: 0, at: 0 };
        activeHammerPigletsRef.current = [];
        nextHammerPigletSpawnAtRef.current = 0;
        screenHitPulsesRef.current = [];
        activeArrowsRef.current = [];
        activeTicksRef.current = [];
        activeWebsRef.current = [];
        activeSpiderLiftsRef.current = [];
        spiderLiftCooldownsRef.current.clear();
        skeletonShardsRef.current = [];
        dyingSpidersRef.current = [];
        fruitProjectilesRef.current = [];
        fruitSplatsRef.current = [];
        laserTrailRef.current = [];
        laserSparksRef.current = [];
        laserDrillsRef.current = [];
        laserDrillCursorRef.current = null;
        laserCutRef.current = createLaserCutState();
        splashRef.current = createSplashState();
        splashRigRef.current = createSplashRigState();
        slingerRef.current = createSlingerState();
        clearEffects();
        const canvas = canvasRef.current;
        restoreDefaultCreatures(canvas?.clientWidth || payload?.display.width || 1280, canvas?.clientHeight || payload?.display.height || 720);
        setImpactCountImmediate(0);
        loadSourceImage(source);
        window.screenPlaygroundAPI?.selectSource(source.id);
    }, [clearEffects, loadSourceImage, payload, restoreDefaultCreatures, setImpactCountImmediate]);

    const saveSnapshot = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            setSaveStatus("Saving...");
            const result = await window.screenPlaygroundAPI?.saveSnapshot(canvas.toDataURL("image/png"));
            setSaveStatus(result?.success ? "Saved" : (result?.error || "Save failed"));
        } catch (error) {
            setSaveStatus((error as Error).message);
        }

        window.setTimeout(() => setSaveStatus(null), 2400);
    }, []);

    const clearSplashToolState = useCallback(() => {
        splashRef.current = createSplashState();
        splashSpraysRef.current = [];
        activeWaterFishRef.current = [];
        lastWaterFishSpawnRef.current = 0;
        lastSplashResetRef.current = { x: -999, y: -999, angle: 0, at: 0 };
        splashRigRef.current = {
            ...createSplashRigState(),
            hoseConnected: splashRigRef.current.hoseConnected,
        };
        screenHitPulsesRef.current = screenHitPulsesRef.current.filter((pulse) => pulse.source !== "splash");
        lastLetterKnockRef.current.splash = 0;
    }, []);

    const selectTool = useCallback((nextTool: PlaygroundToolId) => {
        if (toolRef.current === "splash" && nextTool !== "splash") {
            clearSplashToolState();
        }
        setTool(nextTool);
        if (nextTool !== "burn" || mutedRef.current) return;

        const now = performance.now();
        const canvas = canvasRef.current;
        const width = canvas?.clientWidth ?? payload?.display.width ?? window.innerWidth;
        const height = canvas?.clientHeight ?? payload?.display.height ?? window.innerHeight;
        const focusY = pointerRef.current.smoothY > -100 ? pointerRef.current.smoothY : height * 0.54;
        dragonBreathsRef.current = [
            createDragonBreath(
                width * 0.32,
                focusY,
                64,
                width,
                height,
                Math.floor(now * 31) % 100000,
                now,
            ),
        ];
        playDragonHeatSelectSound();
    }, [clearSplashToolState, payload]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setConfirmQuitOpen((val) => !val);
                return;
            }
            if (event.key === "F11") {
                window.screenPlaygroundAPI?.toggleFullscreen();
                return;
            }
            if (confirmQuitOpen) return;
            if (event.key.toLowerCase() === "r") {
                reset();
                return;
            }
            const selected = TOOLS.find((candidate) => candidate.hotkey === event.key);
            if (selected) selectTool(selected.id);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [reset, selectTool, confirmQuitOpen]);

    const selectedTool = useMemo(() => TOOLS.find((item) => item.id === tool) ?? TOOLS[0], [tool]);

    return (
        <div className="playground-shell">
            <style>{`
                * { box-sizing: border-box; }
                html, body, #root { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #05070d; }
                body { user-select: none; cursor: default; font-family: "Segoe UI", Arial, sans-serif; }
                .playground-shell { width: 100%; height: 100%; position: relative; overflow: visible; }
                .playground-canvas { width: 100%; height: 100%; display: block; cursor: none; touch-action: none; }
                .playground-hud {
                    position: absolute; left: 50%; top: 12px; transform: translateX(-50%);
                    display: flex; align-items: center; gap: 3px; padding: 4px;
                    max-width: calc(100vw - 24px); overflow-x: auto; overflow-y: hidden; white-space: nowrap;
                    border: 1px solid rgba(255,255,255,0.14); border-radius: 12px;
                    background: linear-gradient(135deg, rgba(7,10,18,0.84), rgba(16,24,39,0.68));
                    backdrop-filter: blur(24px) saturate(160%);
                    box-shadow: 0 18px 60px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08);
                    color: #f8fafc;
                    z-index: 20;
                }
                .playground-hud::-webkit-scrollbar { display: none; }
                .playground-btn {
                    border: 1px solid rgba(255,255,255,0.09); color: #e2e8f0; background: rgba(255,255,255,0.045);
                    height: 28px; min-width: auto; padding: 0 7px; border-radius: 8px; font-size: 10px; font-weight: 800;
                    cursor: pointer; transition: transform 0.12s ease, background 0.12s ease, border 0.12s ease, box-shadow 0.12s ease;
                    display: inline-flex; flex-direction: row; align-items: center; justify-content: center; gap: 5px; flex: 0 0 auto;
                }
                .playground-btn svg { width: 14px; height: 14px; flex: 0 0 auto; }
                .playground-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.1); }
                .playground-btn.active {
                    background: linear-gradient(135deg, rgba(147,197,253,0.22), rgba(45,212,191,0.13));
                    border-color: rgba(147,197,253,0.48); color: #e0f2fe;
                    box-shadow: 0 10px 34px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.12);
                }
                .playground-btn.utility { padding: 0 8px; }
                .tool-title { display: flex; align-items: center; gap: 5px; }
                .tool-label { line-height: 1; }
                .playground-meta {
                    position: absolute; left: 18px; bottom: 16px; color: rgba(248,250,252,0.7);
                    font-size: 11px; line-height: 1.45; padding: 8px 10px; border-radius: 10px;
                    background: rgba(7,10,18,0.56); border: 1px solid rgba(255,255,255,0.08);
                    backdrop-filter: blur(18px);
                    z-index: 20;
                }
                .playground-cursor {
                    position: absolute; pointer-events: none; left: 0; top: 0; width: 28px; height: 28px;
                    border-radius: 50%; display: grid; place-items: center; color: transparent; font-size: 0;
                    border: 1px solid rgba(255,255,255,0.7);
                    background: ${tool === "laser" ? "rgba(239,68,68,0.2)" : "rgba(15,23,42,0.08)"};
                    box-shadow: ${tool === "laser"
                        ? "0 0 0 6px rgba(239,68,68,0.08), 0 0 22px rgba(239,68,68,0.46), inset 0 0 0 1px rgba(254,226,226,0.72)"
                        : "0 0 0 6px rgba(255,255,255,0.04), 0 8px 22px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(15,23,42,0.38)"};
                    will-change: transform; z-index: 26; opacity: ${tool === "laser" ? "0" : "1"};
                }
                .playground-cursor.hammer-cursor {
                    width: ${HAMMER_CURSOR_WIDTH}px; height: ${HAMMER_CURSOR_HEIGHT}px; border: 0; border-radius: 0;
                    background: url(${realisticHammerSrc}) center / contain no-repeat;
                    box-shadow: none; opacity: 1;
                    transform-origin: ${HAMMER_HAND_PIVOT_X}px ${HAMMER_HAND_PIVOT_Y}px;
                    filter: drop-shadow(0 16px 18px rgba(0,0,0,0.58));
                    --hammer-shadow-opacity: 0;
                    --hammer-shadow-scale: 0;
                    --hammer-shock-opacity: 0;
                }
                .playground-cursor.hammer-cursor::before {
                    display: none;
                }
                .playground-cursor.hammer-cursor::after {
                    display: none;
                }
                .playground-cursor.heat-cursor {
                    width: 42px; height: 42px; border: 0; border-radius: 50%; background: transparent;
                    box-shadow: none; opacity: 1; transform-origin: 50% 50%;
                    filter: drop-shadow(0 0 9px rgba(249,115,22,0.72)) drop-shadow(0 5px 7px rgba(15,23,42,0.62));
                }
                .playground-cursor.heat-cursor::before {
                    content: ""; position: absolute; inset: 0;
                    border-radius: 50%;
                    background:
                        radial-gradient(circle, rgba(15,23,42,0.58) 0 15%, rgba(127,29,29,0.42) 16% 25%, rgba(249,115,22,0.24) 26% 46%, transparent 50%),
                        radial-gradient(circle, rgba(255,255,255,0.96) 0 7%, rgba(254,240,138,0.78) 8% 18%, rgba(249,115,22,0.24) 19% 43%, transparent 48%),
                        radial-gradient(circle, transparent 0 53%, rgba(127,29,29,0.78) 54% 58%, rgba(254,240,138,0.9) 59% 63%, rgba(249,115,22,0.78) 64% 73%, transparent 76%);
                    box-shadow: inset 0 0 0 1px rgba(127,29,29,0.62), inset 0 0 12px rgba(254,240,138,0.38), 0 0 18px rgba(249,115,22,0.42);
                }
                .playground-cursor.heat-cursor::after {
                    content: ""; position: absolute; left: 50%; top: 50%; width: 7px; height: 7px;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    background:
                        radial-gradient(circle, rgba(255,255,255,0.95) 0 28%, rgba(254,240,138,0.9) 32% 62%, rgba(249,115,22,0) 70%);
                    box-shadow: 0 0 8px rgba(15,23,42,0.44), 0 0 12px rgba(254,240,138,0.92), 0 0 20px rgba(249,115,22,0.72);
                }
                .hammer-aim-marker {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 42px;
                    height: 18px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 25;
                    opacity: 0;
                    will-change: transform, opacity;
                    --hammer-aim-scale: 1;
                    --hammer-aim-impact: 0;
                    background:
                        radial-gradient(ellipse at 50% 62%, rgba(2,6,23,0.76) 0 22%, rgba(15,23,42,0.5) 43%, rgba(15,23,42,0) 78%),
                        radial-gradient(ellipse at 50% 50%, rgba(248,250,252,0.82) 0 7%, rgba(248,250,252,0.28) 8% 15%, transparent 18%);
                    filter: drop-shadow(0 5px 8px rgba(0,0,0,0.52));
                    box-shadow: 0 8px 14px rgba(0,0,0,0.28), 0 0 calc(10px + var(--hammer-aim-impact) * 10px) rgba(248,250,252,0.2);
                }
                .hammer-aim-marker::before,
                .hammer-aim-marker::after {
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 32px;
                    height: 2px;
                    border-radius: 999px;
                    background: linear-gradient(90deg, rgba(15,23,42,0), rgba(15,23,42,0.82), rgba(15,23,42,0));
                    transform-origin: 50% 50%;
                    opacity: 0.78;
                }
                .hammer-aim-marker::before {
                    transform: translate(-50%, -50%);
                }
                .hammer-aim-marker::after {
                    width: 2px;
                    height: 18px;
                    background: linear-gradient(180deg, rgba(15,23,42,0), rgba(15,23,42,0.76), rgba(15,23,42,0));
                    transform: translate(-50%, -50%);
                }
                .playground-cursor.laser-cursor {
                    --laser-blade-length: 384px;
                    --laser-plunge: 0px;
                    --laser-heat: 0.72;
                    --laser-drill: 0;
                    --laser-twist: 0deg;
                    width: 84px; height: 604px; border: 0; border-radius: 0; background: transparent;
                    box-shadow: none; opacity: 1; transform-origin: 50% 10px;
                    filter: drop-shadow(0 10px 14px rgba(0,0,0,0.36));
                }
                .playground-cursor.laser-cursor::before {
                    content: ""; position: absolute; left: 36px; top: 10px; width: 12px; height: var(--laser-blade-length);
                    z-index: 1;
                    border-radius: 999px;
                    background:
                        linear-gradient(90deg, rgba(255,255,255,0) 0 18%, rgba(255,255,255,0.98) 34% 66%, rgba(255,255,255,0) 82% 100%),
                        linear-gradient(180deg, rgba(255,255,255,0.98), rgba(254,226,226,0.98) 16%, rgba(248,113,113,0.92) 78%, rgba(127,29,29,0.34) 100%);
                    box-shadow:
                        0 0 4px rgba(255,255,255,0.96),
                        0 0 10px rgba(254,202,202,0.96),
                        0 0 22px rgba(248,113,113,0.9),
                        0 0 46px rgba(220,38,38,0.84),
                        0 0 78px rgba(127,29,29,0.52);
                    transform-origin: center bottom;
                    transition: height 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.08s ease, box-shadow 0.08s ease;
                }
                .playground-cursor.laser-cursor::after {
                    content: ""; position: absolute; left: 11px; top: calc(var(--laser-blade-length) - 18px); width: 62px; height: 212px;
                    z-index: 2;
                    border-radius: 0;
                    background: url("${laserHiltSrc}") center top / contain no-repeat;
                    box-shadow: none;
                    transform-origin: center top;
                    transition: top 0.16s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .playground-cursor.laser-cursor.laser-pressing::before {
                    filter: brightness(var(--laser-heat)) saturate(1.18);
                    box-shadow:
                        0 0 5px rgba(255,255,255,1),
                        0 0 13px rgba(254,202,202,1),
                        0 0 28px rgba(248,113,113,0.98),
                        0 0 58px rgba(220,38,38,0.92),
                        0 0 96px rgba(127,29,29,0.64);
                }
                .playground-cursor.laser-cursor.laser-pressing::after {
                    transform: translateY(calc(var(--laser-plunge) * 0.16));
                }
                .playground-cursor.laser-cursor.laser-drilling::before {
                    transform: translateY(calc(var(--laser-plunge) * -0.34)) scaleX(calc(1 + var(--laser-drill) * 0.55)) rotate(var(--laser-twist));
                    filter: brightness(1.28) saturate(1.45);
                    box-shadow:
                        0 0 7px rgba(255,255,255,1),
                        0 0 18px rgba(254,202,202,1),
                        0 0 38px rgba(248,113,113,1),
                        0 0 78px rgba(220,38,38,0.98),
                        0 0 118px rgba(127,29,29,0.72);
                }
                .playground-cursor.laser-cursor.laser-drilling::after {
                    transform: translateY(calc(var(--laser-plunge) * -0.34)) rotate(var(--laser-twist));
                }
                .playground-cursor.shot-cursor {
                    width: 46px; height: 46px; border: 0; border-radius: 0; background: transparent;
                    box-shadow: none; opacity: 1; transform-origin: 50% 50%;
                }
                .playground-cursor.shot-cursor::before {
                    content: ""; position: absolute; left: 5px; top: 5px; width: 36px; height: 36px;
                    border: 1px solid rgba(226,232,240,0.9); border-radius: 999px;
                    background:
                        radial-gradient(circle, rgba(248,250,252,0.98) 0 1.5px, rgba(15,23,42,0.58) 1.5px 3px, rgba(248,250,252,0) 3px),
                        radial-gradient(circle, rgba(248,250,252,0) 0 8px, rgba(226,232,240,0.58) 8px 9px, rgba(248,250,252,0) 9px),
                        linear-gradient(rgba(226,232,240,0.78), rgba(226,232,240,0.78)) center / 1px 100% no-repeat,
                        linear-gradient(90deg, rgba(226,232,240,0.78), rgba(226,232,240,0.78)) center / 100% 1px no-repeat;
                    box-shadow: 0 0 5px rgba(125,211,252,0.36), inset 0 0 0 10px rgba(15,23,42,0.14);
                }
                .playground-cursor.shot-cursor::after {
                    content: ""; position: absolute; left: 8px; top: 8px; width: 30px; height: 30px;
                    border-radius: 999px;
                    background:
                        linear-gradient(rgba(248,250,252,0.66), rgba(248,250,252,0.66)) center top / 1px 7px no-repeat,
                        linear-gradient(rgba(248,250,252,0.66), rgba(248,250,252,0.66)) center bottom / 1px 7px no-repeat,
                        linear-gradient(90deg, rgba(248,250,252,0.66), rgba(248,250,252,0.66)) left center / 7px 1px no-repeat,
                        linear-gradient(90deg, rgba(248,250,252,0.66), rgba(248,250,252,0.66)) right center / 7px 1px no-repeat;
                    box-shadow: 0 0 6px rgba(125,211,252,0.42);
                }
                .playground-cursor.splash-cursor {
                    width: 1px; height: 1px; border: 0; background: transparent;
                    box-shadow: none; opacity: 0; transform-origin: 50% 50%;
                    filter: none;
                }
                .playground-cursor.splash-cursor::before {
                    content: none;
                }
                .playground-cursor.splash-cursor::after {
                    content: none;
                }
                .playground-cursor.throw-cursor {
                    width: 72px; height: 72px; border: 0; border-radius: 0; background: transparent;
                    box-shadow: none; opacity: 0; transform-origin: 50% 50%;
                }
                .playground-cursor.throw-cursor::before {
                    content: ""; position: absolute; left: 16px; top: 18px; width: 38px; height: 44px;
                    border-radius: 42% 42% 46% 46%;
                    background:
                        radial-gradient(circle at 30% 24%, rgba(255,255,255,0.42), rgba(255,255,255,0) 28%),
                        linear-gradient(135deg, #f6c690, #d9965d 58%, #925a34);
                    box-shadow: inset -7px -7px 10px rgba(91,44,18,0.28), 0 10px 20px rgba(0,0,0,0.34);
                    transform: rotate(-22deg);
                }
                .playground-cursor.throw-cursor::after {
                    content: ""; position: absolute; left: 8px; top: 12px; width: 52px; height: 52px;
                    background:
                        radial-gradient(ellipse at 20px 12px, #f7ca96 0 7px, rgba(0,0,0,0) 7.5px),
                        radial-gradient(ellipse at 30px 10px, #f0bd84 0 7px, rgba(0,0,0,0) 7.5px),
                        radial-gradient(ellipse at 39px 14px, #dda06b 0 6.5px, rgba(0,0,0,0) 7px),
                        radial-gradient(ellipse at 46px 20px, #c98755 0 6px, rgba(0,0,0,0) 6.5px);
                    filter: drop-shadow(0 5px 7px rgba(0,0,0,0.28));
                    transform: rotate(-22deg);
                }
                .hand-food-holder {
                    position: absolute; left: 24px; top: 16px; width: 32px; height: 32px;
                    display: grid; place-items: center; pointer-events: none;
                    z-index: 5; transition: opacity 0.12s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .throwing .hand-food-holder {
                    opacity: 0; transform: scale(0.4) translate(20px, -20px);
                }
                .food-visual {
                    width: 28px; height: 28px; border-radius: 50%; position: relative;
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.34));
                }
                .food-visual.tomato {
                    width: 38px; height: 38px; border-radius: 0;
                    background: url("${slingerTomatoSheetSrc}") 0 50% / 900% auto no-repeat;
                }
                .food-visual.egg {
                    width: 38px; height: 38px; border-radius: 0;
                    background: url("${slingerEggSheetSrc}") 0 50% / 900% auto no-repeat;
                }
                .food-visual.watermelon {
                    width: 42px; height: 42px; border-radius: 0;
                    background: url("${slingerWatermelonSheetSrc}") 0 50% / 900% auto no-repeat;
                }
                .food-visual.strawberry {
                    width: 38px; height: 38px; border-radius: 0;
                    background: url("${slingerStrawberrySheetSrc}") 0 50% / 900% auto no-repeat;
                }
                .throw-food-picker {
                    display: inline-flex; align-items: center; gap: 5px; padding-left: 7px; margin-left: 4px;
                    border-left: 1px solid rgba(255,255,255,0.1);
                }
                .throw-food-btn {
                    width: 36px; height: 34px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
                    display: inline-grid; place-items: center; padding: 0; cursor: pointer; color: #f8fafc;
                    background:
                        radial-gradient(circle at 50% 34%, rgba(255,255,255,0.14), rgba(255,255,255,0) 46%),
                        rgba(255,255,255,0.055);
                    font-size: 13px; line-height: 1;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 7px 14px rgba(0,0,0,0.16);
                    transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
                }
                .throw-food-btn:hover {
                    transform: translateY(-1px);
                    border-color: rgba(255,255,255,0.24);
                    background:
                        radial-gradient(circle at 50% 34%, rgba(255,255,255,0.22), rgba(255,255,255,0) 50%),
                        rgba(255,255,255,0.085);
                }
                .throw-food-btn.active {
                    border-color: rgba(251,191,36,0.7); background: rgba(251,191,36,0.16);
                    box-shadow: 0 0 18px rgba(251,191,36,0.16), inset 0 1px 0 rgba(255,255,255,0.14);
                }
                .food-icon { position: relative; width: 30px; height: 30px; display: block; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.42)); }
                .food-icon.tomato {
                    width: 32px; height: 32px; border-radius: 0;
                    background: url("${slingerTomatoSheetSrc}") 0 50% / 900% auto no-repeat;
                    transform: translate(1px, -0.5px);
                }
                .food-icon.egg {
                    width: 32px; height: 32px; border-radius: 0;
                    background: url("${slingerEggSheetSrc}") 0 50% / 900% auto no-repeat;
                }
                .food-icon.watermelon {
                    width: 33px; height: 33px; border-radius: 0;
                    background: url("${slingerWatermelonSheetSrc}") 0 50% / 900% auto no-repeat;
                }
                .food-icon.strawberry {
                    width: 32px; height: 32px; border-radius: 0;
                    background: url("${slingerStrawberrySheetSrc}") 0 50% / 900% auto no-repeat;
                }
                .object-picker {
                    display: inline-flex; align-items: center; gap: 3px; padding-left: 4px; margin-left: 2px;
                    border-left: 1px solid rgba(255,255,255,0.1);
                }
                .object-btn {
                    width: 28px; height: 26px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
                    display: inline-grid; place-items: center; padding: 0; cursor: pointer; background: rgba(255,255,255,0.045);
                }
                .object-btn.active {
                    border-color: rgba(148,163,184,0.72); background: rgba(148,163,184,0.16);
                    box-shadow: 0 0 18px rgba(148,163,184,0.16), inset 0 1px 0 rgba(255,255,255,0.14);
                }
                .object-icon { position: relative; width: 20px; height: 18px; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.38)); }
                .object-icon.fly::before {
                    content: ""; position: absolute; left: 8px; top: 4px; width: 5px; height: 12px; border-radius: 50%;
                    background: linear-gradient(90deg, #09090b, #71717a 45%, #18181b);
                }
                .object-icon.fly::after {
                    content: ""; position: absolute; left: 2px; top: 1px; width: 16px; height: 12px;
                    background:
                        radial-gradient(ellipse at 30% 50%, rgba(226,232,240,0.72) 0 32%, rgba(226,232,240,0) 34%),
                        radial-gradient(ellipse at 70% 50%, rgba(226,232,240,0.72) 0 32%, rgba(226,232,240,0) 34%);
                }
                .object-icon.hair::before {
                    content: ""; position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse at 20% 50%, transparent 0 42%, rgba(17,24,39,0.9) 43% 46%, transparent 47%),
                        radial-gradient(ellipse at 42% 52%, transparent 0 40%, rgba(71,55,39,0.9) 41% 44%, transparent 45%),
                        radial-gradient(ellipse at 64% 48%, transparent 0 38%, rgba(226,232,240,0.72) 39% 42%, transparent 43%);
                    transform: rotate(-20deg);
                }
                .playground-source-panel {
                    position: absolute; right: 20px; top: 78px; width: min(720px, calc(100vw - 40px)); max-height: calc(100vh - 118px);
                    overflow: auto; padding: 12px; border-radius: 18px; z-index: 30;
                    border: 1px solid rgba(255,255,255,0.12); background: rgba(7,10,18,0.84);
                    backdrop-filter: blur(24px) saturate(150%); box-shadow: 0 24px 70px rgba(0,0,0,0.42);
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;
                }
                .source-card {
                    border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.04);
                    border-radius: 12px; padding: 8px; color: #e2e8f0; cursor: pointer; text-align: left;
                }
                .source-card.active { border-color: rgba(125,211,252,0.55); background: rgba(14,165,233,0.13); }
                .source-card img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 8px; display: block; background: #020617; }
                .source-name { margin-top: 7px; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .source-kind { margin-top: 2px; font-size: 9px; color: rgba(203,213,225,0.66); text-transform: uppercase; letter-spacing: 0.08em; }
                .playground-confirm-overlay {
                    position: absolute; inset: 0; background: rgba(3, 7, 18, 0.45);
                    backdrop-filter: blur(14px); z-index: 50; display: grid; place-items: center;
                    animation: fadeIn 0.22s ease-out;
                }
                .playground-confirm-modal {
                    background: linear-gradient(145deg, rgba(13, 17, 28, 0.94), rgba(7, 10, 18, 0.98));
                    border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px;
                    padding: 30px; width: min(440px, calc(100vw - 40px)); text-align: center;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255, 255, 255, 0.08);
                    animation: modalScale 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .confirm-modal-title { font-size: 18px; font-weight: 800; color: #f8fafc; margin-bottom: 10px; letter-spacing: -0.01em; }
                .confirm-modal-desc { font-size: 13px; color: rgba(203, 213, 225, 0.7); line-height: 1.6; margin-bottom: 24px; }
                .confirm-modal-actions { display: flex; flex-direction: column; gap: 8px; }
                .confirm-btn {
                    height: 38px; border-radius: 10px; border: 1px solid transparent; font-size: 12px; font-weight: 700;
                    cursor: pointer; transition: all 0.16s ease; display: inline-flex; align-items: center; justify-content: center;
                }
                .confirm-btn.resume {
                    background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.08); color: #e2e8f0;
                }
                .confirm-btn.resume:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.15); transform: translateY(-1px); }
                .confirm-btn.quit {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.28), rgba(185, 28, 28, 0.2));
                    border-color: rgba(239, 68, 68, 0.38); color: #fee2e2;
                }
                .confirm-btn.quit:hover {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(185, 28, 28, 0.3));
                    border-color: rgba(239, 68, 68, 0.6); transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.16);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            <canvas
                ref={canvasRef}
                className="playground-canvas"
                onPointerMove={(event) => {
                    if (pointerRef.current.smoothX < -100 || pointerRef.current.smoothY < -100) {
                        pointerRef.current.smoothX = event.clientX;
                        pointerRef.current.smoothY = event.clientY;
                    }
                    pointerRef.current.x = event.clientX;
                    pointerRef.current.y = event.clientY;
                    if (toolRef.current === "throw" && slingerRef.current.active && canvasRef.current) {
                        const point = getCanvasPoint(event, canvasRef.current);
                        const state = slingerRef.current;
                        const pull = clampSlingerPull(state.anchorX, state.anchorY, point.x, point.y);
                        state.targetPullX = pull.x;
                        state.targetPullY = pull.y;
                        return;
                    }
                    if (event.buttons === 1 && canvasRef.current && toolRef.current !== "throw" && toolRef.current !== "glyph") {
                        if (toolRef.current === "splash" && splashRef.current.active) {
                            const point = getCanvasPoint(event, canvasRef.current);
                            const splash = splashRef.current;
                            splash.x += (point.x - splash.x) * 0.72;
                            splash.y += (point.y - splash.y) * 0.72;
                            return;
                        }
                        if (toolRef.current === "laser") {
                            const point = getCanvasPoint(event, canvasRef.current);
                            const cut = laserCutRef.current;
                            cut.active = true;
                            cut.targetX = point.x;
                            cut.targetY = point.y;
                            return;
                        }
                        const point = getCanvasPoint(event, canvasRef.current);
                        const impactPoint = toolRef.current === "hammer"
                            ? getHammerContactPoint(point.x, point.y)
                            : point;
                        addDragImpact(impactPoint.x, impactPoint.y);
                    }
                }}
                onPointerDown={(event) => {
                    if (event.button === 2 && (toolRef.current === "hammer" || toolRef.current === "scatter" || toolRef.current === "burn" || toolRef.current === "laser" || toolRef.current === "splash")) {
                        event.preventDefault();
                    }
                    event.currentTarget.setPointerCapture(event.pointerId);
                    if (pointerRef.current.smoothX < -100 || pointerRef.current.smoothY < -100) {
                        pointerRef.current.smoothX = event.clientX;
                        pointerRef.current.smoothY = event.clientY;
                    }
                    pointerRef.current.x = event.clientX;
                    pointerRef.current.y = event.clientY;
                    const point = getCanvasPoint(event, event.currentTarget);
                    const impactPoint = toolRef.current === "hammer"
                        ? getHammerContactPoint(point.x, point.y)
                        : point;
                    if (event.button === 2 && toolRef.current === "hammer") {
                        lastDragImpactRef.current = { x: impactPoint.x, y: impactPoint.y, at: performance.now() };
                        startHeavyHammerStrike(impactPoint.x, impactPoint.y);
                        return;
                    }
                    if (event.button === 2 && toolRef.current === "scatter") {
                        lastDragImpactRef.current = { x: impactPoint.x, y: impactPoint.y, at: performance.now() };
                        addImpact(impactPoint.x, impactPoint.y, {
                            heavyArrow: true,
                            impactScale: HEAVY_ARROW_IMPACT_SCALE,
                            skipSuppress: true,
                            toolOverride: "scatter",
                        });
                        return;
                    }
                    if (event.button === 2 && toolRef.current === "burn") {
                        lastDragImpactRef.current = { x: impactPoint.x, y: impactPoint.y, at: performance.now() };
                        addImpact(impactPoint.x, impactPoint.y, {
                            hugeFireball: true,
                            impactScale: 2.25,
                            skipSuppress: true,
                            toolOverride: "burn",
                        });
                        return;
                    }
                    if (event.button === 2 && toolRef.current === "laser") {
                        lastDragImpactRef.current = { x: point.x, y: point.y, at: performance.now() };
                        laserCutRef.current = createLaserCutState();
                        triggerLaserDrill(point.x, point.y, lastLaserCutRef.current.angle);
                        return;
                    }
                    if (event.button === 2 && toolRef.current === "splash") {
                        event.preventDefault();
                        splashRef.current = createSplashState();
                        return;
                    }
                    if (event.button === 0) {
                        const now = performance.now();
                        if (toolRef.current === "laser") {
                            if (!mutedRef.current && now - lastLaserSoundAtRef.current > 70) {
                                lastLaserSoundAtRef.current = now;
                                playToolSound("laser");
                            }
                            laserCutRef.current = {
                                active: true,
                                pointerId: event.pointerId,
                                holdStartAt: now,
                                targetX: point.x,
                                targetY: point.y,
                                tipX: point.x,
                                tipY: point.y,
                                lastTipX: point.x,
                                lastTipY: point.y,
                                lastEmitAt: 0,
                                lastShardAt: 0,
                                angle: lastLaserCutRef.current.angle,
                                initialized: true,
                            };
                            return;
                        }
                        if (toolRef.current === "splash") {
                            event.preventDefault();
                            const pose = getSplashPistolPose(point.x, point.y, splashRef.current.angle, 0.58);
                            const angle = pose.angle;
                            splashRef.current = {
                                active: true,
                                pointerId: event.pointerId,
                                startX: point.x,
                                startY: point.y,
                                x: point.x,
                                y: point.y,
                                lastX: point.x,
                                lastY: point.y,
                                angle,
                                startedAt: now,
                                lastEmitAt: 0,
                                pressure: 0.56,
                            };
                            applySplashPressure(point.x, point.y, angle, 0.58);
                            if (!mutedRef.current && now - lastSoundAtRef.current > 80) {
                                lastSoundAtRef.current = now;
                                playToolSound("splash");
                            }
                            return;
                        }
                        if (toolRef.current === "throw") {
                            event.preventDefault();
                            slingerRef.current = {
                                active: true,
                                pointerId: event.pointerId,
                                anchorX: point.x,
                                anchorY: point.y,
                                pullX: point.x,
                                pullY: point.y,
                                targetPullX: point.x,
                                targetPullY: point.y,
                                chargeStartAt: now,
                                seed: Math.floor(now * 1000) % 100000,
                            };
                            return;
                        }
                    }
                    lastDragImpactRef.current = { x: impactPoint.x, y: impactPoint.y, at: performance.now() };
                    addImpact(impactPoint.x, impactPoint.y);
                }}
                onContextMenu={(event) => {
                    if (toolRef.current === "hammer" || toolRef.current === "scatter" || toolRef.current === "burn" || toolRef.current === "laser" || toolRef.current === "splash") {
                        event.preventDefault();
                    }
                }}
                onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    if (slingerRef.current.pointerId === event.pointerId) {
                        const point = getCanvasPoint(event, event.currentTarget);
                        const state = slingerRef.current;
                        const pull = clampSlingerPull(state.anchorX, state.anchorY, point.x, point.y);
                        state.targetPullX = pull.x;
                        state.targetPullY = pull.y;
                        try {
                            launchSlingerFruit();
                        } catch (error) {
                            console.error("[playground] Slinger launch failed", error);
                        }
                        slingerRef.current = createSlingerState();
                    }
                    if (laserCutRef.current.pointerId === event.pointerId) {
                        laserCutRef.current = createLaserCutState();
                    }
                    if (splashRef.current.pointerId === event.pointerId) {
                        splashRef.current = createSplashState();
                    }
                }}
                onPointerCancel={() => {
                    laserCutRef.current = createLaserCutState();
                    slingerRef.current = createSlingerState();
                    splashRef.current = createSplashState();
                }}
                onPointerLeave={(event) => {
                    if (event.buttons !== 1 && !slingerRef.current.active) {
                        laserCutRef.current = createLaserCutState();
                        splashRef.current = createSplashState();
                    }
                }}
            />
            <div className="playground-hud">
                {TOOLS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`playground-btn ${tool === item.id ? "active" : ""}`}
                        title={`${item.detail} (${item.hotkey})`}
                        onClick={() => selectTool(item.id)}
                    >
                        <span className="tool-title">{item.icon}<span className="tool-label">{item.label}</span></span>
                    </button>
                ))}
                {tool === "throw" && (
                    <div className="throw-food-picker" aria-label="Slinger fruit">
                        {THROW_FOODS.map((food) => (
                            <button
                                key={food.id}
                                type="button"
                                className={`throw-food-btn ${throwFood === food.id ? "active" : ""}`}
                                title={food.label}
                                onClick={() => setThrowFood(food.id)}
                            >
                                <span className={`food-icon ${food.id}`} aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                )}
                <button type="button" className="playground-btn utility" onClick={() => setSourcePickerOpen((value) => !value)}><ImageIcon size={14} /> Source</button>
                <button type="button" className="playground-btn utility" onClick={() => setMuted((value) => !value)}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />} Sound</button>
                <button type="button" className="playground-btn utility" onClick={() => void saveSnapshot()}><Save size={14} /> {saveStatus || "Save"}</button>
                <button type="button" className="playground-btn utility" onClick={reset}><RotateCcw size={14} /> Reset</button>
                <button type="button" className="playground-btn utility" onClick={() => setConfirmQuitOpen(true)}><X size={14} /> Close</button>
            </div>
            {sourcePickerOpen && payload && (
                <div className="playground-source-panel">
                    {payload.sources.map((source) => (
                        <button
                            key={source.id}
                            type="button"
                            className={`source-card ${selectedSourceId === source.id ? "active" : ""}`}
                            onClick={() => chooseSource(source)}
                        >
                            <img src={source.dataUrl} alt="" />
                            <div className="source-name">{source.name}</div>
                            <div className="source-kind">{source.kind}</div>
                        </button>
                    ))}
                </div>
            )}
            <div className="playground-meta">
                {selectedTool.label} mode. Impacts: {impactCount}. 1-9 tools, R reset, Esc close.
            </div>
            <div
                ref={cursorRef}
                className={`playground-cursor ${tool === "hammer" ? "hammer-cursor" : ""} ${tool === "burn" ? "heat-cursor" : ""} ${tool === "laser" ? "laser-cursor" : ""} ${tool === "scatter" ? "shot-cursor" : ""} ${tool === "splash" ? "splash-cursor" : ""} ${tool === "throw" ? "throw-cursor" : ""}`}
            >
                {tool === "throw" && (
                    <div className="hand-food-holder">
                        <div className={`food-visual ${throwFood}`} />
                    </div>
                )}
                {tool !== "hammer" && tool !== "burn" && tool !== "splash" ? selectedTool.cursor : null}
            </div>
            <div ref={hammerAimRef} className="hammer-aim-marker" />
            {!payload && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#f8fafc", background: "#05070d" }}>
                    Loading Screen Playground...
                </div>
            )}
            {confirmQuitOpen && (
                <div className="playground-confirm-overlay">
                    <div className="playground-confirm-modal">
                        <div className="confirm-modal-title">Exit Playground?</div>
                        <div className="confirm-modal-desc">Are you sure you want to quit the screen playground? Any unsaved captures will be lost.</div>
                        <div className="confirm-modal-actions">
                            <button type="button" className="confirm-btn resume" onClick={() => setConfirmQuitOpen(false)}>Resume Capture</button>
                            <button type="button" className="confirm-btn quit" onClick={() => window.screenPlaygroundAPI?.close()}>Quit Game</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

createRoot(document.getElementById("root")!).render(<ScreenPlayground />);
