import { WORLD, CAN_TYPES, RARE_CANS, stats, format, clamp } from './engine.mjs';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.width = 0; this.height = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)'); this.palette();
    new MutationObserver(() => this.palette()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
  }
  palette() {
    const css = getComputedStyle(document.documentElement);
    this.colors = Object.fromEntries(['bg', 'surface', 'surface-soft', 'text', 'muted', 'border', 'primary', 'on-primary', 'accent', 'accent-strong', 'dot'].map(name => [name, css.getPropertyValue(`--${name}`).trim()]));
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  camera(player) { return { x: clamp(player.x - this.width / 2, 0, Math.max(0, WORLD.width - this.width)), y: clamp(player.y - this.height / 2, 0, Math.max(0, WORLD.height - this.height)) }; }
  can(x, y, size, color, angle = 0, player = false, open = false, represented = 1, mark = 'C') {
    const c = this.ctx, p = this.colors;
    c.save(); c.translate(x, y); c.rotate(angle); c.lineWidth = player ? 2.5 : 1.5;
    c.fillStyle = p.text; c.globalAlpha = .1; c.beginPath(); c.ellipse(0, size * .6, size * .65, size * .24, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    if (player) { c.fillStyle = p.text; c.fillRect(-size * .42, size * .48, size * .25, size * .23); c.fillRect(size * .18, size * .48, size * .25, size * .23); }
    c.fillStyle = color; c.strokeStyle = p.text;
    c.beginPath(); c.roundRect(-size * .55, -size * .65, size * 1.1, size * 1.24, size * .16); c.fill(); c.stroke();
    c.fillStyle = p.surface; c.beginPath(); c.ellipse(0, -size * .56, size * .55, size * .16, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(0, size * .48, size * .55, size * .12, 0, 0, Math.PI); c.stroke();
    c.fillStyle = p.text; c.beginPath(); c.ellipse(0, -size * .56, size * .16, size * .055, -.3, 0, Math.PI * 2); c.fill();
    if (player) {
      if (mark !== 'C') { c.fillStyle = p.surface; c.beginPath(); c.roundRect(-size * .4, -size * .36, size * .8, size * .75, size * .08); c.fill(); c.fillStyle = p.text; }
      c.font = `900 ${size * .24}px system-ui`; c.textAlign = 'center'; c.fillText(mark === 'C' ? 'CAN!' : mark, 0, -size * .17);
      c.beginPath(); c.arc(-size * .2, size * .09, size * .065, 0, Math.PI * 2); c.arc(size * .2, size * .09, size * .065, 0, Math.PI * 2); c.fill();
      c.lineWidth = 1.7; c.beginPath(); c.arc(0, size * .16, size * .13, 0, Math.PI); c.stroke();
      if (open) { c.save(); c.translate(size * .1, -size * .65); c.rotate(-.65); c.fillStyle = p.surface; c.beginPath(); c.ellipse(0, 0, size * .56, size * .15, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore(); }
    } else {
      c.fillStyle = p.surface; c.globalAlpha = .75; c.fillRect(-size * .35, -size * .16, size * .7, size * .4); c.globalAlpha = 1;
      c.fillStyle = p.text; c.font = `800 ${size * .4}px system-ui`; c.textAlign = 'center'; c.fillText(mark === 'C' && represented > 1 ? '×' : mark, 0, size * .17);
      if (mark === 'H') { c.lineWidth = 3; c.beginPath(); c.moveTo(-size * .43, size * .34); c.lineTo(size * .43, size * .34); c.stroke(); }
      if (mark === '★') { c.lineWidth = 2; c.beginPath(); c.moveTo(-size * .43, -size * .24); c.lineTo(size * .43, -size * .24); c.stroke(); }
    }
    c.restore();
  }
  draw(game) {
    const c = this.ctx, colors = this.colors, p = game.state.player, s = stats(game.state), camera = this.camera(p);
    c.clearRect(0, 0, this.width, this.height); c.fillStyle = colors.bg; c.fillRect(0, 0, this.width, this.height);
    c.save();
    const shake = game.state.settings.screenShake && !this.reduced.matches ? game.burst : 0;
    c.translate(-camera.x + Math.sin(game.time * 55) * shake, -camera.y + Math.cos(game.time * 49) * shake);
    c.fillStyle = colors['surface-soft']; c.fillRect(0, 0, WORLD.width, WORLD.height);
    c.fillStyle = colors.border;
    const startX = Math.max(0, Math.floor(camera.x / 48) * 48), startY = Math.max(0, Math.floor(camera.y / 48) * 48);
    for (let x = startX; x <= Math.min(WORLD.width, camera.x + this.width); x += 48) for (let y = startY; y <= Math.min(WORLD.height, camera.y + this.height); y += 48) { c.beginPath(); c.arc(x, y, 1.4, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = colors.border; c.lineWidth = 4; c.strokeRect(12, 12, WORLD.width - 24, WORLD.height - 24);
    if (game.sucking) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
      c.fillStyle = colors.primary; c.globalAlpha = this.reduced.matches ? .09 : .13;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s.range, -s.halfAngle, s.halfAngle); c.closePath(); c.fill();
      c.globalAlpha = .6; c.strokeStyle = colors.primary; c.lineWidth = 1.5; c.setLineDash([5, 7]); c.stroke(); c.setLineDash([]);
      if (!this.reduced.matches) {
        for (let i = 0; i < 7; i++) {
          const a = -s.halfAngle + s.halfAngle * 2 * i / 6, r = (1 - ((game.time * 1.7 + i * .13) % 1)) * s.range;
          c.globalAlpha = .3; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a) * Math.max(25, r - 18), Math.sin(a) * Math.max(25, r - 18)); c.stroke();
        }
      }
      c.restore();
    } else {
      c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.strokeStyle = colors.primary; c.globalAlpha = .4; c.lineWidth = 2;
      c.beginPath(); c.moveTo(39, -5); c.lineTo(46, 0); c.lineTo(39, 5); c.stroke(); c.restore();
    }
    const canColors = [colors.accent, colors.dot, colors.primary, colors['accent-strong']];
    const canColor = enemy => enemy.kind === 'gold' ? colors.accent : enemy.kind === 'heavy' ? colors.muted : enemy.kind === 'magnet' ? colors.primary : canColors[enemy.color];
    for (const enemy of game.enemies) {
      if (enemy.x < camera.x - 30 || enemy.x > camera.x + this.width + 30 || enemy.y < camera.y - 30 || enemy.y > camera.y + this.height + 30) continue;
      const tilt = enemy.pulled && !this.reduced.matches ? Math.sin(game.time * 40 + enemy.phase) * .15 : Math.sin(enemy.heading) * .08;
      const rare = RARE_CANS.find(def => def.id === enemy.rare);
      const size = (enemy.kind === 'heavy' || rare ? 23 : 17) + Math.min(6, Math.log2(enemy.representedCount));
      this.can(enemy.x, enemy.y, size, rare ? colors[rare.color] : canColor(enemy), tilt, false, false, enemy.representedCount, rare?.mark || CAN_TYPES[enemy.kind || 'normal'].mark);
      if (rare) {
        c.save(); c.strokeStyle = colors[rare.color]; c.lineWidth = 1.5;
        const radius = size + 10; c.beginPath(); c.moveTo(enemy.x, enemy.y - radius); c.lineTo(enemy.x + radius, enemy.y); c.lineTo(enemy.x, enemy.y + radius); c.lineTo(enemy.x - radius, enemy.y); c.closePath(); c.stroke(); c.restore();
      }
      if (enemy.magnetTime > 0 || enemy.kind === 'magnet') {
        c.save(); c.strokeStyle = colors.primary; c.globalAlpha = .55; c.lineWidth = 1.5; c.setLineDash([3, 4]);
        c.beginPath(); c.arc(enemy.x, enemy.y, size + 10, 0, Math.PI * 2); c.stroke(); c.restore();
      }
    }
    if (game.state.settings.particles) for (const e of game.effects) {
      c.save();
      if (e.age < .16 && !this.reduced.matches) {
        const t = e.age / .16, rare = RARE_CANS.find(def => def.id === e.rare); this.can(e.fromX + (p.x - e.fromX) * t, e.fromY + (p.y - e.fromY) * t, 17 * (1 - t), rare ? colors[rare.color] : canColors[e.color], 0, false, false, 1, rare?.mark || 'C');
      }
      c.globalAlpha = Math.max(0, 1 - e.age / e.life); c.fillStyle = colors.text; c.textAlign = 'center'; c.font = '800 14px system-ui';
      c.fillText(`+${format(e.value)}`, e.x, e.y - 25 - (this.reduced.matches ? 0 : e.age * 42));
      if (!this.reduced.matches) { c.fillStyle = colors.accent; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + e.age; c.fillRect(e.x + Math.cos(a) * e.age * 65, e.y + Math.sin(a) * e.age * 65, 3, 3); } }
      c.restore();
    }
    const bounce = !this.reduced.matches && game.sucking ? Math.sin(game.time * 16) * .03 : 0;
    const skin = RARE_CANS.find(def => def.id === game.state.canSkin);
    this.can(p.x, p.y, 29, skin ? colors[skin.color] : colors['accent-strong'], bounce, true, game.sucking, 1, skin?.label || 'C');
    c.restore();
  }
}
