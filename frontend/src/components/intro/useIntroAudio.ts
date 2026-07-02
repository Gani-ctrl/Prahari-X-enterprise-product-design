import { useCallback, useEffect, useRef, useState } from "react";

// ----------------------------------------------------------------------------
// Fully synthesized cinematic score via the Web Audio API — no recorded
// samples exist (there's no way to source real audio in this build), so
// every layer here is oscillators + filtered noise: a low rumble bed,
// filtered wind/static noise, occasional distant "thud" bursts, a slow
// tense pad (a tritone drone under a sweeping lowpass filter — the classic
// "unsettling" interval used in tension scores), and a steady low pulse
// that reads as a distant heartbeat/war-drum. Plus a short beep used to
// punctuate boot-text lines.
//
// Autoplay: `attemptAutoplay()` is called on mount and is safe to call
// repeatedly — it creates/resumes the AudioContext and starts the ambience
// if it hasn't already. Browsers block audible playback until a real user
// gesture resumes a suspended AudioContext (a platform policy, not
// something any app code can override), so the caller (CinematicIntro.tsx)
// also calls this again on the visitor's first pointerdown/keydown/touch —
// scheduling starts immediately either way, it just isn't audible until
// the context actually resumes.
//
// Volume is the product of two independently controlled gain stages: the
// mute toggle (master) and a separate dissolve stage the caller drives
// every frame from scroll progress (setDissolveGain), so the score fades
// out smoothly as the visitor scrolls into the homepage and fades back in
// if they scroll back to the intro — composing naturally instead of a
// one-shot stop.
// ----------------------------------------------------------------------------

function makeNoiseBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function useIntroAudio() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const dissolveGainRef = useRef<GainNode | null>(null);
  const ambienceNodesRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.5;
    const dissolveGain = ctx.createGain();
    dissolveGain.gain.value = 1;
    master.connect(dissolveGain);
    dissolveGain.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;
    dissolveGainRef.current = dissolveGain;
    return ctx;
  }, []);

  const startAmbience = useCallback(() => {
    const ctx = ensureContext();
    const master = masterRef.current;
    if (!ctx || !master || ambienceNodesRef.current) return;

    // Layer 1: low rumble — a detuned pair of sub-bass oscillators, slowly
    // wandering in gain to feel like distant, irregular explosions rather
    // than a static drone.
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.06;
    rumbleGain.connect(master);
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 42;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 55;
    osc1.connect(rumbleGain);
    osc2.connect(rumbleGain);
    osc1.start();
    osc2.start();

    // Layer 2: filtered noise wind/static bed.
    const noiseBuffer = makeNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 380;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.035;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noiseSource.start();

    // Layer 3: tense pad — two low sawtooth drones a tritone apart (the
    // "unsettling" interval used throughout tension scoring) through a
    // lowpass filter whose cutoff is slowly swept by a sub-audio LFO, so
    // the texture keeps evolving instead of sitting static.
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    padGain.connect(master);
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 320;
    padFilter.Q.value = 0.6;
    padFilter.connect(padGain);
    const padOscA = ctx.createOscillator();
    padOscA.type = "sawtooth";
    padOscA.frequency.value = 55; // A1
    const padOscB = ctx.createOscillator();
    padOscB.type = "sawtooth";
    padOscB.frequency.value = 55 * Math.pow(2, 6 / 12); // tritone above
    padOscA.connect(padFilter);
    padOscB.connect(padFilter);
    padOscA.start();
    padOscB.start();
    const padLfo = ctx.createOscillator();
    padLfo.type = "sine";
    padLfo.frequency.value = 0.045;
    const padLfoGain = ctx.createGain();
    padLfoGain.gain.value = 140;
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);
    padLfo.start();

    // Occasional distant "thud" — randomly scheduled short low-pass bursts.
    let thudTimer: number | undefined;
    function scheduleThud() {
      const delay = 4000 + Math.random() * 9000;
      thudTimer = window.setTimeout(() => {
        if (!ctxRef.current) return;
        const t = ctxRef.current.currentTime;
        const thudOsc = ctxRef.current.createOscillator();
        thudOsc.type = "sine";
        thudOsc.frequency.setValueAtTime(80, t);
        thudOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
        const thudGain = ctxRef.current.createGain();
        thudGain.gain.setValueAtTime(0, t);
        thudGain.gain.linearRampToValueAtTime(0.18, t + 0.03);
        thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        thudOsc.connect(thudGain);
        thudGain.connect(masterRef.current!);
        thudOsc.start(t);
        thudOsc.stop(t + 1);
        scheduleThud();
      }, delay);
    }
    scheduleThud();

    // Steady low pulse — a soft distant heartbeat/war-drum, roughly every
    // 1.5-1.8s with slight humanized jitter so it doesn't read as a metronome.
    let pulseTimer: number | undefined;
    function schedulePulse() {
      const interval = 1500 + Math.random() * 300;
      pulseTimer = window.setTimeout(() => {
        if (!ctxRef.current) return;
        const t = ctxRef.current.currentTime;
        const pulseOsc = ctxRef.current.createOscillator();
        pulseOsc.type = "sine";
        pulseOsc.frequency.setValueAtTime(60, t);
        pulseOsc.frequency.exponentialRampToValueAtTime(38, t + 0.25);
        const pulseGain = ctxRef.current.createGain();
        pulseGain.gain.setValueAtTime(0, t);
        pulseGain.gain.linearRampToValueAtTime(0.09, t + 0.02);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        pulseOsc.connect(pulseGain);
        pulseGain.connect(masterRef.current!);
        pulseOsc.start(t);
        pulseOsc.stop(t + 0.6);
        schedulePulse();
      }, interval);
    }
    schedulePulse();

    ambienceNodesRef.current = {
      stop() {
        osc1.stop();
        osc2.stop();
        noiseSource.stop();
        padOscA.stop();
        padOscB.stop();
        padLfo.stop();
        if (thudTimer) window.clearTimeout(thudTimer);
        if (pulseTimer) window.clearTimeout(pulseTimer);
      },
    };
  }, [ensureContext]);

  // Best-effort autoplay: safe to call from a mount effect and again from a
  // one-time "first interaction" fallback listener. Idempotent — startAmbience
  // no-ops if the ambience is already running, ensureContext no-ops if the
  // context already exists.
  const attemptAutoplay = useCallback(() => {
    const ctx = ensureContext();
    const master = masterRef.current;
    if (!ctx || !master) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    master.gain.setTargetAtTime(mutedRef.current ? 0 : 0.5, ctx.currentTime, 0.15);
    startAmbience();
  }, [ensureContext, startAmbience]);

  // Driven every frame by the caller from scroll-dissolve progress
  // (0 = fully on the intro, 1 = fully into the homepage) — a short
  // setTargetAtTime smooths out any per-frame jitter in the input.
  const setDissolveGain = useCallback((value: number) => {
    const ctx = ctxRef.current;
    const gainNode = dissolveGainRef.current;
    if (!ctx || !gainNode) return;
    gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), ctx.currentTime, 0.1);
  }, []);

  const playBootBeep = useCallback(() => {
    const ctx = ensureContext();
    const master = masterRef.current;
    if (!ctx || !master || mutedRef.current) return;
    const t = ctx.currentTime;
    const beep = ctx.createOscillator();
    beep.type = "sine";
    beep.frequency.value = 880;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    beep.connect(gain);
    gain.connect(master);
    beep.start(t);
    beep.stop(t + 0.1);
  }, [ensureContext]);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const ctx = ensureContext();
      const master = masterRef.current;
      if (ctx && master) {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        master.gain.setTargetAtTime(next ? 0 : 0.5, ctx.currentTime, 0.15);
        if (!next) startAmbience();
      }
      return next;
    });
  }, [ensureContext, startAmbience]);

  useEffect(() => {
    return () => {
      ambienceNodesRef.current?.stop();
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { muted, toggleMuted, playBootBeep, attemptAutoplay, setDissolveGain };
}
