import React from "react";
import { Creature, Impact, Particle, PlaygroundToolId, drawParticle } from "./engine";
import { SkeletonController } from "./SkeletonController";

// Constants from renderer.tsx
export const SPLASH_FISH_MIN_WATER_LEVEL = 0.13;
export const SPLASH_FISH_SHEET_COLS = 4;
export const SPLASH_FISH_SHEET_ROWS = 4;
export const SPLASH_FISH_FRAME_SEQUENCE = Array.from({ length: SPLASH_FISH_SHEET_COLS * SPLASH_FISH_SHEET_ROWS }, (_, index) => index);
export const SPLASH_FISH_FRAME_CROP_X = [
    [0.176, 0.08],
    [0.125, 0.101],
    [0.105, 0.125],
    [0.082, 0.173],
];
export const SPLASH_FISH_FRAME_CROP_Y = [
    [0.275, 0.174],
    [0.264, 0.203],
    [0.223, 0.245],
    [0.191, 0.281],
];

export const HAMMER_PIGLET_SHEET_COLS = 4;
export const HAMMER_PIGLET_SHEET_ROWS = 3;
export const HAMMER_PIGLET_RUN_FRAMES = [0, 1, 2, 3, 4, 5, 8, 9, 10];
export const HAMMER_PIGLET_LOOK_FRAMES = [6, 7];
export const HAMMER_PIGLET_FRAME_CROPS: Array<[number, number, number, number]> = [
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

export const SLINGER_MAX_PULL = 172;
export const SLINGER_MIN_PULL_TO_LAUNCH = 14;
export const SLINGER_POWER_DEADZONE = 8;
export const SLINGER_SPRITE_SPLAT_LIFE_MULTIPLIER = 4;

export const HAMMER_CURSOR_WIDTH = 142;
export const HAMMER_CURSOR_HEIGHT = 248;
export const HAMMER_HEAD_CONTACT_X = 56;
export const HAMMER_HEAD_CONTACT_Y = 40;
export const HAMMER_HAND_PIVOT_X = 78;
export const HAMMER_HAND_PIVOT_Y = 214;
export const HAMMER_TARGET_OFFSET_X = 0;
export const HAMMER_TARGET_OFFSET_Y = 0;
export const HAMMER_IDLE_ROTATION = -32;
export const HAMMER_WINDUP_ROTATION = -96;
export const HAMMER_IMPACT_ROTATION = 16;
export const HAMMER_CONTACT_ROTATION = -38;
export const HAMMER_SWING_MS = 240;
export const HAMMER_WINDUP_T = 0.18;
export const HAMMER_IMPACT_T = 0.44;
export const HAMMER_CONTACT_PROGRESS = 1 - Math.cbrt(1 - ((HAMMER_CONTACT_ROTATION - HAMMER_WINDUP_ROTATION) / (HAMMER_IMPACT_ROTATION - HAMMER_WINDUP_ROTATION)));
export const HAMMER_CONTACT_T = HAMMER_WINDUP_T + (HAMMER_IMPACT_T - HAMMER_WINDUP_T) * HAMMER_CONTACT_PROGRESS;
export const HAMMER_IMPACT_DELAY_MS = HAMMER_SWING_MS * HAMMER_CONTACT_T;

export const HEAVY_HAMMER_SWING_MS = 540;
export const HEAVY_HAMMER_IMPACT_DELAY_MS = 420;
export const HEAVY_HAMMER_IMPACT_SCALE = 2.24;

export const SLINGER_PROJECTILE_DEPTH = 250;
export const SLINGER_GRAVITY = 0.00072;
export const TOMATO_CONTACT_MS = 110;
export const TOMATO_BURST_MS = 240;
export const TOMATO_SETTLE_MS = 520;
export const WATERMELON_CONTACT_MS = 125;
export const WATERMELON_BURST_MS = 280;
export const WATERMELON_SETTLE_MS = 620;

export const DRAGON_MOUTH_X = 0.22;
export const DRAGON_MOUTH_Y = 0.52;
export const DRAGON_DOCK_VISIBLE_RATIO = 0.68;
export const DRAGON_SHEET_FRAMES = 16;
export const DRAGON_BREATH_FLAME_SHEET_FRAMES = 18;
export const DRAGON_IMPACT_FLAME_SHEET_FRAMES = 12;
export const EMBER_PARTICLE_SHEET_FRAMES = 12;
export const DRAGON_FRAME_ASPECT = 1;
export const DRAGON_RENDER_DPR_CAP = 1.6;

export const ARROW_FLIGHT_MS = 320;
export const ARROW_IMPACT_MS = 540;
export const ARROW_FADE_MS = 0;
export const ARROW_LIFE_MS = 120000;
export const HEAVY_ARROW_LIFE_MS = 120000;
export const HEAVY_ARROW_IMPACT_SCALE = 3.05;

export const SPLASH_EMIT_MS = 48;
export const SPLASH_FAUCET_EMIT_MS = 150;
export const SPLASH_HOLD_ARM_MS = 430;
export const SPLASH_OVERFLOW_AFTER_MS = 2400;
export const SPLASH_PISTOL_OFFSET_X = -232;
export const SPLASH_PISTOL_OFFSET_Y = 76;
export const SPLASH_PISTOL_NOZZLE_X = 0.095;
export const SPLASH_PISTOL_NOZZLE_Y = -0.2;
export const SPLASH_PISTOL_HOSE_X = -0.785;
export const SPLASH_PISTOL_HOSE_Y = 0.54;

export const TICK_TRACE_STAMP_MS = 260;
export const TICK_SPRITE_FORWARD_ANGLE = 2.3;

// Shared Types
export type ThrowFoodId = "tomato" | "egg" | "watermelon" | "strawberry";

export type FruitProfile = {
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

export const THROW_FOODS: FruitProfile[] = [
    { id: "watermelon", label: "Watermelon", stain: "rgba(127,29,29,0.38)", pulp: "#fb7185", skin: "#166534", seed: "#111827", mass: 1.42, radius: 36, splatScale: 1.72, slideSpeed: [0.0018, 0.0032], burst: 32 },
    { id: "egg", label: "Egg", stain: "rgba(254,243,199,0.22)", pulp: "#facc15", skin: "#f8fafc", seed: "#f59e0b", mass: 0.72, radius: 19, splatScale: 1.08, slideSpeed: [0.0042, 0.0068], burst: 9 },
    { id: "strawberry", label: "Strawberry", stain: "rgba(159,18,57,0.28)", pulp: "#e11d48", skin: "#7f1d1d", seed: "#fef08a", mass: 0.96, radius: 20, splatScale: 0.88, slideSpeed: [0.0022, 0.0038], burst: 12 },
    { id: "tomato", label: "Tomato", stain: "rgba(153,27,27,0.34)", pulp: "#ef4444", skin: "#991b1b", seed: "#fde68a", mass: 0.88, radius: 24, splatScale: 1.62, slideSpeed: [0.0038, 0.0062], burst: 26 },
];

export type PlaygroundSpriteKey = "arrow" | "burnScorch" | "dragon" | "emberParticle" | "fishSheet" | "flame" | "glassCrack" | "impactFlame" | "hammer" | "pigletRunSheet" | "skeleton" | "spider" | "tick" | "tickTrace" | "splashPistol" | "splashCrane" | "eggSheet" | "slingerFrame" | "strawberrySheet" | "tomatoSheet" | "watermelonSheet";
export type PlaygroundSprites = Partial<Record<PlaygroundSpriteKey, HTMLImageElement>>;

export type ActiveWeb = {
    id: string;
    x: number;
    y: number;
    radius: number;
    rotation: number;
    seed: number;
    createdAt: number;
    life: number;
};

export type ActiveSpiderLift = {
    id: string;
    creatureId: string;
    x: number;
    startY: number;
    targetY: number;
    createdAt: number;
    duration: number;
    seed: number;
};

export type SplashState = {
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

export type SplashRigState = {
    hoseConnected: boolean;
    faucetOn: boolean;
    waterLevel: number;
    lastLeakAt: number;
};

export type FruitSplat = {
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

export type FruitProjectile = {
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

export type SlingerState = {
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

export type ActiveFlame = {
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

export type ActiveDragonBreath = {
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

export type DragonHeadLayout = Pick<ActiveDragonBreath, "x" | "y" | "width" | "height" | "mouthX" | "mouthY" | "mirror">;

export type ActiveBurnResidue = {
    id: string;
    x: number;
    y: number;
    radius: number;
    rotation: number;
    seed: number;
    createdAt: number;
    life: number;
};

export type ActiveWaterFish = {
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

export type ActiveHammerPiglet = {
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

export type ScreenHitPulse = {
    id: string;
    x: number;
    y: number;
    angle: number;
    source: "splash" | "hammer" | "scatter" | "laser";
    createdAt: number;
    life: number;
};

export type ActiveArrow = {
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

export type ScreenTick = {
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

export type SkeletonShard = {
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

export type DyingSkeleton = {
    id: string;
    controller: SkeletonController;
};

export type DyingSpider = {
    id: string;
    creature: Creature;
    hitX: number;
    hitY: number;
    shotAngle: number;
    startedAt: number;
};

export type ActiveLaserDrill = {
    id: string;
    x: number;
    y: number;
    angle: number;
    seed: number;
    createdAt: number;
    life: number;
};

export type ActiveSplashSpray = {
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

// Internal caches
const dragonSilhouetteCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
const dragonHeadCleanFrameCache = new WeakMap<HTMLImageElement, Map<number, HTMLCanvasElement>>();
const chromaCanvasCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
const fishSheetCanvasCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
const splashVideoFrameCanvas = document.createElement("canvas");
let splashVideoFrameCacheKey = "";
let splashVideoFrameCacheTime = -1;

// Drawing Helpers Implementation
export const closeAlphaMask = (
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

export const traceRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void => {
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

export const drawReferenceSpider = (ctx: CanvasRenderingContext2D, creature: Creature, now: number, sprite: HTMLImageElement): void => {
    const size = creature.size * (creature.mergeScale ?? 1);
    const speed = Math.hypot(creature.vx, creature.vy);
    const angle = creature.heading ?? (speed > 0.05 ? Math.atan2(creature.vy, creature.vx) : creature.phase);
    
    const isMoving = speed > 0.1;
    const stride = isMoving 
        ? now * (0.003 + Math.min(0.018, speed * 0.012)) + creature.seed 
        : creature.seed;
        
    const moveScale = isMoving ? 1 : 0;
    const lift = Math.sin(stride * 1.35) * size * 0.03 * moveScale;
    const lateral = Math.sin(stride * 2.05 + creature.seed) * size * (0.012 + speed * 0.01) * moveScale;
    const twitch = (Math.sin(stride * 1.62) + Math.sin(stride * 0.58 + creature.seed)) * 0.022 * moveScale;
    const react = Math.max(0, creature.bumpReact ?? 0) / 34;
    const height = size * (3.25 + react * 0.18);

    const isWalkSheet = sprite.naturalWidth > sprite.naturalHeight * 2;
    if (isWalkSheet) {
        const frameCount = Math.round(sprite.naturalWidth / sprite.naturalHeight) || 15;
        const sourceWidth = sprite.naturalWidth / frameCount;
        const sourceHeight = sprite.naturalHeight;
        const spriteWidth = size * 3.4;
        const spriteHeight = spriteWidth * (sourceHeight / sourceWidth);
        const walkProgress = ((((stride % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * frameCount;
        const frameIndex = Math.floor(walkProgress) % frameCount;

        ctx.save();
        ctx.translate(creature.x + lateral, creature.y + lift);
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

export const drawSpider = (ctx: CanvasRenderingContext2D, creature: Creature, now: number, sprite?: HTMLImageElement): void => {
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

export const drawSpiderWeb = (ctx: CanvasRenderingContext2D, web: ActiveWeb, now: number): void => {
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

export const drawSpiderLiftLine = (ctx: CanvasRenderingContext2D, lift: ActiveSpiderLift, spiderX: number, spiderY: number, spiderSize: number, now: number): void => {
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

export const getChromaKeyedCanvas = (image: HTMLImageElement): HTMLCanvasElement => {
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

export const getFishSheetCanvas = (image: HTMLImageElement): HTMLCanvasElement => {
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

export const drawChromaImage = (
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

export const drawFishSpriteFrame = (
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

export const createWaterFish = (width: number, height: number, waterLevel: number, now: number, index = 0): ActiveWaterFish => {
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

export const updateWaterFish = (
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

export const scheduleNextHammerPigletSpawn = (now: number): number => (
    now + 14000 + Math.random() * 12000
);

export const createHammerPiglet = (width: number, height: number, now: number): ActiveHammerPiglet => {
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

export const updateHammerPiglet = (piglet: ActiveHammerPiglet, width: number, now: number, deltaMs: number): ActiveHammerPiglet | null => {
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

export const drawHammerPiglet = (
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

export const drawSplashVideoFrame = (
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

    const processingScale = 0.25;
    const drawWidth = Math.max(1, Math.round(width * processingScale));
    const drawHeight = Math.max(1, Math.round(height * processingScale));
    const frameKey = `${drawWidth}x${drawHeight}:${Math.floor(video.currentTime * 24)}`;
    if (frameKey === splashVideoFrameCacheKey) {
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

export const getSplashCraneLayout = (width: number) => {
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

export const rotateLocalPoint = (originX: number, originY: number, angle: number, localX: number, localY: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: originX + localX * cos - localY * sin,
        y: originY + localX * sin + localY * cos,
    };
};

export const getSplashPistolPose = (targetX: number, targetY: number, _angle: number, power = 0) => {
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

export const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
};

export const getBackgroundDrawRect = (surfaceWidth: number, surfaceHeight: number, imageWidth: number, imageHeight: number) => {
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

export const colorDistance = (r: number, g: number, b: number, base: { r: number; g: number; b: number }) => {
    const dr = r - base.r;
    const dg = g - base.g;
    const db = b - base.b;
    return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};

export const saturation = (r: number, g: number, b: number) => Math.max(r, g, b) - Math.min(r, g, b);
export const luminance = (r: number, g: number, b: number) => (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
export const smoothStep = (edge0: number, edge1: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(0.0001, edge1 - edge0)));
    return t * t * (3 - (2 * t));
};

export const clampValue = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export const easeOutCubic = (value: number) => 1 - ((1 - value) ** 3);

export const drawJaggedShape = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, vertices = 6, seed = 0.5): void => {
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

export const rotatePoint = (x: number, y: number, degrees: number) => {
    const radians = degrees * (Math.PI / 180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos,
    };
};

export const getHammerTopLeftForContact = (targetX: number, targetY: number, rotation: number, scale: number) => {
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

export const drawGlassPunctureDot = (
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

export const drawImpactGlassDepression = (
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

export const flameNoise = (seed: number, offset: number) => {
    const value = Math.sin((seed + offset) * 12.9898) * 43758.5453;
    return value - Math.floor(value);
};

export const clampSlingerPull = (anchorX: number, anchorY: number, pullX: number, pullY: number) => {
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

export const colorWithAlpha = (color: string, alpha: number): string => {
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

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerpAngle = (a: number, b: number, t: number): number => {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
};

export const foodStyle = (food: ThrowFoodId) => THROW_FOODS.find((item) => item.id === food) ?? THROW_FOODS[0];

export const SLINGER_FOOD_SHEET_FRAMES = 9;

export const getSlingerFoodSheet = (sprites: PlaygroundSprites | undefined, food: ThrowFoodId): HTMLImageElement | undefined => {
    if (food === "egg") return sprites?.eggSheet;
    if (food === "strawberry") return sprites?.strawberrySheet;
    if (food === "tomato") return sprites?.tomatoSheet;
    if (food === "watermelon") return sprites?.watermelonSheet;
    return undefined;
};

export const getSlingerFoodTimeline = (food: ThrowFoodId) => {
    if (food === "egg") return { contact: 78, burst: 160, settle: 330 };
    if (food === "strawberry") return { contact: 86, burst: 180, settle: 360 };
    if (food === "watermelon") return { contact: 96, burst: 210, settle: 420 };
    return { contact: 84, burst: 190, settle: 380 };
};

export const getSlingerSplatFrame = (food: ThrowFoodId, age: number): number => {
    if (food === "watermelon" || food === "tomato") return 8;

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

export const drawSlingerFoodFrame = (
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

    const isWatermelon = sheet.width === 2169;
    if (isWatermelon) {
        if (clampedFrame === 4) clampedFrame = 3;
        if (clampedFrame === 5) clampedFrame = 6;
    }
    const cropX = isWatermelon ? 20 : 0;

    const srcX = frameWidth * clampedFrame + cropX;
    const srcWidth = frameWidth - cropX * 2;

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

export const drawSlingerFoodObject = (
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

export const drawFoodObject = (ctx: CanvasRenderingContext2D, food: ThrowFoodId, radius: number, seed: number) => {
    const style = foodStyle(food);
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    
    ctx.shadowColor = "rgba(15,23,42,0.42)";
    ctx.shadowBlur = radius * 0.22;
    ctx.shadowOffsetY = radius * 0.12;

    if (food === "egg") {
        const eggGrad = ctx.createRadialGradient(-radius * 0.15, -radius * 0.2, 0, 0, 0, radius);
        eggGrad.addColorStop(0, "#ffffff");
        eggGrad.addColorStop(0.5, "#f1f5f9");
        eggGrad.addColorStop(1, "#cbd5e1");
        ctx.fillStyle = eggGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.78, radius * 0.98, -0.18, 0, Math.PI * 2);
        ctx.fill();
        
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
        } else {
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
        
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.beginPath();
        ctx.ellipse(-radius * 0.35, -radius * 0.3, radius * 0.26, radius * 0.16, -0.44, 0, Math.PI * 2);
        ctx.fill();
        
        if (food === "strawberry") {
            ctx.fillStyle = style.seed ?? "#fde68a";
            const detailCount = 18;
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
            
            ctx.fillStyle = "#14532d";
            ctx.beginPath();
            ctx.arc(0, stemY, radius * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
};

export const createFruitBurstParticles = (food: ThrowFoodId, x: number, y: number, angle: number, seed: number): Particle[] => {
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

export const drawTomatoGlassCracks = (ctx: CanvasRenderingContext2D, radius: number, seed: number, intensity: number) => {
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

export const drawTomatoSlice = (ctx: CanvasRenderingContext2D, radius: number, seed: number, burstT: number) => {
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

export const drawTomatoSplat = (ctx: CanvasRenderingContext2D, splat: FruitSplat, now: number) => {
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

export const drawWatermelonRindChunks = (ctx: CanvasRenderingContext2D, radius: number, seed: number, burstT: number) => {
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

export const drawWatermelonFlesh = (ctx: CanvasRenderingContext2D, radius: number, seed: number, burstT: number, settleT: number) => {
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

export const drawWatermelonSplat = (ctx: CanvasRenderingContext2D, splat: FruitSplat, now: number) => {
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

export const drawSplatShape = (ctx: CanvasRenderingContext2D, splat: FruitSplat) => {
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

export const drawFruitSplat = (ctx: CanvasRenderingContext2D, splat: FruitSplat, now: number, sprites?: PlaygroundSprites) => {
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

export const drawFruitProjectile = (ctx: CanvasRenderingContext2D, projectile: FruitProjectile, sprites?: PlaygroundSprites) => {
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

export const getSlingerShot = (
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

export const drawSlingerFrameSprite = (
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

export const drawSlinger = (ctx: CanvasRenderingContext2D, state: SlingerState, food: ThrowFoodId, now: number, fallbackX: number, fallbackY: number, sprites?: PlaygroundSprites) => {
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

export const drawSlingerSafely = (ctx: CanvasRenderingContext2D, state: SlingerState, food: ThrowFoodId, now: number, fallbackX: number, fallbackY: number, sprites?: PlaygroundSprites): void => {
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

export const getDockedDragonLayout = (surfaceWidth: number, surfaceHeight: number, focusY: number): DragonHeadLayout => {
    const drawHeight = clampValue(Math.min(surfaceHeight * 0.76, surfaceWidth * 0.62), 340, 660);
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

export const createDragonBreath = (
    targetX: number,
    targetY: number,
    radius: number,
    surfaceWidth: number,
    surfaceHeight: number,
    seed: number,
    now: number
): ActiveDragonBreath => {
    const layout = getDockedDragonLayout(surfaceWidth, surfaceHeight, targetY - clampValue(radius * 0.2, 4, 20));

    return {
        id: `dragon-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        targetX,
        targetY,
        ...layout,
        seed,
        createdAt: now,
        life: 1320,
    };
};

export const getDragonSilhouette = (sprite: HTMLImageElement): HTMLCanvasElement => {
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

export const isDragonNoseShadowArtifact = (
    frameIndex: number,
    x: number,
    y: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    frameWidth: number,
    frameHeight: number
): boolean => {
    if (alpha <= 8 || frameIndex < 1 || frameIndex > 9) return false;

    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const saturation = maxChannel - minChannel;
    const inNoseSideBlock = (
        x < frameWidth * 0.255 &&
        y > frameHeight * 0.205 &&
        y < frameHeight * 0.535 &&
        (x < frameWidth * 0.19 || y < frameHeight * 0.475)
    );
    if (!inNoseSideBlock) return false;

    const flatBlackBlock = maxChannel < 86;
    const flatGrayBlock = maxChannel < 152 && saturation < 18;
    const greenSmokeBlock = green > red + 34 && blue > red + 28 && maxChannel < 142;
    return flatBlackBlock || flatGrayBlock || greenSmokeBlock;
};

export const getCleanDragonHeadFrame = (
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
        const data = imageData.data;
        for (let y = 0; y < pixelHeight; y += 1) {
            for (let x = 0; x < pixelWidth; x += 1) {
                const offset = ((y * pixelWidth) + x) * 4;
                if (isDragonNoseShadowArtifact(
                    frameIndex,
                    x,
                    y,
                    data[offset],
                    data[offset + 1],
                    data[offset + 2],
                    data[offset + 3],
                    pixelWidth,
                    pixelHeight
                )) {
                    data[offset + 3] = 0;
                }
            }
        }
        cleanCtx.putImageData(imageData, 0, 0);
    } catch {
        cleanCtx.clearRect(0, 0, pixelWidth, pixelHeight);
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
    }

    frameCache.set(frameIndex, canvas);
    return canvas;
};

export const drawDragonHeadFrame = (
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
    const frameIndex = clampValue(Math.round(frame), 0, DRAGON_SHEET_FRAMES - 1);
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
    const cleanFrame = getCleanDragonHeadFrame(sprite, frameIndex, frameWidth, frameHeight);
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

export const drawDragonHeadSequence = (
    ctx: CanvasRenderingContext2D,
    layout: DragonHeadLayout,
    frame: number,
    alpha: number,
    now: number,
    seed: number,
    sprite?: HTMLImageElement,
    intensity = 0
): void => {
    const baseFrame = clampValue(Math.floor(frame), 0, DRAGON_SHEET_FRAMES - 1);
    const nextFrame = clampValue(baseFrame + 1, 0, DRAGON_SHEET_FRAMES - 1);
    const mix = clampValue(frame - baseFrame, 0, 1);
    drawDragonHeadFrame(ctx, layout, baseFrame, alpha * (1 - mix), now, seed, sprite, intensity);
    if (mix > 0.001 && nextFrame !== baseFrame) {
        drawDragonHeadFrame(ctx, layout, nextFrame, alpha * mix, now, seed, sprite, intensity);
    }
};

export const drawIdleDragonHead = (
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

export const drawDragonBreath = (ctx: CanvasRenderingContext2D, breath: ActiveDragonBreath, now: number, sprite?: HTMLImageElement, flameSprite?: HTMLImageElement): void => {
    const age = now - breath.createdAt;
    const t = clampValue(age / breath.life, 0, 1);
    const alpha = Math.min(1, age / 130) * Math.max(0, 1 - smoothStep(0.74, 1, t));
    if (alpha <= 0) return;

    const flameT = smoothStep(0.16, 0.38, t) * (1 - smoothStep(0.82, 1, t));
    const angle = Math.atan2(breath.targetY - breath.mouthY, breath.targetX - breath.mouthX);
    const distance = Math.max(36, Math.hypot(breath.targetX - breath.mouthX, breath.targetY - breath.mouthY));
    const pulse = 0.72 + Math.sin(now * 0.026 + breath.seed) * 0.16;

    if (sprite?.complete && sprite.naturalWidth > 0) {
        const openFrame = smoothStep(0.04, 0.5, t) * (DRAGON_SHEET_FRAMES - 1);
        const settle = smoothStep(0.64, 1, t);
        drawDragonHeadSequence(ctx, breath, openFrame - settle * 1.1, alpha, now, breath.seed, sprite, flameT);
    } else {
        ctx.save();
        ctx.translate(breath.mouthX, breath.mouthY);
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

    if (flameT <= 0) return;

    const flameLength = distance * (0.78 + flameT * 0.18);
    const flameWidth = clampValue(breath.width * 0.22, 46, 92) * pulse;
    const hasFlameSprite = flameSprite?.complete && flameSprite.naturalWidth > 0;

    ctx.save();
    ctx.translate(breath.mouthX, breath.mouthY + clampValue(flameWidth * 0.16, 8, 14));
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha * flameT;

    if (!hasFlameSprite) {
        const outer = ctx.createLinearGradient(0, 0, flameLength, 0);
        outer.addColorStop(0, "rgba(255,255,255,0.64)");
        outer.addColorStop(0.1, "rgba(254,240,138,0.76)");
        outer.addColorStop(0.36, "rgba(249,115,22,0.66)");
        outer.addColorStop(0.7, "rgba(220,38,38,0.3)");
        outer.addColorStop(1, "rgba(127,29,29,0)");
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.moveTo(0, -flameWidth * 0.18);
        ctx.bezierCurveTo(flameLength * 0.12, -flameWidth * 0.76, flameLength * 0.28, -flameWidth * 0.5, flameLength * 0.38, -flameWidth * 0.9);
        ctx.bezierCurveTo(flameLength * 0.48, -flameWidth * 0.18, flameLength * 0.62, -flameWidth * 0.68, flameLength * 0.72, -flameWidth * 0.26);
        ctx.bezierCurveTo(flameLength * 0.86, -flameWidth * 0.48, flameLength * 0.97, -flameWidth * 0.16, flameLength, 0);
        ctx.bezierCurveTo(flameLength * 0.88, flameWidth * 0.22, flameLength * 0.72, flameWidth * 0.56, flameLength * 0.54, flameWidth * 0.34);
        ctx.bezierCurveTo(flameLength * 0.38, flameWidth * 0.84, flameLength * 0.18, flameWidth * 0.56, 0, flameWidth * 0.18);
        ctx.closePath();
        ctx.fill();
    }

    if (hasFlameSprite) {
        const frameCount = DRAGON_BREATH_FLAME_SHEET_FRAMES;
        const frameWidth = flameSprite.naturalWidth / frameCount;
        const frameHeight = flameSprite.naturalHeight;
        const frame = Math.floor((now * 0.018 + breath.seed * 0.11) % frameCount);
        ctx.globalAlpha = alpha * flameT * 0.98;
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
        ctx.globalAlpha = alpha * flameT * 0.32;
        ctx.drawImage(
            flameSprite,
            ((frame + 3) % frameCount) * frameWidth,
            0,
            frameWidth,
            frameHeight,
            -flameWidth * 0.08,
            -flameWidth * 0.6,
            flameLength * 0.98,
            flameWidth * 1.2
        );
        ctx.globalAlpha = alpha * flameT;

        const mouthCore = ctx.createRadialGradient(0, 0, 0, 0, 0, flameWidth * 0.7);
        mouthCore.addColorStop(0, "rgba(255,255,255,0.82)");
        mouthCore.addColorStop(0.42, "rgba(251,191,36,0.46)");
        mouthCore.addColorStop(1, "rgba(249,115,22,0)");
        ctx.fillStyle = mouthCore;
        ctx.beginPath();
        ctx.ellipse(0, 0, flameWidth * 0.62, flameWidth * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let ember = 0; ember < 7; ember += 1) {
            const noise = flameNoise(breath.seed, ember * 13.9);
            const emberX = flameLength * (0.12 + noise * 0.78);
            const emberY = (flameNoise(breath.seed + 5, ember * 7.1) - 0.5) * flameWidth * 1.3;
            const emberSize = 1.4 + flameNoise(breath.seed + 9, ember * 3.7) * 3.8;
            ctx.fillStyle = `rgba(254,240,138,${0.22 + noise * 0.46})`;
            ctx.beginPath();
            ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        return;
    }

    for (let lobe = 0; lobe < 5; lobe += 1) {
        const lobeT = (lobe + 1) / 6;
        const centerX = flameLength * lobeT;
        const centerY = (flameNoise(breath.seed + 17, lobe * 8.3) - 0.5) * flameWidth * (0.72 - lobeT * 0.32);
        const radiusX = flameWidth * (0.62 - lobeT * 0.3) * (0.82 + flameNoise(breath.seed + 23, lobe * 4.8) * 0.34);
        const radiusY = flameWidth * (0.36 - lobeT * 0.16);
        const lobeGradient = ctx.createRadialGradient(centerX - radiusX * 0.25, centerY, 0, centerX, centerY, radiusX);
        lobeGradient.addColorStop(0, "rgba(255,255,255,0.58)");
        lobeGradient.addColorStop(0.24, "rgba(254,240,138,0.64)");
        lobeGradient.addColorStop(0.58, "rgba(249,115,22,0.42)");
        lobeGradient.addColorStop(1, "rgba(220,38,38,0)");
        ctx.fillStyle = lobeGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, (flameNoise(breath.seed + 31, lobe * 6.4) - 0.5) * 0.42, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let tongue = 0; tongue < 4; tongue += 1) {
        const offset = (tongue - 1.5) * flameWidth * 0.16;
        const length = flameLength * (0.38 + tongue * 0.13 + flameNoise(breath.seed, tongue * 9.3) * 0.1);
        const width = flameWidth * (0.3 - tongue * 0.025);
        const inner = ctx.createLinearGradient(0, offset, length, offset * 0.25);
        inner.addColorStop(0, "rgba(255,255,255,0.78)");
        inner.addColorStop(0.2, "rgba(254,240,138,0.76)");
        inner.addColorStop(0.58, "rgba(249,115,22,0.46)");
        inner.addColorStop(1, "rgba(249,115,22,0)");
        ctx.fillStyle = inner;
        ctx.beginPath();
        ctx.moveTo(0, offset - width * 0.24);
        ctx.bezierCurveTo(length * 0.12, offset - width * 0.9, length * 0.34, offset - width * 0.18, length * 0.54, offset - width * 0.66);
        ctx.bezierCurveTo(length * 0.72, offset - width * 0.14, length * 0.9, offset - width * 0.28, length, offset * 0.12);
        ctx.bezierCurveTo(length * 0.76, offset + width * 0.18, length * 0.42, offset + width * 0.76, 0, offset + width * 0.24);
        ctx.closePath();
        ctx.fill();
    }

    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, flameWidth * 0.72);
    core.addColorStop(0, "rgba(255,255,255,0.9)");
    core.addColorStop(0.38, "rgba(251,191,36,0.58)");
    core.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, 0, flameWidth * 0.72, flameWidth * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let ember = 0; ember < 7; ember += 1) {
        const noise = flameNoise(breath.seed, ember * 13.9);
        const emberX = flameLength * (0.12 + noise * 0.78);
        const emberY = (flameNoise(breath.seed + 5, ember * 7.1) - 0.5) * flameWidth * 1.3;
        const emberSize = 1.4 + flameNoise(breath.seed + 9, ember * 3.7) * 3.8;
        ctx.fillStyle = `rgba(254,240,138,${0.22 + noise * 0.46})`;
        ctx.beginPath();
        ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

export const drawLiveFlame = (ctx: CanvasRenderingContext2D, flame: ActiveFlame, now: number, sprite?: HTMLImageElement) => {
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
        const frameProgress = (now * 0.012 + flame.seed * 0.31) % frameCount;
        const frame = Math.floor(frameProgress);
        const nextFrame = (frame + 1) % frameCount;
        const frameMix = frameProgress - frame;
        const isFlyingFireball = flightT < 1;
        const heightFlicker = Math.sin(now * 0.011 + flame.seed) * 0.16 + Math.sin(now * 0.021 + flame.seed * 1.7) * 0.08;
        const widthFlicker = Math.sin(now * 0.009 + flame.seed * 0.8) * 0.1;
        const drawHeight = radius * (isFlyingFireball ? 1.56 : 1.66 + heightFlicker * 0.2);
        const drawWidth = drawHeight * (frameWidth / frameHeight) * (isFlyingFireball ? 1.28 : 1.08 + widthFlicker);
        const leanAngle = isFlyingFireball
            ? travelAngle
            : Math.sin(now * 0.0026 + flame.seed) * 0.12 + (flameNoise(flame.seed + 81, 5.4) - 0.5) * 0.14;
        const baseJitterX = (flameNoise(flame.seed + 91, Math.floor(now * 0.012)) - 0.5) * radius * 0.12;
        const drawX = isFlyingFireball ? -drawWidth * 0.62 : -drawWidth / 2 + baseJitterX;
        const drawY = isFlyingFireball ? -drawHeight * 0.5 : -drawHeight * 0.9;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(leanAngle);
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
            const organicWobble = Math.sin(now * 0.0042 + flame.seed) * 0.035 + Math.sin(now * 0.0028 + flame.seed * 1.9) * 0.018;
            const organicTilt = flame.rotation * 0.16 + organicWobble;
            const holeRadius = radius * (1.06 + burnT * 0.08);
            ctx.globalCompositeOperation = "multiply";
            ctx.globalAlpha = alpha * 0.58;
            const hole = ctx.createRadialGradient(0, 0, 0, 0, 0, holeRadius * 1.08);
            hole.addColorStop(0, "rgba(0,0,0,0.56)");
            ctx.fillStyle = hole;
            ctx.beginPath();
            ctx.ellipse(0, 0, holeRadius * 1.1, holeRadius * 0.76, organicTilt, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = alpha * (0.42 + settleGlow * 0.18);
            const rim = ctx.createRadialGradient(0, 0, holeRadius * 0.28, 0, 0, holeRadius * 1.02);
            rim.addColorStop(0, "rgba(255,255,255,0)");
            rim.addColorStop(0.42, "rgba(254,240,138,0.11)");
            rim.addColorStop(0.62, "rgba(249,115,22,0.3)");
            rim.addColorStop(0.84, "rgba(127,29,29,0.11)");
            rim.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = rim;
            ctx.beginPath();
            ctx.ellipse(0, 0, holeRadius * 1.04, holeRadius * 0.68, organicTilt, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.beginPath();
            const edgePoints = 24;
            for (let point = 0; point <= edgePoints; point += 1) {
                const theta = (Math.PI * 2 * point) / edgePoints;
                const wobble = 0.9 + flameNoise(flame.seed + 139, point * 5.7) * 0.14 + Math.sin(now * 0.0022 + point + flame.seed) * 0.018;
                const px = Math.cos(theta + organicWobble * 0.5) * holeRadius * 0.82 * wobble;
                const py = -holeRadius * 0.04 + Math.sin(theta) * holeRadius * 0.58 * wobble;
                if (point === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.clip();
            drawFlameFrame(frame, (1 - frameMix) * (0.42 + settleGlow * 0.08), -holeRadius * 0.82, -holeRadius * 0.58, 1.64, 0.86);
            drawFlameFrame(nextFrame, frameMix * (0.42 + settleGlow * 0.08), -holeRadius * 0.82, -holeRadius * 0.58, 1.64, 0.86);
            ctx.restore();

            for (let ember = 0; ember < 8; ember += 1) {
                const emberT = flameNoise(flame.seed + 117, ember * 7.9);
                const emberAngle = emberT * Math.PI * 2 + Math.sin(now * 0.0016 + ember + flame.seed) * 0.1;
                const dist = holeRadius * (0.3 + flameNoise(flame.seed + 123, ember * 4.1) * 0.56);
                const size = Math.max(1, holeRadius * (0.015 + flameNoise(flame.seed + 131, ember * 3.3) * 0.018));
                ctx.fillStyle = `rgba(254,240,138,${alpha * settleGlow * (0.12 + emberT * 0.26)})`;
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

        drawFlameFrame(frame, 1 - frameMix);
        drawFlameFrame(nextFrame, frameMix);
        ctx.globalAlpha = Math.min(1, alpha * (isFlyingFireball ? 0.58 : 0.74));
        ctx.scale(0.82 + Math.sin(now * 0.01 + flame.seed) * 0.08, 1.04 + Math.sin(now * 0.013 + flame.seed) * 0.04);
        const ghostFrame = (frame + 3 + Math.floor(flameNoise(flame.seed + 103, 1.9) * 3)) % frameCount;
        const nextGhostFrame = (ghostFrame + 1) % frameCount;
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
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.04, radius * 0.58, radius * 0.36, 0, 0, Math.PI * 2);
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

export const drawPlaygroundParticle = (ctx: CanvasRenderingContext2D, particle: Particle, emberSprite?: HTMLImageElement): void => {
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

export const drawBurnResidue = (ctx: CanvasRenderingContext2D, residue: ActiveBurnResidue, now: number, sprite?: HTMLImageElement): void => {
    if (!sprite?.complete || sprite.naturalWidth <= 0) return;
    const age = now - residue.createdAt;
    const t = Math.max(0, Math.min(1, age / residue.life));
    const settle = 1 - ((1 - t) ** 3);
    const appear = Math.min(1, age / 260);
    const alpha = Math.max(0, appear * (1 - t) * 0.5);
    if (alpha <= 0) return;
    const size = residue.radius * (1.48 + settle * 0.28);
    const pulse = Math.sin(now * 0.008 + residue.seed) * residue.radius * 0.018;

    ctx.save();
    ctx.translate(residue.x, residue.y);
    ctx.rotate(residue.rotation + Math.sin(residue.seed) * 0.04);
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(sprite, -size / 2 - pulse, -size / 2, size + pulse * 2, size);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha * 0.22;
    ctx.strokeStyle = "rgba(251,146,60,0.52)";
    ctx.lineWidth = Math.max(1, residue.radius * 0.018);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.31, size * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};

export const createSkeletonShards = (creature: Creature, hitX: number, hitY: number, now: number): SkeletonShard[] => {
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

export const drawSkeletonShard = (ctx: CanvasRenderingContext2D, shard: SkeletonShard, now: number): void => {
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

export const drawDetailedArrow = (
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
};

export const drawLiveArrow = (ctx: CanvasRenderingContext2D, arrow: ActiveArrow, now: number, sprite?: HTMLImageElement) => {
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

export const drawScreenTick = (ctx: CanvasRenderingContext2D, tick: ScreenTick, now: number, sprite?: HTMLImageElement): void => {
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

export const drawDyingSpider = (ctx: CanvasRenderingContext2D, spider: DyingSpider, now: number, spiderSprite?: HTMLImageElement, arrowSprite?: HTMLImageElement) => {
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

export const drawLaserDrillBurst = (ctx: CanvasRenderingContext2D, drill: ActiveLaserDrill, now: number) => {
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

export const drawSplashSpray = (ctx: CanvasRenderingContext2D, spray: ActiveSplashSpray, now: number, _video?: HTMLVideoElement | null) => {
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
        const Math_noise = flameNoise(spray.seed + 613, droplet * 8.31);
        const theta = -Math.PI * 0.82 + droplet * (Math.PI * 1.64 / 17) + (Math_noise - 0.5) * 0.28;
        const distance = burstRadius * (0.34 + flameNoise(spray.seed + 619, droplet * 4.7) * 0.96) * (0.7 + burst * 0.28);
        const px = Math.cos(theta) * distance;
        const py = Math.sin(theta) * distance * 0.56;
        const dot = 1.2 + flameNoise(spray.seed + 631, droplet * 5.2) * (2.7 + spray.power * 1.8);
        ctx.fillStyle = `rgba(240,249,255,${alpha * (0.34 + Math_noise * 0.5)})`;
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

export const drawSplashFlood = (ctx: CanvasRenderingContext2D, waterLevel: number, width: number, height: number, now: number) => {
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

export const drawSplashAimMarker = (
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

export const drawScreenHitPulse = (ctx: CanvasRenderingContext2D, pulse: ScreenHitPulse, now: number): void => {
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

export const drawSplashRig = (
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
                const xOffset = (jet - 1.5) * 2.8 + Math.sin(now * 0.003 + jet) * 4;
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
