// Toy-can impact: low pop, inharmonic metal, crisp transient and soft sparkle.
// Pure PCM synthesis keeps preview, playback and verification identical.
export const CAPTURE_NOTES = [0, 2, 4, 7, 9, 12, 14, 16];
export function synthesizeCapture(sampleRate = 44100, note = 0, rich = false) {
  const samples = new Float32Array(Math.ceil(sampleRate * .26));
  const pitch = 2 ** (CAPTURE_NOTES[Math.min(7, Math.max(0, note))] / 12);
  let seed = 7351, lowNoise = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    lowNoise += .24 * (noise - lowNoise);
    const attack = Math.min(1, t / .0015), release = Math.min(1, (.26 - t) / .025);
    const pop = .23 * Math.sin(2 * Math.PI * (76 * t + 110 * .012 * (1 - Math.exp(-t / .012)))) * Math.exp(-t / .024);
    let metal = 0;
    for (const [ratio, amount, decay] of [[1, .20, .057], [2.76, .10, .033], [4.07, .044, .02], [5.43, .022, .014]]) {
      metal += amount * Math.sin(2 * Math.PI * 610 * pitch * ratio * t) * Math.exp(-t / decay);
    }
    const snap = .13 * (noise - lowNoise) * Math.exp(-t / .007);
    const sparkle = .035 * Math.sin(2 * Math.PI * 1220 * pitch * t) * Math.exp(-t / .09);
    const extra = rich ? .09 * Math.sin(2 * Math.PI * 915 * pitch * Math.max(0, t - .014)) * Math.exp(-Math.max(0, t - .014) / .06) : 0;
    samples[i] = Math.tanh((pop + metal + snap + sparkle + extra) * attack * release * 1.3) * .8;
  }
  return samples;
}
