"use strict";

(() => {
  const LEVELS = [
    { title: "01 はじめての川", description: "短い川を渡ろう。橋の下に三角形をつくるのがコツ。", left: 300, right: 660, budget: 1100, speed: 2.2, weight: 1.1 },
    { title: "02 ひろい水路", description: "川幅が広がった。少ない部材でしっかり支えよう。", left: 270, right: 690, budget: 1450, speed: 2.25, weight: 1.35 },
    { title: "03 おもたい配達", description: "重い荷物を積んだ車。丈夫な形を考えよう。", left: 240, right: 720, budget: 1780, speed: 2.1, weight: 1.8 },
    { title: "04 ながい川", description: "橋がさらに長くなる。支えを途切れさせないで。", left: 210, right: 750, budget: 1700, speed: 2.3, weight: 1.45 },
    { title: "05 トラック便", description: "川幅は短めでも、車はかなり重い。予算に注意。", left: 270, right: 690, budget: 1350, speed: 2.1, weight: 2.8 },
    { title: "06 対岸が遠い", description: "長い橋を限られた予算で組み上げよう。", left: 180, right: 780, budget: 1930, speed: 2.4, weight: 1.8 },
    { title: "07 重量級", description: "大きな荷物を載せた車。三角形の支えが頼り。", left: 240, right: 720, budget: 1500, speed: 2.0, weight: 3.1 },
    { title: "08 最後の大峡谷", description: "いちばん広い谷。長さと強さを両立させよう。", left: 150, right: 810, budget: 2200, speed: 2.2, weight: 2.5 }
  ];
  const ROAD_Y = 250;
  const GRID = 30;
  const MAX_LENGTH = 155;

  function makeLevel(index) {
    const stage = LEVELS[index];
    const nodes = [
      { x: stage.left, y: ROAD_Y, fixed: true },
      { x: stage.right, y: ROAD_Y, fixed: true },
      { x: stage.left, y: 370, fixed: true },
      { x: stage.right, y: 370, fixed: true }
    ];
    return { nodes, edges: [], nextId: 1 };
  }

  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function snap(point) { return { x: Math.round(point.x / GRID) * GRID, y: ROAD_Y + Math.round((point.y - ROAD_Y) / GRID) * GRID }; }
  function nodeAt(design, point, radius = 17) { return design.nodes.findIndex(node => distance(node, point) <= radius); }
  function cost(edge) { return Math.round(edge.length * (edge.type === "road" ? 1 : 0.68)); }
  function totalCost(design) { return design.edges.reduce((sum, edge) => sum + cost(edge), 0); }
  function compact(design) {
    const used = new Set(design.edges.flatMap(edge => [edge.a, edge.b]));
    design.nodes = design.nodes.map((node, index) => ({ ...node, oldIndex: index })).filter((node, index) => node.fixed || used.has(index));
    const mapping = new Map(design.nodes.map((node, index) => [node.oldIndex, index]));
    design.nodes.forEach(node => delete node.oldIndex);
    design.edges.forEach(edge => { edge.a = mapping.get(edge.a); edge.b = mapping.get(edge.b); });
  }

  function addEdge(design, fromIndex, rawTarget, type, stage) {
    if (!Number.isInteger(fromIndex) || !design.nodes[fromIndex]) return { error: "丸い接続点からドラッグしてね。" };
    let target = snap(rawTarget);
    const existing = nodeAt(design, rawTarget, 20);
    if (existing >= 0) target = design.nodes[existing];
    if (target.x < stage.left || target.x > stage.right || target.y < 100 || target.y > 415) return { error: "橋をつくれるのは川の上だけだよ。" };
    const source = design.nodes[fromIndex];
    const length = distance(source, target);
    if (length < 25) return { error: "もう少し長く引いてね。" };
    if (length > MAX_LENGTH) return { error: "1本が長すぎるよ。途中に接続点をつくろう。" };
    if (type === "road" && (Math.abs(source.y - ROAD_Y) > 65 || Math.abs(target.y - ROAD_Y) > 65)) return { error: "道路は水面より高い位置に引いてね。" };
    let toIndex = existing;
    if (toIndex < 0) toIndex = design.nodes.findIndex(node => node.x === target.x && node.y === target.y);
    if (toIndex === fromIndex) return { error: "別の接続点まで引いてね。" };
    if (design.edges.some(edge => (edge.a === fromIndex && edge.b === toIndex || edge.b === fromIndex && edge.a === toIndex))) return { error: "そこには、すでに部材があるよ。" };
    const edge = { id: design.nextId++, a: fromIndex, b: toIndex < 0 ? design.nodes.length : toIndex, type, length };
    if (totalCost(design) + cost(edge) > stage.budget) return { error: "予算オーバー。部材を減らしてみよう。" };
    if (toIndex < 0) design.nodes.push({ x: target.x, y: target.y, fixed: false });
    design.edges.push(edge);
    return { edge };
  }

  function removeEdge(design, id) {
    const index = design.edges.findIndex(edge => edge.id === id);
    if (index < 0) return false;
    design.edges.splice(index, 1);
    compact(design);
    return true;
  }

  function roadPath(design, stage) {
    const road = design.edges.filter(edge => edge.type === "road");
    const queue = [0];
    const seen = new Set(queue);
    while (queue.length) {
      const current = queue.shift();
      if (current === 1) return true;
      for (const edge of road) {
        const other = edge.a === current ? edge.b : edge.b === current ? edge.a : -1;
        if (other < 0 || seen.has(other)) continue;
        const a = design.nodes[current], b = design.nodes[other];
        if (b.x <= a.x || Math.abs(b.y - a.y) > 65 || b.x < stage.left || b.x > stage.right) continue;
        seen.add(other); queue.push(other);
      }
    }
    return false;
  }

  function startSimulation(design, stage) {
    return {
      nodes: design.nodes.map(node => ({ x: node.x, y: node.y, px: node.x, py: node.y, fixed: node.fixed })),
      edges: design.edges.map(edge => ({ ...edge, broken: false, strain: 0, over: 0, fatigue: 0 })),
      car: { x: 90, y: ROAD_Y - 19, rotation: 0 },
      frame: 0,
      outcome: null,
      stage
    };
  }

  function roadAt(sim, x) {
    const matches = [];
    for (const edge of sim.edges) {
      if (edge.broken || edge.type !== "road") continue;
      const a = sim.nodes[edge.a], b = sim.nodes[edge.b];
      if (x >= Math.min(a.x, b.x) - 1 && x <= Math.max(a.x, b.x) + 1 && Math.abs(a.x - b.x) > 4) {
        const t = (x - a.x) / (b.x - a.x);
        matches.push({ edge, y: a.y + (b.y - a.y) * t, slope: (b.y - a.y) / (b.x - a.x), t });
      }
    }
    matches.sort((a, b) => Math.abs(a.y - ROAD_Y) - Math.abs(b.y - ROAD_Y));
    return matches[0] || null;
  }

  function hasTriangle(sim, road) {
    const fromA = new Set();
    for (const edge of sim.edges) {
      if (edge.broken || edge.type !== "brace") continue;
      if (edge.a === road.a) fromA.add(edge.b);
      if (edge.b === road.a) fromA.add(edge.a);
    }
    return sim.edges.some(edge => !edge.broken && edge.type === "brace" &&
      (edge.a === road.b && fromA.has(edge.b) || edge.b === road.b && fromA.has(edge.a)));
  }

  function step(sim) {
    if (sim.outcome) return sim.outcome;
    sim.frame++;
    const { stage } = sim;
    const car = sim.car;
    car.x += stage.speed;
    const contact = car.x < stage.left || car.x > stage.right ? { y: ROAD_Y, slope: 0 } : roadAt(sim, car.x);
    if (!contact || contact.y > ROAD_Y + 78 || Math.abs(contact.slope) > 0.75) {
      sim.outcome = "failed"; return sim.outcome;
    }
    car.y = contact.y - 19;
    car.rotation = Math.atan(contact.slope);
    if (car.x >= 870) { sim.outcome = "success"; return sim.outcome; }

    // A flat chain can carry its own weight, but vehicle load needs a braced triangle.
    // Fatigue grows relative to span length so tiny road pieces cannot bypass the rule.
    if (contact.edge && !hasTriangle(sim, contact.edge)) {
      contact.edge.fatigue += stage.weight * 90 / contact.edge.length;
      if (contact.edge.fatigue > 13) contact.edge.broken = true;
    }

    const forces = new Array(sim.nodes.length).fill(0);
    if (car.x >= stage.left && car.x <= stage.right && contact.edge) {
      forces[contact.edge.a] += stage.weight * (1 - contact.t);
      forces[contact.edge.b] += stage.weight * contact.t;
    }
    for (let i = 0; i < sim.nodes.length; i++) {
      const node = sim.nodes[i];
      if (node.fixed) continue;
      const vx = (node.x - node.px) * 0.965;
      const vy = (node.y - node.py) * 0.965;
      node.px = node.x; node.py = node.y;
      node.x += vx;
      node.y += vy + 1.0 + forces[i] * 2.0;
    }
    for (let iteration = 0; iteration < 10; iteration++) {
      for (const edge of sim.edges) {
        if (edge.broken) continue;
        const a = sim.nodes[edge.a], b = sim.nodes[edge.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        if (iteration === 0) edge.strain = Math.abs(d / edge.length - 1);
        const diff = (d - edge.length) / d * (edge.type === "road" ? 0.76 : 0.89);
        if (a.fixed && b.fixed) continue;
        if (a.fixed) { b.x -= dx * diff; b.y -= dy * diff; }
        else if (b.fixed) { a.x += dx * diff; a.y += dy * diff; }
        else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
      }
    }
    for (const edge of sim.edges) {
      if (edge.broken) continue;
      edge.over = edge.strain > (edge.type === "road" ? 0.10 : 0.085) ? edge.over + 1 : Math.max(0, edge.over - 1);
      if (edge.over >= 5) edge.broken = true;
    }
    if (sim.frame > 950) sim.outcome = "failed";
    return sim.outcome;
  }

  const api = { LEVELS, ROAD_Y, GRID, MAX_LENGTH, makeLevel, distance, snap, nodeAt, cost, totalCost, addEdge, removeEdge, roadPath, startSimulation, roadAt, step };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else window.BridgeEngine = api;
})();
