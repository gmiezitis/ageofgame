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

type ThrowFoodId = "tomato" | "egg" | "watermelon" | "strawberry";

type FruitProfile = {
    id: ThrowFoodId;
    label: string;
    stain: string;
    pulp: string;
    skin: string;
    seed?: string;
    mass: number;
    radius: number;
    splatScale: number;
    slideSpeed: [number, number];
    burst: number;
};

const THROW_FOODS: FruitProfile[] = [
    { id: "watermelon", label: "Watermelon", stain: "rgba(127,29,29,0.38)", pulp: "#fb7185", skin: "#166534", seed: "#111827", mass: 1.42, radius: 36, splatScale: 1.72, slideSpeed: [0.0018, 0.0032], burst: 32 },
    { id: "egg", label: "Egg", stain: "rgba(254,243,199,0.22)", pulp: "#facc15", skin: "#f8fafc", seed: "#f59e0b", mass: 0.72, radius: 19, splatScale: 1.08, slideSpeed: [0.0042, 0.0068], burst: 9 },
    { id: "strawberry", label: "Strawberry", stain: "rgba(159,18,57,0.28)", pulp: "#e11d48", skin: "#7f1d1d", seed: "#fef08a", mass: 0.96, radius: 20, splatScale: 0.88, slideSpeed: [0.0022, 0.0038], burst: 12 },
    { id: "tomato", label: "Tomato", stain: "rgba(153,27,27,0.34)", pulp: "#ef4444", skin: "#991b1b", seed: "#fde68a", mass: 0.88, radius: 24, splatScale: 1.62, slideSpeed: [0.0038, 0.0062], burst: 26 },
];

const MAX_IMPACTS = 96;
const MAX_PARTICLES = 48;
const MAX_ENTITIES = 40;
const MAX_LETTER_KNOCK_QUEUE = 18;
const TICKS_PER_CLICK = 5;
const MAX_SCREEN_TICKS = 60;
const TICK_LIFE_MS = 16000;
const TICK_TRACE_STAMP_MS = 260;
const TICK_SPRITE_FORWARD_ANGLE = 2.3;
const RENDER_DPR_CAP = 1;
const DRAGON_RENDER_DPR_CAP = 1.6;
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
const SPLASH_EMIT_MS = 48;
const SPLASH_RESET_MIN_MS = 110;
const SPLASH_RESET_MIN_DISTANCE = 34;
const SPLASH_RESET_MIN_ANGLE = 0.18;
const SPLASH_FAUCET_EMIT_MS = 150;
const SPLASH_HOLD_ARM_MS = 430;
const SPLASH_OVERFLOW_AFTER_MS = 2400;
const SPLASH_FLOOD_DRAIN_PER_MS = 0.000014;
const SPLASH_FLOOD_FILL_PER_MS = 0.000052;
const SPLASH_PISTOL_OFFSET_X = -232;
const SPLASH_PISTOL_OFFSET_Y = 76;
const SPLASH_PISTOL_NOZZLE_X = 0.095;
const SPLASH_PISTOL_NOZZLE_Y = -0.2;
const SPLASH_PISTOL_HOSE_X = -0.785;
const SPLASH_PISTOL_HOSE_Y = 0.54;
const SPLASH_FISH_MIN_WATER_LEVEL = 0.13;
const SPLASH_FISH_MAX = 7;
const SPLASH_FISH_SPAWN_MS = 820;
const SPLASH_FISH_SHEET_COLS = 4;
const SPLASH_FISH_SHEET_ROWS = 4;
const SPLASH_FISH_FRAME_SEQUENCE = Array.from({ length: SPLASH_FISH_SHEET_COLS * SPLASH_FISH_SHEET_ROWS }, (_, index) => index);
const SPLASH_FISH_FRAME_CROP_X = [
    [0.176, 0.08],
    [0.125, 0.101],
    [0.105, 0.125],
    [0.082, 0.173],
];
const SPLASH_FISH_FRAME_CROP_Y = [
    [0.275, 0.174],
    [0.264, 0.203],
    [0.223, 0.245],
    [0.191, 0.281],
];
const HAMMER_PIGLET_SHEET_COLS = 4;
const HAMMER_PIGLET_SHEET_ROWS = 3;
const HAMMER_PIGLET_RUN_FRAMES = [0, 1, 2, 3, 4, 5, 8, 9, 10];
const HAMMER_PIGLET_LOOK_FRAMES = [6, 7];
const HAMMER_PIGLET_MIN_SPAWN_MS = 14000;
const HAMMER_PIGLET_MAX_SPAWN_MS = 26000;
const HAMMER_PIGLET_MAX_ACTIVE = 1;
const HAMMER_PIGLET_FRAME_CROPS: Array<[number, number, number, number]> = [
    [0.05, 0.22, 0.05, 0.05],
    [0.05, 0.22, 0.05, 0.05],
    [0.05, 0.19, 0.05, 0.05],
    [0.05, 0.2, 0.05, 0.05],
    [0.21, 0.21, 0.14, 0.16],
    [0.25, 0.16, 0.2, 0.08],
    [0.26, 0.14, 0.23, 0.05],
    [0.26, 0.15, 0.25, 0.05],
    [0.12, 0.28, 0.12, 0.21],
    [0.1, 0.25, 0.1, 0.18],
    [0.27, 0.31, 0.08, 0.17],
    [0.46, 0.34, 0.02, 0.04],
];
const SLINGER_MAX_PULL = 172;
const SLINGER_MIN_PULL_TO_LAUNCH = 14;
const SLINGER_POWER_DEADZONE = 8;
const SLINGER_SPRITE_SPLAT_LIFE_MULTIPLIER = 4;
type PlaygroundSpriteKey = "arrow" | "burnScorch" | "dragon" | "emberParticle" | "fishSheet" | "flame" | "glassCrack" | "impactFlame" | "hammer" | "pigletRunSheet" | "skeleton" | "spider" | "tick" | "tickTrace" | "splashPistol" | "splashCrane" | "eggSheet" | "slingerFrame" | "strawberrySheet" | "tomatoSheet" | "watermelonSheet";
type PlaygroundSprites = Partial<Record<PlaygroundSpriteKey, HTMLImageElement>>;
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

type SplashState = {
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    angle: number;
    startedAt: number;
    lastEmitAt: number;
    pressure: number;
};

type SplashRigState = {
    hoseConnected: boolean;
    faucetOn: boolean;
    waterLevel: number;
    lastLeakAt: number;
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

const SLINGER_PROJECTILE_DEPTH = 250;
const SLINGER_GRAVITY = 0.00072;
const TOMATO_CONTACT_MS = 110;
const TOMATO_BURST_MS = 240;
const TOMATO_SETTLE_MS = 520;
const WATERMELON_CONTACT_MS = 125;
const WATERMELON_BURST_MS = 280;
const WATERMELON_SETTLE_MS = 620;
const DRAGON_SHEET_FRAMES = 16;
const DRAGON_BREATH_FLAME_SHEET_FRAMES = 18;
const DRAGON_IMPACT_FLAME_SHEET_FRAMES = 20;
const EMBER_PARTICLE_SHEET_FRAMES = 12;
const DRAGON_HEAD_TWEEN_STEPS = 5;
const DRAGON_SOURCE_FRAME_PX = 704;
const DRAGON_MIN_DISPLAY_HEIGHT = 260;
const DRAGON_MAX_DISPLAY_HEIGHT = 440;
const DRAGON_FRAME_ASPECT = 1;
const DRAGON_MOUTH_X = 0.36;
const DRAGON_MOUTH_Y = 0.61;
const DRAGON_BREATH_ORIGIN_FORWARD = -0.012;
const DRAGON_BREATH_ORIGIN_DOWN = 0.012;
const DRAGON_DOCK_VISIBLE_RATIO = 0.82;
const DRAGON_ROAR_ANIMATION_MS = 8100;
const HAMMER_CURSOR_WIDTH = 142;
const HAMMER_CURSOR_HEIGHT = 248;
const HAMMER_HEAD_CONTACT_X = 56;
const HAMMER_HEAD_CONTACT_Y = 40;
const HAMMER_HAND_PIVOT_X = 78;
const HAMMER_HAND_PIVOT_Y = 214;
const HAMMER_TARGET_OFFSET_X = 0;
const HAMMER_TARGET_OFFSET_Y = 0;
const HAMMER_IDLE_ROTATION = -32;
const HAMMER_WINDUP_ROTATION = -96;
const HAMMER_IMPACT_ROTATION = 16;
const HAMMER_CONTACT_ROTATION = -38;
const HAMMER_SWING_MS = 240;
const HAMMER_WINDUP_T = 0.18;
const HAMMER_IMPACT_T = 0.44;
const HAMMER_CONTACT_PROGRESS = 1 - Math.cbrt(1 - ((HAMMER_CONTACT_ROTATION - HAMMER_WINDUP_ROTATION) / (HAMMER_IMPACT_ROTATION - HAMMER_WINDUP_ROTATION)));
const HAMMER_CONTACT_T = HAMMER_WINDUP_T + (HAMMER_IMPACT_T - HAMMER_WINDUP_T) * HAMMER_CONTACT_PROGRESS;
const HAMMER_IMPACT_DELAY_MS = HAMMER_SWING_MS * HAMMER_CONTACT_T;
const MAX_PENDING_HAMMER_IMPACTS = 2;
const HAMMER_EXTRACTION_MIN_DELAY_MS = 34;
const HAMMER_EXTRACTION_IDLE_TIMEOUT_MS = 180;
const HAMMER_EXTRACTION_MIN_IDLE_MS = 9;
const HEAVY_HAMMER_SWING_MS = 540;
const HEAVY_HAMMER_IMPACT_DELAY_MS = 420;
const HEAVY_HAMMER_IMPACT_SCALE = 2.24;
const ARROW_LIFE_MS = 120000;
const HEAVY_ARROW_LIFE_MS = 120000;
const MAX_ACTIVE_ARROWS = 24;
const HEAVY_ARROW_IMPACT_SCALE = 3.05;
const ARROW_FLIGHT_MS = 320;
const ARROW_IMPACT_MS = 540;
const ARROW_FADE_MS = 0;
const SCREEN_CRACK_PULSE_MS = 760;
const MAX_SCREEN_CRACK_PULSES = 10;
const dragonSilhouetteCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
const dragonHeadCleanFrameCache = new WeakMap<HTMLImageElement, Map<number, HTMLCanvasElement>>();
const dragonHeadTweenFrameCache = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();

const closeAlphaMask = (
    source: Uint8ClampedArray,
    width: number,
    height: number,
    iterations: number
): Uint8ClampedArray => {
    let mask: Uint8ClampedArray = new Uint8ClampedArray(width * height);
    for (let index = 0; index < mask.length; index += 1) {
        mask[index] = source[index * 4 + 3] > 10 ? 255 : 0;
    }

    const dilate = (input: Uint8ClampedArray): Uint8ClampedArray => {
        const output = new Uint8ClampedArray(input.length);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                if (input[index] > 0) {
                    output[index] = 255;
                    continue;
                }
                let filled = false;
                for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1) && !filled; yy += 1) {
                    for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx += 1) {
                        if (input[yy * width + xx] > 0) {
                            output[index] = 255;
                            filled = true;
                            break;
                        }
                    }
                }
            }
        }
        return output;
    };

    const erode = (input: Uint8ClampedArray): Uint8ClampedArray => {
        const output = new Uint8ClampedArray(input.length);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let solid = true;
                for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1) && solid; yy += 1) {
                    for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx += 1) {
                        if (input[yy * width + xx] === 0) {
                            solid = false;
                            break;
                        }
                    }
                }
                output[y * width + x] = solid ? 255 : 0;
            }
        }
        return output;
    };

    for (let pass = 0; pass < iterations; pass += 1) mask = dilate(mask);
    for (let pass = 0; pass < iterations; pass += 1) mask = erode(mask);
    return mask;
};

const traceRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void => {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
};

