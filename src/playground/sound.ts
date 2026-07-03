import type { PlaygroundToolId } from "./engine";
import dragonRoarSrc from "../assets/playground/dragon-studio-dragon-roar-364478.mp3";

let audioContext: AudioContext | null = null;
let dragonRoarAudio: HTMLAudioElement | null = null;

const getAudioContext = (): AudioContext | null => {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return null;
    if (!audioContext) audioContext = new AudioCtor();
    if (audioContext.state === "suspended") {
        void audioContext.resume();
    }
    return audioContext;
};

const playDragonRoarMp3 = (volume: number): void => {
    try {
        if (!dragonRoarAudio) {
            dragonRoarAudio = new Audio(dragonRoarSrc);
            dragonRoarAudio.preload = "auto";
        }
        dragonRoarAudio.pause();
        dragonRoarAudio.currentTime = 0;
        dragonRoarAudio.volume = volume;
        void dragonRoarAudio.play();
    } catch {
        playDragonFlameReleaseFallback();
    }
};

export const playDragonHeatSelectSound = (): void => {
    playDragonRoarMp3(0.48);
};

export const playDragonFlameReleaseSound = (): void => {
    playDragonRoarMp3(0.36);
};

const playDragonFlameReleaseFallback = (): void => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.062, now + 0.025);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    master.connect(ctx.destination);

    const growl = ctx.createOscillator();
    const growlFilter = ctx.createBiquadFilter();
    growl.type = "sawtooth";
    growl.frequency.setValueAtTime(240 + Math.random() * 18, now);
    growl.frequency.exponentialRampToValueAtTime(120 + Math.random() * 14, now + 0.3);
    growlFilter.type = "lowpass";
    growlFilter.frequency.setValueAtTime(1200, now);
    growlFilter.frequency.exponentialRampToValueAtTime(320, now + 0.32);
    growl.connect(growlFilter);
    growlFilter.connect(master);
    growl.start(now);
    growl.stop(now + 0.36);

    const breath = ctx.createOscillator();
    const breathFilter = ctx.createBiquadFilter();
    const breathGain = ctx.createGain();
    breath.type = "sawtooth";
    breath.frequency.setValueAtTime(410 + Math.random() * 40, now);
    breath.frequency.exponentialRampToValueAtTime(180 + Math.random() * 24, now + 0.22);
    breathFilter.type = "bandpass";
    breathFilter.frequency.setValueAtTime(1500, now);
    breathFilter.Q.setValueAtTime(1.35, now);
    breathGain.gain.setValueAtTime(0.0001, now);
    breathGain.gain.exponentialRampToValueAtTime(0.48, now + 0.018);
    breathGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    breath.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(master);
    breath.start(now);
    breath.stop(now + 0.28);
};

export const playToolSound = (tool: PlaygroundToolId): void => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    if (tool === "laser") {
        // Star Wars style Lightsaber Ignite + Hum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = "sawtooth";
        // Ignition spike
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);
        osc.frequency.linearRampToValueAtTime(80 + Math.random() * 20, now + 0.15);
        
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
        
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + 0.15);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.18);
        
        // Add a secondary sub-hum for depth
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(40, now);
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        subGain.gain.linearRampToValueAtTime(0, now + 0.18);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.18);
    } else if (tool === "splash") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(420 + Math.random() * 90, now);
        osc.frequency.exponentialRampToValueAtTime(140 + Math.random() * 30, now + 0.18);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(980 + Math.random() * 220, now);
        filter.Q.setValueAtTime(0.9, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.052, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const baseFrequency = tool === "burn" ? 96 : tool === "scatter" ? 260 : tool === "glyph" ? 180 : 145;
        const endFrequency = tool === "glyph" ? 68 : tool === "scatter" ? 90 : 48;

        filter.type = tool === "burn" ? "lowpass" : "bandpass";
        filter.frequency.setValueAtTime(tool === "glyph" ? 520 : 720, now);
        osc.type = tool === "glyph" ? "square" : tool === "burn" ? "sawtooth" : "square";
        osc.frequency.setValueAtTime(baseFrequency, now);
        osc.frequency.exponentialRampToValueAtTime(endFrequency, now + 0.16);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(tool === "hammer" ? 0.11 : 0.075, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }
};
