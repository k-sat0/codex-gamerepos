"use strict";
const assert = require("node:assert/strict");
const E = require("./engine.js");

function connect(design, a, target, type, stage) {
  const result = E.addEdge(design, a, target, type, stage);
  assert.ok(result.edge, result.error);
  return result.edge.b;
}

function solve(index) {
  const stage = E.LEVELS[index];
  const design = E.makeLevel(index);
  const top = [0];
  const spans = stage.right - stage.left === 420 ? [90, 120, 120, 90] : [];
  if (!spans.length) {
    let remaining = stage.right - stage.left;
    while (remaining > 0) { const span = Math.min(120, remaining); spans.push(span); remaining -= span; }
  }
  let x = stage.left;
  for (const span of spans) {
    x += span;
    top.push(connect(design, top.at(-1), { x, y: E.ROAD_Y }, "road", stage));
  }
  const lower = [];
  for (let i = 0; i < spans.length; i++) {
    const midpoint = Math.round((design.nodes[top[i]].x + design.nodes[top[i+1]].x) / 60) * 30;
    const bottom = connect(design, top[i], { x: midpoint, y: 340 }, "brace", stage);
    connect(design, top[i+1], design.nodes[bottom], "brace", stage);
    lower.push(bottom);
    if (i) connect(design, lower[i-1], design.nodes[bottom], "brace", stage);
  }
  assert.ok(E.roadPath(design, stage));
  assert.ok(E.totalCost(design) <= stage.budget);
  const sim = E.startSimulation(design, stage);
  for (let frame = 0; frame < 950 && !sim.outcome; frame++) E.step(sim);
  return { outcome: sim.outcome, cost: E.totalCost(design), frame: sim.frame, broken: sim.edges.filter(e => e.broken).length, maxY: Math.max(...sim.nodes.map(n => n.y)) };
}

for (let i = 0; i < E.LEVELS.length; i++) {
  const result = solve(i);
  console.log(`${E.LEVELS[i].title}: ${JSON.stringify(result)}`);
  assert.equal(result.outcome, "success", `Stage ${i + 1} must be solvable`);
}

// A road-only design connects the banks, but must not survive vehicle load.
for (let i = 0; i < E.LEVELS.length; i++) {
  const stage = E.LEVELS[i], design = E.makeLevel(i);
  let from = 0;
  for (let x = stage.left + 120; x < stage.right; x += 120) from = connect(design, from, { x, y: E.ROAD_Y }, "road", stage);
  connect(design, from, { x: stage.right, y: E.ROAD_Y }, "road", stage);
  const sim = E.startSimulation(design, stage);
  for (let frame = 0; frame < 950 && !sim.outcome; frame++) E.step(sim);
  assert.equal(sim.outcome, "failed", `Stage ${i + 1} needs support`);
}
console.log("Road-only bridges fail as expected.");
