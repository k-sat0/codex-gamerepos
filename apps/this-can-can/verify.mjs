import assert from 'node:assert/strict';
import { createState, sanitizeState, Game, stats, UPGRADES, PERMANENT, MILESTONES, nextMilestone, cost, buy, prestigeGain, prestigeNextAt, prestige, WORLD, inCone } from './src/engine.mjs';
import { readSave, writeSave, removeSave, SAVE_KEY } from './src/save.mjs';
import { synthesizeCapture, CAPTURE_NOTES } from './src/capture-sound.mjs';
import { Audio } from './src/audio.mjs';

let checks = 0;
function test(name, fn) { fn(); checks++; console.log(`✓ ${name}`); }
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < .00001, `${actual} ≈ ${expected}`); }
test('移動速度・斜め正規化・境界・巨大deltaTime制限', () => {
  const s = createState(), g = new Game(s, () => .5);
  g.update(10, { x: 1, y: 1 }); close(Math.hypot(s.player.x - 800, s.player.y - 500), 230 * .05);
  s.player.x = 1572; s.player.y = 972; g.update(.05, { x: 1, y: 1 }); assert.equal(s.player.x, 1572); assert.equal(s.player.y, 972);
});
test('扇形の向き・射程・角度', () => {
  const s = createState(), values = stats(s), p = s.player;
  assert.equal(inCone(p, { x: 900, y: 500 }, values), true);
  assert.equal(inCone(p, { x: 960, y: 500 }, values), false);
  assert.equal(inCone(p, { x: 800, y: 600 }, values), false);
  p.angle = Math.PI; assert.equal(inCone(p, { x: 700, y: 500 }, values), true);
});
test('端でも新しい缶がプレイヤー中心に出現しない', () => {
  for (const [x, y] of [[28, 28], [1572, 28], [28, 972], [1572, 972]]) {
    const s = createState(); s.player.x = x; s.player.y = y; const g = new Game(s, () => .5);
    for (let i = 0; i < 50; i++) { const e = g.spawn(); assert.ok(Math.hypot(e.x - x, e.y - y) >= 160); assert.ok(e.x > 0 && e.x < WORLD.width && e.y > 0 && e.y < WORLD.height); }
  }
});
test('接触だけで捕獲せず、同時吸引で全缶を一度だけ捕獲', () => {
  const s = createState(), g = new Game(s, () => .5);
  g.enemies = [g.spawn(), g.spawn(), g.spawn()].map((e, i) => ({ ...e, x: 816 + i * 2, y: 500 }));
  g.update(.01, {}); assert.equal(s.cans, 0);
  const result = g.update(.05, { suck: true }); assert.equal(result.find(e => e.type === 'capture').count, 3);
  assert.equal(s.cans, 3); assert.equal(s.runTotalCanned, 3); assert.equal(s.lifetimeCanned, 3);
  assert.equal(g.enemies.length, 25); assert.equal(g.rate(), .6);
  g.update(.05, {}); assert.equal(s.cans, 3);
  for (let i = 0; i < 101; i++) g.update(.05, {}); assert.equal(g.rate(), 0);
});
test('価格・残高・上限・購入で累積獲得を減らさない', () => {
  const s = createState(); s.cans = 15; s.runTotalCanned = 100;
  assert.equal(buy(s, 'suctionPower'), false); assert.equal(s.cans, 15);
  assert.equal(buy(s, 'suctionRange'), true); assert.equal(s.cans, 0); assert.equal(buy(s, 'suctionRange'), false);
  assert.equal(s.runTotalCanned, 100); assert.equal(cost(UPGRADES[0], 1), 23);
  s.cans = 1e12; s.upgradeLevels.suctionRange = 15; assert.equal(buy(s, 'suctionRange'), false);
});
test('6種類の強化を性能に反映', () => {
  const s = createState(); s.cans = 1000;
  for (const def of UPGRADES) assert.equal(buy(s, def.id), true);
  const v = stats(s); assert.equal(v.range, 170); assert.equal(v.power, 305); assert.equal(v.speed, 245);
  close(v.halfAngle, 40 * Math.PI / 180); assert.equal(v.target, 32); close(v.multiplier, 1.15);
});
test('最大密度でも実体300以下・代表缶数で倍率を維持', () => {
  const s = createState(); s.upgradeLevels.moreCans = 20; s.upgradeLevels.canValue = 2; s.permanentLevels.betterCan = 3;
  const g = new Game(s, () => .5), v = stats(s); assert.equal(g.enemies.length, 300); assert.equal(v.target, 2169);
  g.enemies[0].x = 820; g.enemies[0].y = 500;
  g.update(.05, { suck: true }); close(s.cans, v.represented * v.multiplier); assert.equal(g.enemies.length, 300);
  assert.ok(g.enemies.every(e => e.representedCount === v.represented));
  s.permanentLevels.canResearch = 3; let seed = 12345;
  g.random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  g.enemies = g.enemies.map((e, i) => ({ ...e, kind: ['normal', 'gold', 'heavy', 'magnet'][i % 4] }));
  for (let i = 0; i < 500; i++) g.update(.05, { suck: true, x: 1, turn: 1 });
  assert.ok(g.enemies.length <= WORLD.maxEnemies); assert.ok(g.effects.length <= 55);
});
test('初回マイルストーンを保存し、重複通知しない', () => {
  const s = createState(); s.runTotalCanned = 999; const g = new Game(s, () => .5);
  g.enemies[0].x = 820; g.enemies[0].y = 500;
  const events = g.update(.05, { suck: true }); assert.ok(s.milestones[1000]); assert.equal(events.filter(e => e.type === 'milestone').length, 3);
  assert.equal(g.update(.05, {}).filter(e => e.type === 'milestone').length, 0);
});
test('転生条件・計算・永久資産保持・開始資金の反映', () => {
  const s = createState(); assert.equal(prestige(s), false);
  for (const [total, expected] of [[999, 0], [1000, 1], [4000, 1], [8000, 2], [9000, 2], [27000, 3]]) { s.runTotalCanned = total; assert.equal(prestigeGain(s), expected); }
  s.cans = 999; s.lifetimeCanned = 12000; s.canDo = 5; s.permanentLevels.startingCapital = 2; s.permanentLevels.betterCan = 3;
  s.milestones[1000] = true; s.upgradeLevels.canValue = 4; s.settings.sound = true;
  assert.equal(prestige(s), true); assert.equal(s.canDo, 8); assert.equal(s.cans, 600); assert.equal(s.runTotalCanned, 0);
  assert.equal(s.lifetimeCanned, 12000); assert.equal(s.upgradeLevels.canValue, 0); close(stats(s).multiplier, 1.25 ** 3);
  assert.ok(s.milestones[1000]); assert.equal(s.settings.sound, true); assert.deepEqual(s.player, { x: 800, y: 500, angle: 0 });
  assert.equal(buy(s, 'betterCan', true), true); assert.equal(s.canDo, 0); assert.equal(s.permanentLevels.betterCan, 4);
});
test('不正値・未知バージョンを安全に復元', () => {
  const s = sanitizeState({ version: 1, cans: -5, canDo: 2.8, runTotalCanned: Infinity, upgradeLevels: { suctionRange: 1e12, canValue: 'evil' }, permanentLevels: { betterCan: -2 }, player: { x: 1e9, y: NaN, angle: Infinity }, settings: { sound: 'yes', sfxVolume: 5 } });
  assert.equal(s.cans, 0); assert.equal(s.canDo, 2); assert.equal(s.runTotalCanned, 0); assert.equal(s.upgradeLevels.suctionRange, 15);
  assert.equal(s.upgradeLevels.canValue, 0); assert.equal(s.player.x, 1572); assert.equal(s.player.y, 500); assert.equal(s.player.angle, 0);
  assert.equal(s.settings.sound, false); assert.equal(s.settings.sfxVolume, 1);
  assert.deepEqual(sanitizeState({ version: 2 }), createState());
});
test('セーブ往復・破損JSON・保存不可・ゲーム固有キーの削除', () => {
  const data = new Map([['asobi-theme-v1', 'dark'], ['maru-tap-best-v1', '88']]);
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
  const s = createState(); s.cans = 23.7; s.canDo = 4; s.upgradeLevels.suctionRange = 2; s.permanentLevels.betterCan = 3; s.settings.sound = true;
  assert.equal(writeSave(storage, s), true); assert.deepEqual(readSave(storage).state, s); assert.equal(readSave(storage).exists, true);
  storage.setItem(SAVE_KEY, '{broken'); assert.equal(readSave(storage).exists, false); assert.equal(readSave(storage).state.cans, 0);
  assert.equal(writeSave(null, s), false); assert.equal(readSave(null).state.cans, 0);
  assert.equal(removeSave(storage), true); assert.equal(data.get('asobi-theme-v1'), 'dark'); assert.equal(data.get('maru-tap-best-v1'), '88');
});
test('軍資金は初回購入直後に使え、差額のみ支給・獲得数に加算しない', () => {
  const s = createState(); s.milestones[1000] = true; s.canDo = 4;
  assert.equal(buy(s, 'startingCapital', true), true); assert.equal(s.cans, 150); assert.equal(s.canDo, 3);
  for (const id of ['suctionRange', 'suctionPower', 'suctionAngle', 'movementSpeed', 'moreCans']) assert.equal(buy(s, id), true);
  assert.equal(s.cans, 25); assert.equal(buy(s, 'startingCapital', true), true); assert.equal(s.cans, 475); assert.equal(s.canDo, 0);
  assert.equal(buy(s, 'startingCapital', true), false); assert.equal(s.cans, 475);
  assert.equal(s.runTotalCanned, 0); assert.equal(s.lifetimeCanned, 0); assert.equal(prestige(s), false);
  s.runTotalCanned = 1000; assert.equal(prestige(s), true); assert.equal(s.cans, 600); assert.equal(s.runTotalCanned, 0);
});
test('永久吸引・密度の購入が即反映し、転生後も残る', () => {
  const s = createState(); s.milestones[1000] = true; s.canDo = 6;
  assert.equal(buy(s, 'vacuumTalent', true), true); assert.equal(buy(s, 'canGathering', true), true); assert.equal(buy(s, 'betterCan', true), true);
  const v = stats(s); assert.equal(v.range, 165); assert.equal(v.power, 280); close(v.halfAngle, 38 * Math.PI / 180); assert.equal(v.target, 30); close(v.multiplier, 1.25);
  s.runTotalCanned = 1000; prestige(s); assert.deepEqual(stats(s), v);
  s.upgradeLevels.moreCans = 20; s.permanentLevels.canGathering = 10;
  const g = new Game(s, () => .5); assert.equal(g.enemies.length, 300); assert.ok(stats(s).represented > 40);
});
test('旧セーブの購入レベルと通貨を保持し、新しい永久強化は0で追加', () => {
  const raw = createState(); raw.cans = 19; raw.canDo = 7; raw.permanentLevels = { betterCan: 2, startingCapital: 3 };
  const restored = sanitizeState(raw); assert.equal(restored.cans, 19); assert.equal(restored.canDo, 7);
  assert.deepEqual(restored.permanentLevels, { betterCan: 2, startingCapital: 3, vacuumTalent: 0, canGathering: 0, canResearch: 0 });
  assert.equal(stats(restored).capital, 1350); close(stats(restored).multiplier, 1.5625);
});
test('捕獲SEの全音程・まとめ捕獲がクリップせず、立ち上がりと末尾が滑らか', () => {
  for (const rate of [22050, 44100, 48000]) for (let note = 0; note < CAPTURE_NOTES.length; note++) for (const rich of [false, true]) {
    const data = synthesizeCapture(rate, note, rich); assert.equal(data.length, Math.ceil(rate * .26)); close(data[0], 0);
    assert.ok(data.every(n => Number.isFinite(n) && Math.abs(n) < .8));
    assert.ok(data.some(n => Math.abs(n) > .1)); assert.ok(data.slice(-100).every(n => Math.abs(n) < .002));
  }
  assert.notDeepEqual(synthesizeCapture(22050, 0), synthesizeCapture(22050, 2));
  assert.notDeepEqual(synthesizeCapture(22050, 0), synthesizeCapture(22050, 0, true));
});
test('SEの連続音程・短時間捕獲の集約・ミュート・連続判定のリセット', () => {
  const audio = new Audio(), played = []; audio.context = { currentTime: 0, state: 'running' };
  audio.play = (volume, count, note) => played.push({ volume, count, note });
  const settings = { sound: true, sfxVolume: .5 };
  audio.clank({ ...settings, sound: false }, 1); audio.clank({ ...settings, sfxVolume: 0 }, 1); assert.equal(played.length, 0);
  audio.clank(settings, 1); audio.context.currentTime = .02; audio.clank(settings, 2); assert.equal(played.length, 1);
  audio.context.currentTime = .07; audio.clank(settings, 1); assert.equal(played[1].count, 3);
  audio.context.currentTime = .13; audio.clank(settings, 1); assert.ok(played[2].note > played[0].note);
  audio.context.currentTime = 1; audio.clank(settings, 1); assert.equal(played.at(-1).note, 0);
  audio.context.state = 'suspended'; audio.clank(settings, 1); assert.equal(played.length, 4);
});
test('価値強化だけを弱体化し、既存通貨・購入レベル・実績を維持', () => {
  const raw = createState(); raw.cans = 123456; raw.upgradeLevels.canValue = 10; raw.permanentLevels.betterCan = 4; raw.milestones[100000] = true;
  const s = sanitizeState(raw); assert.equal(s.cans, 123456); assert.equal(s.upgradeLevels.canValue, 10); assert.ok(s.milestones[100000]);
  close(stats(s).multiplier, 1.15 ** 10 * 1.25 ** 4); assert.ok(1.15 ** 10 < 1.25 ** 10);
});
test('価値強化の新価格・残高不足・購入後の倍率・上限価格', () => {
  const s = createState(), def = UPGRADES.find(u => u.id === 'canValue');
  for (const [level, price] of [[0, 100], [1, 200], [5, 3200], [10, 102400], [29, 53687091200]]) assert.equal(cost(def, level), price);
  s.cans = 99; assert.equal(buy(s, 'canValue'), false); assert.equal(s.cans, 99);
  s.cans = 100; assert.equal(buy(s, 'canValue'), true); assert.equal(s.cans, 0); close(stats(s).multiplier, 1.15);
  for (let level = 0; level < def.max; level++) assert.ok(cost(def, level) > Math.ceil(50 * 1.9 ** level));
  s.upgradeLevels.canValue = 30; s.cans = Number.MAX_SAFE_INTEGER; assert.equal(buy(s, 'canValue'), false);
});
test('転生報酬の全境界・次の報酬表示・永久価格・初回の軍資金', () => {
  const s = createState(); assert.equal(prestigeNextAt(s), 1000);
  for (let reward = 1; reward <= 200; reward++) {
    const threshold = 1000 * reward ** 3;
    s.runTotalCanned = threshold - 1; assert.equal(prestigeGain(s), reward - 1); assert.equal(prestigeNextAt(s), threshold);
    s.runTotalCanned = threshold; assert.equal(prestigeGain(s), reward); assert.equal(prestigeNextAt(s), 1000 * (reward + 1) ** 3);
  }
  for (const [score, reward] of [[10000, 2], [100000, 4], [1000000, 10], [10000000, 21], [1000000000, 100]]) {
    s.runTotalCanned = score; assert.equal(prestigeGain(s), reward); assert.ok(reward < Math.floor(Math.sqrt(score / 1000)));
  }
  for (const def of PERMANENT.filter(d => !d.prices)) for (let level = 0; level < def.max; level++) {
    const price = cost(def, level, true); assert.ok(price > 1 + level || (def.id === 'startingCapital' && level === 0));
    assert.equal(price, (def.id === 'startingCapital' ? 1 : 2) + 2 * level);
  }
  const first = createState(); first.runTotalCanned = 1000; first.milestones[1000] = true;
  assert.equal(prestige(first), true); assert.equal(first.canDo, 1); assert.equal(buy(first, 'betterCan', true), false);
  assert.equal(buy(first, 'startingCapital', true), true); assert.equal(first.canDo, 0); assert.equal(first.cans, 150);
  const saved = sanitizeState({ ...s, canDo: 87, permanentLevels: { ...s.permanentLevels, betterCan: 8, canResearch: 3 } });
  assert.equal(saved.canDo, 87); assert.equal(saved.permanentLevels.betterCan, 8); assert.equal(saved.permanentLevels.canResearch, 3);
});
test('10万の先の目標・上位実績・転生しても実績を維持', () => {
  const s = createState(); s.runTotalCanned = 100000; assert.equal(nextMilestone(s).amount, 1000000);
  s.runTotalCanned = 1000000000; const g = new Game(s, () => .5);
  const result = g.update(.01, {}); assert.equal(result.filter(e => e.type === 'milestone').length, MILESTONES.length);
  assert.ok(s.milestones[1e6] && s.milestones[1e7] && s.milestones[1e8] && s.milestones[1e9]); assert.equal(nextMilestone(s), undefined);
  assert.equal(g.update(.01, {}).filter(e => e.type === 'milestone').length, 0);
  prestige(s); assert.ok(s.milestones[1e9]); assert.equal(s.prestigeCount, 1); new Game(s, () => .5).update(.01, {}); assert.ok(s.achievements.reborn);
});
test('研究はCAN DOで段階解放・残高チェック・転生後も保持', () => {
  const s = createState(); s.canDo = 55; assert.equal(buy(s, 'canResearch', true), false);
  s.milestones[1000] = true; const def = PERMANENT.find(d => d.id === 'canResearch');
  for (const [level, price] of [[0, 5], [1, 15], [2, 35]]) { assert.equal(cost(def, level, true), price); assert.equal(buy(s, 'canResearch', true), true); }
  assert.equal(s.canDo, 0); assert.equal(s.permanentLevels.canResearch, 3); assert.equal(buy(s, 'canResearch', true), false);
  s.runTotalCanned = 1000; prestige(s); assert.equal(s.permanentLevels.canResearch, 3);
  const low = createState(); low.milestones[1000] = true; low.canDo = 2; assert.equal(buy(low, 'canResearch', true), false); assert.equal(low.canDo, 2);
});
test('研究レベルごとの特殊缶の出現・固定確率の境界', () => {
  const s = createState(), g = new Game(s, () => .5);
  for (const [level, roll, kind] of [[0, .01, 'normal'], [1, .01, 'gold'], [1, .04, 'normal'], [2, .04, 'heavy'], [2, .1199, 'heavy'], [2, .12, 'normal'], [3, .12, 'magnet'], [3, .1699, 'magnet'], [3, .17, 'normal']]) {
    s.permanentLevels.canResearch = level; g.random = () => roll; assert.equal(g.rollKind(), kind);
  }
});
test('金缶報酬・重量缶抵抗・種類ごとの収集と転生保持', () => {
  const s = createState(), g = new Game(s, () => .5);
  g.enemies = [{ ...g.spawn(), x: 818, y: 500, kind: 'gold' }, { ...g.spawn(), x: 818, y: 500, kind: 'heavy' }];
  g.update(.05, { suck: true }); assert.equal(s.cans, 8); assert.equal(s.runTotalCanned, 8); assert.equal(s.collection.gold, 1); assert.equal(s.collection.heavy, 1);
  const normal = { ...g.spawn(), x: 900, y: 500, kind: 'normal' }, heavy = { ...normal, kind: 'heavy' };
  g.enemies = [normal, heavy]; g.update(.05, { suck: true }); close(normal.x, 887); close(heavy.x, 894.15);
  s.runTotalCanned = 1000; prestige(s); assert.equal(s.collection.gold, 1); assert.equal(s.collection.heavy, 1);
});
test('磁石缶は最大5缶を引き寄せ、扇形外でも捕獲・二重捕獲なし', () => {
  const s = createState(), g = new Game(s, () => .5);
  const magnet = { ...g.spawn(), x: 820, y: 500, kind: 'magnet' };
  const neighbors = Array.from({ length: 7 }, (_, i) => ({ ...g.spawn(), kind: 'normal', x: 760 - i, y: 530 }));
  g.enemies = [magnet, ...neighbors]; const result = g.update(.05, { suck: true });
  assert.equal(s.collection.magnet, 1); assert.equal(result.find(e => e.type === 'magnet').count, 5);
  assert.equal(neighbors.filter(e => e.magnetTime > 0).length, 5);
  for (let i = 0; i < 6; i++) g.update(.05, {});
  assert.equal(s.cans, 6); assert.equal(s.collection.normal, 5); assert.equal(g.enemies.length, 25);
  g.update(.05, {}); assert.equal(s.cans, 6);
});
test('収集・転生の実績とセーブ互換性・不正な新フィールドの復旧', () => {
  const s = createState(); s.collection.gold = 25; s.collection.heavy = 50; s.collection.magnet = 25; s.prestigeCount = 25;
  new Game(s, () => .5).update(.01, {}); assert.equal(Object.keys(s.achievements).length, 6);
  const restored = sanitizeState(JSON.parse(JSON.stringify(s))); assert.deepEqual(restored, s);
  const old = createState(); delete old.collection; delete old.achievements; delete old.prestigeCount; delete old.permanentLevels.canResearch;
  assert.deepEqual(sanitizeState(old), createState());
  const bad = sanitizeState({ version: 1, prestigeCount: -9, collection: { gold: NaN, heavy: -1, magnet: '999' } });
  assert.equal(bad.prestigeCount, 0); assert.deepEqual(bad.collection, { normal: 0, gold: 0, heavy: 0, magnet: 0 });
});
console.log(`${checks}項目すべて成功`);
