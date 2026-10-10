export const WORLD = { width: 1600, height: 1000, captureRadius: 28, maxEnemies: 300 };
export const VALUE_GROWTH = 1.15;
export const CAN_TYPES = {
  normal: { name: 'ふつう缶', mark: 'C', value: 1, pull: 1, research: 0, description: 'いつもの缶。まずはここから。' },
  gold: { name: '金缶', mark: '★', value: 5, pull: 1, research: 1, description: '獲得量5倍。見つけたら狙おう！' },
  heavy: { name: '重量缶', mark: 'H', value: 3, pull: .45, research: 2, description: '獲得量3倍、吸引速度45%。じっくり吸う価値あり。' },
  magnet: { name: '磁石缶', mark: 'U', value: 1, pull: 1, research: 3, description: '捕獲すると半径135pxの近くの5缶を0.8秒間引き寄せる。' },
};
export const RARE_CANS = [
  { id: 'soda', name: 'サイダー缶', mark: 'S', label: 'SODA', color: 'primary', chance: .0012, rarity: 'レア', hint: 'しゅわしゅわの青い缶。', story: '小さな泡に、大きな野望。今日もすっきり缶日和。' },
  { id: 'peach', name: '桃缶', mark: 'P', label: 'PEACH', color: 'accent-strong', chance: .0004, rarity: 'レア', hint: '甘い香りのまあるい缶。', story: 'やさしい甘さをぎゅっと缶詰に。中身はひみつ。' },
  { id: 'coffee', name: 'コーヒー缶', mark: 'B', label: 'BREW', color: 'muted', chance: .0001, rarity: 'レア', hint: 'ほろ苦い大人の缶。', story: '眠れない缶工場の相棒。深煎りの缶生をどうぞ。' },
  { id: 'star', name: '星くず缶', mark: '✦', label: 'STAR', color: 'accent', chance: .00003, rarity: 'スーパーレア', hint: '夜空のかけらを集めた缶。', story: '星をひとつずつ拾って閉じ込めた、きらめく缶詰。' },
  { id: 'aurora', name: 'オーロラ缶', mark: 'A', label: 'AURA', color: 'dot', chance: .000003, rarity: 'スーパーレア', hint: '遠い空から来た光の缶。', story: '空を流れる光のリボン。缶のふたを開けずに眺めよう。' },
  { id: 'cosmic', name: '宇宙缶', mark: '∞', label: 'SPACE', color: 'primary', chance: .0000005, rarity: 'ウルトラレア', hint: '果てしない世界を詰めた缶。', story: 'この小さな缶に、まだ見ぬ宇宙が広がっている。' },
];
export function rollRareCan(random = Math.random) {
  const roll = random(); let end = 0;
  for (const def of RARE_CANS) { end += def.chance; if (roll < end) return def.id; }
  return null;
}
export function selectCanSkin(state, id) {
  if (id !== 'classic' && (!RARE_CANS.some(def => def.id === id) || !state.rareCollection[id])) return false;
  state.canSkin = id; return true;
}
export const UPGRADES = [
  { id: 'suctionRange', name: '長い缶', english: 'LONG CAN', icon: '↗', base: 15, growth: 1.5, max: 15 },
  { id: 'suctionPower', name: '強い缶', english: 'STRONG CAN', icon: '»', base: 20, growth: 1.55, max: 20 },
  { id: 'suctionAngle', name: '広い缶', english: 'WIDE CAN', icon: '◔', base: 30, growth: 1.6, max: 14 },
  { id: 'movementSpeed', name: '速い缶', english: 'FAST CAN', icon: '↝', base: 25, growth: 1.5, max: 12 },
  { id: 'moreCans', name: 'もっと缶！', english: 'MORE CANS!', icon: '⁙', base: 35, growth: 1.75, max: 20 },
  { id: 'canValue', name: '価値ある缶', english: 'VALUABLE CANS', icon: '★', base: 100, growth: 2, max: 30 },
];
export const PERMANENT = [
  { id: 'betterCan', name: '缶の目利き', english: 'CAN CONNOISSEUR', icon: '✦', max: 20, description: '1レベルごとに獲得量×1.25。今回の価値強化にも掛かります。' },
  { id: 'startingCapital', name: '再出発の軍資金', english: 'CAN STARTER FUND', icon: '▣', max: 20, description: '開始資金は150×Lv² CANS。購入時にも増えた分を即受け取れます。' },
  { id: 'vacuumTalent', name: '吸引の才能', english: 'BORN TO CAN', icon: '◔', max: 10, description: '射程+15px・吸引速度+20px/秒・扇形の広さ+6°。購入後すぐ、毎回の初期性能が上がります。' },
  { id: 'canGathering', name: '缶の呼び水', english: 'CANS COME TO YOU', icon: '⁙', max: 10, description: '1レベルごとに缶の密度×1.2。「もっと缶！」にも掛かります。' },
  { id: 'canResearch', name: '缶の研究所', english: 'CAN DISCOVERY LAB', icon: '⚗', max: 3, prices: [5, 15, 35], description: 'CAN DOで金缶→重量缶→磁石缶を順に解放。転生しても研究は残ります。' },
];
export const MILESTONES = [
  { amount: 10, label: '最初の10 CANSを集めよう', message: '10 CANS！15で「長い缶」が買えるよ。' },
  { amount: 100, label: '100 CANSで、CAN CAN CAN!', message: 'CAN CAN CAN! 100 CANS達成！' },
  { amount: 1000, label: '1,000 CANSで転生を解放', message: '転生と永久強化を解放！新しい缶人生へ。' },
  { amount: 10000, label: '次の野望は10,000 CANS', message: '10,000 CANS！小さな缶も大きな工場へ。' },
  { amount: 100000, label: '100,000 CANSで CAN’T STOP!', message: 'CAN’T STOP! 100,000 CANSの実績達成！' },
  { amount: 1000000, label: '100万 CANSで ミリオン缶パニー', message: 'ミリオン缶パニー！100万 CANS達成！' },
  { amount: 10000000, label: '1,000万 CANSで 缶の大企業', message: '缶の大企業！1,000万 CANS達成！' },
  { amount: 100000000, label: '1億 CANSで 缶の惑星', message: '缶の惑星！1億 CANS達成！' },
  { amount: 1000000000, label: '10億 CANSで 缶の銀河', message: '缶の銀河！10億 CANS達成！まだまだ缶人生は続く。' },
];
export const ACHIEVEMENTS = [
  { id: 'reborn', name: 'はじめての再出発', target: 1, metric: 'prestiges', description: '転生1回' },
  { id: 'veteran', name: '缶人生のベテラン', target: 10, metric: 'prestiges', description: '転生10回' },
  { id: 'eternal', name: '何度でも缶！', target: 25, metric: 'prestiges', description: '転生25回' },
  { id: 'goldCollector', name: 'きらめくコレクター', target: 25, metric: 'gold', description: '金缶を25個捕獲' },
  { id: 'heavyCollector', name: 'ヘビーな缶職人', target: 50, metric: 'heavy', description: '重量缶を50個捕獲' },
  { id: 'magnetCollector', name: '引き寄せの達人', target: 25, metric: 'magnet', description: '磁石缶を25個捕獲' },
];
export function achievementValue(state, def) { return def.metric === 'prestiges' ? state.prestigeCount : state.collection[def.metric]; }
export function nextMilestone(state) { return MILESTONES.find(m => state.runTotalCanned < m.amount); }
export function collectAchievements(state) {
  const events = [];
  for (const def of ACHIEVEMENTS) if (!state.achievements[def.id] && achievementValue(state, def) >= def.target) {
    state.achievements[def.id] = true; events.push({ type: 'milestone', message: `実績：${def.name}！` });
  }
  return events;
}
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const MAX_NUMBER = Number.MAX_SAFE_INTEGER;
export function createState(reducedMotion = false) {
  return { version: 1, cans: 0, runTotalCanned: 0, lifetimeCanned: 0, canDo: 0,
    upgradeLevels: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    permanentLevels: Object.fromEntries(PERMANENT.map(u => [u.id, 0])), milestones: {}, achievements: {}, prestigeCount: 0,
    collection: Object.fromEntries(Object.keys(CAN_TYPES).map(id => [id, 0])),
    rareCollection: Object.fromEntries(RARE_CANS.map(def => [def.id, 0])), canSkin: 'classic',
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
  state.prestigeCount = Math.floor(finite(raw.prestigeCount, 0));
  for (const id of Object.keys(CAN_TYPES)) state.collection[id] = Math.floor(finite(raw.collection?.[id], 0));
  for (const def of RARE_CANS) state.rareCollection[def.id] = Math.floor(finite(raw.rareCollection?.[def.id], 0));
  selectCanSkin(state, raw.canSkin);
  for (const [defs, key] of [[UPGRADES, 'upgradeLevels'], [PERMANENT, 'permanentLevels']]) {
    for (const u of defs) state[key][u.id] = Math.floor(finite(raw[key]?.[u.id], 0, u.max));
  }
  for (const m of MILESTONES) if (raw.milestones?.[m.amount] === true || state.runTotalCanned >= m.amount) state.milestones[m.amount] = true;
  for (const def of ACHIEVEMENTS) if (raw.achievements?.[def.id] === true || achievementValue(state, def) >= def.target) state.achievements[def.id] = true;
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
    multiplier: VALUE_GROWTH ** l.canValue * permanent.multiplier, capital: permanent.capital };
}
export function cost(def, level, permanent = false) {
  if (!permanent) return Math.ceil(def.base * def.growth ** level);
  return def.prices?.[level] ?? ((def.id === 'startingCapital' ? 1 : 2) + 2 * level);
}
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
export function prestigeGain(state) { return state.runTotalCanned >= 1000 ? Math.floor(Math.cbrt(state.runTotalCanned / 1000)) : 0; }
export function prestigeNextAt(state) { return 1000 * (prestigeGain(state) + 1) ** 3; }
export function prestige(state) {
  const gain = prestigeGain(state);
  if (!gain) return false;
  state.canDo = Math.min(MAX_NUMBER, state.canDo + gain);
  state.upgradeLevels = Object.fromEntries(UPGRADES.map(u => [u.id, 0]));
  state.cans = permanentEffects(state.permanentLevels).capital; state.runTotalCanned = 0;
  state.prestigeCount = Math.min(MAX_NUMBER, state.prestigeCount + 1);
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
    const kind = this.rollKind();
    return { x, y,
      heading: this.random() * Math.PI * 2, timer: 1 + this.random() * 3, color: Math.floor(this.random() * 4), phase: this.random() * 6, pulled: false,
      kind, rare: kind === 'normal' ? rollRareCan(this.random) : null, magnetTime: 0, representedCount: stats(this.state).represented };
  }
  rollKind() {
    const level = this.state.permanentLevels.canResearch || 0, roll = this.random();
    if (level >= 1 && roll < .04) return 'gold';
    if (level >= 2 && roll >= .04 && roll < .12) return 'heavy';
    if (level >= 3 && roll >= .12 && roll < .17) return 'magnet';
    return 'normal';
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
    let earned = 0, captured = 0; const magnets = [];
    for (const enemy of this.enemies) {
      enemy.pulled = false; enemy.timer -= dt;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) > 670) Object.assign(enemy, this.spawn());
      if (enemy.timer <= 0) { enemy.heading = this.random() * Math.PI * 2; enemy.timer = 1 + this.random() * 3; }
      const chained = enemy.magnetTime > 0;
      enemy.magnetTime = Math.max(0, (enemy.magnetTime || 0) - dt);
      const type = CAN_TYPES[enemy.kind || 'normal'];
      if (chained || (this.sucking && inCone(p, enemy, s))) {
        enemy.pulled = true;
        const dx = p.x - enemy.x, dy = p.y - enemy.y, distance = Math.hypot(dx, dy);
        const step = Math.min(s.power * type.pull * dt, distance);
        if (distance > 0) { enemy.x += dx / distance * step; enemy.y += dy / distance * step; }
        if (distance - step <= WORLD.captureRadius) {
          enemy.captured = true; const value = enemy.representedCount * s.multiplier * type.value; earned += value; captured++;
          const kind = enemy.kind || 'normal'; state.collection[kind] = Math.min(MAX_NUMBER, state.collection[kind] + 1);
          const rare = RARE_CANS.find(def => def.id === enemy.rare);
          if (rare) {
            if (!state.rareCollection[rare.id]) events.push({ type: 'discovery', id: rare.id, name: rare.name });
            state.rareCollection[rare.id] = Math.min(MAX_NUMBER, state.rareCollection[rare.id] + 1);
          }
          if (kind === 'magnet') magnets.push({ x: enemy.x, y: enemy.y });
          if (state.settings.particles && this.effects.length < 55) this.effects.push({ x: enemy.x, y: enemy.y, fromX: enemy.x, fromY: enemy.y, color: enemy.color, rare: enemy.rare, value, age: 0, life: .75 });
        }
      } else {
        enemy.x += Math.cos(enemy.heading) * 24 * dt; enemy.y += Math.sin(enemy.heading) * 24 * dt;
        if (enemy.x < 30 || enemy.x > WORLD.width - 30 || enemy.y < 30 || enemy.y > WORLD.height - 30) enemy.heading += Math.PI;
        enemy.x = clamp(enemy.x, 30, WORLD.width - 30); enemy.y = clamp(enemy.y, 30, WORLD.height - 30);
      }
    }
    for (const magnet of magnets) {
      const nearby = this.enemies.filter(e => !e.captured && Math.hypot(e.x - magnet.x, e.y - magnet.y) <= 135)
        .sort((a, b) => Math.hypot(a.x - magnet.x, a.y - magnet.y) - Math.hypot(b.x - magnet.x, b.y - magnet.y)).slice(0, 5);
      for (const enemy of nearby) enemy.magnetTime = .8;
      if (nearby.length) events.push({ type: 'magnet', count: nearby.length });
    }
    if (captured) {
      for (const key of ['cans', 'runTotalCanned', 'lifetimeCanned']) state[key] = Math.min(MAX_NUMBER, state[key] + earned);
      this.samples.push({ time: this.time, value: earned }); this.burst = Math.min(4, this.burst + captured * .4);
      events.push({ type: 'capture', count: captured, representedCount: captured * s.represented, value: earned });
    }
    this.enemies = this.enemies.filter(e => !e.captured); this.refill();
    this.samples = this.samples.filter(sample => this.time - sample.time < 5);
    for (const m of MILESTONES) if (!state.milestones[m.amount] && state.runTotalCanned >= m.amount) {
      state.milestones[m.amount] = true; events.push({ type: 'milestone', message: m.message });
    }
    events.push(...collectAchievements(state));
    for (const effect of this.effects) effect.age += dt;
    this.effects = this.effects.filter(effect => effect.age < effect.life);
    return events;
  }
}
