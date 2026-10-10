// Tuned can impact: C-major bell with a thin metallic shell and mellow top octave.
// Pure PCM synthesis keeps preview, playback and verification identical.
export const CAPTURE_NOTES = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
export function captureFrequency(note = 0) {
  const index = Math.min(CAPTURE_NOTES.length - 1, Math.max(0, Math.floor(Number.isFinite(note) ? note : 0)));
  return 261.6255653005986 * 2 ** (CAPTURE_NOTES[index] / 12);
}
export function synthesizeCapture(sampleRate = 44100, note = 0, rich = false) {
  const samples = new Float32Array(Math.ceil(sampleRate * .26));
  const frequency = captureFrequency(note), height = Math.log2(frequency / 261.6255653005986) / 2;
  let seed = 7351, lowNoise = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    lowNoise += .24 * (noise - lowNoise);
    const attack = Math.min(1, t / .0015), release = Math.min(1, (.26 - t) / .025);
    const pop = .14 * Math.sin(2 * Math.PI * frequency / 2 * t) * Math.exp(-t / .02);
    let metal = 0;
    for (const [ratio, amount, decay] of [[1, .28, .065], [2, .13, .035], [3, .04, .02], [4, .014, .014]]) {
      const softness = ratio === 1 ? 1 : 1 - height * .65;
      metal += amount * softness * Math.sin(2 * Math.PI * frequency * ratio * t) * Math.exp(-t / decay);
    }
    // Brief inharmonic resonances make the strike sound like a can, without masking the note.
    let shell = 0;
    for (const [ratio, amount, decay] of [[2.76, .075, .038], [4.07, .029, .022], [5.43, .012, .014]]) {
      shell += amount * (1 - height * .55) * Math.sin(2 * Math.PI * frequency * ratio * t) * Math.exp(-t / decay);
    }
    const snap = .07 * (1 - height * .6) * (noise - lowNoise) * Math.exp(-t / .005);
    const sparkle = .03 * Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t / .07);
    const extra = (rich ? .065 : .035 * height) * Math.sin(2 * Math.PI * frequency / 2 * t) * Math.exp(-t / .055);
    samples[i] = Math.tanh((pop + metal + shell + snap + sparkle + extra) * attack * release * 1.3) * .8;
  }
  return samples;
}
