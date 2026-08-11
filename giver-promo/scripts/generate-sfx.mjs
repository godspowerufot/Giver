/**
 * Generate lightweight product UI SFX as WAV files (no external deps).
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "sfx");
mkdirSync(outDir, { recursive: true });

function writeWav(filename, samples, sampleRate = 44100) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE((s * 32767) | 0, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(join(outDir, filename), Buffer.concat([header, data]));
  console.log("wrote", filename, `${(samples.length / sampleRate).toFixed(2)}s`);
}

function env(t, type = "expo", a = 8) {
  if (type === "expo") return Math.exp(-a * t);
  if (type === "lin") return Math.max(0, 1 - t);
  return 1;
}

function tone(freq, dur, { gain = 0.3, type = "sine", decay = 8 } = {}) {
  const sr = 44100;
  const n = Math.floor(sr * dur);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const phase = 2 * Math.PI * freq * t;
    let s =
      type === "square"
        ? Math.sign(Math.sin(phase))
        : type === "tri"
          ? (2 / Math.PI) * Math.asin(Math.sin(phase))
          : Math.sin(phase);
    out[i] = s * gain * env(t / dur, "expo", decay);
  }
  return out;
}

function noise(dur, gain = 0.2, decay = 10) {
  const sr = 44100;
  const n = Math.floor(sr * dur);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    out[i] = (Math.random() * 2 - 1) * gain * env(t / dur, "expo", decay);
  }
  return out;
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => p.length));
  const out = new Float64Array(len);
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) out[i] += p[i];
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  if (peak > 1) for (let i = 0; i < out.length; i++) out[i] /= peak * 1.05;
  return out;
}

function pad(dur, freqs, gain = 0.08) {
  const sr = 44100;
  const n = Math.floor(sr * dur);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let s = 0;
    for (const f of freqs) s += Math.sin(2 * Math.PI * f * t);
    const fadeIn = Math.min(1, t / 1.2);
    const fadeOut = Math.min(1, (dur - t) / 1.5);
    out[i] = (s / freqs.length) * gain * fadeIn * fadeOut;
  }
  return out;
}

// Soft UI click
writeWav(
  "click.wav",
  mix(tone(1800, 0.045, { gain: 0.22, decay: 28 }), tone(900, 0.05, { gain: 0.12, decay: 22 })),
);

// Whoosh / transition
{
  const sr = 44100;
  const dur = 0.35;
  const n = Math.floor(sr * dur);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const f = 400 + 2400 * (t / dur);
    out[i] =
      Math.sin(2 * Math.PI * f * t) * 0.12 * env(t / dur, "expo", 4) +
      (Math.random() * 2 - 1) * 0.05 * env(t / dur, "expo", 6);
  }
  writeWav("whoosh.wav", out);
}

// Success / parse done
writeWav(
  "success.wav",
  mix(
    tone(523.25, 0.12, { gain: 0.18, decay: 10 }),
    tone(659.25, 0.16, { gain: 0.16, decay: 9 }),
    tone(783.99, 0.22, { gain: 0.14, decay: 8 }),
  ),
);

// Type tick
writeWav("type.wav", mix(tone(2100, 0.03, { gain: 0.12, decay: 40 }), noise(0.02, 0.04, 50)));

// Card pop
writeWav(
  "pop.wav",
  mix(tone(320, 0.1, { gain: 0.2, decay: 12 }), tone(640, 0.08, { gain: 0.1, decay: 16 }), noise(0.06, 0.06, 20)),
);

// Dark ambient bed (~22s)
writeWav("ambient.wav", pad(22, [55, 82.5, 110, 164.8], 0.07));

console.log("SFX ready in public/sfx/");
