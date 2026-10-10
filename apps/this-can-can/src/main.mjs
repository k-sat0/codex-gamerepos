import { createState, Game, stats, permanentEffects, UPGRADES, PERMANENT, MILESTONES, cost, buy, prestigeGain, prestige, format } from './engine.mjs';
import { readSave, writeSave, removeSave } from './save.mjs';
import { Renderer } from './renderer.mjs';
import { Input } from './input.mjs';
import { Audio } from './audio.mjs';

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const loaded = readSave(storage, reducedMotion);
let state = loaded.state, game = new Game(state), started = false, paused = false, confirmAction = null;
const renderer = new Renderer($('field')), audio = new Audio();
const dialogs = ['start-dialog', 'settings-dialog', 'confirm-dialog'];
const hasDialog = () => dialogs.some(id => $(id).open);
const active = () => started && !paused && !hasDialog() && !document.hidden;
const input = new Input($('field'), () => renderer.camera(state.player), active, togglePause);
let toastTimer, saveClock = 0, uiClock = 0, lastFrame = 0;

function notify(message) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}
function save() {
  const saved = writeSave(storage, state);
  $('save-status').textContent = saved ? '✓ このブラウザに自動保存' : '保存できません。このまま遊べます。';
  return saved;
}
function togglePause() {
  if (!started || hasDialog()) return;
  paused = !paused; input.clear(); updateUI();
}
function effectText(id, s, level) {
  switch (id) {
    case 'suctionRange': return `射程 ${s.range} → ${s.range + 20}px`;
    case 'suctionPower': return `吸引 ${s.power} → ${s.power + 45}px/秒`;
    case 'suctionAngle': return `広さ ${Math.round(s.halfAngle * 360 / Math.PI)} → ${Math.round(s.halfAngle * 360 / Math.PI) + 10}°`;
    case 'movementSpeed': return `移動 ${s.speed} → ${s.speed + 15}px/秒`;
    case 'moreCans': return `密度 ${format(s.target)} → ${format(Math.ceil(25 * 1.25 ** (level + 1) * permanentEffects(state.permanentLevels).densityMultiplier))}缶`;
    case 'canValue': return `価値 ×${s.multiplier.toFixed(1)} → ×${(s.multiplier * 1.3).toFixed(1)}`;
    case 'betterCan': return `永久倍率 ×${(1.25 ** level).toFixed(2)} → ×${(1.25 ** (level + 1)).toFixed(2)}`;
    case 'startingCapital': return `開始 ${format(150 * level ** 2)} → ${format(150 * (level + 1) ** 2)} CANS / 今すぐ＋${format(150 * (2 * level + 1))}`;
    case 'vacuumTalent': return `才能 Lv.${level} → ${level + 1} / 射程＋15・吸引＋20・広さ＋6°`;
    case 'canGathering': return `永久密度 ×${(1.2 ** level).toFixed(2)} → ×${(1.2 ** (level + 1)).toFixed(2)}`;
  }
}
function makeShop(defs, container, permanent = false) {
  for (const def of defs) {
    const button = document.createElement('button'); button.className = 'upgrade'; button.type = 'button'; button.dataset.id = def.id;
    button.innerHTML = `<span class="upgrade-icon" aria-hidden="true">${def.icon}</span><span class="upgrade-title"><span>${def.name}</span><small></small></span><span class="upgrade-effect"></span><span class="upgrade-price"></span>`;
    button.addEventListener('click', () => {
      if (!started || hasDialog()) return;
      const previousCans = state.cans;
      if (buy(state, def.id, permanent)) { game.refill(); save(); updateUI(); notify(`${def.name}を強化！${def.id === 'startingCapital' ? ` 軍資金＋${format(state.cans - previousCans)} CANS！` : ''}`); }
    });
    $(container).append(button);
  }
}
makeShop(UPGRADES, 'run-shop'); makeShop(PERMANENT, 'permanent-list', true);
function updateShop(defs, permanent, s) {
  for (const def of defs) {
    const button = document.querySelector(`.upgrade[data-id="${def.id}"]`), level = (permanent ? state.permanentLevels : state.upgradeLevels)[def.id];
    const maxed = level >= def.max, price = cost(def, level, permanent), affordable = !maxed && state[permanent ? 'canDo' : 'cans'] >= price && (!permanent || state.milestones[1000]);
    button.disabled = !started || !affordable; button.classList.toggle('affordable', started && affordable);
    button.querySelector('small').textContent = `Lv.${level}/${def.max}`;
    button.querySelector('.upgrade-effect').textContent = maxed ? '最高レベル！' : effectText(def.id, s, level);
    button.querySelector('.upgrade-price').textContent = maxed ? 'MAX' : `${format(price)} ${permanent ? 'CAN DO' : 'CANS'} ＋`;
    button.title = `${def.english} / ${maxed ? '最高レベル' : `${price.toLocaleString('ja-JP')} ${permanent ? 'CAN DO' : 'CANS'}`}${def.description ? ` / ${def.description}` : ''}`;
  }
}
function number(id, value, prefix = '') {
  $(id).textContent = prefix + format(value); $(id).title = prefix + value.toLocaleString('ja-JP', { maximumFractionDigits: 6 });
}
function updateUI() {
  const s = stats(state);
  number('cans', state.cans); number('run-total', state.runTotalCanned); number('rate', game.rate()); number('can-do', state.canDo);
  $('multiplier').textContent = `×${s.multiplier.toFixed(1)}`; $('multiplier').title = `1缶分の価値 ${s.multiplier} CANS。実体1個は ${s.represented.toFixed(2)}缶分。`;
  $('density').textContent = s.target > 300 ? `${format(s.target)}缶分 / 実体300` : `${s.target}缶`;
  $('status').textContent = !started ? '準備できた？' : paused || hasDialog() ? 'ひと息中' : game.sucking ? '吸い込み中！' : 'ねらって、吸い込もう';
  $('pause').disabled = !started; $('pause').textContent = paused ? '再開する' : '一時停止'; $('pause-cover').hidden = !paused;
  updateShop(UPGRADES, false, s); updateShop(PERMANENT, true, s);
  const goal = MILESTONES.find(m => state.runTotalCanned < m.amount);
  $('goal-label').textContent = goal?.label || 'CAN’T STOP! これからも、もっと缶。';
  $('goal-value').textContent = goal ? `${format(state.runTotalCanned)} / ${format(goal.amount)}` : '100,000 CANS 達成！';
  $('goal-progress').max = goal?.amount || 1; $('goal-progress').value = goal ? state.runTotalCanned : 1;
  const gain = prestigeGain(state); $('prestige').disabled = !started || !gain;
  $('prestige-info').textContent = gain ? `今なら +${format(gain)} CAN DO。永久強化に使おう。` : '今回の獲得が1,000で解放';
  $('prestige-lock').textContent = state.milestones[1000] ? '✦' : '🔒';
  $('lifetime').textContent = `全期間の獲得：${format(state.lifetimeCanned)} CANS`;
  $('sound-toggle').textContent = state.settings.sound ? '♪ 音ON' : '♪ 音OFF';
  $('sound-toggle').setAttribute('aria-pressed', String(state.settings.sound));
}
function showSettings() {
  input.clear();
  $('sound').checked = state.settings.sound; $('volume').value = state.settings.sfxVolume;
  $('particles').checked = state.settings.particles; $('shake').checked = state.settings.screenShake;
  $('settings-dialog').showModal(); updateUI();
}
for (const id of ['settings-open', 'start-settings']) $(id).addEventListener('click', showSettings);
$('sound-toggle').addEventListener('click', () => {
  state.settings.sound = !state.settings.sound;
  if (state.settings.sound) audio.preview(state.settings);
  if (started) save(); updateUI();
});
$('sound-preview').addEventListener('click', async () => {
  $('sound-preview').disabled = true;
  const ok = await audio.preview(state.settings);
  $('sound-preview').disabled = false;
  $('sound-preview-status').textContent = !ok ? 'この環境では音を再生できません。' : state.settings.sfxVolume === 0 ? '音量が0です。スライダーを上げて試してください。' : '試聴しました。捕獲音は「効果音」をONにすると鳴ります。';
});
$('settings-close').addEventListener('click', () => { $('settings-dialog').close(); updateUI(); });
for (const [id, key] of [['sound', 'sound'], ['particles', 'particles'], ['shake', 'screenShake'], ['volume', 'sfxVolume']]) {
  $(id).addEventListener('input', () => {
    state.settings[key] = id === 'volume' ? Number($(id).value) : $(id).checked;
    if (state.settings.sound) audio.unlock();
    if (started) save();
  });
}
function confirm(title, message, label, action) {
  input.clear(); $('confirm-title').textContent = title; $('confirm-text').textContent = message; $('confirm-ok').textContent = label; confirmAction = action; $('confirm-dialog').showModal();
}
$('confirm-cancel').addEventListener('click', () => $('confirm-dialog').close());
$('confirm-ok').addEventListener('click', () => { const action = confirmAction; confirmAction = null; $('confirm-dialog').close(); action?.(); updateUI(); });
$('confirm-dialog').addEventListener('close', () => { confirmAction = null; });
$('prestige').addEventListener('click', () => {
  const gain = prestigeGain(state); if (!gain) return;
  confirm('新しい缶人生へ？', `+${format(gain)} CAN DO を獲得します。今回のお財布・獲得数・6種類の強化はリセット。永久強化・永久通貨・実績・設定・全期間の獲得は残ります。開始資金は ${stats(state).capital} CANS。`, '転生する', () => {
    if (prestige(state)) { game = new Game(state); input.clear(); save(); notify('RE-CANNING! 新しい缶人生のはじまり。'); }
  });
});
function resetPrompt() {
  confirm('保存データを削除しますか？', 'このゲームの通貨・強化・永久強化・実績をすべて削除します。元には戻せません。共通テーマや他のゲームの記録は残ります。', '削除する', () => {
    const removed = removeSave(storage); state = createState(reducedMotion); game = new Game(state); started = false; paused = false; input.clear();
    $('settings-dialog').close(); $('start').textContent = 'はじめる / PLAY'; $('start-reset').hidden = true;
    if (!$('start-dialog').open) $('start-dialog').showModal();
    $('save-status').textContent = removed ? '保存データを削除しました' : '保存先にアクセスできません';
  });
}
$('reset-open').addEventListener('click', resetPrompt); $('start-reset').addEventListener('click', resetPrompt);
$('start').textContent = loaded.exists ? 'つづきから / CONTINUE' : 'はじめる / PLAY'; $('start-reset').hidden = !loaded.exists;
$('start').addEventListener('click', () => {
  started = true; paused = false; $('start-dialog').close(); input.clear(); if (state.settings.sound) audio.unlock();
  save(); updateUI(); $('field').focus({ preventScroll: true });
});
$('start-dialog').addEventListener('cancel', event => { if (!started) event.preventDefault(); });
for (const id of dialogs) $(id).addEventListener('close', () => { input.clear(); lastFrame = 0; updateUI(); });
$('pause').addEventListener('click', () => { togglePause(); $('field').focus({ preventScroll: true }); });
for (const [tab, other, panel, otherPanel] of [['run-tab', 'permanent-tab', 'run-shop', 'permanent-shop'], ['permanent-tab', 'run-tab', 'permanent-shop', 'run-shop']]) {
  $(tab).addEventListener('click', () => {
    $(tab).setAttribute('aria-selected', 'true'); $(other).setAttribute('aria-selected', 'false'); $(panel).hidden = false; $(otherPanel).hidden = true;
  });
}
document.addEventListener('visibilitychange', () => { input.clear(); lastFrame = 0; if (started) save(); });
window.addEventListener('pagehide', () => { if (started) save(); });
window.addEventListener('blur', () => { input.clear(); if (started && !paused) { paused = true; updateUI(); } });
function frame(timestamp) {
  const dt = lastFrame ? Math.min(.05, (timestamp - lastFrame) / 1000) : 0; lastFrame = timestamp;
  if (active()) {
    const events = game.update(dt, input.sample());
    for (const event of events) {
      if (event.type === 'capture') audio.clank(state.settings, event.count);
      if (event.type === 'milestone') { notify(event.message); save(); }
    }
    saveClock += dt; if (saveClock >= 10) { saveClock = 0; save(); }
  }
  renderer.draw(game); uiClock += dt;
  if (uiClock >= .1) { uiClock = 0; updateUI(); }
  requestAnimationFrame(frame);
}
updateUI(); if (!loaded.available) $('save-status').textContent = '保存が利用できないか、読み込みに失敗しました。遊べます。';
$('start-dialog').showModal(); requestAnimationFrame(frame);