const drawReferenceSpider = (ctx: CanvasRenderingContext2D, creature: Creature, now: number, sprite: HTMLImageElement): void => {
    const size = creature.size * (creature.mergeScale ?? 1);
    const speed = Math.hypot(creature.vx, creature.vy);
    const angle = creature.heading ?? (speed > 0.05 ? Math.atan2(creature.vy, creature.vx) : creature.phase);
    
    // Freeze the stride animation when stationary to keep leg movement realistic and super clean
    const isMoving = speed > 0.1;
    const stride = isMoving 
        ? now * (0.003 + Math.min(0.018, speed * 0.012)) + creature.seed 
        : creature.seed;
        
    // Suppress twitch/lift shifts when resting to ensure perfectly still and smooth state transitions
    const moveScale = isMoving ? 1 : 0;
    const lift = Math.sin(stride * 1.35) * size * 0.03 * moveScale;
    const lateral = Math.sin(stride * 2.05 + creature.seed) * size * (0.012 + speed * 0.01) * moveScale;
    const twitch = (Math.sin(stride * 1.62) + Math.sin(stride * 0.58 + creature.seed)) * 0.022 * moveScale;
    const react = Math.max(0, creature.bumpReact ?? 0) / 34;
    const height = size * (3.25 + react * 0.18);

    const isWalkSheet = sprite.naturalWidth > sprite.naturalHeight * 2;
    if (isWalkSheet) {
        // Dynamically compute walk sheet frame count (e.g. 15 frames) based on width-height proportions to prevent glitchy jumps
        const frameCount = Math.round(sprite.naturalWidth / sprite.naturalHeight) || 15;
        const sourceWidth = sprite.naturalWidth / frameCount;
        const sourceHeight = sprite.naturalHeight;
        const spriteWidth = size * 3.4;
        const spriteHeight = spriteWidth * (sourceHeight / sourceWidth);
        const walkProgress = ((((stride % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * frameCount;
        const frameIndex = Math.floor(walkProgress) % frameCount;

        ctx.save();
        ctx.translate(creature.x + lateral, creature.y + lift);
        // Corrected math orientation from subtraction to addition so the spider faces forwards head-first
        ctx.rotate(angle + Math.PI / 2 + twitch * 0.55);
        ctx.shadowColor = "rgba(0,0,0,0.64)";
        ctx.shadowBlur = size * 0.22;
        ctx.shadowOffsetY = size * 0.15;
        ctx.drawImage(
            sprite,
            frameIndex * sourceWidth,
            0,
            sourceWidth,
            sourceHeight,
            -spriteWidth / 2,
            -spriteHeight / 2,
            spriteWidth,
            spriteHeight,
        );
        ctx.restore();
        return;
    }

    const width = height * (sprite.naturalWidth / sprite.naturalHeight);
    const eyeFlicker = 0.34 + Math.max(0, Math.sin(stride * 3.9 + creature.seed)) * 0.28;

    ctx.save();
    ctx.translate(creature.x + lateral, creature.y + lift);
    ctx.rotate(angle + (Math.PI / 2) + twitch);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.save();
    ctx.translate(Math.sin(stride * 1.8) * size * 0.01, Math.cos(stride * 1.42) * size * 0.009);
    ctx.scale(1 + Math.sin(stride) * 0.026, 1 + Math.cos(stride * 1.18) * 0.02);
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
    ctx.restore();

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(248,250,252,0.17)";
    ctx.lineWidth = Math.max(0.7, size * 0.01);
    for (let side = -1; side <= 1; side += 2) {
        for (let leg = 0; leg < 3; leg += 1) {
            const legT = stride * (1.66 + leg * 0.14) + leg * 1.7 + (side > 0 ? 0 : Math.PI);
            const baseY = -height * 0.18 + leg * height * 0.12;
            const baseX = side * width * (0.13 + leg * 0.02);
            const footX = side * width * (0.34 + leg * 0.035) + Math.sin(legT) * size * 0.1;
            const footY = baseY + Math.cos(legT * 0.78) * size * 0.09;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(side * width * 0.25, baseY + Math.sin(legT) * size * 0.16, footX, footY);
            ctx.stroke();
        }
    }

    ctx.fillStyle = `rgba(248,113,113,${eyeFlicker})`;
    ctx.shadowColor = "rgba(248,113,113,0.72)";
    ctx.shadowBlur = size * 0.08;
    for (const eyeX of [-0.045, 0.045]) {
        ctx.beginPath();
        ctx.ellipse(eyeX * width, -height * 0.28, Math.max(1.1, size * 0.025), Math.max(0.8, size * 0.015), 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(226,232,240,0.1)";
    ctx.lineWidth = Math.max(0.55, size * 0.006);
    for (let strand = 0; strand < 4; strand += 1) {
        const y = -height * 0.3 + strand * height * 0.08 + Math.sin(stride + strand) * size * 0.012;
        ctx.beginPath();
        ctx.moveTo(-width * 0.44, y);
        ctx.quadraticCurveTo(Math.sin(stride * 0.4 + strand) * size * 0.16, y + size * 0.08, width * 0.43, y + Math.cos(stride + strand) * size * 0.035);
        ctx.stroke();
    }
    ctx.restore();
};

const drawSpider = (ctx: CanvasRenderingContext2D, creature: Creature, now: number, sprite?: HTMLImageElement): void => {
    if (sprite?.complete && sprite.naturalWidth > 0) {
        drawReferenceSpider(ctx, creature, now, sprite);
        return;
    }

    const size = creature.size * (creature.mergeScale ?? 1);
    const speed = Math.hypot(creature.vx, creature.vy);
    const angle = creature.heading ?? (speed > 0.05 ? Math.atan2(creature.vy, creature.vx) : creature.phase);
    const stride = now * (0.007 + Math.min(0.01, speed * 0.01)) + creature.seed;
    const pulse = Math.max(0, creature.bumpReact ?? 0) / 34;
    const breathe = Math.sin(now * 0.004 + creature.seed) * 0.018;

    ctx.save();
    ctx.translate(creature.x, creature.y);
    ctx.rotate(angle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const legBases = [
        { x: -0.18, y: -0.26, reach: 0.94, forward: -0.54 },
        { x: -0.1, y: -0.1, reach: 0.78, forward: -0.38 },
        { x: 0.02, y: 0.08, reach: 0.8, forward: -0.3 },
        { x: 0.12, y: 0.22, reach: 0.94, forward: -0.44 },
    ];

    for (let pair = 0; pair < 4; pair += 1) {
        const base = legBases[pair];
        const baseX = size * base.x;
        const baseY = size * base.y;
        for (const side of [-1, 1]) {
            const gait = stride + pair * 1.08 + (side > 0 ? 0 : Math.PI);
            const step = Math.sin(gait) * size * 0.12;
            const lift = Math.max(0, Math.sin(gait)) * size * 0.06;
            const hip = { x: baseX, y: baseY };
            const knee = {
                x: baseX + size * (base.forward * 0.48) + step * 0.36,
                y: side * size * base.reach * 0.38 + lift * 0.28,
            };
            const ankle = {
                x: baseX + size * base.forward + step,
                y: side * size * base.reach * 0.72 - lift * 0.12,
            };
            const foot = {
                x: ankle.x - size * (0.12 + pair * 0.02) + step * 0.18,
                y: side * size * (base.reach * 0.92 + 0.04) + lift * 0.28,
            };

            const legGradient = ctx.createLinearGradient(hip.x, hip.y, foot.x, foot.y);
            legGradient.addColorStop(0, "#17110d");
            legGradient.addColorStop(0.34, "#070707");
            legGradient.addColorStop(0.62, "#2a1d15");
            legGradient.addColorStop(1, "#040404");

            ctx.strokeStyle = legGradient;
            ctx.lineWidth = Math.max(2.4, size * 0.072);
            ctx.beginPath();
            ctx.moveTo(hip.x, hip.y);
            ctx.lineTo(knee.x, knee.y);
            ctx.lineTo(ankle.x, ankle.y);
            ctx.lineTo(foot.x, foot.y);
            ctx.stroke();

            ctx.strokeStyle = "rgba(154,130,103,0.28)";
            ctx.lineWidth = Math.max(0.8, size * 0.018);
            ctx.beginPath();
            ctx.moveTo(hip.x - size * 0.012, hip.y - side * size * 0.015);
            ctx.lineTo(knee.x - size * 0.012, knee.y - side * size * 0.015);
            ctx.lineTo(ankle.x - size * 0.012, ankle.y - side * size * 0.015);
            ctx.lineTo(foot.x - size * 0.012, foot.y - side * size * 0.015);
            ctx.stroke();

            ctx.strokeStyle = "rgba(190,172,148,0.26)";
            ctx.lineWidth = Math.max(0.45, size * 0.007);
            for (let hair = 0; hair < 5; hair += 1) {
                const t = (hair + 1) / 6;
                const hx = knee.x + (foot.x - knee.x) * t;
                const hy = knee.y + (foot.y - knee.y) * t;
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                ctx.lineTo(hx + size * 0.04 * Math.sin(gait + hair), hy + side * size * 0.06);
                ctx.stroke();
            }
        }
    }

    const bodyPulse = 1 + pulse * 0.08;
    const abdomenGradient = ctx.createRadialGradient(-size * 0.23, -size * 0.2, 0, -size * 0.12, size * 0.04, size * 0.58);
    abdomenGradient.addColorStop(0, "#3a2a1d");
    abdomenGradient.addColorStop(0.4, "#15110d");
    abdomenGradient.addColorStop(1, "#030303");
    const thoraxGradient = ctx.createRadialGradient(size * 0.16, -size * 0.12, 0, size * 0.2, 0, size * 0.36);
    thoraxGradient.addColorStop(0, "#31251c");
    thoraxGradient.addColorStop(0.52, "#0d0d0d");
    thoraxGradient.addColorStop(1, "#020202");
    ctx.strokeStyle = "rgba(154,130,103,0.34)";
    ctx.lineWidth = Math.max(1, size * 0.018);

    ctx.save();
    ctx.scale(bodyPulse * (1 + breathe), bodyPulse * (1 - breathe));
    ctx.fillStyle = abdomenGradient;
    ctx.beginPath();
    ctx.ellipse(-size * 0.12, size * 0.05, size * 0.34, size * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = thoraxGradient;
    ctx.beginPath();
    ctx.ellipse(size * 0.24, -size * 0.01, size * 0.25, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(203,168,121,0.24)";
    ctx.lineWidth = Math.max(0.8, size * 0.009);
    for (let band = -2; band <= 2; band += 1) {
        ctx.beginPath();
        ctx.ellipse(-size * 0.12 + band * size * 0.05, size * 0.05, size * 0.035, size * 0.35, 0, -1.0, 1.0);
        ctx.stroke();
    }

    ctx.strokeStyle = "rgba(216,199,168,0.2)";
    ctx.lineWidth = Math.max(0.65, size * 0.008);
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, -size * 0.02);
    ctx.quadraticCurveTo(-size * 0.54, size * 0.04, -size * 0.6, size * 0.02);
    ctx.moveTo(-size * 0.45, size * 0.11);
    ctx.quadraticCurveTo(-size * 0.54, size * 0.06, -size * 0.6, size * 0.1);
    ctx.stroke();

    ctx.strokeStyle = "rgba(230,214,185,0.22)";
    ctx.lineWidth = Math.max(0.45, size * 0.006);
    for (let hair = 0; hair < 28; hair += 1) {
        const theta = (Math.PI * 2 * hair) / 28;
        const rx = -size * 0.12 + Math.cos(theta) * size * 0.29;
        const ry = size * 0.05 + Math.sin(theta) * size * 0.4;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.cos(theta) * size * 0.055, ry + Math.sin(theta) * size * 0.055);
        ctx.stroke();
    }

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(215,197,166,0.34)";
    ctx.fillStyle = "rgba(11,8,6,0.94)";
    ctx.lineWidth = Math.max(0.75, size * 0.01);
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(size * 0.42, side * size * 0.16, size * 0.05, size * 0.09, side * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(size * 0.48, side * size * 0.04);
        ctx.lineTo(size * 0.57, side * size * 0.11);
        ctx.stroke();
    }
    ctx.restore();

    const eyeGlow = 0.5 + Math.sin(now * 0.014 + creature.seed) * 0.18 + pulse * 0.22;
    ctx.fillStyle = `rgba(239,68,68,${eyeGlow})`;
    ctx.shadowColor = "rgba(239,68,68,0.74)";
    ctx.shadowBlur = size * 0.08;
    for (const y of [-0.1, -0.035, 0.035, 0.1]) {
        ctx.beginPath();
        ctx.arc(size * 0.42, y * size, Math.max(1.25, size * 0.022), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

const drawSpiderWeb = (ctx: CanvasRenderingContext2D, web: ActiveWeb, now: number): void => {
    const age = now - web.createdAt;
    const lifeT = Math.max(0, Math.min(1, age / web.life));
    const fadeIn = Math.min(1, lifeT / 0.18);
    const fadeOut = Math.max(0, Math.min(1, (1 - lifeT) / 0.28));
    const alpha = fadeIn * fadeOut;
    if (alpha <= 0) return;

    const strands = 9;
    const rings = 4;
    const sway = Math.sin(now * 0.0018 + web.seed) * web.radius * 0.025;

    ctx.save();
    ctx.translate(web.x, web.y);
    ctx.rotate(web.rotation);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(226,232,240,0.58)";
    ctx.lineWidth = Math.max(0.7, web.radius * 0.012);
    ctx.shadowColor = "rgba(255,255,255,0.32)";
    ctx.shadowBlur = web.radius * 0.06;

    for (let strand = 0; strand < strands; strand += 1) {
        const angle = (Math.PI * 2 * strand) / strands + Math.sin(web.seed + strand) * 0.08;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            Math.cos(angle + 0.18) * web.radius * 0.48 + sway,
            Math.sin(angle + 0.18) * web.radius * 0.48,
            Math.cos(angle) * web.radius,
            Math.sin(angle) * web.radius,
        );
        ctx.stroke();
    }

    for (let ring = 1; ring <= rings; ring += 1) {
        const ringRadius = web.radius * (ring / (rings + 0.35));
        ctx.beginPath();
        for (let strand = 0; strand <= strands; strand += 1) {
            const angle = (Math.PI * 2 * strand) / strands;
            const wobble = Math.sin(web.seed + strand * 1.7 + ring) * web.radius * 0.025;
            const x = Math.cos(angle) * (ringRadius + wobble) + sway * ring * 0.18;
            const y = Math.sin(angle) * (ringRadius + wobble);
            if (strand === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.2, web.radius * 0.025), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawSpiderLiftLine = (ctx: CanvasRenderingContext2D, lift: ActiveSpiderLift, spiderX: number, spiderY: number, spiderSize: number, now: number): void => {
    const age = now - lift.createdAt;
    const t = clampValue(age / lift.duration, 0, 1);
    const alpha = Math.sin(t * Math.PI) * 0.46 + (1 - t) * 0.24;
    const sway = Math.sin(now * 0.006 + lift.seed) * Math.min(7, spiderSize * 0.12);
    const anchorX = lift.x + sway * 0.35;
    const attachY = spiderY - spiderSize * 0.18;

    ctx.save();
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = Math.max(1.1, spiderSize * 0.026);
    ctx.shadowColor = "rgba(255,255,255,0.42)";
    ctx.shadowBlur = Math.max(5, spiderSize * 0.12);
    ctx.beginPath();
    ctx.moveTo(anchorX, 0);
    ctx.quadraticCurveTo(anchorX + sway, attachY * 0.52, spiderX, attachY);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(226,232,240,${Math.min(0.84, alpha + 0.16)})`;
    ctx.lineWidth = Math.max(0.65, spiderSize * 0.011);
    ctx.beginPath();
    ctx.moveTo(anchorX, 0);
    ctx.quadraticCurveTo(anchorX + sway * 0.72, attachY * 0.52, spiderX, attachY);
    ctx.stroke();
    ctx.restore();
};

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

type ActiveFlame = {
    id: string;
    startX?: number;
    startY?: number;
    x: number;
    y: number;
    radius: number;
    rotation: number;
    seed: number;
    createdAt: number;
    life: number;
};

type ActiveDragonBreath = {
    id: string;
    targetX: number;
    targetY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    mouthX: number;
    mouthY: number;
    mirror: boolean;
    seed: number;
    createdAt: number;
    life: number;
    showFlame?: boolean;
};

type DragonHeadLayout = Pick<ActiveDragonBreath, "x" | "y" | "width" | "height" | "mouthX" | "mouthY" | "mirror">;

type ActiveBurnResidue = {
    id: string;
    x: number;
    y: number;
    radius: number;
    rotation: number;
    seed: number;
    createdAt: number;
    life: number;
};

type ActiveSplashSpray = {
    id: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    impactX?: number;
    impactY?: number;
    angle: number;
    power: number;
    seed: number;
    createdAt: number;
    life: number;
};

type ActiveWaterFish = {
    id: string;
    x: number;
    y: number;
    vx: number;
    targetY: number;
    size: number;
    seed: number;
    phase: number;
    bornAt: number;
    opacity: number;
    direction: 1 | -1;
};

type ActiveHammerPiglet = {
    id: string;
    x: number;
    y: number;
    vx: number;
    baseY: number;
    size: number;
    direction: 1 | -1;
    seed: number;
    bornAt: number;
    life: number;
    pauseAt: number;
    pauseDuration: number;
    strideMs: number;
    opacity: number;
    hitAt?: number;
    hitVx?: number;
    hitVy?: number;
    hitRotation?: number;
};

type ScreenHitPulse = {
    id: string;
    x: number;
    y: number;
    angle: number;
    source: "splash" | "hammer" | "scatter" | "laser";
    createdAt: number;
    life: number;
};

type ActiveArrow = {
    id: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    radius: number;
    rotation: number;
    seed: number;
    createdAt: number;
    life: number;
    heavy: boolean;
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

type ScreenTick = {
    id: string;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    vx: number;
    vy: number;
    angle: number;
    size: number;
    seed: number;
    createdAt: number;
    life: number;
    nextTurnAt: number;
    lastTraceAt: number;
};

type SkeletonShard = {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    spin: number;
    length: number;
    width: number;
    seed: number;
    createdAt: number;
    life: number;
};

type DyingSkeleton = {
    id: string;
    controller: SkeletonController;
};

type DyingSpider = {
    id: string;
    creature: Creature;
    hitX: number;
    hitY: number;
    shotAngle: number;
    startedAt: number;
};

type ActiveWeb = {
    id: string;
    x: number;
    y: number;
    radius: number;
    rotation: number;
    seed: number;
    createdAt: number;
    life: number;
};

type ActiveSpiderLift = {
    id: string;
    creatureId: string;
    x: number;
    startY: number;
    targetY: number;
    createdAt: number;
    duration: number;
    seed: number;
};

type SlingerState = {
    active: boolean;
    pointerId: number | null;
    anchorX: number;
    anchorY: number;
    pullX: number;
    pullY: number;
    targetPullX: number;
    targetPullY: number;
    chargeStartAt: number;
    seed: number;
};

type FruitProjectile = {
    id: string;
    food: ThrowFoodId;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    radius: number;
    rotation: number;
    spin: number;
    seed: number;
    createdAt: number;
};

type FruitSplat = {
    id: string;
    food: ThrowFoodId;
    x: number;
    y: number;
    originY: number;
    radius: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    slideSpeed: number;
    seed: number;
    createdAt: number;
    life: number;
    initialDrawnRadius?: number;
    initialRotation?: number;
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

type ActiveLaserDrill = {
    id: string;
    x: number;
    y: number;
    angle: number;
    seed: number;
    createdAt: number;
    life: number;
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

const easeOutCubic = (value: number) => 1 - ((1 - value) ** 3);

const rotatePoint = (x: number, y: number, degrees: number) => {
    const radians = degrees * (Math.PI / 180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos,
    };
};

const getHammerTopLeftForContact = (targetX: number, targetY: number, rotation: number, scale: number) => {
    const contactFromPivot = rotatePoint(
        (HAMMER_HEAD_CONTACT_X - HAMMER_HAND_PIVOT_X) * scale,
        (HAMMER_HEAD_CONTACT_Y - HAMMER_HAND_PIVOT_Y) * scale,
        rotation,
    );
    return {
        x: targetX - HAMMER_HAND_PIVOT_X - contactFromPivot.x,
        y: targetY - HAMMER_HAND_PIVOT_Y - contactFromPivot.y,
    };
};

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

const chromaCanvasCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
const fishSheetCanvasCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

const getChromaKeyedCanvas = (image: HTMLImageElement): HTMLCanvasElement => {
    const cached = chromaCanvasCache.get(image);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    for (let offset = 0; offset < data.length; offset += 4) {
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const greenDominance = g - Math.max(r, b);
        if (g > 105 && greenDominance > 34) {
            const alpha = Math.max(0, Math.min(255, 255 - (greenDominance - 20) * 8));
            data[offset + 3] = Math.min(data[offset + 3], alpha);
        }
    }
    ctx.putImageData(imageData, 0, 0);
    chromaCanvasCache.set(image, canvas);
    return canvas;
};

const getFishSheetCanvas = (image: HTMLImageElement): HTMLCanvasElement => {
    const cached = fishSheetCanvasCache.get(image);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    for (let offset = 0; offset < data.length; offset += 4) {
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const greenDominance = g - Math.max(r, b);
        const brightest = Math.max(r, g, b);
        const darkest = Math.min(r, g, b);
        const brightness = (r + g + b) / 3;
        const neutrality = brightest - darkest;
        const paperBacking = brightness > 204 && neutrality < 34;
        const paperEdge = brightness > 188 && neutrality < 22;

        if (paperBacking || paperEdge) {
            const brightnessAlpha = Math.max(0, Math.min(255, (232 - brightness) * 8));
            const neutralityAlpha = Math.max(0, Math.min(255, (neutrality - 7) * 18));
            data[offset + 3] = Math.min(data[offset + 3], Math.max(0, Math.min(brightnessAlpha, neutralityAlpha)));
        } else if (g > 105 && greenDominance > 34) {
            const alpha = Math.max(0, Math.min(255, 255 - (greenDominance - 20) * 8));
            data[offset + 3] = Math.min(data[offset + 3], alpha);
        }
    }
    ctx.putImageData(imageData, 0, 0);
    fishSheetCanvasCache.set(image, canvas);
    return canvas;
};

const drawChromaImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
): boolean => {
    if (!image?.complete || image.naturalWidth <= 0) return false;
    ctx.drawImage(getChromaKeyedCanvas(image), x, y, width, height);
    return true;
};

const drawFishSpriteFrame = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | undefined,
    frameIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    direction: 1 | -1,
    alpha: number,
    rotation = 0,
): boolean => {
    if (!image?.complete || image.naturalWidth <= 0 || alpha <= 0) return false;

    const keyed = getFishSheetCanvas(image);
    const frameWidth = image.naturalWidth / SPLASH_FISH_SHEET_COLS;
    const frameHeight = image.naturalHeight / SPLASH_FISH_SHEET_ROWS;
    const wrappedFrame = ((frameIndex % (SPLASH_FISH_SHEET_COLS * SPLASH_FISH_SHEET_ROWS)) + (SPLASH_FISH_SHEET_COLS * SPLASH_FISH_SHEET_ROWS)) % (SPLASH_FISH_SHEET_COLS * SPLASH_FISH_SHEET_ROWS);
    const col = wrappedFrame % SPLASH_FISH_SHEET_COLS;
    const row = Math.floor(wrappedFrame / SPLASH_FISH_SHEET_COLS);
    const [leftCrop, rightCrop] = SPLASH_FISH_FRAME_CROP_X[col] ?? [0.12, 0.12];
    const [topCrop, bottomCrop] = SPLASH_FISH_FRAME_CROP_Y[row] ?? [0.2, 0.2];
    const sx = col * frameWidth + frameWidth * leftCrop;
    const sy = row * frameHeight + frameHeight * topCrop;
    const sw = frameWidth * (1 - leftCrop - rightCrop);
    const sh = frameHeight * (1 - topCrop - bottomCrop);

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(direction, 1);
    ctx.drawImage(keyed, sx, sy, sw, sh, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
    return true;
};

const createWaterFish = (width: number, height: number, waterLevel: number, now: number, index = 0): ActiveWaterFish => {
    const waterHeight = Math.min(height * 0.72, height * waterLevel);
    const topY = height - waterHeight;
    const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    const size = Math.max(74, Math.min(156, width * (0.055 + Math.random() * 0.028)));
    const x = direction > 0 ? -size * (0.8 + Math.random() * 1.4) : width + size * (0.8 + Math.random() * 1.4);
    const swimBandTop = Math.min(height - size * 0.38, topY + Math.max(28, waterHeight * 0.2));
    const swimBandBottom = Math.max(swimBandTop + 4, height - size * 0.34);
    const targetY = swimBandTop + Math.random() * Math.max(1, swimBandBottom - swimBandTop);
    const speed = (0.28 + Math.random() * 0.34) * direction;

    return {
        id: `fish-${Math.round(now).toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        x,
        y: targetY + (Math.random() - 0.5) * 12,
        vx: speed,
        targetY,
        size,
        seed: Math.random() * 1000,
        phase: Math.random() * Math.PI * 2,
        bornAt: now,
        opacity: 0,
        direction,
    };
};

const updateWaterFish = (
    fish: ActiveWaterFish,
    width: number,
    height: number,
    waterLevel: number,
    now: number,
    deltaMs: number,
): ActiveWaterFish | null => {
    const waterHeight = Math.min(height * 0.72, height * waterLevel);
    if (waterLevel < SPLASH_FISH_MIN_WATER_LEVEL || waterHeight < 42) {
        return {
            ...fish,
            opacity: Math.max(0, fish.opacity - deltaMs * 0.004),
        };
    }

    const topY = height - waterHeight;
    const swimBandTop = Math.min(height - fish.size * 0.38, topY + Math.max(24, waterHeight * 0.18));
    const swimBandBottom = Math.max(swimBandTop + 6, height - fish.size * 0.34);
    const drift = Math.sin(now * 0.0016 + fish.phase) * Math.min(28, waterHeight * 0.12);
    const desiredY = clampValue(fish.targetY + drift, swimBandTop, swimBandBottom);
    const nextY = fish.y + (desiredY - fish.y) * Math.min(1, deltaMs / 360);
    const nextX = fish.x + fish.vx * deltaMs;
    const offscreenMargin = fish.size * 1.45;

    if ((fish.direction > 0 && nextX > width + offscreenMargin) || (fish.direction < 0 && nextX < -offscreenMargin)) {
        return null;
    }

    return {
        ...fish,
        x: nextX,
        y: nextY,
        opacity: Math.min(0.92, fish.opacity + deltaMs * 0.0018),
    };
};

const scheduleNextHammerPigletSpawn = (now: number): number => (
    now + HAMMER_PIGLET_MIN_SPAWN_MS + Math.random() * (HAMMER_PIGLET_MAX_SPAWN_MS - HAMMER_PIGLET_MIN_SPAWN_MS)
);

const createHammerPiglet = (width: number, height: number, now: number): ActiveHammerPiglet => {
    const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    const size = Math.max(150, Math.min(270, width * (0.1 + Math.random() * 0.035)));
    const groundY = height - Math.max(46, Math.min(150, height * (0.08 + Math.random() * 0.08)));
    const speed = (0.92 + Math.random() * 0.42) * direction;
    const pauseAt = 840 + Math.random() * 860;
    return {
        id: `piglet-${Math.round(now).toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        x: direction > 0 ? -size * 0.9 : width + size * 0.9,
        y: groundY,
        vx: speed,
        baseY: groundY,
        size,
        direction,
        seed: Math.floor(now * 17 + Math.random() * 10000),
        bornAt: now,
        life: 5200 + Math.random() * 1350,
        pauseAt,
        pauseDuration: 260 + Math.random() * 220,
        strideMs: 56 + Math.random() * 16,
        opacity: 1,
    };
};

const updateHammerPiglet = (piglet: ActiveHammerPiglet, width: number, now: number, deltaMs: number): ActiveHammerPiglet | null => {
    const age = now - piglet.bornAt;
    if (piglet.hitAt !== undefined) {
        const hitAge = now - piglet.hitAt;
        if (hitAge > 720) return null;
        const nextHitVy = (piglet.hitVy ?? -0.42) + deltaMs * 0.0025;
        return {
            ...piglet,
            x: piglet.x + (piglet.hitVx ?? piglet.vx * 0.32) * deltaMs,
            y: piglet.y + nextHitVy * deltaMs,
            hitVy: nextHitVy,
            opacity: Math.max(0, 1 - hitAge / 720),
        };
    }

    const fadeIn = Math.min(1, age / 160);
    const fadeOut = Math.min(1, Math.max(0, (piglet.life - age) / 340));
    const isPaused = age >= piglet.pauseAt && age <= piglet.pauseAt + piglet.pauseDuration;
    const nextX = piglet.x + (isPaused ? 0 : piglet.vx * deltaMs);
    const outMargin = piglet.size * 1.2;
    if (age > piglet.life || nextX < -outMargin || nextX > width + outMargin) return null;
    return {
        ...piglet,
        x: nextX,
        y: piglet.baseY + Math.sin(age * 0.026 + piglet.seed) * (isPaused ? 0.18 : 0.55),
        opacity: Math.min(fadeIn, fadeOut),
    };
};

const drawHammerPiglet = (
    ctx: CanvasRenderingContext2D,
    piglet: ActiveHammerPiglet,
    now: number,
    sprite?: HTMLImageElement,
): void => {
    if (!sprite?.complete || sprite.naturalWidth <= 0 || piglet.opacity <= 0) return;

    const keyed = getChromaKeyedCanvas(sprite);
    const frameWidth = sprite.naturalWidth / HAMMER_PIGLET_SHEET_COLS;
    const frameHeight = sprite.naturalHeight / HAMMER_PIGLET_SHEET_ROWS;
    const age = now - piglet.bornAt;
    const isPaused = piglet.hitAt === undefined && age >= piglet.pauseAt && age <= piglet.pauseAt + piglet.pauseDuration;
    const pauseAge = Math.max(0, age - piglet.pauseAt);
    const runIndex = Math.floor(age / piglet.strideMs) % HAMMER_PIGLET_RUN_FRAMES.length;
    const lookIndex = Math.floor(pauseAge / Math.max(80, piglet.pauseDuration / 2)) % HAMMER_PIGLET_LOOK_FRAMES.length;
    const frame = isPaused ? HAMMER_PIGLET_LOOK_FRAMES[lookIndex] : HAMMER_PIGLET_RUN_FRAMES[runIndex];
    const col = frame % HAMMER_PIGLET_SHEET_COLS;
    const row = Math.floor(frame / HAMMER_PIGLET_SHEET_COLS);
    const [leftCrop, topCrop, rightCrop, bottomCrop] = HAMMER_PIGLET_FRAME_CROPS[frame] ?? [0.08, 0.18, 0.08, 0.08];
    const sx = col * frameWidth + frameWidth * leftCrop;
    const sy = row * frameHeight + frameHeight * topCrop;
    const sw = frameWidth * (1 - leftCrop - rightCrop);
    const sh = frameHeight * (1 - topCrop - bottomCrop);
    const hitAge = piglet.hitAt === undefined ? 0 : now - piglet.hitAt;
    const stride = isPaused ? 0 : Math.sin(age * 0.043 + piglet.seed);
    const faceScale = isPaused ? 0.84 : 1;
    const drawWidth = piglet.size * faceScale * (isPaused ? 0.92 : 1.14 + Math.abs(stride) * 0.075);
    const drawHeight = piglet.size * (isPaused ? 0.78 : 0.68 * (0.94 + Math.abs(stride) * 0.03));
    const drawY = piglet.y - Math.abs(stride) * piglet.size * 0.018 - (isPaused ? piglet.size * 0.03 : 0);

    ctx.save();
    ctx.globalAlpha *= piglet.opacity;

    const shadowAlpha = piglet.hitAt !== undefined ? 0.1 : 0.18 + Math.abs(stride) * 0.08;
    ctx.fillStyle = `rgba(15,23,42,${shadowAlpha * piglet.opacity})`;
    ctx.filter = "blur(3px)";
    ctx.beginPath();
    ctx.ellipse(piglet.x - piglet.direction * piglet.size * 0.08, piglet.y + drawHeight * 0.32, drawWidth * 0.36, piglet.size * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = "none";

    if (!isPaused && piglet.hitAt === undefined) {
        ctx.globalCompositeOperation = "screen";
        for (let trail = 3; trail >= 1; trail -= 1) {
            const trailOffset = -piglet.direction * piglet.size * (0.14 + trail * 0.12);
            ctx.save();
            ctx.globalAlpha = piglet.opacity * (0.045 / trail);
            ctx.translate(piglet.x + trailOffset, drawY);
            ctx.scale(piglet.direction, 1);
            ctx.drawImage(keyed, sx, sy, sw, sh, -drawWidth * 0.5, -drawHeight * 0.5, drawWidth * 1.06, drawHeight);
            ctx.restore();
        }
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = piglet.opacity;
    ctx.translate(piglet.x, drawY);
    ctx.rotate(piglet.hitAt !== undefined
        ? (piglet.hitRotation ?? 0) + hitAge * 0.013 * piglet.direction
        : Math.sin(age * 0.028 + piglet.seed) * (isPaused ? 0.006 : 0.014));
    ctx.scale(piglet.direction, 1);
    ctx.drawImage(keyed, sx, sy, sw, sh, -drawWidth * 0.5, -drawHeight * 0.5, drawWidth, drawHeight);
    ctx.restore();

    if (isPaused || piglet.hitAt !== undefined) return;

    ctx.save();
    ctx.globalAlpha = piglet.opacity * 0.28;
    ctx.globalCompositeOperation = "multiply";
    const dustBaseX = piglet.x - piglet.direction * piglet.size * 0.58;
    for (let dust = 0; dust < 9; dust += 1) {
        const n = flameNoise(piglet.seed + 911, dust * 5.1 + age * 0.015);
        const dx = -piglet.direction * (dust * piglet.size * 0.065 + n * piglet.size * 0.22);
        const dy = (n - 0.5) * piglet.size * 0.08;
        const radius = piglet.size * (0.018 + n * 0.024);
        ctx.fillStyle = `rgba(120,83,45,${0.11 + n * 0.18})`;
        ctx.beginPath();
        ctx.ellipse(dustBaseX + dx, piglet.y + piglet.size * 0.25 + dy, radius * 2.4, radius, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

const splashVideoFrameCanvas = document.createElement("canvas");
let splashVideoFrameCacheKey = "";
let splashVideoFrameCacheTime = -1;

const drawSplashVideoFrame = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement | null | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
    alpha = 1,
): boolean => {
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth <= 0 || video.videoHeight <= 0 || alpha <= 0) {
        return false;
    }

    const drawWidth = Math.max(1, Math.ceil(width));
    const drawHeight = Math.max(1, Math.ceil(height));
    const frameKey = `${drawWidth}x${drawHeight}:${Math.floor(video.currentTime * 24)}`;
    if (frameKey === splashVideoFrameCacheKey && video.currentTime === splashVideoFrameCacheTime) {
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.drawImage(splashVideoFrameCanvas, x, y, width, height);
        ctx.restore();
        return true;
    }

    if (splashVideoFrameCanvas.width !== drawWidth || splashVideoFrameCanvas.height !== drawHeight) {
        splashVideoFrameCanvas.width = drawWidth;
        splashVideoFrameCanvas.height = drawHeight;
    }

    const frameCtx = splashVideoFrameCanvas.getContext("2d", { willReadFrequently: true });
    if (!frameCtx) return false;
    frameCtx.clearRect(0, 0, drawWidth, drawHeight);
    frameCtx.drawImage(video, 0, 0, drawWidth, drawHeight);
    const frame = frameCtx.getImageData(0, 0, drawWidth, drawHeight);
    const { data } = frame;
    for (let offset = 0; offset < data.length; offset += 4) {
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const brightness = Math.max(r, g, b);
        const greenScreen = g > 74 && g - r > 18 && g - b > 18;
        const blueWater = b > 86 && b >= g * 0.72 && b - r > 18;
        const cyanWater = g > 92 && b > 92 && Math.abs(g - b) < 70 && Math.max(g, b) - r > 24;
        const whiteFoam = r > 150 && g > 150 && b > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 92;

        let nextAlpha = data[offset + 3];
        if (brightness < 28 || greenScreen) {
            nextAlpha = 0;
        } else if (blueWater || cyanWater || whiteFoam) {
            const waterStrength = Math.max(
                blueWater ? Math.min(1, (b - r) / 108) : 0,
                cyanWater ? Math.min(1, (Math.min(g, b) - r) / 120) : 0,
                whiteFoam ? Math.min(1, (brightness - 120) / 130) : 0,
            );
            nextAlpha = Math.min(nextAlpha, Math.round(255 * Math.max(0.18, waterStrength)));
        } else {
            nextAlpha = 0;
        }

        if (nextAlpha > 0) {
            const edge = nextAlpha / 255;
            data[offset] = Math.round((r * edge) + (196 * (1 - edge)));
            data[offset + 1] = Math.round((g * edge) + (240 * (1 - edge)));
            data[offset + 2] = Math.round((b * edge) + (255 * (1 - edge)));
        }
        data[offset + 3] = nextAlpha;
    }
    frameCtx.putImageData(frame, 0, 0);
    splashVideoFrameCacheKey = frameKey;
    splashVideoFrameCacheTime = video.currentTime;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(splashVideoFrameCanvas, x, y, width, height);
    ctx.restore();
    return true;
};

const getSplashCraneLayout = (width: number) => {
    const craneWidth = Math.max(260, Math.min(430, width * 0.34));
    const craneHeight = craneWidth * (1536 / 2816);
    const craneX = Math.max(12, Math.min(36, width * 0.018));
    const craneY = 8;
    return {
        x: craneX,
        y: craneY,
        width: craneWidth,
        height: craneHeight,
        nozzleX: craneX + craneWidth * 0.155,
        nozzleY: craneY + craneHeight * 0.52,
        connectorX: craneX + craneWidth * 0.68,
        connectorY: craneY + craneHeight * 0.76,
    };
};

const rotateLocalPoint = (originX: number, originY: number, angle: number, localX: number, localY: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: originX + localX * cos - localY * sin,
        y: originY + localX * sin + localY * cos,
    };
};

const getSplashPistolPose = (targetX: number, targetY: number, _angle: number, power = 0) => {
    const pistolWidth = 244;
    const pistolHeight = pistolWidth * (1536 / 2816);
    const x = targetX + SPLASH_PISTOL_OFFSET_X - Math.max(0, Math.min(1, power)) * 10;
    const y = targetY + SPLASH_PISTOL_OFFSET_Y;
    const poseAngle = Math.atan2(targetY - y, targetX - x);
    return {
        x,
        y,
        angle: poseAngle,
        width: pistolWidth,
        height: pistolHeight,
        nozzle: rotateLocalPoint(x, y, poseAngle, pistolWidth * SPLASH_PISTOL_NOZZLE_X, pistolHeight * SPLASH_PISTOL_NOZZLE_Y),
        hoseSocket: rotateLocalPoint(x, y, poseAngle, pistolWidth * SPLASH_PISTOL_HOSE_X, pistolHeight * SPLASH_PISTOL_HOSE_Y),
    };
};

const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
};

const getBackgroundDrawRect = (surfaceWidth: number, surfaceHeight: number, imageWidth: number, imageHeight: number) => {
    const scale = Math.max(surfaceWidth / imageWidth, surfaceHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    return {
        x: (surfaceWidth - width) / 2,
        y: (surfaceHeight - height) / 2,
        width,
        height,
        scale,
    };
};

const colorDistance = (r: number, g: number, b: number, base: { r: number; g: number; b: number }) => {
    const dr = r - base.r;
    const dg = g - base.g;
    const db = b - base.b;
    return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};

const saturation = (r: number, g: number, b: number) => Math.max(r, g, b) - Math.min(r, g, b);
const luminance = (r: number, g: number, b: number) => (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
const smoothStep = (edge0: number, edge1: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(0.0001, edge1 - edge0)));
    return t * t * (3 - (2 * t));
};

const clampValue = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const drawGlassPunctureDot = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    heavy = false,
): void => {
    const dotRadius = Math.max(1.2, (heavy ? 4.6 : 2.7) / scale);
    const ringRadius = dotRadius * (heavy ? 2.9 : 2.45);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const ring = ctx.createRadialGradient(x, y, dotRadius * 0.3, x, y, ringRadius);
    ring.addColorStop(0, heavy ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.34)");
    ring.addColorStop(0.48, heavy ? "rgba(15,23,42,0.18)" : "rgba(15,23,42,0.12)");
    ring.addColorStop(1, "rgba(2,6,23,0)");
    ctx.fillStyle = ring;

    ctx.beginPath();
    const vertices = heavy ? 7 : 6;
    for (let i = 0; i < vertices; i++) {
        const angle = (Math.PI * 2 * i) / vertices + (i % 2 === 0 ? 0.12 : -0.1);
        const r = ringRadius * (i % 2 === 0 ? 0.74 : 1.18);
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = heavy ? "rgba(0,0,0,0.68)" : "rgba(0,0,0,0.54)";
    ctx.beginPath();
    for (let i = 0; i < vertices; i++) {
        const angle = (Math.PI * 2 * i) / vertices + (i % 2 === 0 ? -0.1 : 0.1);
        const r = dotRadius * (i % 2 === 0 ? 0.82 : 1.18);
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = heavy ? "rgba(255,255,255,0.44)" : "rgba(255,255,255,0.34)";
    ctx.lineWidth = Math.max(0.55, (heavy ? 1.2 : 0.8) / scale);
    ctx.beginPath();
    ctx.arc(x - dotRadius * 0.26, y - dotRadius * 0.36, dotRadius * 0.72, Math.PI * 1.08, Math.PI * 1.62);
    ctx.stroke();
    ctx.restore();
};

const drawImpactGlassDepression = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    radius: number,
    heavy = false,
    seed = 0.5,
    angle = 0,
): void => {
    const dentRadius = Math.max(7, Math.min(heavy ? 84 : 30, radius / scale));
    const bruiseRadius = dentRadius * (heavy ? 1.45 : 1.25);

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const shade = ctx.createRadialGradient(x, y, dentRadius * 0.08, x, y, bruiseRadius);
    shade.addColorStop(0, heavy ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.12)");
    shade.addColorStop(0.34, heavy ? "rgba(15,23,42,0.13)" : "rgba(15,23,42,0.08)");
    shade.addColorStop(0.72, "rgba(30,41,59,0.035)");
    shade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shade;
    drawJaggedShape(ctx, x, y, bruiseRadius, heavy ? 10 : 8, seed + 0.11);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    const shine = ctx.createRadialGradient(
        x - dentRadius * 0.22,
        y - dentRadius * 0.3,
        0,
        x - dentRadius * 0.22,
        y - dentRadius * 0.3,
        dentRadius * 0.95,
    );
    shine.addColorStop(0, heavy ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.15)");
    shine.addColorStop(0.36, "rgba(226,232,240,0.07)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.ellipse(x - dentRadius * 0.18, y - dentRadius * 0.24, dentRadius * 0.72, dentRadius * 0.42, angle - 0.36, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = "round";
    for (let ray = 0; ray < (heavy ? 13 : 8); ray += 1) {
        const rayAngle = angle + (Math.PI * 2 * ray) / (heavy ? 13 : 8) + (flameNoise(seed + 47, ray) - 0.5) * 0.54;
        const inner = dentRadius * (0.42 + flameNoise(seed + 59, ray) * 0.2);
        const outer = dentRadius * (0.95 + flameNoise(seed + 71, ray) * (heavy ? 1.1 : 0.55));
        ctx.strokeStyle = `rgba(248,250,252,${(heavy ? 0.26 : 0.18) * (0.6 + flameNoise(seed + 83, ray) * 0.4)})`;
        ctx.lineWidth = Math.max(0.45, (heavy ? 1.15 : 0.75) / scale);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(rayAngle) * inner, y + Math.sin(rayAngle) * inner);
        ctx.lineTo(x + Math.cos(rayAngle) * outer, y + Math.sin(rayAngle) * outer);
        ctx.stroke();
    }
    ctx.restore();
};

const flameNoise = (seed: number, offset: number) => {
    const value = Math.sin((seed + offset) * 12.9898) * 43758.5453;
    return value - Math.floor(value);
};

const clampSlingerPull = (anchorX: number, anchorY: number, pullX: number, pullY: number) => {
    const dx = pullX - anchorX;
    const dy = pullY - anchorY;
    const distance = Math.hypot(dx, dy);
    if (distance <= SLINGER_MAX_PULL) {
        return { x: pullX, y: pullY, distance };
    }
    const scale = SLINGER_MAX_PULL / Math.max(1, distance);
    return {
        x: anchorX + dx * scale,
        y: anchorY + dy * scale,
        distance: SLINGER_MAX_PULL,
    };
};

const colorWithAlpha = (color: string, alpha: number): string => {
    const clamped = Math.max(0, Math.min(1, alpha));
    const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
    if (hex) {
        const value = hex[1];
        const red = Number.parseInt(value.slice(0, 2), 16);
        const green = Number.parseInt(value.slice(2, 4), 16);
        const blue = Number.parseInt(value.slice(4, 6), 16);
        return `rgba(${red},${green},${blue},${clamped})`;
    }
    const rgba = color.trim().match(/^rgba?\(([^)]+)\)$/i);
    if (rgba) {
        const parts = rgba[1].split(",").map((part) => Number.parseFloat(part.trim()));
        if (parts.length >= 3 && parts.every((part, index) => index >= 3 || Number.isFinite(part))) {
            return `rgba(${parts[0]},${parts[1]},${parts[2]},${clamped})`;
        }
    }
    return color;
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpAngle = (a: number, b: number, t: number): number => {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
};

const drawJaggedShape = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, vertices = 6, seed = 0.5): void => {
    let state = Math.floor(seed * 1000000) % 2147483647;
    if (state <= 0) state = 12345;
    const next = () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
    const nextBetween = (min: number, max: number) => min + next() * (max - min);

    ctx.beginPath();
    for (let i = 0; i < vertices; i++) {
        const angle = (Math.PI * 2 * i) / vertices + nextBetween(-0.15, 0.15);
        const dist = r * nextBetween(0.72, 1.28);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
};

const foodStyle = (food: ThrowFoodId) => THROW_FOODS.find((item) => item.id === food) ?? THROW_FOODS[0];

const SLINGER_FOOD_SHEET_FRAMES = 9;

const getSlingerFoodSheet = (sprites: PlaygroundSprites | undefined, food: ThrowFoodId): HTMLImageElement | undefined => {
    if (food === "egg") return sprites?.eggSheet;
    if (food === "strawberry") return sprites?.strawberrySheet;
    if (food === "tomato") return sprites?.tomatoSheet;
    if (food === "watermelon") return sprites?.watermelonSheet;
    return undefined;
};

const getSlingerFoodTimeline = (food: ThrowFoodId) => {
    if (food === "egg") return { contact: 78, burst: 160, settle: 330 };
    if (food === "strawberry") return { contact: 86, burst: 180, settle: 360 };
    if (food === "watermelon") return { contact: 96, burst: 210, settle: 420 };
    return { contact: 84, burst: 190, settle: 380 };
};

const getSlingerSplatFrame = (food: ThrowFoodId, age: number): number => {
    if (food === "watermelon" || food === "tomato") return 8; // Immediately show the stunning final dripping splat!

    const timeline = getSlingerFoodTimeline(food);
    if (age < timeline.contact) {
        return 2 + smoothStep(0, timeline.contact, age);
    }
    if (age < timeline.contact + timeline.burst) {
        return 3 + (smoothStep(0, timeline.burst, age - timeline.contact) * 2);
    }
    if (age < timeline.contact + timeline.burst + timeline.settle) {
        return 5 + (smoothStep(0, timeline.settle, age - timeline.contact - timeline.burst) * 3);
    }
    return 8;
};

const drawSlingerFoodFrame = (
    ctx: CanvasRenderingContext2D,
    sheet: HTMLImageElement,
    frame: number,
    x: number,
    y: number,
    radius: number,
    rotation = 0,
    alpha = 1,
    drawScale = 1,
) => {
    const frameWidth = sheet.width / SLINGER_FOOD_SHEET_FRAMES;
    const frameHeight = sheet.height;
    let clampedFrame = Math.max(0, Math.min(SLINGER_FOOD_SHEET_FRAMES - 1, Math.round(frame)));

    // For watermelon, the asset has overlap/bleeding at the frame boundaries.
    // We crop 20px from the left and right boundaries to remove the bleeding.
    const isWatermelon = sheet.width === 2169;
    if (isWatermelon) {
        // Skip the ugly, cut-in-half explosion frames (4 and 5) by mapping them to clean centered frames.
        if (clampedFrame === 4) clampedFrame = 3; // Keep the beautiful split open frame slightly longer
        if (clampedFrame === 5) clampedFrame = 6; // Transition directly to the nice red splat
    }
    const cropX = isWatermelon ? 20 : 0;

    const srcX = frameWidth * clampedFrame + cropX;
    const srcWidth = frameWidth - cropX * 2;

    // Align shifting frames for watermelon to prevent jumping/offset issues.
    // Shifting early centered frames (0 to 7) to match the naturally left-shifted final settling drip frame (index 8).
    const watermelonOffsets = [-14, -14, -14, -14, -14, -14, -14, -14, 0];
    const localOffset = isWatermelon ? watermelonOffsets[clampedFrame] : 0;
    const scaledOffsetX = localOffset * drawScale * (radius / 36);

    const drawWidth = radius * 4.9 * drawScale;
    const drawHeight = drawWidth * (frameHeight / frameWidth);
    const aspectWidth = drawWidth * (srcWidth / frameWidth);

    ctx.save();
    ctx.translate(x + scaledOffsetX, y);
    ctx.rotate(rotation);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(
        sheet,
        srcX,
        0,
        srcWidth,
        frameHeight,
        -aspectWidth / 2,
        -drawHeight / 2,
        aspectWidth,
        drawHeight,
    );
    ctx.restore();
};

const drawSlingerFoodObject = (
    ctx: CanvasRenderingContext2D,
    food: ThrowFoodId,
    radius: number,
    seed: number,
    sprites?: PlaygroundSprites,
) => {
    const sheet = getSlingerFoodSheet(sprites, food);
    if (sheet) {
        drawSlingerFoodFrame(ctx, sheet, 0, 0, 0, radius);
        return;
    }
};

const drawFoodObject = (ctx: CanvasRenderingContext2D, food: ThrowFoodId, radius: number, seed: number) => {
    const style = foodStyle(food);
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    
    // Ambient shadow
    ctx.shadowColor = "rgba(15,23,42,0.42)";
    ctx.shadowBlur = radius * 0.22;
    ctx.shadowOffsetY = radius * 0.12;

    if (food === "egg") {
        // Egg body with better shading
        const eggGrad = ctx.createRadialGradient(-radius * 0.15, -radius * 0.2, 0, 0, 0, radius);
        eggGrad.addColorStop(0, "#ffffff");
        eggGrad.addColorStop(0.5, "#f1f5f9");
        eggGrad.addColorStop(1, "#cbd5e1");
        ctx.fillStyle = eggGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.78, radius * 0.98, -0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Specular highlight
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.beginPath();
        ctx.ellipse(-radius * 0.26, -radius * 0.34, radius * 0.18, radius * 0.28, -0.55, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const squashY = food === "watermelon" ? 0.72 : food === "strawberry" ? 1.08 : 0.92;
        const mainGrad = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, 0, 0, 0, radius);
        
        if (food === "watermelon") {
            mainGrad.addColorStop(0, "#22c55e");
            mainGrad.addColorStop(0.34, "#84cc16");
            mainGrad.addColorStop(0.72, "#166534");
            mainGrad.addColorStop(1, "#052e16");
            ctx.fillStyle = mainGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 1.02, radius * 0.98, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "rgba(187,247,208,0.34)";
            ctx.lineWidth = radius * 0.11;
            for (let s = -3; s <= 3; s++) {
                ctx.beginPath();
                ctx.moveTo(s * radius * 0.24, -radius * 0.92);
                ctx.bezierCurveTo(
                    s * radius * 0.4,
                    -radius * 0.42,
                    s * radius * 0.34,
                    radius * 0.36,
                    s * radius * 0.2,
                    radius * 0.92,
                );
                ctx.stroke();
            }
        } else if (food === "strawberry") {
            mainGrad.addColorStop(0, "#fb7185");
            mainGrad.addColorStop(0.6, "#e11d48");
            mainGrad.addColorStop(1, "#9f1239");
            ctx.fillStyle = mainGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.88, radius * 1.12, 0, 0, Math.PI * 2);
            ctx.fill();
        } else { // Tomato
            mainGrad.addColorStop(0, "#fecaca");
            mainGrad.addColorStop(0.38, "#ef4444");
            mainGrad.addColorStop(0.78, "#dc2626");
            mainGrad.addColorStop(1, "#7f1d1d");
            ctx.fillStyle = mainGrad;
            ctx.beginPath();
            ctx.ellipse(0, radius * 0.02, radius * 1.02, radius * 0.94, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(127,29,29,0.26)";
            ctx.lineWidth = Math.max(1, radius * 0.045);
            for (let crease = -1; crease <= 1; crease += 1) {
                ctx.beginPath();
                ctx.moveTo(crease * radius * 0.18, -radius * 0.72);
                ctx.quadraticCurveTo(crease * radius * 0.34, -radius * 0.1, crease * radius * 0.16, radius * 0.72);
                ctx.stroke();
            }
        }
        
        // Shine/Highlights
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.beginPath();
        ctx.ellipse(-radius * 0.35, -radius * 0.3, radius * 0.26, radius * 0.16, -0.44, 0, Math.PI * 2);
        ctx.fill();
        
        // Seeds/Details
        if (food === "strawberry") {
            ctx.fillStyle = style.seed ?? "#fde68a";
            const detailCount = food === "strawberry" ? 18 : 8;
            for (let i = 0; i < detailCount; i += 1) {
                const noise = flameNoise(seed, i * 19.17);
                const angle = noise * Math.PI * 2;
                const dist = radius * (0.24 + flameNoise(seed + 1, i * 7.3) * 0.55);
                ctx.save();
                ctx.translate(Math.cos(angle) * dist, Math.sin(angle) * dist * squashY);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.ellipse(0, 0, radius * 0.035, radius * 0.065, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // Green stem for tomato/strawberry
        if (food === "tomato" || food === "strawberry") {
            ctx.fillStyle = "#166534";
            ctx.beginPath();
            const stemY = food === "strawberry" ? -radius * 1.05 : -radius * 0.88;
            ctx.moveTo(0, stemY);
            for (let leaf = 0; leaf < 5; leaf++) {
                const la = (leaf * Math.PI * 2) / 5;
                const lr = radius * 0.34;
                ctx.lineTo(Math.cos(la) * lr, stemY + Math.sin(la) * lr * 0.5);
                ctx.lineTo(Math.cos(la + 0.3) * lr * 0.4, stemY + Math.sin(la + 0.3) * lr * 0.2);
            }
            ctx.closePath();
            ctx.fill();
            
            // Stem nub
            ctx.fillStyle = "#14532d";
            ctx.beginPath();
            ctx.arc(0, stemY, radius * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
};

const createFruitBurstParticles = (food: ThrowFoodId, x: number, y: number, angle: number, seed: number): Particle[] => {
    const style = foodStyle(food);
    const profile = style;
    const colors = food === "egg"
        ? ["rgba(255,255,255,0.92)", "#facc15", "#f59e0b", "rgba(254,243,199,0.72)"]
        : food === "watermelon"
            ? ["#fb7185", "#f43f5e", "#111827", "#16a34a"]
            : food === "strawberry"
                ? ["#e11d48", "#be123c", "#fef08a", "#7f1d1d"]
                : ["#ef4444", "#dc2626", "#fde68a", "#991b1b"];
    const particles: Particle[] = [];
    for (let index = 0; index < profile.burst; index += 1) {
        const sideSpray = angle + Math.PI + (flameNoise(seed, index * 13.7) - 0.5) * Math.PI * 1.45;
        const randomSpray = flameNoise(seed + 11, index * 8.1) * Math.PI * 2;
        const useSide = index < profile.burst * 0.72;
        const theta = useSide ? sideSpray : randomSpray;
        const speed = 1.2 + flameNoise(seed + 19, index * 5.3) * (food === "watermelon" ? 5.2 : 7.4);
        const isSeed = (food === "watermelon" && index % 5 === 0) || (food === "strawberry" && index % 6 === 0);
        particles.push({
            id: `fruit-particle-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
            x,
            y,
            vx: Math.cos(theta) * speed,
            vy: Math.sin(theta) * speed - (0.2 + flameNoise(seed + 29, index * 4.9) * 1.8),
            life: 38 + flameNoise(seed + 31, index * 7.7) * 42,
            maxLife: 80,
            size: isSeed ? 2.4 : 3.8 + flameNoise(seed + 37, index * 2.1) * 5.6,
            color: isSeed ? (style.seed ?? colors[index % colors.length]) : colors[index % colors.length],
            spin: (flameNoise(seed + 43, index * 3.3) - 0.5) * 0.18,
            shape: isSeed ? "spark" : "pixel",
        });
    }
    return particles;
};

const drawTomatoGlassCracks = (ctx: CanvasRenderingContext2D, radius: number, seed: number, intensity: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let shard = 0; shard < 24; shard += 1) {
        const theta = (Math.PI * 2 * shard) / 24 + (flameNoise(seed + 101, shard * 4.7) - 0.5) * 0.42;
        const inner = radius * (0.38 + flameNoise(seed + 107, shard * 6.2) * 0.22);
        const outer = radius * (0.9 + flameNoise(seed + 113, shard * 9.3) * 1.08) * intensity;
        const kink = theta + (flameNoise(seed + 127, shard * 5.1) - 0.5) * 0.34;
        ctx.strokeStyle = `rgba(220,245,255,${(0.14 + flameNoise(seed + 131, shard * 7.8) * 0.18) * intensity})`;
        ctx.lineWidth = Math.max(0.7, radius * (0.009 + flameNoise(seed + 139, shard * 2.4) * 0.014));
        ctx.beginPath();
        ctx.moveTo(Math.cos(theta) * inner, Math.sin(theta) * inner * 0.72);
        ctx.lineTo(Math.cos(kink) * outer, Math.sin(kink) * outer * 0.78);
        ctx.stroke();
    }

    for (let shard = 0; shard < 10; shard += 1) {
        const theta = flameNoise(seed + 151, shard * 8.9) * Math.PI * 2;
        const dist = radius * (0.74 + flameNoise(seed + 157, shard * 3.6) * 0.94) * intensity;
        const size = radius * (0.06 + flameNoise(seed + 163, shard * 6.4) * 0.09);
        ctx.save();
        ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.72);
        ctx.rotate(theta + flameNoise(seed + 167, shard * 5.5));
        ctx.fillStyle = `rgba(220,245,255,${0.08 + flameNoise(seed + 173, shard * 2.8) * 0.12})`;
        ctx.strokeStyle = `rgba(255,255,255,${0.12 * intensity})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-size, size * 0.2);
        ctx.lineTo(size * 0.72, -size * 0.42);
        ctx.lineTo(size * 0.28, size * 0.86);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};

const drawTomatoSlice = (ctx: CanvasRenderingContext2D, radius: number, seed: number, burstT: number) => {
    const skin = ctx.createRadialGradient(-radius * 0.14, -radius * 0.12, 0, 0, 0, radius * 1.08);
    skin.addColorStop(0, "#fecaca");
    skin.addColorStop(0.34, "#ef4444");
    skin.addColorStop(0.76, "#b91c1c");
    skin.addColorStop(1, "#7f1d1d");
    ctx.fillStyle = skin;
    ctx.beginPath();
    const lobes = 28;
    for (let lobe = 0; lobe <= lobes; lobe += 1) {
        const theta = (Math.PI * 2 * lobe) / lobes;
        const wobble = 0.9 + Math.sin(theta * 5 + seed) * 0.035 + (flameNoise(seed + 181, lobe * 3.1) - 0.5) * 0.08;
        const x = Math.cos(theta) * radius * wobble;
        const y = Math.sin(theta) * radius * (0.82 + (flameNoise(seed + 187, lobe * 5.2) - 0.5) * 0.08);
        if (lobe === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(127,29,29,0.8)";
    ctx.lineWidth = Math.max(2.2, radius * 0.075);
    ctx.stroke();

    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.82);
    core.addColorStop(0, "rgba(254,202,202,0.9)");
    core.addColorStop(0.34, "rgba(248,113,113,0.84)");
    core.addColorStop(1, "rgba(127,29,29,0.1)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.76, radius * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let chamber = 0; chamber < 6; chamber += 1) {
        const theta = (Math.PI * 2 * chamber) / 6 + 0.12;
        ctx.save();
        ctx.rotate(theta);
        const chamberGradient = ctx.createRadialGradient(radius * 0.34, 0, 0, radius * 0.34, 0, radius * 0.28);
        chamberGradient.addColorStop(0, "rgba(254,240,138,0.72)");
        chamberGradient.addColorStop(0.46, "rgba(248,113,113,0.78)");
        chamberGradient.addColorStop(1, "rgba(127,29,29,0.12)");
        ctx.fillStyle = chamberGradient;
        ctx.beginPath();
        ctx.ellipse(radius * 0.34, 0, radius * 0.26, radius * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(254,202,202,0.24)";
        ctx.lineWidth = Math.max(1, radius * 0.026);
        ctx.stroke();
        ctx.restore();
    }

    ctx.strokeStyle = "rgba(254,202,202,0.42)";
    ctx.lineWidth = Math.max(1, radius * 0.028);
    for (let rib = 0; rib < 10; rib += 1) {
        const theta = (Math.PI * 2 * rib) / 10 + (flameNoise(seed + 193, rib * 3.8) - 0.5) * 0.22;
        ctx.beginPath();
        ctx.moveTo(Math.cos(theta) * radius * 0.12, Math.sin(theta) * radius * 0.08);
        ctx.quadraticCurveTo(
            Math.cos(theta) * radius * 0.42,
            Math.sin(theta) * radius * 0.32,
            Math.cos(theta) * radius * 0.72,
            Math.sin(theta) * radius * 0.54,
        );
        ctx.stroke();
    }

    ctx.fillStyle = "#fde68a";
    for (let seedIndex = 0; seedIndex < 34; seedIndex += 1) {
        const theta = flameNoise(seed + 199, seedIndex * 4.1) * Math.PI * 2;
        const dist = radius * (0.18 + flameNoise(seed + 211, seedIndex * 7.3) * 0.5);
        ctx.save();
        ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.56);
        ctx.rotate(theta);
        ctx.globalAlpha = 0.62 + flameNoise(seed + 223, seedIndex * 2.2) * 0.32;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.025, radius * 0.052, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,255,255,${0.16 + burstT * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.26, -radius * 0.24, radius * 0.28, radius * 0.1, -0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
};

const drawTomatoSplat = (ctx: CanvasRenderingContext2D, splat: FruitSplat, now: number) => {
    const age = now - splat.createdAt;
    const contactT = Math.max(0, Math.min(1, age / TOMATO_CONTACT_MS));
    const burstT = Math.max(0, Math.min(1, (age - TOMATO_CONTACT_MS) / TOMATO_BURST_MS));
    const settleT = Math.max(0, Math.min(1, (age - TOMATO_CONTACT_MS - TOMATO_BURST_MS) / TOMATO_SETTLE_MS));
    const pop = 0.62 + easeOutCubic(contactT) * 0.5 + Math.sin(Math.min(1, burstT) * Math.PI) * 0.14;
    const dripAlpha = smoothStep(0.08, 1, settleT);

    ctx.save();
    ctx.translate(splat.x, splat.y);
    ctx.rotate(splat.rotation * 0.32);
    ctx.scale(splat.scaleX * pop, splat.scaleY * (0.82 + easeOutCubic(contactT) * 0.28));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawTomatoGlassCracks(ctx, splat.radius, splat.seed, Math.max(contactT, burstT * 0.86));

    ctx.save();
    ctx.globalAlpha = 0.38 + burstT * 0.42;
    ctx.fillStyle = "rgba(127,29,29,0.38)";
    for (let splash = 0; splash < 22; splash += 1) {
        const theta = flameNoise(splat.seed + 229, splash * 3.7) * Math.PI * 2;
        const dist = splat.radius * (0.68 + flameNoise(splat.seed + 233, splash * 8.5) * 0.96) * Math.max(0.58, burstT);
        const length = splat.radius * (0.12 + flameNoise(splat.seed + 239, splash * 2.4) * 0.28);
        ctx.save();
        ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.74);
        ctx.rotate(theta);
        ctx.beginPath();
        ctx.ellipse(0, 0, length, splat.radius * (0.025 + flameNoise(splat.seed + 241, splash * 4.6) * 0.035), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(153,27,27,0.34)";
    ctx.shadowBlur = splat.radius * 0.22;
    drawTomatoSlice(ctx, splat.radius, splat.seed, burstT);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = dripAlpha;
    for (let drip = 0; drip < 8; drip += 1) {
        const offset = (flameNoise(splat.seed + 251, drip * 5.9) - 0.5) * splat.radius * 1.15;
        const startY = splat.radius * (0.32 + flameNoise(splat.seed + 257, drip * 7.1) * 0.34);
        const length = splat.radius * (0.58 + flameNoise(splat.seed + 263, drip * 4.3) * 1.38) * (0.32 + settleT * 0.86);
        const width = Math.max(2, splat.radius * (0.05 + flameNoise(splat.seed + 269, drip * 2.7) * 0.07));
        const gradient = ctx.createLinearGradient(offset, startY, offset, startY + length);
        gradient.addColorStop(0, "rgba(239,68,68,0.78)");
        gradient.addColorStop(0.58, "rgba(153,27,27,0.56)");
        gradient.addColorStop(1, "rgba(153,27,27,0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(offset, startY);
        ctx.bezierCurveTo(
            offset + Math.sin(splat.seed + drip) * splat.radius * 0.14,
            startY + length * 0.28,
            offset - Math.cos(splat.seed + drip) * splat.radius * 0.12,
            startY + length * 0.72,
            offset + Math.sin(splat.seed * 0.3 + drip) * splat.radius * 0.1,
            startY + length,
        );
        ctx.stroke();

        ctx.fillStyle = "rgba(185,28,28,0.58)";
        ctx.beginPath();
        ctx.ellipse(offset, startY + length, width * 0.72, width, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.restore();
};

const drawWatermelonRindChunks = (ctx: CanvasRenderingContext2D, radius: number, seed: number, burstT: number) => {
    ctx.save();
    for (let chunk = 0; chunk < 18; chunk += 1) {
        const theta = flameNoise(seed + 281, chunk * 5.2) * Math.PI * 2;
        const dist = radius * (0.58 + flameNoise(seed + 287, chunk * 8.4) * 0.78) * (0.72 + burstT * 0.5);
        const width = radius * (0.12 + flameNoise(seed + 293, chunk * 2.6) * 0.18);
        const height = radius * (0.045 + flameNoise(seed + 307, chunk * 4.1) * 0.08);
        ctx.save();
        ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.74);
        ctx.rotate(theta + (flameNoise(seed + 311, chunk * 6.7) - 0.5) * 1.4);
        ctx.fillStyle = chunk % 4 === 0 ? "#fef3c7" : chunk % 3 === 0 ? "#84cc16" : "#166534";
        ctx.strokeStyle = "rgba(6,78,59,0.48)";
        ctx.lineWidth = Math.max(1, radius * 0.014);
        ctx.beginPath();
        ctx.moveTo(-width * 0.72, -height);
        ctx.lineTo(width * 0.82, -height * 0.46);
        ctx.lineTo(width * 0.5, height);
        ctx.lineTo(-width, height * 0.56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};

const drawWatermelonFlesh = (ctx: CanvasRenderingContext2D, radius: number, seed: number, burstT: number, settleT: number) => {
    const rindAlpha = 1 - smoothStep(0.18, 0.82, settleT);
    if (rindAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = rindAlpha;
        const rind = ctx.createRadialGradient(-radius * 0.12, -radius * 0.16, radius * 0.28, 0, 0, radius * 1.08);
        rind.addColorStop(0, "#86efac");
        rind.addColorStop(0.48, "#22c55e");
        rind.addColorStop(0.82, "#166534");
        rind.addColorStop(1, "#064e3b");
        ctx.fillStyle = rind;
        ctx.beginPath();
        ctx.ellipse(-radius * 0.18, 0, radius * 0.82, radius * 0.74, 0, 0.74, Math.PI * 2.08);
        ctx.lineTo(radius * 0.66, radius * 0.36);
        ctx.quadraticCurveTo(radius * 0.1, radius * 0.62, -radius * 0.64, radius * 0.18);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(6,78,59,0.52)";
        ctx.lineWidth = Math.max(2, radius * 0.055);
        for (let stripe = -2; stripe <= 2; stripe += 1) {
            ctx.beginPath();
            ctx.moveTo(-radius * 0.18 + stripe * radius * 0.18, -radius * 0.64);
            ctx.bezierCurveTo(
                -radius * 0.04 + stripe * radius * 0.26,
                -radius * 0.3,
                -radius * 0.12 + stripe * radius * 0.22,
                radius * 0.24,
                -radius * 0.28 + stripe * radius * 0.16,
                radius * 0.6,
            );
            ctx.stroke();
        }
        ctx.restore();
    }

    const flesh = ctx.createRadialGradient(0, -radius * 0.02, 0, 0, 0, radius * 0.98);
    flesh.addColorStop(0, "#fecaca");
    flesh.addColorStop(0.24, "#fb7185");
    flesh.addColorStop(0.68, "#dc2626");
    flesh.addColorStop(1, "rgba(127,29,29,0.52)");
    ctx.fillStyle = flesh;
    ctx.beginPath();
    const biteLobes = 18;
    for (let lobe = 0; lobe <= biteLobes; lobe += 1) {
        const theta = (Math.PI * 2 * lobe) / biteLobes;
        const wobble = 0.68 + flameNoise(seed + 317, lobe * 7.5) * 0.38 + Math.sin(theta * 7 + seed) * 0.08;
        const x = Math.cos(theta) * radius * wobble;
        const y = Math.sin(theta) * radius * (0.48 + flameNoise(seed + 331, lobe * 3.9) * 0.26);
        if (lobe === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(254,243,199,${0.72 * rindAlpha})`;
    ctx.lineWidth = Math.max(2, radius * 0.05);
    ctx.beginPath();
    ctx.arc(-radius * 0.08, radius * 0.02, radius * 0.62, -0.98, 1.08);
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,255,255,${0.1 + burstT * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.34, -radius * 0.28, radius * 0.24, radius * 0.09, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawWatermelonSplat = (ctx: CanvasRenderingContext2D, splat: FruitSplat, now: number) => {
    const age = now - splat.createdAt;
    const contactT = Math.max(0, Math.min(1, age / WATERMELON_CONTACT_MS));
    const burstT = Math.max(0, Math.min(1, (age - WATERMELON_CONTACT_MS) / WATERMELON_BURST_MS));
    const settleT = Math.max(0, Math.min(1, (age - WATERMELON_CONTACT_MS - WATERMELON_BURST_MS) / WATERMELON_SETTLE_MS));
    const pop = 0.58 + easeOutCubic(contactT) * 0.56 + Math.sin(burstT * Math.PI) * 0.2;
    const dripAlpha = smoothStep(0.05, 1, settleT);

    ctx.save();
    ctx.translate(splat.x, splat.y);
    ctx.rotate(splat.rotation * 0.22);
    ctx.scale(splat.scaleX * pop, splat.scaleY * (0.8 + easeOutCubic(contactT) * 0.24));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawTomatoGlassCracks(ctx, splat.radius * 1.06, splat.seed + 37, Math.max(contactT, burstT * 0.92));

    ctx.save();
    ctx.globalAlpha = 0.36 + burstT * 0.48;
    ctx.fillStyle = "rgba(185,28,28,0.44)";
    for (let splash = 0; splash < 30; splash += 1) {
        const theta = flameNoise(splat.seed + 337, splash * 3.4) * Math.PI * 2;
        const dist = splat.radius * (0.7 + flameNoise(splat.seed + 347, splash * 6.6) * 1.14) * Math.max(0.52, burstT);
        const length = splat.radius * (0.1 + flameNoise(splat.seed + 353, splash * 2.9) * 0.32);
        ctx.save();
        ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.74);
        ctx.rotate(theta);
        ctx.beginPath();
        ctx.ellipse(0, 0, length, splat.radius * (0.022 + flameNoise(splat.seed + 359, splash * 4.8) * 0.034), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    drawWatermelonRindChunks(ctx, splat.radius, splat.seed, burstT);

    ctx.save();
    ctx.shadowColor = "rgba(185,28,28,0.38)";
    ctx.shadowBlur = splat.radius * 0.24;
    drawWatermelonFlesh(ctx, splat.radius, splat.seed, burstT, settleT);
    ctx.restore();

    ctx.fillStyle = "#111827";
    ctx.strokeStyle = "rgba(255,255,255,0.26)";
    ctx.lineWidth = Math.max(0.7, splat.radius * 0.012);
    for (let seedIndex = 0; seedIndex < 42; seedIndex += 1) {
        const theta = flameNoise(splat.seed + 367, seedIndex * 5.1) * Math.PI * 2;
        const dist = splat.radius * (0.18 + flameNoise(splat.seed + 373, seedIndex * 7.7) * 0.62);
        ctx.save();
        ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.58);
        ctx.rotate(theta + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, splat.radius * 0.032, splat.radius * 0.066, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = dripAlpha;
    for (let drip = 0; drip < 10; drip += 1) {
        const offset = (flameNoise(splat.seed + 379, drip * 5.4) - 0.5) * splat.radius * 1.28;
        const startY = splat.radius * (0.28 + flameNoise(splat.seed + 383, drip * 7.8) * 0.36);
        const length = splat.radius * (0.7 + flameNoise(splat.seed + 389, drip * 3.5) * 1.55) * (0.28 + settleT * 0.92);
        const width = Math.max(2.4, splat.radius * (0.052 + flameNoise(splat.seed + 397, drip * 2.2) * 0.08));
        const gradient = ctx.createLinearGradient(offset, startY, offset, startY + length);
        gradient.addColorStop(0, "rgba(251,113,133,0.82)");
        gradient.addColorStop(0.54, "rgba(185,28,28,0.62)");
        gradient.addColorStop(1, "rgba(127,29,29,0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(offset, startY);
        ctx.bezierCurveTo(
            offset + Math.sin(splat.seed + drip) * splat.radius * 0.16,
            startY + length * 0.24,
            offset - Math.cos(splat.seed + drip) * splat.radius * 0.18,
            startY + length * 0.7,
            offset + Math.sin(splat.seed * 0.25 + drip) * splat.radius * 0.12,
            startY + length,
        );
        ctx.stroke();

        if (drip % 2 === 0) {
            ctx.fillStyle = "#111827";
            ctx.beginPath();
            ctx.ellipse(offset + width * 0.4, startY + length * 0.72, width * 0.22, width * 0.42, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "rgba(185,28,28,0.62)";
        ctx.beginPath();
        ctx.ellipse(offset, startY + length, width * 0.72, width, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.restore();
};

const drawSplatShape = (ctx: CanvasRenderingContext2D, splat: FruitSplat) => {
    const style = foodStyle(splat.food);
    const radius = splat.radius;
    ctx.save();
    ctx.translate(splat.x, splat.y);
    ctx.rotate(splat.rotation);
    ctx.scale(splat.scaleX, splat.scaleY);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = splat.food === "egg" ? "rgba(255,255,255,0.22)" : colorWithAlpha(style.stain, 0.34);
    ctx.shadowBlur = radius * 0.22;

    const wet = ctx.createRadialGradient(-radius * 0.14, -radius * 0.12, 0, 0, 0, radius * 1.14);
    if (splat.food === "egg") {
        wet.addColorStop(0, "rgba(255,255,255,0.88)");
        wet.addColorStop(0.54, "rgba(255,255,255,0.48)");
        wet.addColorStop(1, "rgba(255,255,255,0.03)");
    } else {
        wet.addColorStop(0, colorWithAlpha(style.pulp, 0.93));
        wet.addColorStop(0.52, colorWithAlpha(style.stain, 0.78));
        wet.addColorStop(1, colorWithAlpha(style.stain, 0.03));
    }

    ctx.fillStyle = wet;
    ctx.beginPath();
    const lobes = splat.food === "strawberry" ? 12 : splat.food === "egg" ? 10 : 15;
    for (let lobe = 0; lobe <= lobes; lobe += 1) {
        const theta = (Math.PI * 2 * lobe) / lobes;
        const wobble = 0.64 + flameNoise(splat.seed, lobe * 17.9) * 0.54;
        const x = Math.cos(theta) * radius * wobble;
        const y = Math.sin(theta) * radius * (0.58 + flameNoise(splat.seed + 3, lobe * 6.1) * 0.24);
        if (lobe === 0) ctx.moveTo(x, y);
        else ctx.quadraticCurveTo(
            Math.cos(theta - Math.PI / lobes) * radius * 1.1,
            Math.sin(theta - Math.PI / lobes) * radius * 0.76,
            x,
            y,
        );
    }
    ctx.closePath();
    ctx.fill();

    if (splat.food === "egg") {
        const yolk = ctx.createRadialGradient(-radius * 0.08, radius * 0.02, 0, 0, 0, radius * 0.34);
        yolk.addColorStop(0, "#fde047");
        yolk.addColorStop(0.72, "#f59e0b");
        yolk.addColorStop(1, "rgba(245,158,11,0)");
        ctx.fillStyle = yolk;
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.02, radius * 0.34, radius * 0.28, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    const dripCount = splat.food === "tomato" ? 9 : splat.food === "watermelon" ? 7 : splat.food === "egg" ? 6 : 5;
    for (let drip = 0; drip < dripCount; drip += 1) {
        const theta = Math.PI * 0.42 + flameNoise(splat.seed + 23, drip * 5.3) * Math.PI * 0.72;
        const start = radius * (0.22 + flameNoise(splat.seed + 31, drip * 2.9) * 0.35);
        const length = radius * (0.32 + flameNoise(splat.seed + 37, drip * 9.1) * (splat.food === "tomato" ? 1.1 : 0.68));
        const sx = Math.cos(theta) * start;
        const sy = Math.sin(theta) * start * 0.64;
        const ex = Math.cos(theta) * (start + length);
        const ey = Math.sin(theta) * (start + length) * 0.82;
        const dripGradient = ctx.createLinearGradient(sx, sy, ex, ey);
        dripGradient.addColorStop(0, splat.food === "egg" ? "rgba(255,255,255,0.6)" : colorWithAlpha(style.pulp, 0.82));
        dripGradient.addColorStop(1, splat.food === "egg" ? "rgba(255,255,255,0)" : colorWithAlpha(style.stain, 0));
        ctx.strokeStyle = dripGradient;
        ctx.lineWidth = Math.max(1.4, radius * (0.055 + flameNoise(splat.seed + 41, drip * 4.7) * 0.05));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx + ex) * 0.5, (sy + ey) * 0.5 + radius * 0.12, ex, ey);
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    if (splat.food === "watermelon" || splat.food === "strawberry") {
        const seedCount = splat.food === "watermelon" ? 17 : 22;
        ctx.fillStyle = splat.food === "watermelon" ? "#111827" : "#fef08a";
        for (let seedIndex = 0; seedIndex < seedCount; seedIndex += 1) {
            const theta = flameNoise(splat.seed + 53, seedIndex * 11.1) * Math.PI * 2;
            const dist = radius * (0.12 + flameNoise(splat.seed + 59, seedIndex * 7.2) * 0.7);
            ctx.save();
            ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.62);
            ctx.rotate(theta);
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.025, radius * 0.052, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    if (splat.food === "tomato" || splat.food === "watermelon") {
        const fragmentCount = splat.food === "tomato" ? 7 : 9;
        ctx.fillStyle = style.skin;
        for (let fragment = 0; fragment < fragmentCount; fragment += 1) {
            const theta = flameNoise(splat.seed + 67, fragment * 6.4) * Math.PI * 2;
            const dist = radius * (0.42 + flameNoise(splat.seed + 71, fragment * 8.9) * 0.52);
            ctx.save();
            ctx.translate(Math.cos(theta) * dist, Math.sin(theta) * dist * 0.66);
            ctx.rotate(theta);
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.12, radius * 0.035, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = splat.food === "egg" ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.22, -radius * 0.2, radius * 0.22, radius * 0.08, -0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawFruitSplat = (ctx: CanvasRenderingContext2D, splat: FruitSplat, now: number, sprites?: PlaygroundSprites) => {
    const style = foodStyle(splat.food);
    const age = now - splat.createdAt;
    const alpha = Math.min(1, age / 120) * Math.max(0.15, 1 - Math.max(0, age - splat.life * 0.72) / (splat.life * 0.28));
    const slide = Math.max(0, splat.y - splat.originY);
    ctx.save();
    ctx.globalAlpha = alpha;
    const sheet = getSlingerFoodSheet(sprites, splat.food);
    if (sheet) {
        const timeline = getSlingerFoodTimeline(splat.food);
        const transitionDuration = timeline.contact + timeline.burst;
        const transitionT = Math.min(1, age / transitionDuration);
        const smoothT = easeOutCubic(transitionT);

        const splatRadiusFactor = splat.food === "egg" ? 1.18 : splat.food === "strawberry" ? 1.12 : splat.food === "watermelon" ? 0.92 : 1.04;
        const splatDrawScaleFactor = splat.food === "egg" ? 0.92 : splat.food === "strawberry" ? 0.94 : splat.food === "watermelon" ? 0.88 : 0.95;

        const targetDrawnRadius = splat.radius * splatRadiusFactor;
        const currentRadiusParam = lerp(splat.initialDrawnRadius ?? targetDrawnRadius, targetDrawnRadius, smoothT);
        const currentDrawScaleParam = lerp(1, splatDrawScaleFactor, smoothT);

        const targetDrawnRotation = splat.rotation * 0.1;
        const currentDrawnRotation = lerpAngle(splat.initialRotation ?? targetDrawnRotation, targetDrawnRotation, smoothT);

        // Squash Y and Stretch X during impact contact (first timeline.contact ms)
        const contactPeriod = timeline.contact;
        const contactT = Math.min(1, age / contactPeriod);
        const squashY = age < contactPeriod ? 1 - 0.28 * Math.sin(contactT * Math.PI) : 1;
        const stretchX = age < contactPeriod ? 1 + 0.22 * Math.sin(contactT * Math.PI) : 1;

        ctx.save();
        ctx.translate(splat.x, splat.y);
        ctx.scale(splat.scaleX * stretchX, splat.scaleY * squashY);
        drawSlingerFoodFrame(
            ctx,
            sheet,
            getSlingerSplatFrame(splat.food, age),
            0,
            0,
            currentRadiusParam,
            currentDrawnRotation,
            1,
            currentDrawScaleParam,
        );
        ctx.restore();
        ctx.restore();
        return;
    }
    if (splat.food === "watermelon") {
        if (slide > 1) {
            const trail = ctx.createLinearGradient(splat.x, splat.originY, splat.x, splat.y + splat.radius * 1.2);
            trail.addColorStop(0, "rgba(127,29,29,0.1)");
            trail.addColorStop(0.5, "rgba(251,113,133,0.24)");
            trail.addColorStop(1, "rgba(127,29,29,0)");
            ctx.strokeStyle = trail;
            ctx.lineWidth = Math.max(5, splat.radius * 0.28);
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(splat.x, splat.originY + splat.radius * 0.22);
            ctx.bezierCurveTo(
                splat.x + Math.sin(splat.seed) * splat.radius * 0.34,
                splat.originY + slide * 0.22,
                splat.x - Math.cos(splat.seed) * splat.radius * 0.24,
                splat.originY + slide * 0.7,
                splat.x,
                splat.y + splat.radius * 0.82,
            );
            ctx.stroke();
        }
        drawWatermelonSplat(ctx, splat, now);
        ctx.restore();
        return;
    }
    if (splat.food === "tomato") {
        if (slide > 1) {
            const trail = ctx.createLinearGradient(splat.x, splat.originY, splat.x, splat.y + splat.radius * 1.1);
            trail.addColorStop(0, "rgba(153,27,27,0.1)");
            trail.addColorStop(0.58, "rgba(239,68,68,0.24)");
            trail.addColorStop(1, "rgba(153,27,27,0)");
            ctx.strokeStyle = trail;
            ctx.lineWidth = Math.max(4, splat.radius * 0.24);
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(splat.x, splat.originY + splat.radius * 0.24);
            ctx.bezierCurveTo(
                splat.x + Math.sin(splat.seed) * splat.radius * 0.32,
                splat.originY + slide * 0.24,
                splat.x - Math.cos(splat.seed) * splat.radius * 0.2,
                splat.originY + slide * 0.72,
                splat.x,
                splat.y + splat.radius * 0.74,
            );
            ctx.stroke();
        }
        drawTomatoSplat(ctx, splat, now);
        ctx.restore();
        return;
    }
    if (slide > 1) {
        const streak = ctx.createLinearGradient(splat.x, splat.originY, splat.x, splat.y + splat.radius * 0.5);
        streak.addColorStop(0, colorWithAlpha(style.stain, 0.15));
        streak.addColorStop(0.72, colorWithAlpha(style.pulp, 0.22));
        streak.addColorStop(1, colorWithAlpha(style.stain, 0));
        ctx.strokeStyle = streak;
        ctx.lineWidth = Math.max(3, splat.radius * 0.18);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(splat.x, splat.originY + splat.radius * 0.16);
        ctx.bezierCurveTo(
            splat.x + Math.sin(splat.seed) * splat.radius * 0.22,
            splat.originY + slide * 0.28,
            splat.x - Math.cos(splat.seed) * splat.radius * 0.14,
            splat.originY + slide * 0.72,
            splat.x,
            splat.y + splat.radius * 0.3,
        );
        ctx.stroke();
    }
    drawSplatShape(ctx, splat);
    ctx.restore();
};

const drawFruitProjectile = (ctx: CanvasRenderingContext2D, projectile: FruitProjectile, sprites?: PlaygroundSprites) => {
    const approachT = 1 - Math.max(0, Math.min(1, projectile.z / SLINGER_PROJECTILE_DEPTH));
    const sheet = getSlingerFoodSheet(sprites, projectile.food);
    if (sheet) {
        const depthScale = projectile.food === "tomato"
            ? 1 + easeOutCubic(approachT) * 1.08
            : 1 + easeOutCubic(approachT) * 0.9;
        const frame = smoothStep(0.04, 0.96, approachT) * 2;
        ctx.save();
        ctx.globalAlpha = 0.18 + approachT * 0.16;
        ctx.fillStyle = "rgba(15,23,42,0.7)";
        ctx.beginPath();
        ctx.ellipse(projectile.x, projectile.y + projectile.radius * (1.3 + projectile.z * 0.001), projectile.radius * 1.2, projectile.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawSlingerFoodFrame(
            ctx,
            sheet,
            frame,
            projectile.x,
            projectile.y,
            projectile.radius * depthScale,
            projectile.rotation * 0.1,
        );
        return;
    }
};

const getSlingerShot = (
    anchorX: number,
    anchorY: number,
    pullX: number,
    pullY: number,
    _chargeStartAt: number,
    food: ThrowFoodId,
    now: number,
) => {
    const profile = foodStyle(food);
    const rawDx = anchorX - pullX;
    const rawDy = anchorY - pullY;
    const rawDistance = Math.min(SLINGER_MAX_PULL, Math.hypot(rawDx, rawDy));
    const angle = rawDistance > 5 ? Math.atan2(rawDy, rawDx) : -Math.PI / 2;
    const pullPower = clampValue((rawDistance - SLINGER_POWER_DEADZONE) / (SLINGER_MAX_PULL - SLINGER_POWER_DEADZONE), 0, 1);
    const power = smoothStep(0, 1, pullPower);
    const punch = easeOutCubic(power);
    const massDrag = 1 / (0.82 + (profile.mass * 0.22));
    const speed = (0.38 + punch * 2.65) * massDrag;
    const depthSpeed = (0.58 + punch * 0.3) * (0.9 + massDrag * 0.1);
    const startX = anchorX + Math.cos(angle) * 18;
    const startY = anchorY + Math.sin(angle) * 18;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - (0.035 + punch * 0.09);
    const flightMs = SLINGER_PROJECTILE_DEPTH / depthSpeed;
    const impactX = startX + vx * flightMs;
    const impactY = startY + vy * flightMs + 0.5 * SLINGER_GRAVITY * profile.mass * flightMs * flightMs;

    return {
        angle,
        power,
        punch,
        speed,
        depthSpeed,
        startX,
        startY,
        vx,
        vy,
        flightMs,
        impactX,
        impactY,
    };
};

const drawSlingerFrameSprite = (
    ctx: CanvasRenderingContext2D,
    sprite: HTMLImageElement | undefined,
    anchorX: number,
    anchorY: number,
    shake: number,
) => {
    if (!sprite) return false;
    const drawHeight = 196;
    const drawWidth = drawHeight * (sprite.width / sprite.height);
    ctx.save();
    ctx.translate(anchorX + shake * 0.16, anchorY + 52);
    ctx.shadowColor = "rgba(0,0,0,0.42)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 9;
    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
    return true;
};

const drawSlinger = (ctx: CanvasRenderingContext2D, state: SlingerState, food: ThrowFoodId, now: number, fallbackX: number, fallbackY: number, sprites?: PlaygroundSprites) => {
    const profile = foodStyle(food);
    const idle = !state.active;
    const anchorX = idle ? fallbackX : state.anchorX;
    const anchorY = idle ? fallbackY : state.anchorY;
    const pullBaseX = idle ? anchorX : state.pullX;
    const pullBaseY = idle ? anchorY + 8 : state.pullY;
    const dx = pullBaseX - anchorX;
    const dy = pullBaseY - anchorY;
    const pullDistance = Math.min(SLINGER_MAX_PULL, Math.hypot(dx, dy));
    const pullAngle = Math.atan2(dy, dx);
    const pullX = anchorX + Math.cos(pullAngle) * pullDistance;
    const pullY = anchorY + Math.sin(pullAngle) * pullDistance;
    const power = clampValue((pullDistance - SLINGER_POWER_DEADZONE) / (SLINGER_MAX_PULL - SLINGER_POWER_DEADZONE), 0, 1);
    const shot = getSlingerShot(anchorX, anchorY, pullX, pullY, idle ? now : state.chargeStartAt, food, now);
    const shake = idle ? Math.sin(now * 0.0048) * 0.45 : Math.sin(now * 0.034 + state.seed) * power * 1.35;
    const forkLeft = { x: anchorX - 44 + shake, y: anchorY - 18 };
    const forkRight = { x: anchorX + 44 - shake, y: anchorY - 18 };
    const base = { x: anchorX, y: anchorY + 64 };
    const handleBottom = { x: anchorX, y: anchorY + 124 };

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.strokeStyle = `rgba(15,23,42,${idle ? 0.42 : 0.58 + power * 0.22})`;
    ctx.lineWidth = idle ? 4.8 : 6.2;
    ctx.beginPath();
    for (let step = 0; step < 22; step += 1) {
        const t = step / 21;
        const x = shot.startX + shot.vx * shot.flightMs * t;
        const y = shot.startY + shot.vy * shot.flightMs * t + 0.5 * SLINGER_GRAVITY * profile.mass * shot.flightMs * shot.flightMs * t * t;
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = idle ? "rgba(14,165,233,0.74)" : `rgba(34,211,238,${0.76 + power * 0.2})`;
    ctx.lineWidth = idle ? 2.1 : 3.1;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(15,23,42,${idle ? 0.64 : 0.76})`;
    ctx.lineWidth = idle ? 5 : 6.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(shot.impactX, shot.impactY, idle ? 10 : 13 + power * 5, 0, Math.PI * 2);
    ctx.moveTo(shot.impactX - (idle ? 16 : 22), shot.impactY);
    ctx.lineTo(shot.impactX + (idle ? 16 : 22), shot.impactY);
    ctx.moveTo(shot.impactX, shot.impactY - (idle ? 16 : 22));
    ctx.lineTo(shot.impactX, shot.impactY + (idle ? 16 : 22));
    ctx.stroke();
    ctx.strokeStyle = `rgba(254,240,138,${idle ? 0.86 : 0.92 + power * 0.08})`;
    ctx.lineWidth = idle ? 2 : 2.8;
    ctx.stroke();
    ctx.fillStyle = `rgba(15,23,42,${idle ? 0.72 : 0.82})`;
    ctx.beginPath();
    ctx.arc(shot.impactX, shot.impactY, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${idle ? 0.82 : 0.94})`;
    ctx.beginPath();
    ctx.arc(shot.impactX, shot.impactY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.38)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "rgba(2,6,23,0.22)";
    ctx.beginPath();
    ctx.ellipse(anchorX, handleBottom.y + 6, 54, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!drawSlingerFrameSprite(ctx, sprites?.slingerFrame, anchorX, anchorY, shake)) {
        ctx.strokeStyle = "rgba(146,64,14,0.92)";
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(handleBottom.x, handleBottom.y);
        ctx.quadraticCurveTo(anchorX + 6, anchorY + 86, base.x, base.y);
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(forkLeft.x, forkLeft.y);
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(forkRight.x, forkRight.y);
        ctx.stroke();
    }

    ctx.strokeStyle = "#3f1d0b";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(forkLeft.x, forkLeft.y);
    ctx.quadraticCurveTo((forkLeft.x + pullX) * 0.5, (forkLeft.y + pullY) * 0.5 + power * 20, pullX, pullY);
    ctx.quadraticCurveTo((forkRight.x + pullX) * 0.5, (forkRight.y + pullY) * 0.5 + power * 20, forkRight.x, forkRight.y);
    ctx.stroke();

    ctx.fillStyle = "#7c2d12";
    ctx.strokeStyle = "rgba(15,23,42,0.48)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(pullX, pullY + 3, 21 + power * 7, 12 + power * 2, pullAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(pullX, pullY);
    ctx.rotate(pullAngle + Math.PI / 2 + Math.sin(now * 0.06) * power * 0.08);
    ctx.scale(1 + (idle ? 0.04 : power * 0.22), 1 - (idle ? 0.03 : power * 0.16));
    drawSlingerFoodObject(ctx, food, profile.radius * (0.84 + power * 0.12), state.seed, sprites);
    ctx.restore();

    ctx.fillStyle = `rgba(254,240,138,${0.14 + power * 0.28})`;
    ctx.beginPath();
    ctx.arc(pullX, pullY, 18 + power * 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawSlingerSafely = (ctx: CanvasRenderingContext2D, state: SlingerState, food: ThrowFoodId, now: number, fallbackX: number, fallbackY: number, sprites?: PlaygroundSprites): void => {
    try {
        drawSlinger(ctx, state, food, now, fallbackX, fallbackY, sprites);
    } catch (error) {
        console.error("[playground] Slinger draw failed", error);
        ctx.save();
        ctx.translate(fallbackX, fallbackY);
        ctx.strokeStyle = "rgba(217,119,6,0.92)";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 76);
        ctx.lineTo(-28, -10);
        ctx.moveTo(0, 76);
        ctx.lineTo(28, -10);
        ctx.stroke();
        ctx.strokeStyle = "#3f1d0b";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-28, -10);
        ctx.quadraticCurveTo(0, state.active ? 18 : -2, 28, -10);
        ctx.stroke();
        drawSlingerFoodObject(ctx, food, foodStyle(food).radius * 0.82, state.seed || Math.floor(now), sprites);
        ctx.restore();
    }
};

const getDockedDragonLayout = (surfaceWidth: number, surfaceHeight: number, focusY: number): DragonHeadLayout => {
    const renderDpr = Math.min(DRAGON_RENDER_DPR_CAP, window.devicePixelRatio || 1);
    const qualityMaxHeight = Math.min(DRAGON_MAX_DISPLAY_HEIGHT, Math.floor((DRAGON_SOURCE_FRAME_PX * 0.98) / renderDpr));
    const drawHeight = clampValue(
        Math.min(surfaceHeight * 0.54, surfaceWidth * 0.46),
        DRAGON_MIN_DISPLAY_HEIGHT,
        qualityMaxHeight
    );
    const drawWidth = drawHeight * DRAGON_FRAME_ASPECT;
    const yFocus = Number.isFinite(focusY) ? focusY : surfaceHeight * 0.54;
    const x = -drawWidth * (1 - DRAGON_DOCK_VISIBLE_RATIO);
    const y = clampValue(
        yFocus - (DRAGON_MOUTH_Y * drawHeight),
        -drawHeight * 0.2,
        surfaceHeight - (drawHeight * 0.72)
    );

    return {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
        mouthX: x + ((1 - DRAGON_MOUTH_X) * drawWidth),
        mouthY: y + (DRAGON_MOUTH_Y * drawHeight),
        mirror: true,
    };
};

const createDragonBreath = (
    targetX: number,
    targetY: number,
    radius: number,
    surfaceWidth: number,
    surfaceHeight: number,
    seed: number,
    now: number,
    showFlame = true,
    life = 1320,
): ActiveDragonBreath => {
    const layout = getDockedDragonLayout(surfaceWidth, surfaceHeight, targetY - clampValue(radius * 0.2, 4, 20));

    return {
        id: `dragon-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        targetX,
        targetY,
        ...layout,
        seed,
        createdAt: now,
        life,
        showFlame,
    };
};

const getDragonSilhouette = (sprite: HTMLImageElement): HTMLCanvasElement => {
    const cached = dragonSilhouetteCache.get(sprite);
    if (cached) return cached;

    const silhouette = document.createElement("canvas");
    silhouette.width = sprite.naturalWidth;
    silhouette.height = sprite.naturalHeight;
    const silhouetteCtx = silhouette.getContext("2d");
    if (silhouetteCtx) {
        silhouetteCtx.drawImage(sprite, 0, 0);
        silhouetteCtx.globalCompositeOperation = "source-in";
        silhouetteCtx.fillStyle = "rgba(7,10,14,0.82)";
        silhouetteCtx.fillRect(0, 0, silhouette.width, silhouette.height);
    }
    dragonSilhouetteCache.set(sprite, silhouette);
    return silhouette;
};

const hasTransparentNeighbor = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    radius: number
): boolean => {
    const minX = Math.max(0, x - radius);
    const maxX = Math.min(width - 1, x + radius);
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(height - 1, y + radius);
    for (let checkY = minY; checkY <= maxY; checkY += 1) {
        for (let checkX = minX; checkX <= maxX; checkX += 1) {
            if (checkX === x && checkY === y) continue;
            const offset = ((checkY * width) + checkX) * 4;
            if (data[offset + 3] <= 10) return true;
        }
    }
    return false;
};

const isDragonBackgroundArtifactPixel = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number
): boolean => {
    const offset = ((y * width) + x) * 4;
    const alpha = data[offset + 3];
    if (alpha <= 10) return true;

    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const luminance = (red * 0.2126) + (green * 0.7152) + (blue * 0.0722);
    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const saturation = maxChannel - minChannel;
    const isLeftSmokeBlock = x < width * 0.25 && y > height * 0.24 && y < height * 0.67;
    const isEyeSideSmokeBlock = x > width * 0.69 && y > height * 0.24 && y < height * 0.44;
    const darkMatte = luminance < 76 && saturation < 52 && alpha < 252;
    const softSmoke = alpha < 184 && luminance < 146 && saturation < 86;
    const greenGraySmoke = green > red + 20 && blue > red + 18 && luminance < 150 && alpha < 246;
    const edgeHalo = alpha < 238 && luminance < 118 && saturation < 68 && hasTransparentNeighbor(data, width, height, x, y, 2);

    return edgeHalo || ((isLeftSmokeBlock || isEyeSideSmokeBlock) && (darkMatte || softSmoke || greenGraySmoke));
};

const removeConnectedDragonBackgroundArtifacts = (
    data: Uint8ClampedArray,
    width: number,
    height: number
): void => {
    const visited = new Uint8Array(width * height);
    const stack: number[] = [];
    const enqueue = (x: number, y: number): void => {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        const index = (y * width) + x;
        if (visited[index]) return;
        if (!isDragonBackgroundArtifactPixel(data, width, height, x, y)) return;
        visited[index] = 1;
        stack.push(index);
    };

    for (let y = 0; y < height; y += 1) {
        enqueue(0, y);
        enqueue(width - 1, y);
    }
    for (let x = 0; x < width; x += 1) {
        enqueue(x, 0);
        enqueue(x, height - 1);
    }

    while (stack.length > 0) {
        const index = stack.pop();
        if (index === undefined) break;
        const x = index % width;
        const y = Math.floor(index / width);
        const offset = index * 4;
        data[offset + 3] = 0;
        enqueue(x - 1, y);
        enqueue(x + 1, y);
        enqueue(x, y - 1);
        enqueue(x, y + 1);
    }
};

const removeDragonHeadShadowPixels = (
    data: Uint8ClampedArray,
    width: number,
    height: number
): void => {
    removeConnectedDragonBackgroundArtifacts(data, width, height);

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const offset = ((y * width) + x) * 4;
            const alpha = data[offset + 3];
            if (alpha <= 10 || alpha >= 252) continue;

            const red = data[offset];
            const green = data[offset + 1];
            const blue = data[offset + 2];
            const luminance = (red * 0.2126) + (green * 0.7152) + (blue * 0.0722);
            const maxChannel = Math.max(red, green, blue);
            const minChannel = Math.min(red, green, blue);
            const saturation = maxChannel - minChannel;
            const isDarkHalo = luminance < 128 && saturation < 76;
            const isOutsideSmokeRegion = (
                (x < width * 0.27 && y > height * 0.22 && y < height * 0.7) ||
                (x > width * 0.68 && y > height * 0.22 && y < height * 0.48)
            );
            if (!(isDarkHalo && (isOutsideSmokeRegion || hasTransparentNeighbor(data, width, height, x, y, 3)))) continue;

            data[offset + 3] = 0;
        }
    }
};

const getCleanDragonHeadFrame = (
    sprite: HTMLImageElement,
    frameIndex: number,
    frameWidth: number,
    frameHeight: number
): HTMLCanvasElement => {
    let frameCache = dragonHeadCleanFrameCache.get(sprite);
    if (!frameCache) {
        frameCache = new Map<number, HTMLCanvasElement>();
        dragonHeadCleanFrameCache.set(sprite, frameCache);
    }
    const cached = frameCache.get(frameIndex);
    if (cached) return cached;

    const pixelWidth = Math.round(frameWidth);
    const pixelHeight = Math.round(frameHeight);
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const cleanCtx = canvas.getContext("2d");
    if (!cleanCtx) {
        frameCache.set(frameIndex, canvas);
        return canvas;
    }

    cleanCtx.drawImage(
        sprite,
        frameIndex * frameWidth,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        pixelWidth,
        pixelHeight
    );

    try {
        const imageData = cleanCtx.getImageData(0, 0, pixelWidth, pixelHeight);
        removeDragonHeadShadowPixels(imageData.data, pixelWidth, pixelHeight);
        cleanCtx.putImageData(imageData, 0, 0);
    } catch {
        // Keep the original frame if canvas readback is blocked.
    }

    frameCache.set(frameIndex, canvas);
    return canvas;
};

const getDragonHeadTweenFrame = (
    sprite: HTMLImageElement,
    frame: number,
    frameWidth: number,
    frameHeight: number
): HTMLCanvasElement => {
    const clampedFrame = clampValue(frame, 0, DRAGON_SHEET_FRAMES - 1);
    const baseFrame = clampValue(Math.floor(clampedFrame), 0, DRAGON_SHEET_FRAMES - 1);
    const nextFrame = clampValue(baseFrame + 1, 0, DRAGON_SHEET_FRAMES - 1);
    const rawMix = clampValue(clampedFrame - baseFrame, 0, 1);
    const tweenStep = nextFrame === baseFrame ? 0 : Math.round(rawMix * DRAGON_HEAD_TWEEN_STEPS);
    const mix = tweenStep / DRAGON_HEAD_TWEEN_STEPS;
    const cacheKey = `${baseFrame}:${nextFrame}:${tweenStep}`;
    let tweenCache = dragonHeadTweenFrameCache.get(sprite);
    if (!tweenCache) {
        tweenCache = new Map<string, HTMLCanvasElement>();
        dragonHeadTweenFrameCache.set(sprite, tweenCache);
    }
    const cached = tweenCache.get(cacheKey);
    if (cached) return cached;

    const baseCanvas = getCleanDragonHeadFrame(sprite, baseFrame, frameWidth, frameHeight);
    const nextCanvas = getCleanDragonHeadFrame(sprite, nextFrame, frameWidth, frameHeight);
    if (mix <= 0 || nextFrame === baseFrame) {
        tweenCache.set(cacheKey, baseCanvas);
        return baseCanvas;
    }
    if (mix >= 1) {
        tweenCache.set(cacheKey, nextCanvas);
        return nextCanvas;
    }

    const canvas = document.createElement("canvas");
    canvas.width = baseCanvas.width;
    canvas.height = baseCanvas.height;
    const tweenCtx = canvas.getContext("2d");
    if (!tweenCtx) {
        tweenCache.set(cacheKey, baseCanvas);
        return baseCanvas;
    }

    tweenCtx.imageSmoothingEnabled = true;
    tweenCtx.imageSmoothingQuality = "high";
    tweenCtx.globalAlpha = 1 - mix;
    tweenCtx.drawImage(baseCanvas, 0, 0);
    tweenCtx.globalAlpha = mix;
    tweenCtx.drawImage(nextCanvas, 0, 0);
    tweenCtx.globalAlpha = 1;

    tweenCache.set(cacheKey, canvas);
    return canvas;
};

const warmDragonHeadFrames = (sprite: HTMLImageElement): void => {
    if (!sprite.complete || sprite.naturalWidth <= 0) return;
    const frameWidth = sprite.naturalWidth / DRAGON_SHEET_FRAMES;
    const frameHeight = sprite.naturalHeight;
    for (let frameIndex = 0; frameIndex < DRAGON_SHEET_FRAMES; frameIndex += 1) {
        getCleanDragonHeadFrame(sprite, frameIndex, frameWidth, frameHeight);
    }

    const buildTweenBatch = (): void => {
        for (let frameIndex = 0; frameIndex < DRAGON_SHEET_FRAMES - 1; frameIndex += 1) {
            for (let step = 1; step < DRAGON_HEAD_TWEEN_STEPS; step += 1) {
                getDragonHeadTweenFrame(sprite, frameIndex + (step / DRAGON_HEAD_TWEEN_STEPS), frameWidth, frameHeight);
            }
        }
    };

    const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
    };
    if (idleWindow.requestIdleCallback) {
        idleWindow.requestIdleCallback(buildTweenBatch, { timeout: 1400 });
    } else {
        globalThis.setTimeout(buildTweenBatch, 120);
    }
};

const drawDragonHeadFrame = (
    ctx: CanvasRenderingContext2D,
    layout: DragonHeadLayout,
    frame: number,
    alpha: number,
    now: number,
    seed: number,
    sprite?: HTMLImageElement,
    intensity = 0
): void => {
    if (!sprite?.complete || sprite.naturalWidth <= 0 || alpha <= 0) return;

    const frameWidth = sprite.naturalWidth / DRAGON_SHEET_FRAMES;
    const frameHeight = sprite.naturalHeight;
    const recoil = Math.sin(Math.min(1, intensity) * Math.PI) * 14;
    const breathe = Math.sin(now * 0.0028 + seed) * 3.4;
    const shakeX = Math.sin(now * 0.034 + seed) * 2.8 * intensity;
    const shakeY = Math.cos(now * 0.029 + seed) * 2.2 * intensity;

    ctx.save();
    ctx.translate(
        layout.x + layout.width / 2 - recoil + shakeX,
        layout.y + layout.height / 2 + breathe + shakeY
    );
    if (layout.mirror) ctx.scale(-1, 1);
    ctx.globalAlpha = alpha;

    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.shadowBlur = 0;
    const cleanFrame = getDragonHeadTweenFrame(sprite, frame, frameWidth, frameHeight);
    ctx.drawImage(
        cleanFrame,
        0,
        0,
        cleanFrame.width,
        cleanFrame.height,
        -layout.width / 2,
        -layout.height / 2,
        layout.width,
        layout.height
    );

    ctx.restore();
};

const drawDragonHeadSequence = (
    ctx: CanvasRenderingContext2D,
    layout: DragonHeadLayout,
    frame: number,
    alpha: number,
    now: number,
    seed: number,
    sprite?: HTMLImageElement,
    intensity = 0
): void => {
    drawDragonHeadFrame(ctx, layout, frame, alpha, now, seed, sprite, intensity);
};

const drawIdleDragonHead = (
    ctx: CanvasRenderingContext2D,
    surfaceWidth: number,
    surfaceHeight: number,
    focusY: number,
    now: number,
    sprite?: HTMLImageElement
): void => {
    const layout = getDockedDragonLayout(surfaceWidth, surfaceHeight, focusY);
    const smokeFrame = 0.12 + (Math.sin(now * 0.0018) * 0.5 + 0.5) * 0.18;
    drawDragonHeadSequence(ctx, layout, smokeFrame, 0.96, now, 1137, sprite, 0);
};

const drawDragonBreath = (ctx: CanvasRenderingContext2D, breath: ActiveDragonBreath, now: number, sprite?: HTMLImageElement, flameSprite?: HTMLImageElement): void => {
    const age = now - breath.createdAt;
    const t = clampValue(age / breath.life, 0, 1);
    const alpha = Math.min(1, age / 130) * Math.max(0, 1 - smoothStep(0.74, 1, t));
    if (alpha <= 0) return;

    const flameT = smoothStep(0.16, 0.38, t) * (1 - smoothStep(0.82, 1, t));
    const roughAngle = Math.atan2(breath.targetY - breath.mouthY, breath.targetX - breath.mouthX);
    const originX = breath.mouthX + Math.cos(roughAngle) * breath.width * DRAGON_BREATH_ORIGIN_FORWARD;
    const originY = breath.mouthY + Math.sin(roughAngle) * breath.width * DRAGON_BREATH_ORIGIN_FORWARD + breath.height * DRAGON_BREATH_ORIGIN_DOWN;
    const angle = Math.atan2(breath.targetY - originY, breath.targetX - originX);
    const distance = Math.max(36, Math.hypot(breath.targetX - originX, breath.targetY - originY));
    const pulse = 0.72 + Math.sin(now * 0.026 + breath.seed) * 0.16;
    let headFrame: number | null = null;

    if (sprite?.complete && sprite.naturalWidth > 0) {
        const openFrame = breath.showFlame === false
            ? (
                smoothStep(0.02, 0.18, t) *
                (1 - smoothStep(0.82, 0.98, t)) *
                (DRAGON_SHEET_FRAMES - 2.1)
            ) + (Math.sin(now * 0.0054 + breath.seed) * 0.38)
            : smoothStep(0.04, 0.5, t) * (DRAGON_SHEET_FRAMES - 1);
        const settle = breath.showFlame === false ? 0 : smoothStep(0.64, 1, t);
        headFrame = openFrame - settle * 1.1;
    } else {
        ctx.save();
        ctx.translate(originX, originY);
        ctx.rotate(angle + Math.PI);
        ctx.globalAlpha = alpha * 0.92;
        ctx.fillStyle = "rgba(16,24,39,0.86)";
        ctx.strokeStyle = "rgba(251,146,60,0.32)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, breath.width * 0.36, breath.height * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    if (breath.showFlame === false || flameT <= 0) {
        if (headFrame !== null) {
            drawDragonHeadSequence(ctx, breath, headFrame, alpha, now, breath.seed, sprite, flameT);
        }
        return;
    }

    const flameLength = distance * (0.78 + flameT * 0.18);
    const flameWidth = clampValue(breath.width * 0.22, 46, 92) * pulse;
    const hasFlameSprite = flameSprite?.complete && flameSprite.naturalWidth > 0;
    const drawBreathShape = () => {
        ctx.beginPath();
        ctx.moveTo(0, -flameWidth * 0.18);
        ctx.bezierCurveTo(flameLength * 0.12, -flameWidth * 0.76, flameLength * 0.28, -flameWidth * 0.5, flameLength * 0.38, -flameWidth * 0.9);
        ctx.bezierCurveTo(flameLength * 0.48, -flameWidth * 0.18, flameLength * 0.62, -flameWidth * 0.68, flameLength * 0.72, -flameWidth * 0.26);
        ctx.bezierCurveTo(flameLength * 0.86, -flameWidth * 0.48, flameLength * 0.97, -flameWidth * 0.16, flameLength, 0);
        ctx.bezierCurveTo(flameLength * 0.88, flameWidth * 0.22, flameLength * 0.72, flameWidth * 0.56, flameLength * 0.54, flameWidth * 0.34);
        ctx.bezierCurveTo(flameLength * 0.38, flameWidth * 0.84, flameLength * 0.18, flameWidth * 0.56, 0, flameWidth * 0.18);
        ctx.closePath();
    };

    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha * flameT * (hasFlameSprite ? 0.72 : 0.82);
    const contrastBody = ctx.createLinearGradient(0, 0, flameLength, 0);
    contrastBody.addColorStop(0, "rgba(127,29,29,0.78)");
    contrastBody.addColorStop(0.24, "rgba(194,65,12,0.72)");
    contrastBody.addColorStop(0.64, "rgba(88,28,14,0.58)");
    contrastBody.addColorStop(1, "rgba(15,23,42,0)");
    ctx.fillStyle = contrastBody;
    drawBreathShape();
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha * flameT;
    if (hasFlameSprite && flameSprite) {
        const frameWidth = flameSprite.naturalWidth / DRAGON_BREATH_FLAME_SHEET_FRAMES;
        const frameHeight = flameSprite.naturalHeight;
        const frame = Math.floor((now * 0.018 + breath.seed * 0.11) % DRAGON_BREATH_FLAME_SHEET_FRAMES);
        ctx.drawImage(
            flameSprite,
            frame * frameWidth,
            0,
            frameWidth,
            frameHeight,
            -flameWidth * 0.22,
            -flameWidth * 0.72,
            flameLength * 1.04,
            flameWidth * 1.44
        );
    } else {
        const outer = ctx.createLinearGradient(0, 0, flameLength, 0);
        outer.addColorStop(0, "rgba(255,255,255,0.64)");
        outer.addColorStop(0.1, "rgba(254,240,138,0.76)");
        outer.addColorStop(0.36, "rgba(249,115,22,0.66)");
        outer.addColorStop(0.7, "rgba(220,38,38,0.3)");
        outer.addColorStop(1, "rgba(127,29,29,0)");
        ctx.fillStyle = outer;
        drawBreathShape();
        ctx.fill();
    }

    const mouthCore = ctx.createRadialGradient(0, 0, 0, 0, 0, flameWidth * 0.7);
    mouthCore.addColorStop(0, "rgba(255,255,255,0.82)");
    mouthCore.addColorStop(0.42, "rgba(251,191,36,0.46)");
    mouthCore.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = mouthCore;
    ctx.beginPath();
    ctx.ellipse(0, 0, flameWidth * 0.62, flameWidth * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (headFrame !== null) {
        drawDragonHeadSequence(ctx, breath, headFrame, alpha, now, breath.seed, sprite, flameT);
    }
};

const drawLiveFlame = (ctx: CanvasRenderingContext2D, flame: ActiveFlame, now: number, sprite?: HTMLImageElement) => {
    const age = now - flame.createdAt;
    const lifeT = Math.max(0, Math.min(1, age / flame.life));
    const flightT = flame.startX === undefined || flame.startY === undefined ? 1 : Math.min(1, lifeT / 0.46);
    const easedFlight = 1 - ((1 - flightT) ** 3);
    const burnT = Math.max(0, Math.min(1, (lifeT - 0.34) / 0.66));
    const x = flame.startX === undefined ? flame.x : flame.startX + (flame.x - flame.startX) * easedFlight;
    const y = flame.startY === undefined ? flame.y : flame.startY + (flame.y - flame.startY) * easedFlight;
    const alpha = flightT < 1 ? 0.78 + Math.sin(flightT * Math.PI) * 0.22 : Math.sin((1 - burnT) * Math.PI * 0.5);
    if (alpha <= 0) return;

    const randomScale = 0.94 + flameNoise(flame.seed + 71, 3.2) * 0.22;
    const radius = flame.radius * randomScale * (flightT < 1 ? (0.46 + flightT * 0.18) : (0.76 + burnT * 0.28));
    const flicker = Math.sin((now * 0.014) + flame.seed) * 0.5 + 0.5;
    const lean = Math.sin((now * 0.0034) + flame.seed) * radius * 0.22;
    const baseY = radius * 0.18;
    const tipY = -radius * (0.82 + flicker * 0.2);
    const travelAngle = flame.startX === undefined || flame.startY === undefined
        ? flame.rotation
        : Math.atan2(flame.y - flame.startY, flame.x - flame.startX);

    if (sprite?.complete && sprite.naturalWidth > 0) {
        const frameCount = DRAGON_IMPACT_FLAME_SHEET_FRAMES;
        const frameWidth = sprite.naturalWidth / frameCount;
        const frameHeight = sprite.naturalHeight;
        const isFlyingFireball = flightT < 1;

        let frameProgress: number;
        let frame: number;
        let nextFrame: number;

        if (isFlyingFireball) {
            // Loop the first 8 active frames of the sheet during flight
            frameProgress = (now * 0.016 + flame.seed * 0.31) % 8;
            frame = Math.floor(frameProgress);
            nextFrame = (frame + 1) % 8;
        } else {
            // Progressively play the entire 20-frame sheet as it burns down
            frameProgress = burnT * (frameCount - 1);
            frame = Math.floor(frameProgress);
            nextFrame = Math.min(frameCount - 1, frame + 1);
        }

        const frameMix = frameProgress - frame;
        const heightFlicker = Math.sin(now * 0.011 + flame.seed) * 0.16 + Math.sin(now * 0.021 + flame.seed * 1.7) * 0.08;
        const widthFlicker = Math.sin(now * 0.009 + flame.seed * 0.8) * 0.1;
            const drawHeight = radius * (isFlyingFireball ? 1.74 : 1.78 + heightFlicker * 0.18);
            const drawWidth = drawHeight * (frameWidth / frameHeight) * (isFlyingFireball ? 1.38 : 1.12 + widthFlicker);
        const leanAngle = isFlyingFireball
            ? travelAngle
            : Math.sin(now * 0.0026 + flame.seed) * 0.12 + (flameNoise(flame.seed + 81, 5.4) - 0.5) * 0.14;
        const baseJitterX = (flameNoise(flame.seed + 91, Math.floor(now * 0.012)) - 0.5) * radius * 0.12;
        const drawX = isFlyingFireball ? -drawWidth * 0.62 : -drawWidth / 2 + baseJitterX;
        const drawY = isFlyingFireball ? -drawHeight * 0.5 : -drawHeight * 0.9;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(leanAngle);
        if (isFlyingFireball) {
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = alpha * 0.78;
            const flightContrast = ctx.createRadialGradient(0, 0, 0, 0, 0, drawHeight * 0.48);
            flightContrast.addColorStop(0, "rgba(127,29,29,0.54)");
            flightContrast.addColorStop(0.44, "rgba(194,65,12,0.32)");
            flightContrast.addColorStop(0.86, "rgba(15,23,42,0.18)");
            flightContrast.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = flightContrast;
            ctx.beginPath();
            ctx.ellipse(0, -drawHeight * 0.08, drawWidth * 0.44, drawHeight * 0.28, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = alpha;

        const drawFlameFrame = (frameIndex: number, frameAlpha: number, xOffset = 0, yOffset = 0, widthScale = 1, heightScale = 1): void => {
            if (frameAlpha <= 0) return;
            ctx.globalAlpha = alpha * frameAlpha;
            ctx.drawImage(
                sprite,
                frameIndex * frameWidth,
                0,
                frameWidth,
                frameHeight,
                drawX + xOffset,
                drawY + yOffset,
                drawWidth * widthScale,
                drawHeight * heightScale
            );
        };

        if (!isFlyingFireball) {
            const settleGlow = 1 - smoothStep(0.68, 1, burnT);
            const glowRadius = radius * (1.02 + burnT * 0.08);

            ctx.globalCompositeOperation = "screen";
            drawFlameFrame(frame, (1 - frameMix) * (0.92 + settleGlow * 0.18), 0, 0, 1.18, 1.08);
            drawFlameFrame(nextFrame, frameMix * (0.92 + settleGlow * 0.18), 0, 0, 1.18, 1.08);

            for (let ember = 0; ember < 10; ember += 1) {
                const emberT = flameNoise(flame.seed + 117, ember * 7.9);
                const emberAngle = emberT * Math.PI * 2 + Math.sin(now * 0.0016 + ember + flame.seed) * 0.1;
                const dist = glowRadius * (0.16 + flameNoise(flame.seed + 123, ember * 4.1) * 0.62);
                const size = Math.max(1.4, glowRadius * (0.018 + flameNoise(flame.seed + 131, ember * 3.3) * 0.024));
                ctx.fillStyle = `rgba(254,240,138,${alpha * settleGlow * (0.28 + emberT * 0.42)})`;
                ctx.beginPath();
                ctx.arc(Math.cos(emberAngle) * dist, Math.sin(emberAngle) * dist * 0.66, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        const heat = ctx.createRadialGradient(0, -drawHeight * 0.18, 0, 0, -drawHeight * 0.18, drawWidth * 0.72);
        heat.addColorStop(0, "rgba(255,244,214,0.24)");
        heat.addColorStop(0.36, "rgba(249,115,22,0.16)");
        heat.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = heat;
        ctx.beginPath();
        ctx.ellipse(0, -drawHeight * 0.18, drawWidth * 0.72, drawHeight * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();

        drawFlameFrame(frame, (1 - frameMix) * (isFlyingFireball ? 1.28 : 1));
        drawFlameFrame(nextFrame, frameMix * (isFlyingFireball ? 1.28 : 1));
        ctx.globalAlpha = Math.min(1, alpha * (isFlyingFireball ? 0.76 : 0.74));
        ctx.scale(0.82 + Math.sin(now * 0.01 + flame.seed) * 0.08, 1.04 + Math.sin(now * 0.013 + flame.seed) * 0.04);
        const ghostFrame = (frame + 3 + Math.floor(flameNoise(flame.seed + 103, 1.9) * 3)) % 8;
        const nextGhostFrame = (ghostFrame + 1) % 8;
        drawFlameFrame(ghostFrame, (1 - frameMix) * (isFlyingFireball ? 0.58 : 0.74), -drawWidth * 0.04, drawHeight * 0.03, 1.06, 0.96);
        drawFlameFrame(nextGhostFrame, frameMix * (isFlyingFireball ? 0.58 : 0.74), -drawWidth * 0.04, drawHeight * 0.03, 1.06, 0.96);
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(flightT < 1 ? travelAngle + Math.PI / 2 : flame.rotation);
    ctx.globalCompositeOperation = "screen";

    if (flightT < 1) {
        const trailLength = radius * (2.1 + flightT * 1.1);
        const trail = ctx.createLinearGradient(0, radius * 0.55, 0, radius * 0.55 + trailLength);
        trail.addColorStop(0, `rgba(255,255,255,${0.46 * alpha})`);
        trail.addColorStop(0.14, `rgba(254,240,138,${0.64 * alpha})`);
        trail.addColorStop(0.42, `rgba(249,115,22,${0.38 * alpha})`);
        trail.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.34, radius * 0.14);
        ctx.bezierCurveTo(-radius * 0.58, radius * 0.9, -radius * 0.2, trailLength, 0, radius * 0.62 + trailLength);
        ctx.bezierCurveTo(radius * 0.24, trailLength, radius * 0.58, radius * 0.9, radius * 0.34, radius * 0.14);
        ctx.closePath();
        ctx.fill();
    }

    const heat = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.7);
    heat.addColorStop(0, `rgba(255,255,255,${0.2 * alpha})`);
    heat.addColorStop(0.32, `rgba(255,196,87,${0.18 * alpha})`);
    heat.addColorStop(0.68, `rgba(249,115,22,${0.08 * alpha})`);
    heat.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = heat;
    drawJaggedShape(ctx, 0, -radius * 0.04, radius * 0.52, 7, flame.seed);
    ctx.fill();

    const flameGradient = ctx.createLinearGradient(0, baseY, lean, tipY);
    flameGradient.addColorStop(0, `rgba(127,29,29,${0.16 * alpha})`);
    flameGradient.addColorStop(0.24, `rgba(220,38,38,${0.48 * alpha})`);
    flameGradient.addColorStop(0.58, `rgba(249,115,22,${0.86 * alpha})`);
    flameGradient.addColorStop(0.86, `rgba(254,240,138,${0.78 * alpha})`);
    flameGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.3, baseY);
    ctx.bezierCurveTo(-radius * 0.5, -radius * 0.2, lean - radius * 0.2, tipY + radius * 0.35, lean, tipY);
    ctx.bezierCurveTo(lean + radius * 0.24, tipY + radius * 0.35, radius * 0.46, -radius * 0.12, radius * 0.28, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(254,240,138,${0.24 * alpha})`;
    ctx.lineWidth = Math.max(0.8, radius * 0.016);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.08, baseY * 0.55);
    ctx.bezierCurveTo(radius * 0.04, -radius * 0.18, lean * 0.55, tipY + radius * 0.22, lean * 0.78, tipY + radius * 0.1);
    ctx.stroke();

    for (let ember = 0; ember < 4; ember += 1) {
        const noise = flameNoise(flame.seed, ember * 31.41);
        const drift = Math.sin(now * 0.004 + ember) * radius * 0.1;
        const rise = (lifeT * radius * (1.1 + noise * 0.5) + noise * radius * 0.28) % (radius * 1.18);
        const ex = (noise - 0.5) * radius * 0.75 + drift;
        const ey = radius * 0.18 - rise;
        const emberAlpha = alpha * Math.max(0, 1 - rise / (radius * 1.18)) * 0.62;
        const emberLen = radius * (0.02 + noise * 0.022);
        ctx.strokeStyle = `rgba(251,191,36,${emberAlpha})`;
        ctx.lineWidth = Math.max(0.8, radius * 0.012);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.sin(now * 0.003 + ember) * emberLen, ey - emberLen * 1.7);
        ctx.stroke();
    }

    ctx.restore();
};

const drawPlaygroundParticle = (ctx: CanvasRenderingContext2D, particle: Particle, emberSprite?: HTMLImageElement): void => {
    if (particle.shape !== "ember" || !emberSprite?.complete || emberSprite.naturalWidth <= 0) {
        drawParticle(ctx, particle);
        return;
    }

    const lifeAlpha = clampValue(particle.life / particle.maxLife, 0, 1);
    if (lifeAlpha <= 0) return;

    const t = 1 - lifeAlpha;
    const alpha = Math.sin(lifeAlpha * Math.PI * 0.5) * (1 - smoothStep(0.72, 1, t) * 0.28);
    const frameCount = EMBER_PARTICLE_SHEET_FRAMES;
    const frameWidth = emberSprite.naturalWidth / frameCount;
    const frameHeight = emberSprite.naturalHeight;
    const frameProgress = clampValue(t * (frameCount - 1), 0, frameCount - 1);
    const frame = Math.floor(frameProgress);
    const nextFrame = Math.min(frameCount - 1, frame + 1);
    const mix = frameProgress - frame;
    const motionAngle = Math.atan2(particle.vy, particle.vx);
    const size = particle.size * (2.35 + Math.sin(t * Math.PI) * 0.85 + t * 0.32);
    const age = particle.maxLife - particle.life;
    const wobbleX = Math.sin(age * 0.16 + particle.spin * 41) * particle.size * 0.16;
    const wobbleY = Math.cos(age * 0.12 + particle.spin * 29) * particle.size * 0.1;

    const drawFrame = (frameIndex: number, frameAlpha: number): void => {
        if (frameAlpha <= 0) return;
        ctx.globalAlpha = alpha * frameAlpha;
        ctx.drawImage(
            emberSprite,
            frameIndex * frameWidth,
            0,
            frameWidth,
            frameHeight,
            -size / 2,
            -size / 2,
            size,
            size
        );
    };

    ctx.save();
    ctx.translate(particle.x + wobbleX, particle.y + wobbleY);
    ctx.rotate(motionAngle + age * particle.spin * 0.72);
    ctx.globalCompositeOperation = "screen";
    drawFrame(frame, 1 - mix);
    drawFrame(nextFrame, mix);
    ctx.restore();
};

const drawBurnResidue = (ctx: CanvasRenderingContext2D, residue: ActiveBurnResidue, now: number, sprite?: HTMLImageElement): void => {
    if (!sprite?.complete || sprite.naturalWidth <= 0) return;
    const age = now - residue.createdAt;
    const t = Math.max(0, Math.min(1, age / residue.life));
    const settle = 1 - ((1 - t) ** 3);
    const appear = Math.min(1, age / 260);
    const alpha = Math.max(0, appear * (1 - t) * 0.62);
    if (alpha <= 0) return;
    const size = residue.radius * (1.48 + settle * 0.28);
    const pulse = Math.sin(now * 0.008 + residue.seed) * residue.radius * 0.018;

    ctx.save();
    ctx.translate(residue.x, residue.y);
    ctx.rotate(residue.rotation + Math.sin(residue.seed) * 0.04);
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.46, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(sprite, -size / 2 - pulse, -size / 2, size + pulse * 2, size);
    ctx.restore();

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha * 0.42;
    ctx.strokeStyle = "rgba(251,146,60,0.64)";
    ctx.lineWidth = Math.max(1.2, residue.radius * 0.02);
    drawJaggedShape(ctx, 0, 0, size * 0.31, 8, residue.seed);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha * 0.28;
    ctx.strokeStyle = "rgba(67,20,7,0.54)";
    ctx.lineWidth = Math.max(1.0, residue.radius * 0.015);
    drawJaggedShape(ctx, 0, 0, size * 0.36, 9, residue.seed + 1);
    ctx.stroke();
    ctx.restore();
};

const createSkeletonShards = (creature: Creature, hitX: number, hitY: number, now: number): SkeletonShard[] => {
    const count = 34;
    const shards: SkeletonShard[] = [];
    for (let index = 0; index < count; index += 1) {
        const seed = creature.seed + index * 101;
        const angle = (Math.PI * 2 * index) / count + (flameNoise(seed, 2.1) - 0.5) * 0.82;
        const distance = creature.size * (0.08 + flameNoise(seed, 4.7) * 0.48);
        const force = 1.35 + flameNoise(seed, 8.9) * 4.15;
        const originX = creature.x + Math.cos(angle) * distance;
        const originY = creature.y + Math.sin(angle) * distance * 0.82;
        const push = Math.atan2(originY - hitY, originX - hitX);
        shards.push({
            id: `bone-${creature.id}-${index}`,
            x: originX,
            y: originY,
            vx: Math.cos(push) * force + (flameNoise(seed, 12.4) - 0.5) * 1.4,
            vy: Math.sin(push) * force - (1.2 + flameNoise(seed, 16.8) * 2.8),
            rotation: angle + flameNoise(seed, 20.2) * Math.PI,
            spin: (flameNoise(seed, 23.7) - 0.5) * 0.22,
            length: creature.size * (0.08 + flameNoise(seed, 27.1) * 0.18),
            width: creature.size * (0.018 + flameNoise(seed, 31.4) * 0.034),
            seed,
            createdAt: now,
            life: 1180 + flameNoise(seed, 36.6) * 720,
        });
    }
    return shards;
};

const drawSkeletonShard = (ctx: CanvasRenderingContext2D, shard: SkeletonShard, now: number): void => {
    const age = now - shard.createdAt;
    const t = Math.max(0, Math.min(1, age / shard.life));
    const alpha = Math.max(0, Math.min(1, (1 - t) * 1.12));
    if (alpha <= 0) return;
    const chip = flameNoise(shard.seed, 41.2) > 0.68;

    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.rotation);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(0,0,0,0.34)";
    ctx.shadowBlur = Math.max(1, shard.width * 0.8);
    const gradient = ctx.createLinearGradient(-shard.length / 2, -shard.width, shard.length / 2, shard.width);
    gradient.addColorStop(0, "rgba(92,74,50,0.92)");
    gradient.addColorStop(0.38, "rgba(235,224,194,0.98)");
    gradient.addColorStop(0.74, "rgba(178,158,121,0.96)");
    gradient.addColorStop(1, "rgba(63,48,32,0.86)");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(47,38,28,0.42)";
    ctx.lineWidth = Math.max(0.8, shard.width * 0.22);
    ctx.beginPath();
    if (chip) {
        ctx.moveTo(-shard.length * 0.48, -shard.width * 0.55);
        ctx.lineTo(shard.length * 0.34, -shard.width * 0.78);
        ctx.lineTo(shard.length * 0.52, shard.width * 0.22);
        ctx.lineTo(-shard.length * 0.2, shard.width * 0.86);
    } else {
        ctx.roundRect(-shard.length / 2, -shard.width / 2, shard.length, shard.width, shard.width / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

const drawDetailedArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    length: number,
    alpha = 1,
    wobble = 0,
    sprite?: HTMLImageElement,
) => {
    const sideX = Math.cos(angle + Math.PI / 2);
    const sideY = Math.sin(angle + Math.PI / 2);
    const forwardX = Math.cos(angle);
    const forwardY = Math.sin(angle);
    const tipX = x;
    const tipY = y;
    const tailX = x - forwardX * length;
    const tailY = y - forwardY * length;
    const wobbleOffset = Math.sin(wobble) * length * 0.018;
    const bodyWidth = Math.max(12, length * 0.1);

    if (sprite?.complete && sprite.naturalWidth > 0) {
        const spriteRatio = sprite.naturalHeight / sprite.naturalWidth;
        const height = Math.max(26, length * spriteRatio * 1.18);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + wobble * 0.008);
        ctx.scale(-1, 1);
        ctx.globalAlpha *= alpha;
        ctx.shadowColor = "rgba(0,0,0,0.52)";
        ctx.shadowBlur = Math.max(8, height * 0.28);
        ctx.drawImage(sprite, 0, -height / 2, length, height);
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(2,6,23,0.5)";
    ctx.shadowBlur = Math.max(7, length * 0.055);

    ctx.strokeStyle = "rgba(2,6,23,0.66)";
    ctx.lineWidth = Math.max(6.4, length * 0.052);
    ctx.beginPath();
    ctx.moveTo(tailX + sideX * wobbleOffset, tailY + sideY * wobbleOffset);
    ctx.lineTo(tipX - forwardX * length * 0.1, tipY - forwardY * length * 0.1);
    ctx.stroke();

    const shaftGradient = ctx.createLinearGradient(tailX, tailY, tipX, tipY);
    shaftGradient.addColorStop(0, "#111827");
    shaftGradient.addColorStop(0.24, "#38bdf8");
    shaftGradient.addColorStop(0.58, "#e0f2fe");
    shaftGradient.addColorStop(1, "#f8fafc");
    ctx.strokeStyle = shaftGradient;
    ctx.lineWidth = Math.max(3.2, length * 0.024);
    ctx.beginPath();
    ctx.moveTo(tailX + sideX * wobbleOffset, tailY + sideY * wobbleOffset);
    ctx.lineTo(tipX - forwardX * length * 0.14, tipY - forwardY * length * 0.14);
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(tipX + forwardX * length * 0.13, tipY + forwardY * length * 0.13);
    ctx.lineTo(tipX - forwardX * length * 0.17 + sideX * bodyWidth * 0.92, tipY - forwardY * length * 0.17 + sideY * bodyWidth * 0.92);
    ctx.lineTo(tipX - forwardX * length * 0.09 + sideX * bodyWidth * 0.22, tipY - forwardY * length * 0.09 + sideY * bodyWidth * 0.22);
    ctx.lineTo(tipX - forwardX * length * 0.17 - sideX * bodyWidth * 0.92, tipY - forwardY * length * 0.17 - sideY * bodyWidth * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(7,89,133,0.72)";
    ctx.lineWidth = Math.max(1.1, length * 0.009);
    ctx.stroke();

    for (const side of [-1, 1]) {
        const featherBaseX = tailX + forwardX * length * 0.12;
        const featherBaseY = tailY + forwardY * length * 0.12;
        ctx.fillStyle = side > 0 ? "rgba(14,116,144,0.9)" : "rgba(8,47,73,0.86)";
        ctx.beginPath();
        ctx.moveTo(featherBaseX, featherBaseY);
        ctx.lineTo(featherBaseX - forwardX * length * 0.16 + sideX * side * length * 0.09, featherBaseY - forwardY * length * 0.16 + sideY * side * length * 0.09);
        ctx.lineTo(featherBaseX + forwardX * length * 0.13 + sideX * side * length * 0.04, featherBaseY + forwardY * length * 0.13 + sideY * side * length * 0.04);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(2,6,23,0.42)";
        ctx.lineWidth = Math.max(0.6, length * 0.006);
        ctx.stroke();
    }

    const tailRingX = tailX + forwardX * length * 0.2;
    const tailRingY = tailY + forwardY * length * 0.2;
    for (let ring = 0; ring < 3; ring += 1) {
        const offset = length * (0.035 + ring * 0.034);
        const cx = tailRingX + forwardX * offset;
        const cy = tailRingY + forwardY * offset;
        ctx.strokeStyle = ring === 1 ? "rgba(224,242,254,0.82)" : "rgba(8,47,73,0.72)";
        ctx.lineWidth = Math.max(0.6, length * 0.004);
        ctx.beginPath();
        ctx.moveTo(cx - sideX * length * 0.035, cy - sideY * length * 0.035);
        ctx.lineTo(cx + sideX * length * 0.035, cy + sideY * length * 0.035);
        ctx.stroke();
    }

    for (const side of [-1, 1]) {
        const finRootX = tailX + forwardX * length * 0.04;
        const finRootY = tailY + forwardY * length * 0.04;
        ctx.fillStyle = side > 0 ? "rgba(125,211,252,0.78)" : "rgba(14,116,144,0.76)";
        ctx.beginPath();
        ctx.moveTo(finRootX, finRootY);
        ctx.lineTo(finRootX + forwardX * length * 0.11 + sideX * side * length * 0.052, finRootY + forwardY * length * 0.11 + sideY * side * length * 0.052);
        ctx.lineTo(finRootX + forwardX * length * 0.23 + sideX * side * length * 0.02, finRootY + forwardY * length * 0.23 + sideY * side * length * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(15,23,42,0.48)";
        ctx.lineWidth = Math.max(0.5, length * 0.004);
        ctx.stroke();
    }

    ctx.restore();
};

const drawLiveArrow = (ctx: CanvasRenderingContext2D, arrow: ActiveArrow, now: number, sprite?: HTMLImageElement) => {
    const age = now - arrow.createdAt;
    const flightT = Math.min(1, age / ARROW_FLIGHT_MS);
    const easedFlight = 1 - ((1 - flightT) ** 3);
    const impactT = Math.max(0, Math.min(1, (age - ARROW_FLIGHT_MS * 0.82) / ARROW_IMPACT_MS));
    const vibration = impactT > 0 ? Math.sin(impactT * Math.PI * 18 + arrow.seed) * (1 - impactT) : 0;
    const travel = Math.max(0, 1 - flightT);
    const length = arrow.heavy
        ? clampValue(arrow.radius * 2.15, 260, 390)
        : clampValue(arrow.radius * 2.25, 108, 168);
    const sideX = Math.cos(arrow.rotation + Math.PI / 2);
    const sideY = Math.sin(arrow.rotation + Math.PI / 2);
    const x = arrow.startX + (arrow.x - arrow.startX) * easedFlight + sideX * vibration * 2.2;
    const y = arrow.startY + (arrow.y - arrow.startY) * easedFlight + sideY * vibration * 2.2;
    const fadeStart = ARROW_FADE_MS > 0 ? Math.max(ARROW_FLIGHT_MS + ARROW_IMPACT_MS, arrow.life - ARROW_FADE_MS) : Number.POSITIVE_INFINITY;
    const alpha = age < fadeStart ? 1 : Math.max(0, 1 - ((age - fadeStart) / ARROW_FADE_MS));
    const wobble = vibration * 1.35;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    if (travel > 0.04) {
        ctx.strokeStyle = `rgba(226,232,240,${0.28 * travel})`;
        ctx.lineWidth = 2.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(arrow.rotation) * length * 1.2, y - Math.sin(arrow.rotation) * length * 1.2);
        ctx.lineTo(x - Math.cos(arrow.rotation) * length * 0.16, y - Math.sin(arrow.rotation) * length * 0.16);
        ctx.stroke();
    }

    drawDetailedArrow(ctx, x, y, arrow.rotation + wobble * 0.025, length, alpha, wobble, sprite);
    ctx.restore();
};

const drawScreenTick = (ctx: CanvasRenderingContext2D, tick: ScreenTick, now: number, sprite?: HTMLImageElement): void => {
    const age = now - tick.createdAt;
    const alpha = Math.max(0, Math.min(1, Math.min(age / 240, (tick.life - age) / 900)));
    if (alpha <= 0) return;

    const stride = age * 0.026 + tick.seed;
    const twitch = Math.sin(stride * 0.8) * 0.08;
    if (sprite?.complete && sprite.naturalWidth > 0) {
        const frameCount = sprite.naturalWidth > sprite.naturalHeight * 2 ? 20 : 1;
        const sourceWidth = sprite.naturalWidth / frameCount;
        const sourceHeight = sprite.naturalHeight;
        const spriteWidth = tick.size * 6.15;
        const spriteHeight = spriteWidth * (sourceHeight / sourceWidth);
        const walkProgress = ((((stride % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * frameCount;
        const frameIndex = Math.floor(walkProgress) % frameCount;

        const forwardAngle = frameCount > 1 ? Math.PI / 2 : TICK_SPRITE_FORWARD_ANGLE;

        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.translate(tick.x, tick.y);
        ctx.rotate(tick.angle - forwardAngle + twitch * 0.55);
        ctx.shadowColor = "rgba(0,0,0,0.54)";
        ctx.shadowBlur = tick.size * 0.34;
        ctx.shadowOffsetY = tick.size * 0.22;
        ctx.drawImage(
            sprite,
            frameIndex * sourceWidth,
            0,
            sourceWidth,
            sourceHeight,
            -spriteWidth / 2,
            -spriteHeight / 2,
            spriteWidth,
            spriteHeight,
        );
        ctx.restore();
        return;
    }

    const bodyLength = tick.size * 1.45;
    const bodyWidth = tick.size * 0.9;
    const forwardX = Math.cos(tick.angle + twitch);
    const forwardY = Math.sin(tick.angle + twitch);

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(tick.x, tick.y);
    ctx.rotate(tick.angle + twitch);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0,0,0,0.52)";
    ctx.shadowBlur = tick.size * 0.22;
    ctx.shadowOffsetY = tick.size * 0.12;

    ctx.fillStyle = "rgba(2,6,23,0.92)";
    ctx.strokeStyle = "rgba(15,23,42,0.96)";
    ctx.lineWidth = Math.max(1, tick.size * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyLength * 0.5, bodyWidth * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(8,13,24,0.98)";
    ctx.beginPath();
    ctx.ellipse(bodyLength * 0.43, 0, tick.size * 0.34, tick.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0,0,0,0.92)";
    ctx.lineWidth = Math.max(1.1, tick.size * 0.09);
    for (let pair = -1; pair <= 1; pair += 1) {
        const legX = pair * tick.size * 0.25;
        const lift = Math.sin(stride + pair * 1.7) * tick.size * 0.12;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(legX, side * bodyWidth * 0.25);
            ctx.lineTo(legX - tick.size * 0.3, side * (bodyWidth * 0.62 + lift));
            ctx.lineTo(legX - tick.size * 0.58, side * (bodyWidth * 0.78 - lift * 0.4));
            ctx.stroke();
        }
    }

    ctx.strokeStyle = "rgba(0,0,0,0.82)";
    ctx.lineWidth = Math.max(0.7, tick.size * 0.045);
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(bodyLength * 0.58, side * tick.size * 0.1);
        ctx.lineTo(bodyLength * 0.86, side * tick.size * 0.34);
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(248,250,252,0.72)";
    ctx.beginPath();
    ctx.arc(bodyLength * 0.54, -tick.size * 0.08, Math.max(0.8, tick.size * 0.055), 0, Math.PI * 2);
    ctx.arc(bodyLength * 0.54, tick.size * 0.08, Math.max(0.8, tick.size * 0.055), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.2 * alpha;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.ellipse(
        tick.x - forwardX * tick.size * 0.26,
        tick.y - forwardY * tick.size * 0.26 + tick.size * 0.48,
        tick.size * 0.58,
        tick.size * 0.16,
        tick.angle,
        0,
        Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
};

const drawDyingSpider = (ctx: CanvasRenderingContext2D, spider: DyingSpider, now: number, spiderSprite?: HTMLImageElement, arrowSprite?: HTMLImageElement) => {
    const age = now - spider.startedAt;
    const t = Math.max(0, Math.min(1, age / 1100));
    const impact = 1 - ((1 - Math.min(1, t / 0.28)) ** 3);
    const fade = age > 840 ? Math.max(0, 1 - ((age - 840) / 360)) : 1;
    const fall = Math.max(0, Math.min(1, (t - 0.2) / 0.62));
    const forwardX = Math.cos(spider.shotAngle);
    const forwardY = Math.sin(spider.shotAngle);
    const baseSize = spider.creature.size * (spider.creature.mergeScale ?? 1);
    const corpse: Creature = {
        ...spider.creature,
        x: spider.creature.x + forwardX * baseSize * (0.18 + impact * 0.52),
        y: spider.creature.y + forwardY * baseSize * (0.08 + impact * 0.22) + baseSize * 0.18 * fall,
        vx: 0,
        vy: 0,
        heading: spider.shotAngle + Math.PI + fall * 0.38,
        bumpReact: 34 * (1 - t),
        mergeScale: (spider.creature.mergeScale ?? 1) * (1 - fall * 0.16),
    };

    ctx.save();
    ctx.globalAlpha *= fade;
    drawSpider(ctx, corpse, spider.startedAt + Math.min(age, 240), spiderSprite);

    const embeddedX = spider.hitX + (corpse.x - spider.creature.x) * 0.78 + forwardX * baseSize * 0.1;
    const embeddedY = spider.hitY + (corpse.y - spider.creature.y) * 0.78 + forwardY * baseSize * 0.04;
    drawDetailedArrow(ctx, embeddedX, embeddedY, spider.shotAngle, Math.max(96, baseSize * 2.6), fade, Math.sin(age * 0.09) * (1 - t), arrowSprite);

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(56,189,248,${0.34 * (1 - t)})`;
    ctx.shadowColor = "rgba(56,189,248,0.62)";
    ctx.shadowBlur = Math.max(8, baseSize * 0.18);
    ctx.beginPath();
    ctx.ellipse(embeddedX, embeddedY, baseSize * 0.18, baseSize * 0.1, spider.shotAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawLaserDrillBurst = (ctx: CanvasRenderingContext2D, drill: ActiveLaserDrill, now: number) => {
    const age = now - drill.createdAt;
    const t = Math.max(0, Math.min(1, age / drill.life));
    const alpha = Math.max(0, 1 - smoothStep(0.58, 1, t));
    const bite = easeOutCubic(Math.min(1, t / 0.28));
    const spin = drill.seed * 0.01 + t * Math.PI * 8;
    const radius = 24 + bite * 34;

    ctx.save();
    ctx.translate(drill.x, drill.y);
    ctx.rotate(drill.angle + spin * 0.18);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha * 0.74;
    const socket = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.92);
    socket.addColorStop(0, "rgba(0,0,0,0.78)");
    socket.addColorStop(0.2, "rgba(15,23,42,0.42)");
    socket.addColorStop(0.48, "rgba(127,29,29,0.24)");
    socket.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = socket;
    ctx.beginPath();
    const socketVertices = 7;
    for (let i = 0; i < socketVertices; i++) {
        const angle = (Math.PI * 2 * i) / socketVertices + (i % 2 === 0 ? 0.05 : -0.05);
        const r = radius * 0.9 * (i % 2 === 0 ? 0.9 : 1.1);
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    for (let ring = 0; ring < 3; ring += 1) {
        const ringT = Math.max(0, Math.min(1, t * 1.2 - ring * 0.16));
        const ringRadius = 10 + ring * 10 + ringT * 34;
        ctx.strokeStyle = `rgba(248,113,113,${alpha * (0.42 - ring * 0.08)})`;
        ctx.lineWidth = Math.max(1.2, 4.8 - ring * 1.1);
        ctx.beginPath();
        const ringVertices = 6;
        for (let i = 0; i < ringVertices; i++) {
            const angle = (Math.PI * 2 * i) / ringVertices + (i % 2 === 0 ? 0.08 : -0.08) + spin * 0.2;
            const r = ringRadius * (i % 2 === 0 ? 0.86 : 1.14);
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }

    for (let shard = 0; shard < 10; shard += 1) {
        const theta = spin + (Math.PI * 2 * shard) / 10 + (flameNoise(drill.seed, shard * 7.3) - 0.5) * 0.36;
        const inner = 8 + flameNoise(drill.seed + 17, shard * 3.1) * 9;
        const outer = radius * (0.7 + flameNoise(drill.seed + 23, shard * 5.8) * 0.7) * (0.5 + bite * 0.5);
        ctx.strokeStyle = `rgba(254,226,226,${alpha * (0.44 + flameNoise(drill.seed + 31, shard) * 0.22)})`;
        ctx.lineWidth = 1.2 + flameNoise(drill.seed + 41, shard) * 2.2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(theta) * inner, Math.sin(theta) * inner);
        ctx.lineTo(Math.cos(theta) * outer, Math.sin(theta) * outer);
        ctx.stroke();
    }

    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.86})`;
    ctx.shadowColor = "rgba(248,113,113,0.9)";
    ctx.shadowBlur = 18 * alpha;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5 + bite * 4, 3.2 + bite * 2.6, spin, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawSplashSpray = (ctx: CanvasRenderingContext2D, spray: ActiveSplashSpray, now: number, _video?: HTMLVideoElement | null) => {
    const age = now - spray.createdAt;
    const t = Math.max(0, Math.min(1, age / spray.life));
    const alpha = Math.max(0, 1 - smoothStep(0.46, 1, t));
    if (alpha <= 0) return;

    const impactX = spray.impactX ?? spray.x;
    const impactY = spray.impactY ?? spray.y;
    const dx = impactX - spray.startX;
    const dy = impactY - spray.startY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const pulse = Math.sin(age * 0.045 + spray.seed) * 0.5 + 0.5;

    ctx.save();
    ctx.translate(spray.startX, spray.startY);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = `rgba(255,255,255,${alpha * 0.34})`;
    ctx.shadowBlur = 7;

    const jetLength = length * (1.08 + spray.power * 0.08);
    const spread = Math.max(16, Math.min(54, 22 + spray.power * 24));
    const wave = Math.sin(age * 0.026 + spray.seed) * spread * 0.18;

    const bodyGradient = ctx.createLinearGradient(0, 0, jetLength, 0);
    bodyGradient.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
    bodyGradient.addColorStop(0.28, `rgba(248,250,252,${alpha * 0.58})`);
    bodyGradient.addColorStop(0.7, `rgba(241,245,249,${alpha * 0.2})`);
    bodyGradient.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.strokeStyle = bodyGradient;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = spread * 0.42;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(jetLength * 0.22, -spread * 0.26 + wave, jetLength * 0.58, spread * 0.2 - wave, jetLength, 0);
    ctx.stroke();

    ctx.lineWidth = Math.max(3, spread * 0.12);
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.64})`;
    for (let ribbon = 0; ribbon < 4; ribbon += 1) {
        const offset = (ribbon - 1.5) * spread * 0.16;
        const phase = age * (0.018 + ribbon * 0.004) + spray.seed + ribbon * 1.7;
        ctx.beginPath();
        ctx.moveTo(jetLength * 0.05, offset);
        ctx.bezierCurveTo(
            jetLength * 0.26,
            offset + Math.sin(phase) * spread * 0.2,
            jetLength * 0.62,
            offset + Math.cos(phase * 0.8) * spread * 0.18,
            jetLength * (0.88 + ribbon * 0.02),
            offset * 0.28,
        );
        ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    ctx.translate(impactX, impactY);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = `rgba(224,242,254,${alpha * 0.62})`;
    ctx.shadowBlur = 12;

    const burst = easeOutCubic(1 - t);
    const burstRadius = (18 + spray.power * 34) * (0.72 + burst * 0.34);
    const splashGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, burstRadius);
    splashGradient.addColorStop(0, `rgba(255,255,255,${alpha * 0.82})`);
    splashGradient.addColorStop(0.4, `rgba(186,230,253,${alpha * 0.36})`);
    splashGradient.addColorStop(1, "rgba(186,230,253,0)");
    ctx.fillStyle = splashGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, burstRadius * 1.08, burstRadius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let droplet = 0; droplet < 18; droplet += 1) {
        const noise = flameNoise(spray.seed + 613, droplet * 8.31);
        const theta = -Math.PI * 0.82 + droplet * (Math.PI * 1.64 / 17) + (noise - 0.5) * 0.28;
        const distance = burstRadius * (0.34 + flameNoise(spray.seed + 619, droplet * 4.7) * 0.96) * (0.7 + burst * 0.28);
        const px = Math.cos(theta) * distance;
        const py = Math.sin(theta) * distance * 0.56;
        const dot = 1.2 + flameNoise(spray.seed + 631, droplet * 5.2) * (2.7 + spray.power * 1.8);
        ctx.fillStyle = `rgba(240,249,255,${alpha * (0.34 + noise * 0.5)})`;
        ctx.beginPath();
        ctx.ellipse(px, py, dot * 1.55, dot, theta * 0.45, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.72})`;
    ctx.lineWidth = 1.4 + spray.power * 1.1;
    ctx.beginPath();
    ctx.moveTo(-burstRadius * 0.62, 0);
    ctx.bezierCurveTo(-burstRadius * 0.22, -burstRadius * 0.24, burstRadius * 0.2, -burstRadius * 0.22, burstRadius * 0.62, 0);
    ctx.stroke();
    ctx.restore();
};

const drawSplashFlood = (ctx: CanvasRenderingContext2D, waterLevel: number, width: number, height: number, now: number) => {
    if (waterLevel <= 0.003) return;
    const floodHeight = Math.min(height * 0.72, height * waterLevel);
    const topY = height - floodHeight;
    const wave = Math.sin(now * 0.0028) * 7;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const water = ctx.createLinearGradient(0, topY, 0, height);
    water.addColorStop(0, "rgba(248,250,252,0.22)");
    water.addColorStop(0.3, "rgba(226,232,240,0.18)");
    water.addColorStop(1, "rgba(148,163,184,0.18)");
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.moveTo(0, topY + wave);
    for (let x = 0; x <= width + 48; x += 48) {
        const y = topY + Math.sin(now * 0.0026 + x * 0.026) * (3.5 + waterLevel * 8);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(240,249,255,0.36)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = 0; x <= width + 36; x += 36) {
        const y = topY + Math.sin(now * 0.0034 + x * 0.034) * (2.5 + waterLevel * 6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
};

const drawSplashAimMarker = (
    ctx: CanvasRenderingContext2D,
    _startX: number,
    _startY: number,
    aimX: number,
    aimY: number,
    power: number,
    now: number,
): void => {
    const pulse = Math.sin(now * 0.009) * 0.5 + 0.5;
    const radius = 22 + power * 10 + pulse * 2;
    const gap = radius * 0.45;
    const reach = radius * 1.42;

    ctx.save();
    ctx.translate(aimX, aimY);
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(255,255,255,0.34)";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "rgba(15,23,42,0.62)";
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(248,250,252,0.9)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(15,23,42,0.58)";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-reach, 0);
    ctx.lineTo(-gap, 0);
    ctx.moveTo(gap, 0);
    ctx.lineTo(reach, 0);
    ctx.moveTo(0, -reach);
    ctx.lineTo(0, -gap);
    ctx.moveTo(0, gap);
    ctx.lineTo(0, reach);
    ctx.stroke();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(248,250,252,0.92)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-reach, 0);
    ctx.lineTo(-gap, 0);
    ctx.moveTo(gap, 0);
    ctx.lineTo(reach, 0);
    ctx.moveTo(0, -reach);
    ctx.lineTo(0, -gap);
    ctx.moveTo(0, gap);
    ctx.lineTo(0, reach);
    ctx.stroke();
    ctx.fillStyle = "rgba(248,250,252,0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, 2.2 + power * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawScreenHitPulse = (ctx: CanvasRenderingContext2D, pulse: ScreenHitPulse, now: number): void => {
    const age = now - pulse.createdAt;
    const t = Math.max(0, Math.min(1, age / pulse.life));
    const fade = 1 - t;
    const pop = easeOutCubic(Math.min(1, t / 0.55));
    const radius = (pulse.source === "hammer" ? 22 : pulse.source === "laser" ? 17 : 19) + pop * (pulse.source === "splash" ? 38 : 26);
    const color = pulse.source === "splash"
        ? "248,250,252"
        : pulse.source === "laser"
            ? "248,113,113"
            : pulse.source === "scatter"
                ? "226,232,240"
                : "255,255,255";

    ctx.save();
    ctx.translate(pulse.x, pulse.y);
    ctx.rotate(pulse.angle);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = fade;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `rgba(${color},${0.72 * fade})`;
    ctx.lineWidth = Math.max(1.2, 3.2 * fade);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * (pulse.source === "splash" ? 0.46 : 0.7), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${color},${0.44 * fade})`;
    ctx.lineWidth = Math.max(0.8, 2.2 * fade);
    for (let mark = -1; mark <= 1; mark += 2) {
        ctx.beginPath();
        ctx.moveTo(mark * radius * 0.36, 0);
        ctx.lineTo(mark * radius * (0.86 + pop * 0.18), 0);
        ctx.stroke();
    }
    ctx.fillStyle = `rgba(255,255,255,${0.68 * fade})`;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.4, 3.8 * fade), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawSplashRig = (
    ctx: CanvasRenderingContext2D,
    splash: SplashState,
    rig: SplashRigState,
    pointer: { x: number; y: number },
    width: number,
    height: number,
    now: number,
    sprites?: PlaygroundSprites,
    splashVideo?: HTMLVideoElement | null,
) => {
    const crane = getSplashCraneLayout(width);
    const targetX = splash.active ? splash.x : pointer.x > -100 ? pointer.x : width * 0.5;
    const targetY = splash.active ? splash.y : pointer.y > -100 ? pointer.y : height * 0.5;
    const angle = splash.active ? splash.angle : 0;
    const pose = getSplashPistolPose(targetX, targetY, angle, splash.pressure || 0.28);
    const poseAngle = pose.angle;
    const pistolWidth = pose.width;
    const pistolHeight = pose.height;
    const hoseSocket = pose.hoseSocket;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (rig.hoseConnected) {
        const distance = Math.hypot(hoseSocket.x - crane.connectorX, hoseSocket.y - crane.connectorY);
        const sag = Math.min(150, Math.max(30, distance * 0.13));
        const startHandleX = crane.connectorX - 34;
        const startHandleY = crane.connectorY + sag * 0.7;
        const endHandleX = hoseSocket.x - Math.cos(poseAngle) * 84;
        const endHandleY = hoseSocket.y - Math.sin(poseAngle) * 84 + sag * 0.18;
        ctx.strokeStyle = "rgba(42,32,22,0.66)";
        ctx.lineWidth = 8.5;
        ctx.beginPath();
        ctx.moveTo(crane.connectorX, crane.connectorY);
        ctx.bezierCurveTo(startHandleX, startHandleY, endHandleX, endHandleY, hoseSocket.x, hoseSocket.y);
        ctx.stroke();
        ctx.strokeStyle = "rgba(194,151,84,0.78)";
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(crane.connectorX, crane.connectorY);
        ctx.bezierCurveTo(startHandleX, startHandleY, endHandleX, endHandleY, hoseSocket.x, hoseSocket.y);
        ctx.stroke();
    } else {
        const pulse = Math.sin(now * 0.012) * 0.5 + 0.5;
        ctx.strokeStyle = "rgba(42,32,22,0.62)";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(crane.connectorX, crane.connectorY);
        ctx.bezierCurveTo(crane.connectorX + 30, crane.connectorY + 56, crane.connectorX + 86, crane.connectorY + 96, crane.connectorX + 146, crane.connectorY + 76);
        ctx.stroke();
        ctx.fillStyle = "rgba(194,151,84,0.9)";
        ctx.beginPath();
        ctx.ellipse(crane.connectorX + 150, crane.connectorY + 76, 13, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();
        if (rig.faucetOn) {
            ctx.globalCompositeOperation = "screen";
            for (let jet = 0; jet < 4; jet += 1) {
                const xOffset = (jet - 3) * 3.4 + Math.sin(now * 0.006 + jet) * 2.2;
                ctx.strokeStyle = `rgba(248,250,252,${0.28 + pulse * 0.18})`;
                ctx.lineWidth = 3.4 + jet * 0.18;
                ctx.beginPath();
                ctx.moveTo(crane.nozzleX + xOffset, crane.nozzleY);
                ctx.bezierCurveTo(
                    crane.nozzleX + xOffset + Math.sin(now * 0.004 + jet) * 9,
                    height * 0.32,
                    crane.nozzleX + xOffset * 1.6,
                    height * 0.68,
                    crane.nozzleX + xOffset * 2.2,
                    height - 8,
                );
                ctx.stroke();
            }
            ctx.globalCompositeOperation = "source-over";
        }
    }

    if (rig.faucetOn) {
        const pulse = Math.sin(now * 0.012) * 0.5 + 0.5;
        ctx.globalCompositeOperation = "screen";
        const landingY = height - Math.max(10, height * rig.waterLevel);
        const streamHeight = Math.max(120, landingY - crane.nozzleY + 34);
        const streamWidth = Math.max(92, Math.min(168, streamHeight * 0.22));
        const streamDrawn = drawSplashVideoFrame(
            ctx,
            splashVideo,
            crane.nozzleX - streamWidth * 0.5 + Math.sin(now * 0.006) * 5,
            crane.nozzleY - 10,
            streamWidth,
            streamHeight,
            0.82 + pulse * 0.12,
        );
        if (!streamDrawn) {
            for (let jet = 0; jet < 4; jet += 1) {
                const xOffset = (jet - 1.5) * 2.8 + Math.sin(now * 0.005 + jet) * 1.6;
                ctx.strokeStyle = `rgba(224,242,254,${0.32 + pulse * 0.22})`;
                ctx.lineWidth = 2.4 + jet * 0.14;
                ctx.beginPath();
                ctx.moveTo(crane.nozzleX + xOffset, crane.nozzleY);
                ctx.bezierCurveTo(
                    crane.nozzleX + xOffset + Math.sin(now * 0.003 + jet) * 4,
                    crane.nozzleY + (landingY - crane.nozzleY) * 0.34,
                    crane.nozzleX + xOffset * 1.25,
                    crane.nozzleY + (landingY - crane.nozzleY) * 0.72,
                    crane.nozzleX + xOffset * 1.5,
                    landingY,
                );
                ctx.stroke();
            }
        }
        const splashY = Math.min(height - 8, landingY + 3);
        const splashWidth = Math.max(190, Math.min(380, width * 0.18 + rig.waterLevel * 90));
        const splashHeight = splashWidth * 0.55;
        const splashDrawn = drawSplashVideoFrame(
            ctx,
            splashVideo,
            crane.nozzleX - splashWidth * 0.5,
            splashY - splashHeight * 0.52,
            splashWidth,
            splashHeight,
            0.56 + pulse * 0.12,
        );
        if (!splashDrawn) {
            ctx.strokeStyle = `rgba(240,249,255,${0.28 + pulse * 0.16})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(crane.nozzleX, splashY, 16 + pulse * 6, 4 + pulse * 2, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
    }

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.36)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 10;
    const craneDrawn = drawChromaImage(ctx, sprites?.splashCrane, crane.x, crane.y, crane.width, crane.height);
    ctx.restore();
    if (!craneDrawn) {
        const chrome = ctx.createLinearGradient(crane.x, crane.y, crane.x + crane.width, crane.y + crane.height);
        chrome.addColorStop(0, "#64748b");
        chrome.addColorStop(0.24, "#f8fafc");
        chrome.addColorStop(0.48, "#94a3b8");
        chrome.addColorStop(0.72, "#334155");
        chrome.addColorStop(1, "#e2e8f0");
        ctx.strokeStyle = chrome;
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(crane.nozzleX, crane.nozzleY);
        ctx.lineTo(crane.connectorX, crane.connectorY);
        ctx.stroke();
    }

    ctx.fillStyle = rig.faucetOn ? "rgba(248,250,252,0.86)" : "rgba(239,68,68,0.92)";
    ctx.beginPath();
    ctx.roundRect(crane.x + crane.width * 0.68, crane.y + crane.height * 0.48, 34, 8, 4);
    ctx.fill();

    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.rotate(poseAngle);
    ctx.shadowColor = "rgba(0,0,0,0.42)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    const pistolDrawn = drawChromaImage(ctx, sprites?.splashPistol, -pistolWidth * 0.86, -pistolHeight * 0.38, pistolWidth, pistolHeight);
    if (!pistolDrawn) {
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "rgba(15,23,42,0.78)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-128, -16, 72, 30, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#111827";
        ctx.beginPath();
        ctx.roundRect(-114, 10, 19, 44, 6);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(-61, -7, 42, 11, 4);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = rig.hoseConnected ? "#22c55e" : "#ef4444";
    ctx.beginPath();
    const couplingX = pistolWidth * SPLASH_PISTOL_HOSE_X;
    const couplingY = pistolHeight * SPLASH_PISTOL_HOSE_Y;
    const coupling = ctx.createLinearGradient(couplingX - 10, couplingY - 4, couplingX + 10, couplingY + 4);
    coupling.addColorStop(0, "#574127");
    coupling.addColorStop(0.32, "#d8b46c");
    coupling.addColorStop(0.68, "#7c5a2d");
    coupling.addColorStop(1, "#f4d58b");
    ctx.fillStyle = coupling;
    ctx.beginPath();
    ctx.ellipse(couplingX, couplingY, 9, 4.6, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
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
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const hammerAimRef = useRef<HTMLDivElement | null>(null);
    const backgroundImageRef = useRef<HTMLImageElement | null>(null);
    const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const effectsCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const lastDragImpactRef = useRef({ x: -999, y: -999, at: 0 });
    const lastImpactRef = useRef({ x: -999, y: -999, at: 0, tool: "hammer" as PlaygroundToolId });
    const lastLaserCutRef = useRef({ x: -999, y: -999, angle: -0.62 });
    const lastLetterKnockRef = useRef({ splash: 0, hammer: 0, scatter: 0, laser: 0 });
    const lastSoundAtRef = useRef(0);
    const lastLaserSoundAtRef = useRef(0);
    const lastDragonHeatSoundAtRef = useRef(0);
    const lastImpactCountUpdateRef = useRef(0);
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
            const dragonSprite = spritesRef.current.dragon;
            if (dragonSprite) warmDragonHeadFrames(dragonSprite);
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
        const workingCtx = workingCanvas.getContext("2d");
        workingCtx?.drawImage(image, 0, 0, workingCanvas.width, workingCanvas.height);
        workingCanvasRef.current = workingCanvas;
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
        }

        const targetWidth = Math.max(1, Math.round(width * dpr));
        const targetHeight = Math.max(1, Math.round(height * dpr));
        const resized = effectsCanvas.width !== targetWidth || effectsCanvas.height !== targetHeight;
        if (resized) {
            effectsCanvas.width = targetWidth;
            effectsCanvas.height = targetHeight;
        }

        const effectsCtx = effectsCanvas.getContext("2d");
        if (!effectsCtx) return null;

        effectsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (resized && impactsRef.current.length > 0) {
            effectsCtx.clearRect(0, 0, width, height);
            impactsRef.current.forEach((impact) => drawImpact(effectsCtx, impact));
        }

        return effectsCtx;
    }, []);

    const clearEffects = useCallback(() => {
        const effectsCanvas = effectsCanvasRef.current;
        const effectsCtx = effectsCanvas?.getContext("2d");
        if (!effectsCanvas || !effectsCtx) return;
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
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
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
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
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
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
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
        particlesRef.current = [
            ...particlesRef.current,
            ...burstParticles,
        ].slice(-MAX_PARTICLES);

        setImpactCount((count) => count + 1);
        if (!mutedRef.current && now - lastSoundAtRef.current > 42) {
            lastSoundAtRef.current = now;
            playToolSound("throw");
        }
    }, []);

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
        const ctx = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !ctx) return;

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
                particlesRef.current = [
                    ...particlesRef.current,
                    ...createParticlesForTool("splash", leakX, leakY, undefined, Math.PI / 2),
                ].slice(-MAX_PARTICLES);
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
            particlesRef.current = [
                ...particlesRef.current,
                ...laserBurnedCreatures.flatMap((creature) => createParticlesForTool("burn", creature.x, creature.y, undefined, Math.atan2(creature.vy, creature.vx || 0.001))),
            ].slice(-MAX_PARTICLES);
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
            const heavySpin = easeOutCubic(heavyFlightT);
            const heavyLandingBounce = heavyActive && heavyFlightT > 0.9 ? Math.sin(((heavyFlightT - 0.9) / 0.1) * Math.PI) : 0;
            const holdPress = isLaserTool && (laserCut.active || drillActive) ? 1 : 0;
            const hammerElapsed = frameNow - hammerSwingRef.current;
            const hammerT = hammerElapsed < HAMMER_SWING_MS ? Math.min(1, hammerElapsed / HAMMER_SWING_MS) : 1;
            const hammerWindup = hammerT < HAMMER_WINDUP_T ? easeOutCubic(hammerT / HAMMER_WINDUP_T) : 1;
            const hammerAttack = hammerT < HAMMER_WINDUP_T
                ? 0
                : hammerT < HAMMER_IMPACT_T
                    ? easeOutCubic((hammerT - HAMMER_WINDUP_T) / (HAMMER_IMPACT_T - HAMMER_WINDUP_T))
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
                    ? HAMMER_IDLE_ROTATION + ((HAMMER_IMPACT_ROTATION + 360) - HAMMER_IDLE_ROTATION) * heavySpin + heavyLandingBounce * 7
                    : hammerSwingRotation
                : 0;
            const finalRotation = isLaserTool ? bladeAngle * (180 / Math.PI) + 90 + drillTwist : hammerRotation;
            const finalScale = isLaserTool
                ? 1 + holdDepth * 0.04 + (drillActive ? Math.sin(Math.min(1, drillT) * Math.PI) * 0.08 : 0)
                : isHammerTool ? (heavyActive ? 1.02 + heavyLandingBounce * 0.05 : 1) : 1;
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
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
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

        const border = workingCtx.getImageData(Math.floor(sourceX), Math.floor(sourceY), Math.ceil(chipWidth), Math.ceil(chipHeight)).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        const bw = Math.ceil(chipWidth);
        const bh = Math.ceil(chipHeight);
        for (let py = 0; py < bh; py += 1) {
            for (let px = 0; px < bw; px += 1) {
                if (px > 0 && py > 0 && px < bw - 1 && py < bh - 1) continue;
                const offset = (py * bw + px) * 4;
                r += border[offset];
                g += border[offset + 1];
                b += border[offset + 2];
                count += 1;
            }
        }
        const base = {
            r: Math.round(r / Math.max(1, count)),
            g: Math.round(g / Math.max(1, count)),
            b: Math.round(b / Math.max(1, count)),
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

    const extractEntityAtImpact = useCallback((x: number, y: number, radius: number, patchBackground = true, spawnEntity = true, initVx?: number, initVy?: number, shakeLife?: number, cleanPatch = false, detailOnly = false): string | undefined => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
        if (!surface || !workingCanvas || !workingCtx) return undefined;

        const rect = getBackgroundDrawRect(surface.clientWidth, surface.clientHeight, workingCanvas.width, workingCanvas.height);
        const imageX = (x - rect.x) / rect.scale;
        const imageY = (y - rect.y) / rect.scale;
        if (imageX < 0 || imageY < 0 || imageX >= workingCanvas.width || imageY >= workingCanvas.height) return undefined;

        const cropRadius = Math.max(18, Math.min(cleanPatch ? 132 : 96, radius / rect.scale));
        const cropX = Math.max(0, Math.floor(imageX - cropRadius));
        const cropY = Math.max(0, Math.floor(imageY - cropRadius));
        const cropRight = Math.min(workingCanvas.width, Math.ceil(imageX + cropRadius));
        const cropBottom = Math.min(workingCanvas.height, Math.ceil(imageY + cropRadius));
        const cropWidth = cropRight - cropX;
        const cropHeight = cropBottom - cropY;
        if (cropWidth < 6 || cropHeight < 6) return undefined;

        const imageData = workingCtx.getImageData(cropX, cropY, cropWidth, cropHeight);
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
                const dist = colorDistance(r, g, b, base);
                const localSaturation = saturation(r, g, b);
                const lumDelta = Math.abs(luminance(r, g, b) - baseLum);
                const leftOffset = (py * cropWidth + Math.max(0, px - 1)) * 4;
                const rightOffset = (py * cropWidth + Math.min(cropWidth - 1, px + 1)) * 4;
                const upOffset = (Math.max(0, py - 1) * cropWidth + px) * 4;
                const downOffset = (Math.min(cropHeight - 1, py + 1) * cropWidth + px) * 4;
                const edge = Math.max(
                    Math.abs(luminance(data[leftOffset], data[leftOffset + 1], data[leftOffset + 2]) - luminance(data[rightOffset], data[rightOffset + 1], data[rightOffset + 2])),
                    Math.abs(luminance(data[upOffset], data[upOffset + 1], data[upOffset + 2]) - luminance(data[downOffset], data[downOffset + 1], data[downOffset + 2])),
                );
                const centerFalloff = Math.max(0, 1 - (Math.hypot(px - centerX, py - centerY) / cropRadius));
                const threshold = 34 + (1 - centerFalloff) * 22;
                const strongPixel = dist > threshold || lumDelta > threshold * 0.82 || (localSaturation > 46 && dist > 23);
                const detailPixel = strongPixel && (edge > 12 || centerFalloff > 0.56 || dist > threshold + 18);
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
            ? workingCtx.getImageData(cropX + minX, cropY + minY, entityImageWidth, entityImageHeight)
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
        const count = source === "splash" ? 2 : source === "hammer" ? 5 : source === "scatter" ? 4 : 3;
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
                shakeLife: source === "hammer" ? 12 : 0,
                detailOnly: true,
            }, index * 18);
        }
    }, [addScreenHitPulse, enqueueHammerExtraction, extractEntityAtImpact, spawnDirectScreenChip]);

    const resetSplashArea = useCallback((x: number, y: number, angle: number, pressure = 0.5): void => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const background = backgroundImageRef.current;
        const workingCtx = workingCanvas?.getContext("2d");
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
        const effectsCtx = effectsCanvas?.getContext("2d");
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
            setImpactCount((count) => Math.max(0, count - removedCount));
        }
    }, []);

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
            particlesRef.current = [
                ...particlesRef.current,
                ...createParticlesForTool("splash", x, y, sample, angle).slice(0, 2),
            ].slice(-MAX_PARTICLES);
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
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
        if (!surface || !workingCanvas || !workingCtx) return undefined;
        clearPendingHammerShockwaves();

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
                { dx: -36, dy: -20, shake: 14, delay: 24 },
                { dx: 36, dy: -20, shake: 14, delay: 42 },
                { dx: -20, dy: 36, shake: 18, delay: 64 },
                { dx: 20, dy: 36, shake: 18, delay: 82 },
                { dx: -72, dy: -12, shake: 28, delay: 104 },
                { dx: 72, dy: 12, shake: 28, delay: 122 },
                { dx: -12, dy: -68, shake: 24, delay: 144 },
                { dx: 12, dy: 68, shake: 24, delay: 162 },
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
                { dx: -30, dy: -30, shake: 0, delay: 18 },
                { dx: 30, dy: -30, shake: 0, delay: 34 },
                { dx: -30, dy: 30, shake: 0, delay: 52 },
                { dx: 30, dy: 30, shake: 0, delay: 68 },
                { dx: -76, dy: -22, shake: 20, delay: 84 },
                { dx: 76, dy: 22, shake: 20, delay: 102 },
                { dx: -22, dy: -76, shake: 24, delay: 120 },
                { dx: 22, dy: 76, shake: 24, delay: 138 },
                { dx: -110, dy: -46, shake: 42, delay: 154 },
                { dx: 110, dy: 46, shake: 42, delay: 172 },
                { dx: -46, dy: -110, shake: 38, delay: 190 },
                { dx: 46, dy: 110, shake: 38, delay: 208 },
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
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
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
        extractEntityAtImpact(x, y, radius * (heavy ? 0.62 : 0.38), true, true, initVx, initVy, 0, false, true);
        knockScreenLettersLoose(x, y, angle, heavy ? 1.55 : 0.9, "scatter");

        return `rgb(${sample[0]},${sample[1]},${sample[2]})`;
    }, [extractEntityAtImpact, knockScreenLettersLoose]);

    const applyBurnTrace = useCallback((x: number, y: number, angle: number, radius: number): string | undefined => {
        const surface = canvasRef.current;
        const workingCanvas = workingCanvasRef.current;
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
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
        const workingCtx = workingCanvas?.getContext("2d", { willReadFrequently: true });
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
            particlesRef.current = [
                ...particlesRef.current,
                ...createParticlesForTool("burn", hitTick.x, hitTick.y, undefined, angle),
            ].slice(-MAX_PARTICLES);
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

        particlesRef.current = [
            ...particlesRef.current,
            ...createParticlesForTool("burn", x, y, undefined, angle),
        ].slice(-MAX_PARTICLES);

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
                            particlesRef.current = [
                                ...particlesRef.current,
                                ...createParticlesForTool(currentTool, x, y, undefined, direction),
                            ].slice(-MAX_PARTICLES);
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
                            particlesRef.current = [
                                ...particlesRef.current,
                                ...createParticlesForTool(currentTool, x, y, undefined, direction),
                            ].slice(-MAX_PARTICLES);
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
                        particlesRef.current = [
                            ...particlesRef.current,
                            ...createParticlesForTool(currentTool, x, y, undefined, direction),
                        ].slice(-MAX_PARTICLES);
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
                        particlesRef.current = [
                            ...particlesRef.current,
                            ...createParticlesForTool(currentTool, x, y, undefined, direction),
                        ].slice(-MAX_PARTICLES);
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
                particlesRef.current = [
                    ...particlesRef.current,
                    ...createParticlesForTool(currentTool, x, y, undefined, direction),
                    ...createParticlesForTool("scatter", hitCreature.x, hitCreature.y, undefined, direction),
                ].slice(-MAX_PARTICLES);
                return true;
            }
            creaturesRef.current = creaturesRef.current.filter((_, index) => index !== hitIndex);
            particlesRef.current = [
                ...particlesRef.current,
                ...createParticlesForTool(currentTool, x, y, undefined, direction),
                ...createParticlesForTool("scatter", hitCreature.x, hitCreature.y, undefined, direction),
            ].slice(-MAX_PARTICLES);
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
            setImpactCount((count) => count + 1);
        }
    }, [emitLaserSparks, extractEntityAtImpact, stampLaserDrillImpact, stampLaserSeam]);

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
        particlesRef.current = [
            ...particlesRef.current,
            ...createParticlesForTool(currentTool, hitTick.x, hitTick.y, undefined, direction),
            ...createParticlesForTool("glyph", hitTick.x, hitTick.y),
        ].slice(-MAX_PARTICLES);
        if (performance.now() - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
            lastImpactCountUpdateRef.current = performance.now();
            setImpactCount((count) => Math.max(0, count - 1));
        }
        return true;
    }, []);

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
            particlesRef.current = [
                ...particlesRef.current,
                ...createParticlesForTool("hammer", x, y),
            ].slice(-MAX_PARTICLES);
            if (now - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
                lastImpactCountUpdateRef.current = now;
                setImpactCount((count) => count + TICKS_PER_CLICK);
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
            const flame: ActiveFlame = {
                id: `flame-${impact.id}`,
                x,
                y: y + impact.radius * 0.05,
                radius: impact.radius * (isHugeFireball ? 1.14 : 1),
                rotation: impact.rotation,
                seed: impact.seed,
                createdAt: now,
                life: isHugeFireball ? 2600 : 1900,
            };
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
                    life: 4600,
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
        particlesRef.current = [
            ...particlesRef.current,
            ...createParticlesForTool(currentTool, x, y, sampledColor ?? extractedColor, currentTool === "scatter" || currentTool === "burn" ? impact.rotation : undefined),
            ...(options.heavyHammer || hitTick || hitPiglet ? createParticlesForTool(currentTool, x, y, sampledColor ?? extractedColor) : []),
        ].slice(-MAX_PARTICLES);
        if (now - lastImpactCountUpdateRef.current > IMPACT_COUNT_UPDATE_MS) {
            lastImpactCountUpdateRef.current = now;
            if (!shouldCacheImpactOverlay) setImpactCount((count) => count + 1);
            else setImpactCount(impactsRef.current.length);
        }
        if (!playedDragonHeatSound && !mutedRef.current && now - lastSoundAtRef.current > 42) {
            lastSoundAtRef.current = now;
            playToolSound(currentTool);
        }
    }, [applyBoltImpact, applyBurnTrace, applyHammerImpactToScreen, cacheImpact, clearEffects, clearPendingHammerImpacts, extractEntityAtImpact, hitCreatureAt, hitHammerPigletAt, hitScreenTickAt, spawnScreenTicks, trackHammerImpactTimeout]);

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
        setImpactCount(0);
    }, [clearEffects, payload, prepareWorkingCanvas, restoreDefaultCreatures]);

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
        setImpactCount(0);
        loadSourceImage(source);
    }, [clearEffects, loadSourceImage, payload, restoreDefaultCreatures]);

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
                false,
                DRAGON_ROAR_ANIMATION_MS,
            ),
        ];
        playDragonHeatSelectSound();
    }, [clearSplashToolState, payload]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                window.screenPlaygroundAPI?.close();
                return;
            }
            if (event.key.toLowerCase() === "r") {
                reset();
                return;
            }
            const selected = TOOLS.find((candidate) => candidate.hotkey === event.key);
            if (selected) selectTool(selected.id);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [reset, selectTool]);

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
                <button type="button" className="playground-btn utility" onClick={() => window.screenPlaygroundAPI?.close()}><X size={14} /> Close</button>
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
        </div>
    );
};

createRoot(document.getElementById("root")!).render(<ScreenPlayground />);
