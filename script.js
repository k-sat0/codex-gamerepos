"use strict";

const DURATION = 30_000;
const STORAGE_KEY = "maru-tap-best-v1";
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const bestEl = document.getElementById("best");
const arena = document.getElementById("arena");
const target = document.getElementById("target");
const start = document.getElementById("start");
const welcome = document.getElementById("welcome");
const result = document.getElementById("result");
const bar = document.getElementById("timer-bar");
let score = 0;
let best = 0;
let playing = false;
let deadline = 0;
let frame = 0;
try {
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  if (Number.isSafeInteger(saved) && saved >= 0) best = saved;
} catch { /* The game also works when browser storage is unavailable. */ }
bestEl.textContent = best;

function moveTarget() {
  const padding = 12;
  const maxX = Math.max(0, arena.clientWidth - target.offsetWidth - padding * 2);
  const maxY = Math.max(0, arena.clientHeight - target.offsetHeight - padding * 2);
  target.style.left = `${padding + Math.random() * maxX}px`;
  target.style.top = `${padding + Math.random() * maxY}px`;
}

function finish() {
  playing = false;
  cancelAnimationFrame(frame);
  target.hidden = true;
  timeEl.textContent = "0";
  bar.style.transform = "scaleX(0)";
  const isRecord = score > best;
  best = Math.max(best, score);
  bestEl.textContent = best;
  try { localStorage.setItem(STORAGE_KEY, String(best)); } catch { /* Optional persistence. */ }
  result.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = isRecord ? "自己ベスト更新！" : "タイムアップ！";
  const total = document.createElement("div");
  total.className = "result-score";
  total.textContent = `${score}`;
  const caption = document.createElement("p");
  caption.textContent = "ポイント獲得。もう一度、挑戦しよう。";
  result.append(heading, total, caption);
  result.hidden = false;
  start.disabled = false;
  start.textContent = "もう一度あそぶ ↗";
  start.focus({ preventScroll: true });
}

function tick() {
  if (!playing) return;
  const remaining = Math.max(0, deadline - performance.now());
  timeEl.textContent = Math.ceil(remaining / 1000);
  bar.style.transform = `scaleX(${remaining / DURATION})`;
  if (remaining <= 0) finish();
  else frame = requestAnimationFrame(tick);
}

start.addEventListener("click", () => {
  if (playing) return;
  score = 0;
  scoreEl.textContent = "0";
  welcome.hidden = true;
  result.hidden = true;
  start.disabled = true;
  start.textContent = "プレイ中…";
  playing = true;
  deadline = performance.now() + DURATION;
  target.hidden = false;
  moveTarget();
  target.focus({ preventScroll: true });
  tick();
});

target.addEventListener("click", () => {
  if (!playing) return;
  if (performance.now() >= deadline) { finish(); return; }
  score += 1;
  scoreEl.textContent = score;
  moveTarget();
});

window.addEventListener("resize", () => { if (playing) moveTarget(); });
document.addEventListener("visibilitychange", () => {
  if (playing && !document.hidden) { cancelAnimationFrame(frame); tick(); }
});
