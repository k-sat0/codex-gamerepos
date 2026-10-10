import assert from 'node:assert/strict';
import { createState, sanitizeState, Game, stats, UPGRADES, cost, buy, prestigeGain, prestige, WORLD, inCone } from './src/engine.mjs';
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
  close(v.halfAngle, 40 * Math.PI / 180); assert.equal(v.target, 32); close(v.multiplier, 1.3);
});
test('最大密度でも実体300以下・代表缶数で倍率を維持', () => {
  const s = createState(); s.upgradeLevels.moreCans = 20; s.upgradeLevels.canValue = 2; s.permanentLevels.betterCan = 3;
  const g = new Game(s, () => .5), v = stats(s); assert.equal(g.enemies.length, 300); assert.equal(v.target, 2169);
  g.enemies[0].x = 820; g.enemies[0].y = 500;
  g.update(.05, { suck: true }); close(s.cans, v.represented * v.multiplier); assert.equal(g.enemies.length, 300);
  assert.ok(g.enemies.every(e => e.representedCount === v.represented));
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
  for (const [total, expected] of [[999, 0], [1000, 1], [4000, 2], [9000, 3]]) { s.runTotalCanned = total; assert.equal(prestigeGain(s), expected); }
  s.cans = 999; s.lifetimeCanned = 12000; s.canDo = 5; s.permanentLevels.startingCapital = 2; s.permanentLevels.betterCan = 3;
  s.milestones[1000] = true; s.upgradeLevels.canValue = 4; s.settings.sound = true;
  assert.equal(prestige(s), true); assert.equal(s.canDo, 8); assert.equal(s.cans, 600); assert.equal(s.runTotalCanned, 0);
  assert.equal(s.lifetimeCanned, 12000); assert.equal(s.upgradeLevels.canValue, 0); close(stats(s).multiplier, 1.25 ** 3);
  assert.ok(s.milestones[1000]); assert.equal(s.settings.sound, true); assert.deepEqual(s.player, { x: 800, y: 500, angle: 0 });
  assert.equal(buy(s, 'betterCan', true), true); assert.equal(s.canDo, 4); assert.equal(s.permanentLevels.betterCan, 4);
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
  const s = createState(); s.milestones[1000] = true; s.canDo = 3;
  assert.equal(buy(s, 'startingCapital', true), true); assert.equal(s.cans, 150); assert.equal(s.canDo, 2);
  for (const id of ['suctionRange', 'suctionPower', 'suctionAngle', 'movementSpeed', 'moreCans']) assert.equal(buy(s, id), true);
  assert.equal(s.cans, 25); assert.equal(buy(s, 'startingCapital', true), true); assert.equal(s.cans, 475); assert.equal(s.canDo, 0);
  assert.equal(buy(s, 'startingCapital', true), false); assert.equal(s.cans, 475);
  assert.equal(s.runTotalCanned, 0); assert.equal(s.lifetimeCanned, 0); assert.equal(prestige(s), false);
  s.runTotalCanned = 1000; assert.equal(prestige(s), true); assert.equal(s.cans, 600); assert.equal(s.runTotalCanned, 0);
});
test('永久吸引・密度の購入が即反映し、転生後も残る', () => {
  const s = createState(); s.milestones[1000] = true; s.canDo = 3;
  assert.equal(buy(s, 'vacuumTalent', true), true); assert.equal(buy(s, 'canGathering', true), true); assert.equal(buy(s, 'betterCan', true), true);
  const v = stats(s); assert.equal(v.range, 165); assert.equal(v.power, 280); close(v.halfAngle, 38 * Math.PI / 180); assert.equal(v.target, 30); close(v.multiplier, 1.25);
  s.runTotalCanned = 1000; prestige(s); assert.deepEqual(stats(s), v);
  s.upgradeLevels.moreCans = 20; s.permanentLevels.canGathering = 10;
  const g = new Game(s, () => .5); assert.equal(g.enemies.length, 300); assert.ok(stats(s).represented > 40);
});
test('旧セーブの購入レベルと通貨を保持し、新しい永久強化は0で追加', () => {
  const raw = createState(); raw.cans = 19; raw.canDo = 7; raw.permanentLevels = { betterCan: 2, startingCapital: 3 };
  const restored = sanitizeState(raw); assert.equal(restored.cans, 19); assert.equal(restored.canDo, 7);
  assert.deepEqual(restored.permanentLevels, { betterCan: 2, startingCapital: 3, vacuumTalent: 0, canGathering: 0 });
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
console.log(`${checks}項目すべて成功`);
