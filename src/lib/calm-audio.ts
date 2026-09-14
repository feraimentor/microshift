// Gerador de áudio procedural via Web Audio API para foco e redução de estresse

let audioCtx: AudioContext | null = null;
let rainNode: AudioNode | null = null;
let alphaOsc1: OscillatorNode | null = null;
let alphaOsc2: OscillatorNode | null = null;
let alphaGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function startRainSound(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    stopRainSound();

    // Cria buffer de ruído rosa/marrom para efeito de chuva serena
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filtro passa-baixa simples para converter em ruído marrom/chuva suave
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filtro biquad para suavizar agudos
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
    rainNode = whiteNoise;
  } catch (err) {
    console.warn("Web Audio não suportado ou bloqueado:", err);
  }
}

export function stopRainSound(): void {
  if (rainNode) {
    try {
      (rainNode as AudioScheduledSourceNode).stop();
      rainNode.disconnect();
    } catch {}
    rainNode = null;
  }
}

export function startAlphaWaves(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    stopAlphaWaves();

    // Frequência base de 432 Hz e batimento binaural de 10 Hz (Alpha)
    const baseFreq = 432;
    const beatFreq = 10;

    alphaOsc1 = ctx.createOscillator();
    alphaOsc2 = ctx.createOscillator();
    alphaGain = ctx.createGain();

    alphaOsc1.type = "sine";
    alphaOsc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    alphaOsc2.type = "sine";
    alphaOsc2.frequency.setValueAtTime(baseFreq + beatFreq, ctx.currentTime);

    alphaGain.gain.setValueAtTime(0.06, ctx.currentTime);

    alphaOsc1.connect(alphaGain);
    alphaOsc2.connect(alphaGain);
    alphaGain.connect(ctx.destination);

    alphaOsc1.start();
    alphaOsc2.start();
  } catch (err) {
    console.warn("Erro ao iniciar ondas Alpha:", err);
  }
}

export function stopAlphaWaves(): void {
  if (alphaOsc1) {
    try {
      alphaOsc1.stop();
      alphaOsc1.disconnect();
    } catch {}
    alphaOsc1 = null;
  }
  if (alphaOsc2) {
    try {
      alphaOsc2.stop();
      alphaOsc2.disconnect();
    } catch {}
    alphaOsc2 = null;
  }
  if (alphaGain) {
    try {
      alphaGain.disconnect();
    } catch {}
    alphaGain = null;
  }
}

export function playTibetanBowlSound(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Frequência harmônica reconfortante (~528 Hz - frequência do milagre/calma)
    osc.frequency.setValueAtTime(528, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 3.6);
  } catch (err) {
    console.warn("Erro ao tocar sino tibetano:", err);
  }
}
