// One drawing is shared by the field, player skins, particles and catalog portraits.
export function drawRareCan(c, def, p, size = 23, { player = false, open = false } = {}) {
  const shapes = { soda: [25, 74], peach: [29, 64], coffee: [23, 80], star: [26, 72], aurora: [24, 80], cosmic: [30, 66], matcha: [27, 70], lemon: [26, 72], honey: [30, 62], sakura: [25, 74], ocean: [26, 80], clockwork: [30, 68] };
  const [w, h] = shapes[def?.id] || [26, 72], top = -h / 2, bottom = h / 2;
  const ink = def ? p[def.color] : p.border;
  c.save(); c.scale(size / 40, size / 40); c.lineJoin = 'round'; c.lineCap = 'round';
  const line = (points, color = p.text, width = 1.5) => { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(...points[0]); for (const point of points.slice(1)) c.lineTo(...point); c.stroke(); };
  const circle = (x, y, r, fill, stroke = null, width = 1.5) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } };
  const ellipse = (x, y, rx, ry, fill, angle = 0, stroke = null) => { c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.3; c.stroke(); } };
  const star = (x, y, r, fill) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * .43 : r; i ? c.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius) : c.moveTo(x, y - radius); } c.closePath(); c.fillStyle = fill; c.fill(); };
  const leaf = (x, y, scale, angle, fill) => { c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale); c.beginPath(); c.moveTo(-9, 0); c.quadraticCurveTo(0, -12, 10, 0); c.quadraticCurveTo(0, 10, -9, 0); c.fillStyle = fill; c.fill(); line([[-6, 0], [7, 0]], p.surface, 1); c.restore(); };
  const wave = (y, color, width = 2) => { c.beginPath(); c.moveTo(-w - 3, y); for (let x = -w - 3; x < w; x += 16) c.bezierCurveTo(x + 4, y - 5, x + 12, y + 5, x + 16, y); c.strokeStyle = color; c.lineWidth = width; c.stroke(); };
  c.globalAlpha = .13; ellipse(3, bottom + 7, w + 6, 6, p.text); c.globalAlpha = 1;
  if (player) { c.fillStyle = p.text; c.fillRect(-w + 5, bottom - 2, 11, 12); c.fillRect(w - 16, bottom - 2, 11, 12); }
  const gradient = c.createLinearGradient(-w, 0, w, 0); gradient.addColorStop(0, ink); gradient.addColorStop(.3, p.surface); gradient.addColorStop(.45, ink); gradient.addColorStop(1, ink);
  c.beginPath(); c.roundRect(-w, top, w * 2, h, [8, 8, 6, 6]); c.fillStyle = gradient; c.fill(); c.strokeStyle = p.text; c.lineWidth = 2; c.stroke();
  c.save(); c.beginPath(); c.roundRect(-w + 1, top + 1, w * 2 - 2, h - 2, 7); c.clip();
  c.globalAlpha = .22; c.fillStyle = p.surface; c.fillRect(-w + 5, top, 3, h); c.globalAlpha = 1;
  if (def) {
    // A printed wrap sits beneath the emblem, with different patterns for every can.
    c.globalAlpha = .13;
    if (['coffee', 'matcha', 'clockwork'].includes(def.id)) for (let x = -w; x <= w; x += 6) line([[x, top + 7], [x, bottom - 5]], p.text, 1);
    else if (['soda', 'lemon', 'peach'].includes(def.id)) for (let y = top - 15; y < bottom + 15; y += 12) line([[-w, y], [w, y + 26]], p.surface, 5);
    else for (const [x, y] of [[-18, -25], [17, -21], [-20, 9], [20, 12], [-8, -30]]) star(x, y, 2, p.surface);
    c.globalAlpha = 1;
    switch (def.id) {
      case 'soda':
        wave(-14, p.dot, 7); wave(-9, p.surface, 2);
        for (const [x, y, r] of [[-14, -23, 4], [8, -20, 2.5], [15, -8, 5], [-6, 3, 3], [12, 8, 2]]) circle(x, y, r, null, p.surface, 2);
        star(-15, -7, 4, p.accent); break;
      case 'peach':
        c.beginPath(); c.moveTo(0, -20); c.bezierCurveTo(-21, -31, -25, 0, 0, 10); c.bezierCurveTo(25, 0, 21, -31, 0, -20); c.fillStyle = p.surface; c.fill(); c.strokeStyle = p.text; c.lineWidth = 1.5; c.stroke();
        c.beginPath(); c.moveTo(0, -17); c.quadraticCurveTo(-4, -4, 1, 5); c.strokeStyle = p['accent-strong']; c.lineWidth = 2; c.stroke();
        leaf(7, -23, .65, -.5, p.primary); circle(-10, -8, 2.5, p['accent-strong']); break;
      case 'coffee':
        ellipse(0, -7, 17, 22, p.surface, 0, p.text);
        for (const [x, y, a] of [[-5, -12, .45], [5, -3, -.3]]) { ellipse(x, y, 5, 8, p.primary, a); c.save(); c.translate(x, y); c.rotate(a); line([[0, -5], [-1, 0], [0, 5]], p.surface, 1.2); c.restore(); }
        for (const x of [-9, 0, 9]) { c.beginPath(); c.moveTo(x, -30); c.quadraticCurveTo(x - 4, -34, x, -38); c.strokeStyle = p.accent; c.lineWidth = 1.5; c.stroke(); } break;
      case 'star':
        line([[-18, -19], [-4, -25], [12, -14], [5, 5], [-14, 1]], p.primary, 1.5);
        for (const [x, y, r] of [[-18, -19, 3], [-4, -25, 4], [12, -14, 8], [5, 5, 4], [-14, 1, 3]]) { circle(x, y, r + 2, p.surface); star(x, y, r, p.primary); }
        break;
      case 'aurora':
        for (const [shift, color, width] of [[-8, p.primary, 9], [0, p['accent-strong'], 7], [7, p.accent, 4]]) { c.beginPath(); c.moveTo(-30, 7 + shift); c.bezierCurveTo(-13, -29 + shift, 10, 20 + shift, 32, -22 + shift); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
        star(-14, -27, 3, p.surface); star(14, 8, 3, p.surface); break;
      case 'cosmic':
        ellipse(0, -6, 24, 8, p.accent, -.4); circle(0, -6, 14, p.surface, p.text); circle(3, -9, 9, p.dot);
        c.beginPath(); c.ellipse(0, -6, 24, 8, -.4, 0, Math.PI); c.strokeStyle = p.accent; c.lineWidth = 3; c.stroke();
        star(-20, -25, 4, p.surface); star(20, 12, 3, p.surface); circle(20, -23, 2, p['accent-strong']); break;
      case 'matcha':
        for (const x of [-17, 17]) { line([[x, top], [x, 14]], p.primary, 4); for (const y of [-23, -9, 5]) line([[x - 3, y], [x + 3, y]], p.accent, 1.5); }
        circle(0, -6, 16, p.surface, p.text); leaf(-2, -7, 1, -.6, p.primary); leaf(5, -2, .65, .5, p.dot); line([[-7, 4], [7, -15]], p.primary, 1.5); break;
      case 'lemon':
        circle(0, -7, 18, p.surface, p.text); circle(0, -7, 14, p.accent);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line([[0, -7], [Math.cos(a) * 12, -7 + Math.sin(a) * 12]], p.surface, 2); }
        circle(0, -7, 2, p.surface); leaf(14, -23, .6, -.5, p.primary); break;
      case 'honey':
        for (const [x, y] of [[-14, -17], [0, -17], [14, -17], [-7, -5], [7, -5], [-14, 7], [14, 7]]) {
          c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; i ? c.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7) : c.moveTo(x + 7, y); } c.closePath(); c.strokeStyle = p.primary; c.lineWidth = 1.5; c.stroke();
        }
        ellipse(-4, -9, 5, 7, p.surface, -.6); ellipse(4, -9, 5, 7, p.surface, .6); ellipse(0, -3, 7, 5, p.accent, 0, p.text); line([[-2, -7], [-2, 1]], p.text, 2); circle(6, -3, 2, p.text); break;
      case 'sakura':
        line([[-25, 11], [0, -8], [23, -26]], p.primary, 2); line([[0, -8], [-10, -25]], p.primary, 1.5);
        for (const [x, y, r] of [[-9, -19, 7], [9, -12, 10], [21, -25, 5]]) { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ellipse(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, r * .55, r * .3, p.surface, a); } circle(x, y, 2, p.accent); }
        ellipse(-14, 4, 4, 2, p.surface, -.5); break;
      case 'ocean':
        for (const [y, color] of [[-24, p.dot], [-12, p.surface], [0, p.dot], [12, p.surface]]) wave(y, color, 2);
        ellipse(0, -7, 13, 8, p.surface, -.25, p.text); c.beginPath(); c.moveTo(10, -8); c.lineTo(20, -17); c.lineTo(20, -1); c.closePath(); c.fillStyle = p.accent; c.fill();
        circle(-6, -9, 2, p.text); for (const [x, y] of [[-15, -24], [-19, -16], [15, 7]]) circle(x, y, 2, null, p.accent, 1.5); break;
      case 'clockwork':
        c.save(); c.translate(0, -7); c.beginPath(); for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, r = i % 4 < 2 ? 21 : 17; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(r, 0); } c.closePath(); c.fillStyle = p.accent; c.fill(); c.strokeStyle = p.text; c.lineWidth = 1.3; c.stroke(); circle(0, 0, 13, p.surface, p.text); line([[0, -9], [0, 0], [7, 4]], p.primary, 2); circle(0, 0, 2, p['accent-strong']); c.restore();
        for (const x of [-24, 24]) for (const y of [-27, 20]) circle(x, y, 2, p.surface, p.text, 1); break;
    }
    // Footer typography and fine foil rules remain legible in the larger catalog view.
    line([[-w + 5, bottom - 16], [w - 5, bottom - 16]], p.surface, 1.2);
    if (!player) {
      c.fillStyle = p.surface; c.beginPath(); c.roundRect(-w + 5, bottom - 14, w * 2 - 10, 11, 3); c.fill();
      c.fillStyle = p.text; c.textAlign = 'center'; c.font = '900 7px system-ui'; c.fillText(size < 32 ? def.mark : def.label, 0, bottom - 6);
    } else {
      c.fillStyle = p.surface; c.beginPath(); c.roundRect(-14, bottom - 17, 28, 15, 5); c.fill();
      circle(-5, bottom - 12, 1.7, p.text); circle(5, bottom - 12, 1.7, p.text);
      c.beginPath(); c.arc(0, bottom - 10, 3, 0, Math.PI); c.strokeStyle = p.text; c.lineWidth = 1.4; c.stroke();
    }
  } else { c.fillStyle = p.surface; c.font = '900 27px system-ui'; c.textAlign = 'center'; c.fillText('?', 0, 10); }
  c.restore();
  // Rolled metal rims, pull tab and bottom seam.
  ellipse(0, top + 2, w, 6, p.surface, 0, p.text); ellipse(0, top + 2, w - 4, 3.5, p.border);
  ellipse(0, top + 1, 6, 2.5, p.text, -.3); ellipse(-1, top + .5, 2.5, 1, p.surface, -.3);
  c.beginPath(); c.ellipse(0, bottom - 3, w, 4, 0, 0, Math.PI); c.strokeStyle = p.text; c.lineWidth = 1.5; c.stroke();
  if (open) { c.save(); c.translate(3, top); c.rotate(-.6); ellipse(0, -2, w, 6, p.surface, 0, p.text); c.restore(); }
  c.restore();
}

export function drawCanPortrait(canvas, def, colors, found = true) {
  const ratio = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
  canvas.width = 100 * ratio; canvas.height = 132 * ratio;
  const c = canvas.getContext('2d'); c.setTransform(ratio, 0, 0, ratio, 0, 0); c.clearRect(0, 0, 100, 132);
  c.translate(50, 65); drawRareCan(c, found ? def : null, colors, 55);
}

export function artPalette() {
  const css = getComputedStyle(document.documentElement);
  return Object.fromEntries(['surface', 'text', 'border', 'primary', 'accent', 'accent-strong', 'dot', 'muted'].map(name => [name, css.getPropertyValue(`--${name}`).trim()]));
}
