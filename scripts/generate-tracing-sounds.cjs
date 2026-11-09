// Original synthesized sounds, shared by the Android and iOS resource bundles.
const fs = require('fs');
const path = require('path');
const rate = 22050;

function bell(time, frequency, duration) {
  if (time < 0 || time >= duration) return 0;
  const attack = Math.min(1, time / 0.008);
  const release = Math.min(1, (duration - time) / 0.035);
  const phase = 2 * Math.PI * frequency * time;
  return (
    attack *
    release *
    Math.exp(-time * 6) *
    (Math.sin(phase) + 0.22 * Math.sin(phase * 2) + 0.08 * Math.sin(phase * 3))
  );
}
function writeWave(name, duration, synth) {
  const samples = Math.round(duration * rate);
  const wave = Buffer.alloc(44 + samples * 2);
  wave.write('RIFF');
  wave.writeUInt32LE(wave.length - 8, 4);
  wave.write('WAVEfmt ', 8);
  wave.writeUInt32LE(16, 16);
  wave.writeUInt16LE(1, 20);
  wave.writeUInt16LE(1, 22);
  wave.writeUInt32LE(rate, 24);
  wave.writeUInt32LE(rate * 2, 28);
  wave.writeUInt16LE(2, 32);
  wave.writeUInt16LE(16, 34);
  wave.write('data', 36);
  wave.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    const sample = Math.max(-0.9, Math.min(0.9, synth(index / rate)));
    wave.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }
  for (const folder of ['android/app/src/main/res/raw', 'ios/ABCKids']) {
    const target = path.resolve(__dirname, '..', folder, name);
    fs.writeFileSync(target, wave);
  }
  console.log(`${name}: ${wave.length} bytes per platform`);
}
const notes = [523.251, 659.255, 783.991, 659.255];
writeWave('tracing_loop.wav', 1.2, time =>
  notes.reduce(
    (sum, note, index) => sum + 0.19 * bell(time - index * 0.3, note, 0.28),
    0,
  ),
);
writeWave('tracing_success.wav', 1.1, time =>
  [...notes.slice(0, 3), 1046.502].reduce(
    (sum, note, index) => sum + 0.16 * bell(time - index * 0.12, note, 0.65),
    0,
  ),
);
