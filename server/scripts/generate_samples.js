#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const __dirname = path.resolve(path.dirname(''));
const DATA_DIR = path.resolve(new URL('../data', import.meta.url).pathname);
const SAMPLES_DIR = path.join(DATA_DIR, 'samples');
const PRESETS_DIR = path.join(DATA_DIR, 'presets');

const sampleRate = 44100;

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

function writeWavFile(filePath, samples, sampleRate = 44100) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;

  const pcmData = floatTo16BitPCM(samples);
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  let offset = 0;

  function writeString(str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    offset += str.length;
  }

  writeString('RIFF');
  view.setUint32(offset, 36 + pcmData.length, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size
  view.setUint16(offset, 1, true); offset += 2; // PCM
  view.setUint16(offset, channels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  writeString('data');
  view.setUint32(offset, pcmData.length, true); offset += 4;

  // copy pcm data
  new Uint8Array(buffer, offset).set(pcmData);

  return fs.writeFile(filePath, Buffer.from(buffer));
}

async function generate() {
  await fs.mkdir(SAMPLES_DIR, { recursive: true });
  await fs.mkdir(PRESETS_DIR, { recursive: true });

  // Generate 16 sine tones (diapason) for pads 0..15
  const len = sampleRate * 1; // 1s each
  const baseFreq = 220; // starting frequency
  const files = [];
  for (let i = 0; i < 16; i++) {
    const freq = Math.round(baseFreq * Math.pow(2, i / 12));
    const buf = new Float32Array(len);
    for (let j = 0; j < len; j++) {
      buf[j] = Math.sin(2 * Math.PI * freq * (j / sampleRate)) * 0.8;
    }
    const name = `sine-${freq}-${Date.now()}-${i}.wav`;
    const p = path.join(SAMPLES_DIR, name);
    await writeWavFile(p, buf, sampleRate);
    files.push({ name, path: p, freq, padIndex: i });
    console.log('Wrote', p);
  }

  // Create a full preset referencing the 16 samples (pads 0..15)
  const samples = files.map(f => ({ padIndex: f.padIndex, url: `/samples/${f.name}`, name: f.name }));
  const fullPreset = {
    id: `preset-16-sines-${Date.now()}`,
    name: '16 Sine Diapason',
    user: 'auto',
    isPublic: false,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    parameters: {
      // default pad states (midiNote etc) are handled by node setState when loading
    },
    samples
  };

  await fs.writeFile(path.join(PRESETS_DIR, `${fullPreset.id}.json`), JSON.stringify(fullPreset, null, 2), 'utf8');
  console.log('Preset created:', fullPreset.id);
}

generate().catch((e) => { console.error('generate failed', e); process.exit(1); });
