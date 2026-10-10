export const WORLD = { width: 1600, height: 1000, captureRadius: 28, maxEnemies: 300 };
export const UPGRADES = [
  { id: 'suctionRange', name: '長い缶', english: 'LONG CAN', icon: '↗', base: 15, growth: 1.5, max: 15 },
  { id: 'suctionPower', name: '強い缶', english: 'STRONG CAN', icon: '»', base: 20, growth: 1.55, max: 20 },
  { id: 'suctionAngle', name: '広い缶', english: 'WIDE CAN', icon: '◔', base: 30, growth: 1.6, max: 14 },
  { id: 'movementSpeed', name: '速い缶', english: 'FAST CAN', icon: '↝', base: 25, growth: 1.5, max: 12 },
  { id: 'moreCans', name: 'もっと缶！', english: 'MORE CANS!', icon: '⁙', base: 35, growth: 1.75, max: 20 },
  { id: 'canValue', name: '価値ある缶', english: 'VALUABLE CANS', icon: '★', base: 50, growth: 1.9, max: 30 },
];
export const PERMANENT = [
  { id: 'betterCan', name: '缶の目利き', english: 'CAN CONNOISSEUR', icon: '✦', max: 20, description: '1レベルごとに獲得量×1.25。今回の価値強化にも掛かります。' },
  { id: 'startingCapital', name: '再出発の軍資金', english: 'CAN STARTER FUND', icon: '▣', max: 20, description: '開始資金は150×Lv² CANS。購入時にも増えた分を即受け取れます。' },
  { id: 'vacuumTalent', name: '吸引の才能', english: 'BORN TO CAN', icon: '◔', max: 10, description: '射程+15px・吸引速度+20px/秒・扇形の広さ+6°。購入後すぐ、毎回の初期性能が上がります。' },
  { id: 'canGathering', name: '缶の呼び水', english: 'CANS COME TO YOU', icon: '⁙', max: 10, description: '1レベルごとに缶の密度×1.2。「もっと缶！」にも掛かります。' },
];
export const MILESTONES = [
  { amount: 10, label: '最初の10 CANSを集めよう', message: '10 CANS！15で「長い缶」が買えるよ。' },
  { amount: 100, label: '100 CANSで、CAN CAN CAN!', message: 'CAN CAN CAN! 100 CANS達成！' },
  { amount: 1000, label: '1,000 CANSで転生を解放', message: '転生と永久強化を解放！新しい缶人生へ。' },
  { amount: 10000, label: '次の野望は10,000 CANS', message: '10,000 CANS！小さな缶も大きな工場へ。' },
  { amount: 100000, label: '100,000 CANSで CAN’T STOP!', message: 'CAN’T STOP! 100,000 CANSの実績達成！' },
];
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const MAX_NUMBER = Number.MAX_SAFE_INTEGER;
export function createState(reducedMotion = false) {
  return { version: 1, cans: 0, runTotalCanned: 0, lifetimeCanned: 0, canDo: 0,
    upgradeLevels: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    permanentLevels: Object.fromEntries(PERMANENT.map(u => [u.id, 0])), milestones: {},
    settings: { sound: false, sfxVolume: .5, particles: !reducedMotion, screenShake: !reducedMotion },
    player: { x: 800, y: 500, angle: 0 } };
}
function finite(value, fallback, max = MAX_NUMBER) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(value, max) : fallback;
}
export function sanitizeState(raw, reducedMotion = false) {
  const state = createState(reducedMotion);
  if (!raw || raw.version !== 1) return state;
  for (const key of ['cans', 'runTotalCanned', 'lifetimeCanned', 'canDo']) state[key] = finite(raw[key], 0);
  state.canDo = Math.floor(state.canDo);
  for (const [defs, key] of [[UPGRADES, 'upgradeLevels'], [PERMANENT, 'permanentLevels']]) {
    for (const u of defs) state[key][u.id] = Math.floor(finite(raw[key]?.[u.id], 0, u.max));
  }
  for (const m of MILESTONES) if (raw.milestones?.[m.amount] === true || state.runTotalCanned >= m.amount) state.milestones[m.amount] = true;
  for (const key of ['sound', 'particles', 'screenShake']) if (typeof raw.settings?.[key] === 'boolean') state.settings[key] = raw.settings[key];
  state.settings.sfxVolume = finite(raw.settings?.sfxVolume, .5, 1);
  state.player.x = clamp(finite(raw.player?.x, 800), 28, WORLD.width - 28);
  state.player.y = clamp(finite(raw.player?.y, 500), 28, WORLD.height - 28);
  state.player.angle = typeof raw.player?.angle === 'number' && Number.isFinite(raw.player.angle) ? raw.player.angle % (Math.PI * 2) : 0;
  return state;
}
export function permanentEffects(levels) {
  const talent = levels.vacuumTalent || 0;
  return { multiplier: 1.25 ** levels.betterCan, capital: 150 * levels.startingCapital ** 2,
    range: 15 * talent, power: 20 * talent, halfAngle: 3 * talent * Math.PI / 180,
    densityMultiplier: 1.2 ** (levels.canGathering || 0) };
}
export function stats(state) {
  const l = state.upgradeLevels, p = state.permanentLevels;
  const permanent = permanentEffects(p);
  const target = Math.ceil(25 * 1.25 ** l.moreCans * permanent.densityMultiplier);
  return { range: 150 + 20 * l.suctionRange + permanent.range, power: 260 + 45 * l.suctionPower + permanent.power,
    halfAngle: (35 + 5 * l.suctionAngle) * Math.PI / 180 + permanent.halfAngle, speed: 230 + 15 * l.movementSpeed,
    target, physical: Math.min(WORLD.maxEnemies, target), represented: Math.max(1, target / WORLD.maxEnemies),
    multiplier: 1.3 ** l.canValue * permanent.multiplier, capital: permanent.capital };
}
export function cost(def, level, permanent = false) { return permanent ? 1 + level : Math.ceil(def.base * def.growth ** level); }
export function buy(state, id, permanent = false) {
  if (permanent && !state.milestones[1000]) return false;
  const def = (permanent ? PERMANENT : UPGRADES).find(u => u.id === id);
  if (!def) return false;
  const levels = permanent ? state.permanentLevels : state.upgradeLevels;
  const currency = permanent ? 'canDo' : 'cans', price = cost(def, levels[id], permanent);
  if (levels[id] >= def.max || state[currency] < price) return false;
  const oldCapital = permanent && id === 'startingCapital' ? permanentEffects(levels).capital : 0;
  state[currency] -= price; levels[id]++;
  if (permanent && id === 'startingCapital') state.cans = Math.min(MAX_NUMBER, state.cans + permanentEffects(levels).capital - oldCapital);
  return true;
}
export function prestigeGain(state) { return state.runTotalCanned >= 1000 ? Math.floor(Math.sqrt(state.runTotalCanned / 1000)) : 0; }
export function prestige(state) {
  const gain = prestigeGain(state);
  if (!gain) return false;
  state.canDo = Math.min(MAX_NUMBER, state.canDo + gain);
  state.upgradeLevels = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));
  state.cans = permanentEffects(state.permanentLevels).capital; state.runTotalCanned = 0;
  state.player = { x: 800, y: 500, angle: 0 }; return true;
}
export function format(n) {
  for (const [size, suffix] of [[1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) {
    if (n >= size) return `${(n / size).toFixed(1)}${suffix}`;
  }
  return n < 10 && n % 1 > .001 ? n.toFixed(1) : Math.floor(n).toLocaleString('ja-JP');
}
export function inCone(player, enemy, s) {
  const dx = enemy.x - player.x, dy = enemy.y - player.y, distance = Math.hypot(dx, dy);
  const difference = Math.atan2(Math.sin(Math.atan2(dy, dx) - player.angle), Math.cos(Math.atan2(dy, dx) - player.angle));
  return distance <= s.range && (distance <= 2 || Math.abs(difference) <= s.halfAngle);
}
export class Game {
  constructor(state, random = Math.random) {
    this.state = state; this.random = random; this.enemies = []; this.effects = []; this.time = 0; this.samples = []; this.sucking = false; this.burst = 0;
    this.refill(true);
  }
  spawn(initial = false) {
    const p = this.state.player;
    let x, y;
    for (let attempt = 0; attempt < 20; attempt++) {
      const angle = this.random() * Math.PI * 2, distance = (initial ? 85 : 185) + this.random() * 250;
      x = clamp(p.x + Math.cos(angle) * distance, 35, WORLD.width - 35);
      y = clamp(p.y + Math.sin(angle) * distance, 35, WORLD.height - 35);
      if (Math.hypot(x - p.x, y - p.y) >= (initial ? 80 : 160)) break;
      if (attempt === 19) {
        const inward = Math.atan2(WORLD.height / 2 - p.y, WORLD.width / 2 - p.x);
        x = p.x + Math.cos(inward) * 220; y = p.y + Math.sin(inward) * 220;
      }
    }
    return { x, y,
      heading: this.random() * Math.PI * 2, timer: 1 + this.random() * 3, color: Math.floor(this.random() * 4), phase: this.random() * 6, pulled: false, representedCount: stats(this.state).represented };
  }
  refill(initial = false) {
    const s = stats(this.state);
    while (this.enemies.length < s.physical) this.enemies.push(this.spawn(initial));
    for (const enemy of this.enemies) enemy.representedCount = s.represented;
  }
  rate() { return this.samples.reduce((sum, sample) => sum + sample.value, 0) / 5; }
  update(dt, input) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .05);
    const state = this.state, p = state.player, s = stats(state), events = [];
    this.time += dt; this.burst = Math.max(0, this.burst - dt * 7);
    const length = Math.hypot(input.x || 0, input.y || 0);
    if (length) {
      p.x = clamp(p.x + input.x / Math.max(1, length) * s.speed * dt, 28, WORLD.width - 28);
      p.y = clamp(p.y + input.y / Math.max(1, length) * s.speed * dt, 28, WORLD.height - 28);
    }
    if (input.aim) p.angle = Math.atan2(input.aim.y - p.y, input.aim.x - p.x);
    if (input.turn) p.angle += input.turn * dt * 2.8;
    this.sucking = !!input.suck;
    let earned = 0, captured = 0;
    for (const enemy of this.enemies) {
      enemy.pulled = false; enemy.timer -= dt;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) > 670) Object.assign(enemy, this.spawn());
      if (enemy.timer <= 0) { enemy.heading = this.random() * Math.PI * 2; enemy.timer = 1 + this.random() * 3; }
      if (this.sucking && inCone(p, enemy, s)) {
        enemy.pulled = true;
        const dx = p.x - enemy.x, dy = p.y - enemy.y, distance = Math.hypot(dx, dy);
        const step = Math.min(s.power * dt, distance);
        if (distance > 0) { enemy.x += dx / distance * step; enemy.y += dy / distance * step; }
        if (distance - step <= WORLD.captureRadius) {
          enemy.captured = true; const value = enemy.representedCount * s.multiplier; earned += value; captured++;
          if (state.settings.particles && this.effects.length < 55) this.effects.push({ x: enemy.x, y: enemy.y, fromX: enemy.x, fromY: enemy.y, color: enemy.color, value, age: 0, life: .75 });
        }
      } else {
        enemy.x += Math.cos(enemy.heading) * 24 * dt; enemy.y += Math.sin(enemy.heading) * 24 * dt;
        if (enemy.x < 30 || enemy.x > WORLD.width - 30 || enemy.y < 30 || enemy.y > WORLD.height - 30) enemy.heading += Math.PI;
        enemy.x = clamp(enemy.x, 30, WORLD.width - 30); enemy.y = clamp(enemy.y, 30, WORLD.height - 30);
      }
    }
    if (captured) {
      for (const key of ['cans', 'runTotalCanned', 'lifetimeCanned']) state[key] = Math.min(MAX_NUMBER, state[key] + earned);
      this.samples.push({ time: this.time, value: earned }); this.burst = Math.min(4, this.burst + captured * .4);
      events.push({ type: 'capture', count: captured, value: earned });
    }
    this.enemies = this.enemies.filter(e => !e.captured); this.refill();
    this.samples = this.samples.filter(sample => this.time - sample.time < 5);
    for (const m of MILESTONES) if (!state.milestones[m.amount] && state.runTotalCanned >= m.amount) {
      state.milestones[m.amount] = true; events.push({ type: 'milestone', message: m.message });
    }
    for (const effect of this.effects) effect.age += dt;
    this.effects = this.effects.filter(effect => effect.age < effect.life);
    return events;
  }
}
