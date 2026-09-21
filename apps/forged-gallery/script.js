"use strict";
(() => {
  const $=id=>document.getElementById(id), canvas=$("board"),ctx=canvas.getContext("2d"),G=Gallery;
  const key="forged-gallery-records-v1";
  let records={};try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&typeof saved==="object")records=saved;}catch{}
  let index=0,level,state,history=[],replaying=false,replayTimer=null,sound=false,audio=null,previous=null,animStart=0;
  let tile=70,ox=0,oy=0;
  let palette;
  function updatePalette() {
    const css=getComputedStyle(document.documentElement);
    const token=name=>css.getPropertyValue("--"+name).trim();
    const dark=document.documentElement.dataset.theme==="dark";
    palette={
      bg:token("bg"), border:token("border"), wall:token("primary"),
      wallTop:token("primary-hover"), wallShadow:dark?"#0b2634":"#0d4e63",
      floor:token("surface"), floorAlt:token("surface-soft"), tileBorder:token("border"),
      exit:dark?"#83ddbb":"#28745c", exitText:dark?"#0b2634":"#ffffff",
      muted:token("muted"), vision:token("accent-strong")+"55",
      visionLine:token("accent-strong")+"88", danger:token("accent-strong"),
      skin:token("accent"), guard:dark?"#503448":"#723d49",
      glow:token("primary")+"44", player:token("primary"),
      playerRing:token("accent"), playerFace:token("on-primary"),
      fadeClear:token("bg")+"00", fadeEdge:token("bg")+"44", scan:token("text")+"08"
    };
    if(level)draw();
  }
  new MutationObserver(updatePalette).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  updatePalette();
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function beep(type){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);o.type="sine";o.frequency.setValueAtTime(type==="swap"?660:type==="caught"?110:type==="won"?880:240,audio.currentTime);v.gain.setValueAtTime(.055,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.2);}catch{}}
  function stars(turns,par){return turns<=par?3:turns<=par+12?2:1;}
  function nav(){ $("stages").replaceChildren(...G.levels.map((l,i)=>{const b=document.createElement("button");b.textContent=`0${i+1} ${l.name}`;b.className=i===index?"active":"";b.setAttribute("aria-current",i===index?"step":"false");const small=document.createElement("small");small.textContent=records[i]?"★".repeat(stars(records[i],l.par)):"—";b.append(small);b.onclick=()=>start(i);return b;}));}
  function start(i){clearInterval(replayTimer);replaying=false;index=i;level=G.levels[i];state=G.initial(level);history=[{...state}];previous=null;$("result").hidden=true;$("room-number").textContent=`EXHIBITION 0${i+1}`;$("room-name").textContent=level.name;$("brief").textContent=level.brief;$("camera").textContent=`CAM 0${i+1}`;$("par").textContent=`${level.par} 手以内`;canvas.setAttribute("aria-label",`${level.name}。矢印キーまたはWASDで移動、スペースで待機、Eですり替え。`);nav();update("巡回の隙を見つけて、作品の隣へ。");draw();}
  function update(message){$("turn").textContent=`${replaying?"REC ":"TURN "}${String(state.turn).padStart(3,"0")}`;$("collected").textContent=`${state.mask.toString(2).replaceAll("0","").length} / ${G.find(level,"A").length}`;$("best").textContent=records[index]?`${records[index]} 手`:"—";$("swap").disabled=state.status!=="playing"||G.nearby(level,state)<0||replaying;$("undo").disabled=history.length<2||replaying;document.querySelectorAll("[data-move],#wait").forEach(b=>b.disabled=state.status!=="playing"||replaying);if(message)$("message").textContent=message;}
  function act(action){if(replaying)return;const next=G.step(level,state,action);if(!next){if(state.status==="playing")update(action==="swap"?"まだすり替えていない作品の隣へ移動しよう。":"壁や作品のあるマスには移動できません。");return;}previous=state;state=next;history.push({...state});animStart=performance.now();beep(state.status==="playing"?action:state.status);let msg=action==="swap"?"すり替え完了。本物はあなたの手の中に。":action==="wait"?"息を潜めて、警備が通り過ぎるのを待つ。":"足音を立てずに、次の一歩。";if(G.nearby(level,state)>=0)msg="作品に手が届く。「すり替える」で1手。";if(state.mask===(1<<G.find(level,"A").length)-1)msg="全作品のすり替え完了。緑の出口へ。";if(state.status==="caught")msg="視線に捉えられた。1手戻して別のタイミングを。";update(msg);draw();if(state.status!=="playing")finish();}
  function finish(){const won=state.status==="won";if(won){records[index]=Math.min(Number(records[index])||Infinity,state.turn);try{localStorage.setItem(key,JSON.stringify(records));}catch{}nav();update("潜入成功。名画は静かに持ち出された。");}$("result-label").textContent=won?"OPERATION COMPLETE":"SECURITY ALERT";$("result-title").textContent=won?(index===4?"完全犯罪、成立。":"誰も、気づかない。"):"視線の先にいた。";$("result-copy").textContent=won?`${state.turn} 手で潜入成功。${index===4?"最後の展示室もすり替え完了。各室の三つ星に挑戦しよう。":"展示室には、精巧な贋作だけが残された。"}`:"1手戻せば、そこから別のルートを試せます。";$("stars").textContent=won?"★".repeat(stars(state.turn,level.par))+"☆".repeat(3-stars(state.turn,level.par)):"";$("next").textContent=won?(index===4?"最初の展示室へ →":"次の展示室へ →"):"1手戻して続ける";$("result").hidden=false;$("next").focus({preventScroll:true});}
  function undo(){if(replaying||history.length<2)return;history.pop();state={...history.at(-1)};previous=null;$("result").hidden=true;update("1手前に戻りました。別の一手を。");draw();}
  function replay(){if(history.length<2||replaying)return;replaying=true;$("result").hidden=true;let frame=0;const end={...state};previous=null;state={...history[0]};update("防犯カメラの記録を再生中…（やり直すで中止）");draw();replayTimer=setInterval(()=>{frame++;if(frame>=history.length){clearInterval(replayTimer);replaying=false;state=end;update();draw();finish();return;}previous=state;state={...history[frame]};animStart=performance.now();update();draw();},reduced?350:230);}
  function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  function text(t,x,y,size,color,font="monospace"){ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(t,x,y);}
  function line(x,y,x2,y2,c,width=1){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
  function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function artwork(x,y,i,done){const s=tile;ctx.save();ctx.translate(x+s/2,y+s/2);ctx.shadowColor="#0009";ctx.shadowBlur=10;ctx.shadowOffsetY=4;rect(-s*.28,-s*.33,s*.56,s*.66,"#cbb379");ctx.shadowBlur=0;ctx.shadowOffsetY=0;rect(-s*.23,-s*.28,s*.46,s*.56,"#352d23");rect(-s*.2,-s*.25,s*.4,s*.5,["#546970","#975f4d","#798361"][i%3]);circle(s*.06,-s*.1,s*.085,"#dfc389");ctx.fillStyle="#283d3b";ctx.beginPath();ctx.moveTo(-s*.2,s*.25);ctx.lineTo(-s*.2,s*.05);ctx.lineTo(-s*.05,-s*.03);ctx.lineTo(s*.2,s*.2);ctx.lineTo(s*.2,s*.25);ctx.fill();line(-s*.08,-s*.25,-s*.08,s*.25,"#cfb48655",2);if(done){circle(s*.25,s*.25,s*.13,"#a5d3b9");text("✓",s*.25,s*.25,s*.17,"#173b2b");}ctx.restore();}
  function draw(now=performance.now()){
    const w=canvas.width,h=canvas.height,cols=level.map[0].length,rows=level.map.length;
    tile=Math.min((w-80)/cols,(h-100)/rows);ox=(w-cols*tile)/2;oy=(h-rows*tile)/2;
    rect(0,0,w,h,palette.bg);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=ox+x*tile,py=oy+y*tile,c=G.cell(level,x,y);if(c==="#"){rect(px,py,tile,tile,palette.border);rect(px+3,py+3,tile-6,tile-9,palette.wall);line(px+4,py+4,px+tile-4,py+4,palette.wallTop,2);rect(px+2,py+tile-7,tile-4,7,palette.wallShadow);}else{rect(px,py,tile,tile,(x+y)%2?palette.floor:palette.floorAlt);ctx.strokeStyle=palette.tileBorder;ctx.lineWidth=1;ctx.strokeRect(px+2,py+2,tile-4,tile-4);if(c==="E"){rect(px+7,py+7,tile-14,tile-14,palette.exit);text("EXIT",px+tile/2,py+tile*.43,tile*.16,palette.exitText);text("↓",px+tile/2,py+tile*.68,tile*.24,palette.exitText);}if(c==="S")text("IN",px+tile/2,py+tile/2,tile*.16,palette.muted);}}
    for(const g of level.guards){for(const p of G.vision(level,g,state.turn)){rect(ox+p.x*tile+2,oy+p.y*tile+2,tile-4,tile-4,palette.vision);line(ox+p.x*tile+5,oy+(p.y+1)*tile-5,ox+(p.x+1)*tile-5,oy+p.y*tile+5,palette.visionLine);}const n=G.guard(g,state.turn+1);ctx.strokeStyle=palette.muted;ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(ox+(n.x+.5)*tile,oy+(n.y+.5)*tile,tile*.28,0,7);ctx.stroke();ctx.setLineDash([]);}
    G.find(level,"A").forEach((p,i)=>artwork(ox+p.x*tile,oy+p.y*tile,i,!!(state.mask&(1<<i))));
    const t=reduced?1:Math.min(1,(now-animStart)/140),ease=1-Math.pow(1-t,3);
    level.guards.forEach(g=>{const pos=G.guard(g,state.turn),old=previous?G.guard(g,previous.turn):pos,x=ox+(old.x+(pos.x-old.x)*ease+.5)*tile,y=oy+(old.y+(pos.y-old.y)*ease+.5)*tile;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(pos.dy,pos.dx));ctx.fillStyle=palette.danger;ctx.beginPath();ctx.moveTo(tile*.36,0);ctx.lineTo(tile*.19,-tile*.1);ctx.lineTo(tile*.19,tile*.1);ctx.fill();circle(0,3,tile*.21,"#0003");circle(0,0,tile*.19,palette.danger);circle(tile*.035,0,tile*.115,palette.skin);if(g.camera){rect(-tile*.15,-tile*.12,tile*.29,tile*.24,palette.guard);rect(tile*.12,-tile*.08,tile*.09,tile*.16,palette.danger);}else{rect(-tile*.13,-tile*.15,tile*.16,tile*.3,palette.guard);}ctx.restore();});
    const p=previous||state,px=ox+(p.x+(state.x-p.x)*ease+.5)*tile,py=oy+(p.y+(state.y-p.y)*ease+.5)*tile;
    circle(px,py+4,tile*.23,"#0004");ctx.shadowBlur=18;ctx.shadowColor=palette.glow;circle(px,py,tile*.22,palette.player);ctx.shadowBlur=0;ctx.strokeStyle=palette.playerRing;ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,tile*.22,0,7);ctx.stroke();circle(px,py-tile*.045,tile*.12,palette.playerFace);rect(px-tile*.13,py-tile*.06,tile*.26,tile*.065,palette.player);rect(px-tile*.07,py+tile*.09,tile*.14,tile*.1,palette.player);
    const vignette=ctx.createRadialGradient(w/2,h/2,w*.2,w/2,h/2,w*.65);vignette.addColorStop(0,palette.fadeClear);vignette.addColorStop(1,palette.fadeEdge);ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
    text(`GALLERY / ${String(index+1).padStart(2,"0")}`,w/2,24,11,palette.muted);text(replaying?"▶ SECURITY FOOTAGE":"ALL MOVEMENTS ARE RECORDED",w/2,h-23,10,palette.muted);
    // Quiet CCTV scan lines without continuous animation.
    for(let y=0;y<h;y+=4)rect(0,y,w,1,palette.scan);
    if(t<1)requestAnimationFrame(draw);
  }
  document.querySelectorAll("[data-move]").forEach(b=>b.onclick=()=>act(b.dataset.move.split(",").map(Number)));
  $("swap").onclick=()=>act("swap");$("wait").onclick=()=>act("wait");$("undo").onclick=undo;$("restart").onclick=()=>start(index);$("retry-result").onclick=()=>start(index);$("next").onclick=()=>{if(state.status==="caught")undo();else start((index+1)%G.levels.length);};$("replay").onclick=replay;
  $("sound").onclick=()=>{sound=!sound;$("sound").textContent=`音 ${sound?"ON":"OFF"}`;$("sound").setAttribute("aria-pressed",String(sound));beep("swap");};
  document.addEventListener("keydown",e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.repeat)return;const k=e.key.toLowerCase(),moves={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};if(k===" "&&e.target.closest("button,summary"))return;if(moves[k]){e.preventDefault();act(moves[k]);}else if(k===" "){e.preventDefault();act("wait");}else if(k==="e")act("swap");else if(k==="z")undo();else if(k==="r")start(index);});
  canvas.addEventListener("pointerdown",e=>{if(replaying||state.status!=="playing")return;canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),x=Math.floor(((e.clientX-r.left)*canvas.width/r.width-ox)/tile),y=Math.floor(((e.clientY-r.top)*canvas.height/r.height-oy)/tile),dx=x-state.x,dy=y-state.y;if(Math.abs(dx)+Math.abs(dy)===1){if(G.cell(level,x,y)==="A")act("swap");else act([dx,dy]);}else if(!dx&&!dy)act("wait");});
  // Keep subsequent Space presses on the game after keyboard movement from a UI button.
  document.addEventListener("keydown",e=>{if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&state.status==="playing"&&/^(arrowup|arrowdown|arrowleft|arrowright|w|a|s|d|z)$/i.test(e.key))canvas.focus({preventScroll:true});});
  start(0);
})();
