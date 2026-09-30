"use strict";

(() => {
  const E = window.BridgeEngine;
  const ROAD_Y = E.ROAD_Y;
  const canvas = document.getElementById("bridge");
  const ctx = canvas.getContext("2d");
  const titleEl = document.getElementById("level-title");
  const descriptionEl = document.getElementById("level-description");
  const budgetEl = document.getElementById("budget-text");
  const budgetFill = document.getElementById("budget-fill");
  const bestEl = document.getElementById("best-text");
  const modeEl = document.getElementById("mode-pill");
  const messageEl = document.getElementById("message");
  const runButton = document.getElementById("run");
  const levelChooser = document.querySelector(".level-chooser");
  const levelButtons = E.LEVELS.map((stage, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.level = String(index);
    button.textContent = String(index + 1).padStart(2, "0");
    button.setAttribute("aria-label", stage.title.replace(/^\d+\s*/, "ステージ" + (index + 1) + " "));
    button.title = stage.description;
    levelChooser.append(button);
    return button;
  });
  const toolButtons = [...document.querySelectorAll("[data-tool]")];
  const STORAGE_KEY = "bridge-lab-progress-v1";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saved = { unlocked: 0, best: Array(E.LEVELS.length).fill(null) };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && Number.isInteger(parsed.unlocked)) saved.unlocked = Math.max(0, Math.min(E.LEVELS.length - 1, parsed.unlocked));
    if (parsed && Array.isArray(parsed.best)) parsed.best.slice(0, E.LEVELS.length).forEach((value, index) => {
      if (Number.isFinite(value) && value > 0) saved.best[index] = value;
    });
    const lastCleared = saved.best.findLastIndex(value => value !== null);
    if (lastCleared >= 0) saved.unlocked = Math.max(saved.unlocked, Math.min(E.LEVELS.length - 1, lastCleared + 1));
  } catch { /* 保存できなくても遊べる。 */ }

  let levelIndex = 0;
  let design = E.makeLevel(0);
  let history = [];
  let tool = "road";
  let simulation = null;
  let pointer = null;
  let tapStart = -1;
  let keyboardCursor = { x: design.nodes[0].x, y: design.nodes[0].y };
  let keyboardStart = -1;
  let frame = 0;
  let lastTime = 0;
  let accumulator = 0;
  let waterPhase = 0;

  function theme() {
    const css = getComputedStyle(document.documentElement);
    const color = name => css.getPropertyValue(name).trim();
    return { bg: color("--bg"), surface: color("--surface"), soft: color("--surface-soft"), text: color("--text"), muted: color("--muted"), border: color("--border"), primary: color("--primary"), onPrimary: color("--on-primary"), accent: color("--accent"), coral: color("--accent-strong"), dot: color("--dot") };
  }
  function setMessage(text, error = false) { messageEl.textContent = text; messageEl.classList.toggle("error", error); }
  function saveProgress() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* 保存は任意。 */ } }
  function snapshot() { history.push(JSON.stringify(design)); if (history.length > 80) history.shift(); }
  function refreshUi() {
    const stage = E.LEVELS[levelIndex];
    titleEl.textContent = stage.title;
    descriptionEl.textContent = stage.description;
    const spent = E.totalCost(design);
    budgetEl.textContent = `${spent} / ${stage.budget}`;
    budgetFill.style.width = `${Math.min(100, spent / stage.budget * 100)}%`;
    budgetFill.classList.toggle("over", spent > stage.budget);
    bestEl.textContent = saved.best[levelIndex] ? `最安記録 ${saved.best[levelIndex]}` : "最安記録 —";
    modeEl.textContent = simulation ? simulation.outcome === "success" ? "クリア！" : simulation.outcome === "failed" ? "失敗" : "走行中" : "設計中";
    runButton.innerHTML = simulation ? "設計に戻る <span aria-hidden=\"true\">↶</span>" : "車を走らせる <span aria-hidden=\"true\">▶</span>";
    toolButtons.forEach(button => { const active = button.dataset.tool === tool; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); button.disabled = !!simulation; });
    document.getElementById("undo").disabled = !!simulation || history.length === 0;
    document.getElementById("clear").disabled = !!simulation || design.edges.length === 0;
    levelButtons.forEach((button, index) => { button.disabled = index > saved.unlocked; button.setAttribute("aria-current", String(index === levelIndex)); });
  }
  function selectLevel(index) {
    if (index > saved.unlocked || index < 0 || index >= E.LEVELS.length) return;
    stopAnimation();
    levelIndex = index;
    design = E.makeLevel(index);
    history = [];
    simulation = null;
    pointer = null;
    tapStart = -1;
    keyboardStart = -1;
    keyboardCursor = { x: design.nodes[0].x, y: design.nodes[0].y };
    setMessage("岸の丸い点から道路を引いて、反対側につなごう。");
    refreshUi(); draw();
  }
  function setTool(next) {
    if (simulation) return;
    tool = next;
    pointer = null;
    tapStart = -1;
    keyboardStart = -1;
    setMessage(next === "erase" ? "消したい部材をクリック / タップしてね。" : next === "brace" ? "接続点からドラッグして、三角形の支えをつくろう。" : "接続点からドラッグして、車が走る道路をつくろう。");
    refreshUi(); draw();
  }
  function stopAnimation() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; accumulator = 0; }
  function run() {
    if (simulation) {
      stopAnimation(); simulation = null;
      setMessage("設計に戻ったよ。橋を直して、もう一度試そう。");
      refreshUi(); draw(); return;
    }
    if (!E.roadPath(design, E.LEVELS[levelIndex])) { setMessage("道路が左右の岸につながっていないよ。", true); return; }
    simulation = E.startSimulation(design, E.LEVELS[levelIndex]);
    pointer = null; tapStart = -1; keyboardStart = -1;
    setMessage("車が出発！ 橋のたわみと部材の色に注目してね。");
    refreshUi();
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }
  function finish(outcome) {
    stopAnimation();
    if (outcome === "success") {
      const spent = E.totalCost(design);
      if (!saved.best[levelIndex] || spent < saved.best[levelIndex]) saved.best[levelIndex] = spent;
      saved.unlocked = Math.max(saved.unlocked, Math.min(E.LEVELS.length - 1, levelIndex + 1));
      saveProgress();
      setMessage(levelIndex === E.LEVELS.length - 1 ? "大成功！ すべての橋を渡れたよ。" : "大成功！ 次のステージが開いたよ。");
    } else setMessage("車が渡れなかった！ 設計に戻って補強しよう。", true);
    refreshUi(); draw();
  }
  function tick(time) {
    if (!simulation || simulation.outcome) return;
    accumulator += Math.min(50, time - lastTime);
    lastTime = time;
    let outcome = null;
    while (accumulator >= 1000 / 60) {
      outcome = E.step(simulation);
      accumulator -= 1000 / 60;
      if (outcome) break;
    }
    if (!reducedMotion.matches) waterPhase += 0.02;
    draw();
    if (outcome) finish(outcome);
    else frame = requestAnimationFrame(tick);
  }
  function add(from, target, touch = false) {
    if (touch) {
      const radius = 22 * 960 / canvas.getBoundingClientRect().width;
      const near = E.nodeAt(design, target, radius);
      if (near >= 0) target = design.nodes[near];
    }
    snapshot();
    const result = E.addEdge(design, from, target, tool, E.LEVELS[levelIndex]);
    if (result.error) {
      history.pop(); setMessage(result.error, true);
    } else setMessage(`${tool === "road" ? "道路" : "補強"}を追加したよ。予算内で橋を完成させよう。`);
    refreshUi(); draw();
  }
  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 960 / rect.width, y: (event.clientY - rect.top) * 520 / rect.height };
  }
  function edgeAt(point, touch = false) {
    let match = null, closest = touch ? 20 * 960 / canvas.getBoundingClientRect().width : 16;
    for (const edge of design.edges) {
      const a = design.nodes[edge.a], b = design.nodes[edge.b];
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (edge.length ** 2)));
      const d = Math.hypot(point.x - (a.x + (b.x - a.x) * t), point.y - (a.y + (b.y - a.y) * t));
      if (d < closest) { closest = d; match = edge; }
    }
    return match;
  }
  canvas.addEventListener("pointerdown", event => {
    if (simulation) return;
    const point = pointFromEvent(event);
    canvas.setPointerCapture(event.pointerId);
    if (tool === "erase") {
      const edge = edgeAt(point, event.pointerType === "touch");
      if (edge) { snapshot(); E.removeEdge(design, edge.id); setMessage("部材を取り外したよ。"); refreshUi(); draw(); }
      else setMessage("消したい部材を選んでね。", true);
      return;
    }
    if (event.pointerType === "touch" && tapStart >= 0) {
      pointer = { from: tapStart, to: point, down: point, pointerId: event.pointerId, touch: true, finishingTap: true };
      draw(); return;
    }
    const radius = event.pointerType === "touch" ? 22 * 960 / canvas.getBoundingClientRect().width : 23;
    const from = E.nodeAt(design, point, radius);
    if (from < 0) { setMessage("丸い接続点から引き始めてね。", true); return; }
    pointer = { from, to: point, down: point, pointerId: event.pointerId, touch: event.pointerType === "touch", finishingTap: false };
    draw();
  });
  canvas.addEventListener("pointermove", event => {
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    pointer.to = pointFromEvent(event);
    draw();
  });
  function endPointer(event) {
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    const current = pointer;
    pointer = null;
    if (event.type === "pointercancel") { draw(); return; }
    const target = pointFromEvent(event);
    const movePx = E.distance(current.down, target) * canvas.getBoundingClientRect().width / 960;
    if (current.touch && movePx < 12 && !current.finishingTap) {
      tapStart = current.from;
      setMessage("終点をタップして部材をつなごう。ドラッグでも引けるよ。");
      draw(); return;
    }
    tapStart = -1;
    add(current.from, target, current.touch);
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("keydown", event => {
    if (simulation) return;
    const moves = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      keyboardCursor.x = Math.max(E.LEVELS[levelIndex].left, Math.min(E.LEVELS[levelIndex].right, keyboardCursor.x + dx));
      keyboardCursor.y = Math.max(100, Math.min(400, keyboardCursor.y + dy));
      draw();
    } else if (event.code === "Space") {
      event.preventDefault();
      if (tool === "erase") {
        const edge = edgeAt(keyboardCursor);
        if (edge) { snapshot(); E.removeEdge(design, edge.id); setMessage("部材を取り外したよ。"); refreshUi(); }
      } else if (keyboardStart < 0) {
        keyboardStart = E.nodeAt(design, keyboardCursor, 18);
        setMessage(keyboardStart < 0 ? "始点は丸い接続点を選んでね。" : "矢印キーで終点を選び、Space でつなごう。", keyboardStart < 0);
      } else {
        const from = keyboardStart;
        keyboardStart = -1;
        add(from, keyboardCursor);
      }
      draw();
    } else if (event.key === "Escape") { keyboardStart = -1; draw(); }
  });
  document.addEventListener("keydown", event => {
    if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (event.key === "1") setTool("road");
    else if (event.key === "2") setTool("brace");
    else if (event.key === "3") setTool("erase");
    else if (event.key.toLowerCase() === "z" && !event.ctrlKey && !event.metaKey) undo();
    else if (event.key.toLowerCase() === "r") clear();
    else if (event.key === "Enter" && !(event.target instanceof HTMLElement && /^(BUTTON|A)$/.test(event.target.tagName))) run();
  });
  function undo() {
    if (simulation || !history.length) return;
    design = JSON.parse(history.pop());
    keyboardStart = -1;
    setMessage("ひとつ前の設計に戻したよ。");
    refreshUi(); draw();
  }
  function clear() {
    if (simulation || !design.edges.length) return;
    snapshot();
    design = E.makeLevel(levelIndex);
    keyboardStart = -1;
    setMessage("まっさらな橋から始めよう。");
    refreshUi(); draw();
  }
  document.getElementById("undo").addEventListener("click", undo);
  document.getElementById("clear").addEventListener("click", clear);
  runButton.addEventListener("click", run);
  toolButtons.forEach(button => button.addEventListener("click", () => setTool(button.dataset.tool)));
  levelButtons.forEach(button => button.addEventListener("click", () => selectLevel(Number(button.dataset.level))));

  function roundRect(x, y, w, h, r, fill) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  }
  function line(ax, ay, bx, by, color, width, dash = []) {
    ctx.beginPath(); ctx.setLineDash(dash); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.stroke(); ctx.setLineDash([]);
  }
  function circle(x, y, radius, fill, stroke, width = 1) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function label(text, x, y, color, size = 13, align = "left", weight = 700) {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px system-ui, sans-serif`; ctx.textAlign = align; ctx.fillText(text, x, y);
  }
  function drawScene(c, stage) {
    ctx.fillStyle = c.soft; ctx.fillRect(0, 0, 960, 520);
    const sky = ctx.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, c.surface); sky.addColorStop(1, c.soft);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 372);
    // Distant landscape and clouds use the shared theme colors.
    circle(780, 82, 38, c.accent);
    for (const [x, y, s] of [[145, 80, 1], [455, 60, .8], [815, 162, .7]]) {
      circle(x, y, 17*s, c.surface); circle(x+18*s, y-9*s, 22*s, c.surface); circle(x+40*s, y, 18*s, c.surface);
    }
    ctx.fillStyle = c.dot;
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.moveTo(0, 268); ctx.quadraticCurveTo(170, 155, 345, 250); ctx.quadraticCurveTo(510, 180, 640, 250); ctx.quadraticCurveTo(825, 142, 960, 240); ctx.lineTo(960, 380); ctx.lineTo(0, 380); ctx.fill();
    ctx.globalAlpha = 1;
    // River and banks.
    ctx.fillStyle = c.primary; ctx.globalAlpha = 0.15; ctx.fillRect(stage.left, 310, stage.right - stage.left, 210); ctx.globalAlpha = 1;
    for (let i = 0; i < 11; i++) {
      const x = stage.left + 18 + ((i * 109 + (reducedMotion.matches ? 0 : waterPhase * 16)) % Math.max(30, stage.right - stage.left - 32));
      line(x, 349 + i % 5 * 30, x + 22, 349 + i % 5 * 30, c.dot, 3);
    }
    ctx.fillStyle = c.surface; ctx.fillRect(0, ROAD_Y + 5, stage.left, 265); ctx.fillRect(stage.right, ROAD_Y + 5, 960-stage.right, 265);
    ctx.fillStyle = c.border; ctx.fillRect(0, ROAD_Y + 5, stage.left, 7); ctx.fillRect(stage.right, ROAD_Y + 5, 960-stage.right, 7);
    ctx.fillStyle = c.muted; ctx.globalAlpha = .15;
    for (let x = 0; x < stage.left; x += 30) ctx.fillRect(x, 275, 15, 3);
    for (let x = stage.right; x < 960; x += 30) ctx.fillRect(x, 275, 15, 3);
    ctx.globalAlpha = 1;
    line(0, ROAD_Y, stage.left, ROAD_Y, c.text, 10);
    line(stage.right, ROAD_Y, 960, ROAD_Y, c.text, 10);
    for (let x = 20; x < stage.left - 10; x += 65) line(x, ROAD_Y - 1, x + 25, ROAD_Y - 1, c.accent, 3);
    for (let x = stage.right + 15; x < 950; x += 65) line(x, ROAD_Y - 1, x + 25, ROAD_Y - 1, c.accent, 3);
    roundRect(22, 182, 78, 37, 10, c.surface); label("START", 61, 206, c.primary, 12, "center", 900);
    roundRect(843, 182, 83, 37, 10, c.surface); label("GOAL", 884, 206, c.primary, 12, "center", 900);
    label("WATER", (stage.left + stage.right)/2, 455, c.muted, 15, "center", 900);
  }
  function drawBridge(c, nodes, edges, sim) {
    const ordered = [...edges].sort((a, b) => (a.type === "road") - (b.type === "road"));
    for (const edge of ordered) {
      if (edge.broken) continue;
      const a = nodes[edge.a], b = nodes[edge.b];
      if (edge.type === "road") {
        line(a.x, a.y + 3, b.x, b.y + 3, c.text, 15);
        line(a.x, a.y, b.x, b.y, sim && (edge.strain > .055 || edge.fatigue > 6) ? c.coral : c.primary, 10);
        line(a.x, a.y - 2, b.x, b.y - 2, c.accent, 2);
      } else {
        line(a.x, a.y, b.x, b.y, sim && edge.strain > .055 ? c.coral : c.text, 7);
        line(a.x, a.y, b.x, b.y, c.coral, 3);
      }
    }
    nodes.forEach((node, index) => {
      if (index < 4) {
        circle(node.x, node.y, canvas.clientWidth < 600 ? 19 : 11, c.accent, c.text, 3);
        circle(node.x, node.y, 3, c.text);
      } else if (edges.some(edge => !edge.broken && (edge.a === index || edge.b === index))) {
      circle(node.x, node.y, canvas.clientWidth < 600 ? 12 : 7, c.surface, c.primary, 3);
      }
    });
  }
  function drawCar(c, car) {
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.rotation);
    circle(-17, 13, 8, c.text); circle(17, 13, 8, c.text);
    circle(-17, 13, 3, c.surface); circle(17, 13, 3, c.surface);
    roundRect(-29, -4, 58, 17, 6, c.coral);
    roundRect(-16, -15, 30, 14, 6, c.coral);
    roundRect(-9, -12, 16, 8, 3, c.surface);
    ctx.restore();
  }
  function draw() {
    const c = theme(), stage = E.LEVELS[levelIndex];
    ctx.clearRect(0, 0, 960, 520);
    drawScene(c, stage);
    if (!simulation) {
      ctx.globalAlpha = .35;
      for (let x = stage.left; x <= stage.right; x += E.GRID) for (let y = 130; y <= 400; y += E.GRID) circle(x, y, 1.5, c.primary);
      ctx.globalAlpha = 1;
    }
    const nodes = simulation ? simulation.nodes : design.nodes;
    const edges = simulation ? simulation.edges : design.edges;
    drawBridge(c, nodes, edges, simulation);
    if (tapStart >= 0 && !simulation) circle(design.nodes[tapStart].x, design.nodes[tapStart].y, 26, "transparent", c.accent, 5);
    if (pointer && !simulation) {
      const from = design.nodes[pointer.from];
      const existing = E.nodeAt(design, pointer.to, 20);
      const to = existing >= 0 ? design.nodes[existing] : E.snap(pointer.to);
      const valid = E.distance(from, to) <= E.MAX_LENGTH && E.distance(from, to) >= 25;
      line(from.x, from.y, to.x, to.y, valid ? tool === "road" ? c.primary : c.coral : c.muted, 5, [9, 7]);
      circle(to.x, to.y, 8, c.surface, valid ? c.primary : c.coral, 2);
    }
    if (document.activeElement === canvas && !simulation) {
      const from = design.nodes[keyboardStart];
      if (from) line(from.x, from.y, keyboardCursor.x, keyboardCursor.y, c.accent, 5, [7, 6]);
      circle(keyboardCursor.x, keyboardCursor.y, 13, c.surface, c.accent, 4);
    }
    drawCar(c, simulation ? simulation.car : { x: 126, y: ROAD_Y - 19, rotation: 0 });
    if (simulation && simulation.outcome) {
      roundRect(337, 65, 286, 62, 18, c.surface);
      label(simulation.outcome === "success" ? "BRIDGE COMPLETE!" : "TRY AGAIN!", 480, 104, simulation.outcome === "success" ? c.primary : c.coral, 20, "center", 900);
    }
  }

  new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  canvas.addEventListener("focus", draw); canvas.addEventListener("blur", draw);
  refreshUi(); draw();
})();
