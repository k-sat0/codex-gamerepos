import { synthesizeCapture } from './capture-sound.mjs';

export class Audio {
  constructor() { this.context = null; this.last = -Infinity; this.combo = 0; this.pending = 0; this.voices = new Set(); this.buffers = new Map(); }
  async unlock() {
    try {
      if (!this.context) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.output = this.context.createDynamicsCompressor();
        this.output.threshold.value = -16; this.output.knee.value = 16; this.output.ratio.value = 4;
        this.output.attack.value = .003; this.output.release.value = .1;
        this.output.connect(this.context.destination);
      }
      await this.context.resume(); return this.context.state === 'running';
    } catch { return false; }
  }
  buffer(note, rich) {
    const key = `${note}:${rich}`;
    if (!this.buffers.has(key)) {
      const data = synthesizeCapture(this.context.sampleRate, note, rich);
      const buffer = this.context.createBuffer(1, data.length, this.context.sampleRate); buffer.copyToChannel(data, 0); this.buffers.set(key, buffer);
    }
    return this.buffers.get(key);
  }
  play(volume, count, note, when = this.context.currentTime) {
    if (volume <= 0 || this.voices.size >= 5) return;
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    source.buffer = this.buffer(note, count >= 3);
    gain.gain.value = Math.min(1, Math.max(0, volume)) * (.72 + Math.min(count - 1, 6) * .035);
    source.connect(gain); gain.connect(this.output); this.voices.add(source);
    source.onended = () => { this.voices.delete(source); source.disconnect(); gain.disconnect(); };
    source.start(when);
  }
  clank(settings, count) {
    if (!settings.sound || !this.context || this.context.state !== 'running' || settings.sfxVolume <= 0) return;
    const now = this.context.currentTime;
    if (now - this.last > .48) { this.combo = 0; this.pending = 0; }
    this.pending += count;
    if (now - this.last < .05) return;
    this.play(settings.sfxVolume, this.pending, Math.min(7, Math.floor(this.combo / 2)));
    this.combo += Math.min(this.pending, 3); this.pending = 0; this.last = now;
  }
  async preview(settings) {
    if (!await this.unlock()) return false;
    const now = this.context.currentTime;
    for (const [index, note] of [0, 2, 4].entries()) this.play(settings.sfxVolume, index === 2 ? 4 : 1, note, now + index * .13);
    return true;
  }
}
