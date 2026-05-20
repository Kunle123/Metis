#!/usr/bin/env node
/**
 * Builds public/walkthrough-voiceover.mp3 from scene copy in src/scenes.ts timing.
 *
 * Uses macOS `say` + `afconvert` (no ffmpeg required). Re-run after script changes.
 * Replace with a professional VO recording by dropping the same filename in public/.
 *
 * Usage: node scripts/generate-voiceover.mjs
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "../../public");
const PUBLIC_WAV = path.join(PUBLIC_DIR, "walkthrough-voiceover.wav");
const PUBLIC_M4A = path.join(PUBLIC_DIR, "walkthrough-voiceover.m4a");
const PUBLIC_MP3 = path.join(PUBLIC_DIR, "walkthrough-voiceover.mp3");
const FPS = 30;

/** Calm British institutional tone — change voice with: say -v '?' */
const VOICE = "Daniel";
const SPEECH_RATE = 168;

const SCENES = [
  { seconds: 8, text: "When an issue is moving quickly, the problem is rarely a lack of information. It is that the information is scattered across emails, updates, calls, documents and unanswered questions." },
  { seconds: 10, text: "In Metis, we start by opening the issue workspace. This gives the team one place to collect what is known, what is still uncertain, and what needs to be turned into a clear briefing line." },
  { seconds: 14, text: "Here, we add a new input. This could be an email from operations, a media enquiry, a note from the executive team, or an update from a colleague on the ground." },
  { seconds: 13, text: "As the input is added, Metis helps structure the information. Important claims, observations and possible gaps are pulled into the issue record, so the team can see the shape of the situation more clearly." },
  { seconds: 13, text: "The aim is not just to produce words. It is to build a briefing record that shows what the organisation knows, where the evidence came from, and what is still unresolved." },
  { seconds: 12, text: "From here, we can move into the brief. Metis uses the issue record, the selected audience, and the available source material to prepare a draft briefing for leadership." },
  { seconds: 14, text: "The brief brings together the current position, key developments, risks, open questions and recommended next steps. It gives senior leaders a clear view without forcing the comms team to rebuild the story from scratch." },
  { seconds: 14, text: "The team can review the draft, check the underlying sources, refine the wording, and decide what is ready to circulate." },
  { seconds: 12, text: "That means fewer disconnected drafts, fewer lost decisions, and more confidence that the final brief reflects the current state of the issue." },
  { seconds: 10, text: "Metis helps teams move from scattered input to structured understanding, and from structured understanding to leadership-ready briefings." },
];

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function aiffToWav(aiff, wav) {
  run(`afconvert -f WAVE -d LEI16@44100 "${aiff}" "${wav}"`);
}

function wavDurationSeconds(wavPath) {
  const buf = fs.readFileSync(wavPath);
  const sampleRate = buf.readUInt32LE(24);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return dataSize / byteRate;
}

function fitWavToDuration(inputWav, outputWav, targetSeconds) {
  const buf = fs.readFileSync(inputWav);
  const sampleRate = buf.readUInt32LE(24);
  const channels = buf.readUInt16LE(22);
  const bitsPerSample = buf.readUInt16LE(34);
  const dataOffset = 44;
  const bytesPerSample = (bitsPerSample / 8) * channels;
  const data = buf.subarray(dataOffset);
  const targetBytes = Math.floor(targetSeconds * sampleRate) * bytesPerSample;
  let fitted;
  if (data.length >= targetBytes) {
    fitted = data.subarray(0, targetBytes);
  } else {
    fitted = Buffer.concat([data, Buffer.alloc(targetBytes - data.length)]);
  }
  const out = Buffer.alloc(dataOffset + fitted.length);
  buf.copy(out, 0, 0, dataOffset);
  out.writeUInt32LE(fitted.length, 40);
  out.writeUInt32LE(36 + fitted.length, 4);
  fitted.copy(out, dataOffset);
  fs.writeFileSync(outputWav, out);
  return targetSeconds;
}

function concatWavs(wavs, outPath) {
  const first = fs.readFileSync(wavs[0]);
  const sampleRate = first.readUInt32LE(24);
  const channels = first.readUInt16LE(22);
  const bitsPerSample = first.readUInt16LE(34);
  const dataChunks = wavs.map((p) => {
    const b = fs.readFileSync(p);
    return b.subarray(44);
  });
  const audio = Buffer.concat(dataChunks);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + audio.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(audio.length, 40);
  fs.writeFileSync(outPath, Buffer.concat([header, audio]));
}

function exportPublicAudio(wav) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.copyFileSync(wav, PUBLIC_WAV);
  console.log(`  → ${PUBLIC_WAV}`);

  try {
    run(`ffmpeg -y -i "${wav}" -codec:a libmp3lame -qscale:a 2 "${PUBLIC_MP3}"`);
    console.log(`  → ${PUBLIC_MP3}`);
    return "walkthrough-voiceover.mp3";
  } catch {
    run(`afconvert -f m4af -d aac "${wav}" "${PUBLIC_M4A}"`);
    console.log(`  → ${PUBLIC_M4A} (install ffmpeg for MP3)`);
    return "walkthrough-voiceover.m4a";
  }
}

function main() {
  if (process.platform !== "darwin") {
    console.error("This generator requires macOS `say` and `afconvert`.");
    console.error("On other OSes, place a 120s recording at public/walkthrough-voiceover.mp3");
    process.exit(1);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "metis-vo-"));
  const fitted = [];

  console.log(`Generating ${SCENES.length} scenes (voice: ${VOICE})…`);

  SCENES.forEach((scene, i) => {
    const aiff = path.join(tmp, `scene-${i}.aiff`);
    const rawWav = path.join(tmp, `scene-${i}-raw.wav`);
    const fitWav = path.join(tmp, `scene-${i}-fit.wav`);
    const escaped = scene.text.replace(/"/g, '\\"');
    run(`say -v "${VOICE}" -r ${SPEECH_RATE} -o "${aiff}" "${escaped}"`);
    aiffToWav(aiff, rawWav);
    const spoken = wavDurationSeconds(rawWav);
    if (spoken > scene.seconds) {
      console.warn(`  Scene ${i + 1}: speech ${spoken.toFixed(1)}s > slot ${scene.seconds}s — will trim`);
    }
    fitWavToDuration(rawWav, fitWav, scene.seconds);
    fitted.push(fitWav);
  });

  const mergedWav = path.join(tmp, "walkthrough.wav");
  concatWavs(fitted, mergedWav);
  const total = SCENES.reduce((s, x) => s + x.seconds, 0);
  console.log(`Merged track: ${total}s`);
  const asset = exportPublicAudio(mergedWav);
  console.log(`Primary asset for Remotion: public/${asset}`);
  console.log("Done.");
}

main();
