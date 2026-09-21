const assert = require('node:assert/strict');
const G = require('./engine.js');
const actions = [...G.dirs, 'wait', 'swap'];
function solve(level) {
  // All routes and camera rotations repeat within this period.
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const period=level.guards.reduce((p,g)=>{const n=g.camera?4:g.route.length;return p*n/gcd(p,n);},1);
  const queue=[{state:G.initial(level),path:[]}],seen=new Set();
  for(let head=0;head<queue.length;head++){
    const {state,path}=queue[head];
    for(const action of actions){const n=G.step(level,state,action);if(!n||n.status==='caught')continue;
      const next=[...path,action];if(n.status==='won')return next;
      const key=[n.x,n.y,n.turn%period,n.mask].join(',');if(seen.has(key))continue;seen.add(key);queue.push({state:n,path:next});
    }
  }
  return null;
}
const l=G.levels[0],s=G.initial(l);
assert.equal(G.step(l,s,[-1,0]),null,'Walls block movement');
assert.equal(G.step(l,s,'swap'),null,'Cannot swap remotely');
assert.equal(s.turn,0,'Simulation does not mutate the input');
const next=G.step(l,s,'wait');assert.equal(next.turn,1,'Waiting advances patrols');
const near={...s,x:4,y:1};const swapped=G.step(l,near,'swap');assert.equal(swapped.mask,1,'Adjacent artwork is replaced');assert.equal(G.step(l,swapped,'swap'),null,'An artwork cannot be collected twice');
assert.equal(G.step({...l,guards:[]},{...s,x:7,y:5},'wait').status,'playing','Exit requires all artwork');
assert.equal(G.step({...l,guards:[]},{...s,x:7,y:5,mask:1},'wait').status,'won','Collected artwork unlocks exit');
assert.equal(G.step(l,{...s,status:'caught'},'wait'),null,'Terminal states reject actions');
const sight={map:['#######','#.....#','#..#..#','#.....#','#######'],guards:[{route:[[1,2],[2,2]],range:5}]};
assert(!G.vision(sight,sight.guards[0],0).some(p=>p.x>2),'Walls block sight');
assert.equal(G.step(sight,{x:2,y:1,mask:0,turn:0,status:'playing'},[0,1]).status,'caught','Moving into a current patrol position/sight is caught');
const camera={route:[[2,2]],camera:true,range:3};assert.deepEqual(G.guard(camera,1),{x:2,y:2,dx:1,dy:0},'Camera rotates each turn');
for(const [i,level] of G.levels.entries()){
  assert(level.map.every(row=>row.length===level.map[0].length),'Rectangular level');
  level.guards.forEach(g=>g.route.forEach(([x,y])=>assert(!'#A'.includes(G.cell(level,x,y)),'Guard patrol must be walkable')));
  const path=solve(level);assert(path,`${level.name} is solvable`);assert(path.length<=level.par,`${level.name}: three stars must be possible (${path.length}/${level.par})`);
  let state=G.initial(level);for(const a of path)state=G.step(level,state,a);assert.equal(state.status,'won');
  console.log(`Room ${i+1}: ${path.length} turns / par ${level.par}. ${JSON.stringify(path)}`);
}
console.log('All mechanics and all five rooms passed.');
