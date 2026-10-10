export class Input {
  constructor(canvas, camera, enabled, onPause) {
    this.canvas = canvas; this.camera = camera; this.keys = new Set(); this.held = new Set(); this.pointer = null; this.pointerId = null; this.down = false;
    const clear = () => this.clear();
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    window.addEventListener('keydown', event => {
      if (event.target.closest('button, input, summary, a, dialog')) return;
      const key = event.key.toLowerCase();
      if (key === 'p') { event.preventDefault(); if (!event.repeat) onPause(); return; }
      if (!enabled()) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'q', 'e', 'p'].includes(key)) event.preventDefault();
      this.keys.add(key);
      if (key === 'q' || key === 'e') this.pointer = null;
    });
    window.addEventListener('keyup', event => this.keys.delete(event.key.toLowerCase()));
    const point = event => {
      const rect = canvas.getBoundingClientRect();
      this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    canvas.addEventListener('pointerdown', event => {
      if (!enabled() || this.pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); canvas.focus({ preventScroll: true }); point(event);
      this.down = true; this.pointerId = event.pointerId; canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerType === 'mouse' || event.pointerId === this.pointerId) point(event);
    });
    const release = event => {
      if (event.pointerId !== this.pointerId) return;
      this.down = false; this.pointerId = null;
      if (event.pointerType !== 'mouse') this.pointer = null;
    };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, release);
    canvas.addEventListener('pointerleave', () => { this.down = false; this.pointer = null; });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    document.querySelectorAll('[data-move]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        if (!enabled()) return;
        event.preventDefault(); this.held.add(button.dataset.move); button.classList.add('held'); button.setPointerCapture(event.pointerId);
      });
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, () => {
        this.held.delete(button.dataset.move); button.classList.remove('held');
      });
    });
  }
  clear() {
    this.keys.clear(); this.held.clear(); this.down = false; this.pointerId = null; this.pointer = null;
    document.querySelectorAll('.held').forEach(button => button.classList.remove('held'));
  }
  sample() {
    const key = (...keys) => keys.some(k => this.keys.has(k));
    const camera = this.camera();
    return { x: Number(key('d', 'arrowright') || this.held.has('right')) - Number(key('a', 'arrowleft') || this.held.has('left')),
      y: Number(key('s', 'arrowdown') || this.held.has('down')) - Number(key('w', 'arrowup') || this.held.has('up')),
      suck: this.down || key(' '), turn: Number(key('e')) - Number(key('q')),
      aim: this.pointer ? { x: this.pointer.x + camera.x, y: this.pointer.y + camera.y } : null };
  }
}
