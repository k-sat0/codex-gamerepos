"use strict";
// Pure turn simulation, shared by the browser and the level verification script.
const Gallery = (() => {
  const levels = [
    {name:"静かな展示室",brief:"最初の仕事。巡回の背後へ回り込み、夜明けまでに一枚をすり替える。",par:18,
      map:["#########","#....A..#","#..#....#","#..#....#","#.......#","#S.....E#","#########"],guards:[{route:[[5,3],[6,3],[6,4],[5,4]],range:3}]},
    {name:"二枚の肖像",brief:"柱の陰は安全地帯。二つの作品を回収し、東側の出口へ。",par:20,
      map:["#########","#A.....A#","#..#.#..#","#.......#","#..#.#..#","#S.....E#","#########"],guards:[{route:[[3,3],[4,3],[5,3],[4,3]],range:3}]},
    {name:"赤い回廊",brief:"二人の警備員が逆向きに巡回する。次の足音を先読みしよう。",par:24,
      map:["#########","#A..#..A#","#...#...#","#.......#","#.#...#.#","#S.....E#","#########"],guards:[{route:[[2,2],[3,2],[3,3],[2,3]],range:3},{route:[[5,3],[6,3],[6,2],[5,2]],range:2}]},
    {name:"動かない目",brief:"監視カメラはその場で回転する。柱で視線を切り、三枚を入れ替える。",par:24,
      map:["###########","#A...A...A#","#..#...#..#","#.........#","#..#...#..#","#S.......E#","###########"],guards:[{route:[[5,3]],range:4,camera:true},{route:[[2,3],[2,4],[2,5],[2,4]],range:2}]},
    {name:"誰も知らない傑作",brief:"最後の展示室。三つの視線をすり抜けて、完璧な贋作だけを残せ。",par:30,
      map:["###########","#A...#...A#","#..#...#..#","#....A....#","#..#...#..#","#S.......E#","###########"],guards:[{route:[[1,2],[2,2],[2,3],[1,3]],range:2},{route:[[8,3],[9,3],[9,2],[8,2]],range:2},{route:[[5,5]],camera:true,range:3}]}
  ];
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  const cell=(l,x,y)=>l.map[y]?.[x]||"#";
  const find=(l,char)=>l.map.flatMap((row,y)=>Array.from(row,(c,x)=>c===char?{x,y}:null).filter(Boolean));
  const initial=l=>({...find(l,"S")[0],turn:0,mask:0,status:"playing"});
  function guard(g,turn){const i=turn%g.route.length,[x,y]=g.route[i],next=g.route[(i+1)%g.route.length];const d=g.camera?dirs[turn%4]:[Math.sign(next[0]-x),Math.sign(next[1]-y)];return {x,y,dx:d[0],dy:d[1]};}
  function vision(l,g,turn){const p=guard(g,turn),out=[];for(let n=1;n<=g.range;n++){const x=p.x+p.dx*n,y=p.y+p.dy*n;if("#A".includes(cell(l,x,y)))break;out.push({x,y});}return out;}
  function exposed(l,s,turn){return l.guards.some(g=>{const p=guard(g,turn);return p.x===s.x&&p.y===s.y||vision(l,g,turn).some(p=>p.x===s.x&&p.y===s.y);});}
  function nearby(l,s){return find(l,"A").findIndex((p,i)=>!(s.mask&(1<<i))&&Math.abs(p.x-s.x)+Math.abs(p.y-s.y)===1);}
  function step(l,s,action){if(s.status!=="playing")return null;const n={...s,turn:s.turn+1};if(Array.isArray(action)){n.x+=action[0];n.y+=action[1];if(Math.abs(action[0])+Math.abs(action[1])!==1||"#A".includes(cell(l,n.x,n.y)))return null;}else if(action==="swap"){const i=nearby(l,s);if(i<0)return null;n.mask|=1<<i;}else if(action!=="wait")return null;
    if(exposed(l,n,s.turn)||exposed(l,n,n.turn))n.status="caught";
    else if(cell(l,n.x,n.y)==="E"&&n.mask===(1<<find(l,"A").length)-1)n.status="won";
    return n;
  }
  return {levels,dirs,cell,find,initial,guard,vision,nearby,step};
})();
if(typeof module!=="undefined")module.exports=Gallery;
