/* PAUSE v1.1 Bubble Shooter Premium — original client-only implementation.
   All coordinates live in logical 340×513 canvas units; no external game assets. */
const bubbleCore=(()=>{
 const W=340,H=513,R=20,D=40,VSTEP=Math.sqrt(3)*D/2,TOP=24,ROWS=12,COLS=8,LAUNCH={x:W/2,y:467},DANGER_ROW=11;
 const colors=['#5C8EC4','#DE956E','#D9848C','#6DB3A5','#D8B76F','#A79CCE'];
 const glyphs=['●','◆','✦','＋','▲','✕'];
 const tiers={easy:{label:'쉬움',rows:4,colors:4,misses:6},normal:{label:'보통',rows:5,colors:5,misses:5},hard:{label:'어려움',rows:6,colors:6,misses:4}};
 const index=(r,c)=>r*COLS+c;
 const center=(r,c)=>({x:R+D*c+(r%2?D/2:0),y:TOP+VSTEP*r});
 const inBounds=(r,c)=>r>=0&&r<ROWS&&c>=0&&c<COLS;
 function neighbors(i){let r=Math.floor(i/COLS),c=i%COLS;const coords=[[r,c-1],[r,c+1],[r-1,c+(r%2?1:0)],[r-1,c+(r%2?0:-1)],[r+1,c+(r%2?1:0)],[r+1,c+(r%2?0:-1)]];return coords.filter(([y,x])=>inBounds(y,x)).map(([y,x])=>index(y,x));}
 function connected(board,start,predicate){const stack=[start],seen=new Set([start]);while(stack.length){for(const j of neighbors(stack.pop()))if(!seen.has(j)&&predicate(j)){seen.add(j);stack.push(j)}}return seen;}
 function removeClusters(board,placed){const next=board.slice(),color=next[placed],match=connected(next,placed,j=>next[j]===color);let popped=0,dropped=0;
  if(match.size>=3){popped=match.size;for(const i of match)next[i]=null;let attached=new Set();for(let c=0;c<COLS;c++)if(next[index(0,c)]!==null){const group=connected(next,index(0,c),i=>next[i]!==null);for(const i of group)attached.add(i)}for(let i=0;i<next.length;i++)if(next[i]!==null&&!attached.has(i)){next[i]=null;dropped++;}}
  return{board:next,popped,dropped};}
 function activeColors(board){return[...new Set(board.filter(v=>v!==null))]}
 function chooseColor(board){const pool=activeColors(board);return pool.length?pool[Math.floor(Math.random()*pool.length)]:0;}
 function fresh(tier='normal'){
  const settings=tiers[tier]||tiers.normal,b=Array(ROWS*COLS).fill(null);
  for(let r=0;r<settings.rows;r++)for(let c=0;c<COLS;c++){
    if(r>2&&Math.random()<.11)continue;
    const candidates=[];if(c>0&&b[index(r,c-1)]!==null)candidates.push(b[index(r,c-1)]);if(r>0&&b[index(r-1,c)]!==null)candidates.push(b[index(r-1,c)]);
    b[index(r,c)]=candidates.length&&Math.random()<.64?candidates[Math.floor(Math.random()*candidates.length)]:Math.floor(Math.random()*settings.colors);
  }
  return{v:1,tier,board:b,score:0,shots:0,misses:0,streak:0,current:chooseColor(b),next:chooseColor(b),won:false,over:false};
 }
 function validState(s){return !!s&&s.v===1&&tiers[s.tier]&&Array.isArray(s.board)&&s.board.length===ROWS*COLS&&s.board.every(x=>x===null||(Number.isInteger(x)&&x>=0&&x<colors.length))&&['score','shots','misses','streak'].every(k=>Number.isInteger(s[k])&&s[k]>=0)&&[s.current,s.next].every(x=>Number.isInteger(x)&&x>=0&&x<colors.length);}
 function nearestOpen(board,pos,hit){let target=-1,best=Infinity;for(let i=0;i<board.length;i++){
   if(board[i]!==null)continue;const r=Math.floor(i/COLS),c=i%COLS; if(hit!==null&&r!==0&&!neighbors(i).some(n=>board[n]!==null))continue;
   const cell=center(r,c),dist=(cell.x-pos.x)**2+(cell.y-pos.y)**2;
   if(dist<best){best=dist;target=i;}}
  return target;
 }
 // One miss may introduce a new ceiling row. The board is checked for overflow before shifting.
 function addRow(board,settings){const next=Array(ROWS*COLS).fill(null);let overflow=false;
  for(let r=ROWS-1;r>=0;r--)for(let c=0;c<COLS;c++){const v=board[index(r,c)];if(r===ROWS-1&&v!==null)overflow=true;else if(r<ROWS-1)next[index(r+1,c)]=v;}
  const pool=activeColors(board);for(let c=0;c<COLS;c++){const prev=c>0?next[c-1]:null;next[c]=prev!==null&&Math.random()<.55?prev:pool.length?pool[Math.floor(Math.random()*pool.length)]:Math.floor(Math.random()*settings.colors)}
  return{board:next,overflow};
 }
 function applyShot(s,cell){if(cell<0||s.board[cell]!==null)return{ok:false,reason:'no-landing'};
  const before=s.board.slice();before[cell]=s.current;const res=removeClusters(before,cell),next={...s,board:res.board,shots:s.shots+1};
  const cleared=res.popped>0;if(cleared){next.streak++;next.misses=0;next.score+=res.popped*25+res.dropped*45+(next.streak>1?(next.streak-1)*20:0)}else{next.streak=0;next.misses++;}
  let advanced=false;if(!cleared&&next.misses>=tiers[s.tier].misses){const adv=addRow(next.board,tiers[s.tier]);next.board=adv.board;next.misses=0;advanced=true;next.over=adv.overflow;}
  if(next.board.every(v=>v===null)){next.won=true;next.score+=500;next.over=false;}
  if(!next.won&&next.board.slice(DANGER_ROW*COLS).some(v=>v!==null))next.over=true;
  if(!next.won&&!next.over){const pool=activeColors(next.board);next.current=pool.includes(s.next)?s.next:chooseColor(next.board);next.next=chooseColor(next.board)}
  return{ok:true,state:next,popped:res.popped,dropped:res.dropped,advanced,cleared};
 }
 function trace(board,angle){const path=[],step=4,dx=Math.sin(angle)*step,dy=-Math.cos(angle)*step;
  let x=LAUNCH.x,y=LAUNCH.y,hit=null,vx=dx;
  for(let t=0;t<250;t++){
   x+=vx; y+=dy;
   if(x<R){x=2*R-x;vx=Math.abs(vx);}else if(x>W-R){x=2*(W-R)-x;vx=-Math.abs(vx);}
   if(t%3===0)path.push({x,y});
   if(y<=TOP){hit={x,y:TOP,cell:null};break;}
   for(let i=0;i<board.length;i++)if(board[i]!==null){const c=center(Math.floor(i/COLS),i%COLS);if((c.x-x)**2+(c.y-y)**2<=(D-1.0)**2){hit={x,y,cell:i};break;}}
   if(hit)break;
  }
  return{path,hit};
 }
 return{W,H,R,D,TOP,VSTEP,ROWS,COLS,LAUNCH,DANGER_ROW,colors,glyphs,tiers,index,center,neighbors,connected,removeClusters,activeColors,chooseColor,fresh,validState,nearestOpen,addRow,applyShot,trace};
})();

const bubbleModule=(()=>{
 const C=bubbleCore;
 let root,canvas,ctx,game,raf=0,last=0,aim=0,projectile=null,particles=[],guide=true,showSymbols=true,gesture=null,reduced=false;
 const save=()=>{if(game){playStore.write('bubble-premium-v1',game);playStore.write('bubble-premium-v1-'+game.tier,game)}};
 const bestKey=t=>`best-bubble-${t}`;
 const stats=()=>{
  exStats([['최고 점수',playStore.number(bestKey(game.tier)).toLocaleString('ko-KR')],['발사',`${game.shots}회`],['난이도',C.tiers[game.tier].label]]);
  const score=root?.querySelector('[data-bsp-score]');if(!score)return;
  score.textContent=game.score.toLocaleString('ko-KR');root.querySelector('[data-bsp-best]').textContent=playStore.number(bestKey(game.tier)).toLocaleString('ko-KR');
  root.querySelector('[data-bsp-left]').textContent=`${Math.max(0,C.tiers[game.tier].misses-game.misses)}회`;
  root.querySelector('[data-bsp-current]').style.setProperty('--bspcolor',C.colors[game.current]);
  root.querySelector('[data-bsp-next]').style.setProperty('--bspcolor',C.colors[game.next]);
  root.querySelector('[data-bsp-swap]').disabled=!!projectile||game.won||game.over;
  root.querySelector('[data-bsp-fire]').disabled=!!projectile||game.won||game.over;
  root.querySelector('[data-bsp-tiers]').querySelectorAll('button').forEach(b=>{const yes=b.dataset.bspTier===game.tier;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))});
  root.querySelector('[data-bsp-current-color]').textContent=`현재: ${['블루','선셋','코랄','민트','골드','라벤더'][game.current]}`;
 };
 function status(text){const el=root?.querySelector('[data-bsp-message]');if(el)el.textContent=text}
 const orbAtlas=new Map();
 function orbArt(color,r){const key=`${color}:${Math.round(r)}:${showSymbols}`;if(orbAtlas.has(key))return orbAtlas.get(key);
  const dpr=2,size=Math.ceil((r+5)*2),a=document.createElement('canvas');a.width=size*dpr;a.height=size*dpr;
  const g=a.getContext('2d');g.scale(dpr,dpr);const x=size/2,y=size/2,col=C.colors[color];
  const grad=g.createRadialGradient(x-r*.4,y-r*.5,r*.08,x,y,r*1.25);
  grad.addColorStop(0,'#fffefa');grad.addColorStop(.17,col);grad.addColorStop(.72,col);grad.addColorStop(1,'#101f34');
  g.fillStyle=grad;g.shadowColor=col+'77';g.shadowBlur=6;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.shadowBlur=0;
  g.strokeStyle='#ffffff77';g.lineWidth=1.2;g.stroke();g.beginPath();g.ellipse(x-r*.33,y-r*.45,r*.22,r*.12,-.6,0,Math.PI*2);g.fillStyle='#ffffffb6';g.fill();
  if(showSymbols){g.font=`900 ${Math.round(r*.66)}px system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#11243caa';g.fillText(C.glyphs[color],x,y+1)}
  orbAtlas.set(key,a);return a;
 }
 function drawOrb(x,y,color,r=C.R*0.91,opacity=1){ctx.save();ctx.globalAlpha=opacity;const art=orbArt(color,r),d=art.width/2;ctx.drawImage(art,x-d/2,y-d/2,d,d);ctx.restore()}

 function paint(){if(!ctx||!game)return;
  ctx.clearRect(0,0,C.W,C.H);let bg=ctx.createLinearGradient(0,0,C.W,C.H);bg.addColorStop(0,'#101f34');bg.addColorStop(.57,'#0c1c2e');bg.addColorStop(1,'#201e2a');ctx.fillStyle=bg;ctx.fillRect(0,0,C.W,C.H);
  let gl=ctx.createRadialGradient(0,200,5,0,230,270);gl.addColorStop(0,'#3267a13f');gl.addColorStop(1,'#3267a100');ctx.fillStyle=gl;ctx.fillRect(0,0,C.W,C.H);
  let warm=ctx.createRadialGradient(360,510,12,330,480,190);warm.addColorStop(0,'#D58D612b');warm.addColorStop(1,'#D58D6100');ctx.fillStyle=warm;ctx.fillRect(0,0,C.W,C.H);
  ctx.setLineDash([5,7]);ctx.strokeStyle='#D58D6180';ctx.lineWidth=1;ctx.beginPath();let dangerY=C.center(C.DANGER_ROW,0).y+8;ctx.moveTo(0,dangerY);ctx.lineTo(C.W,dangerY);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<game.board.length;i++)if(game.board[i]!==null){const r=Math.floor(i/C.COLS),c=i%C.COLS,p=C.center(r,c);drawOrb(p.x,p.y,game.board[i]);}
  if(guide&&!projectile&&!game.over&&!game.won&&!gameShell.paused){const trace=C.trace(game.board,aim);trace.path.forEach((p,i)=>{if(i%2!==0||p.y>C.LAUNCH.y-30)return;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.2,3.4-i*.025),0,Math.PI*2);ctx.fillStyle=i<15?'#b9d8efb8':'#E8AD7D88';ctx.fill();});if(trace.hit){const i=C.nearestOpen(game.board,trace.hit,trace.hit.cell);if(i!==-1){const p=C.center(Math.floor(i/C.COLS),i%C.COLS);ctx.strokeStyle='#edd1b7a8';ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(p.x,p.y,C.R,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}}}
  ctx.save();ctx.translate(C.LAUNCH.x,C.LAUNCH.y+19);ctx.rotate(aim);ctx.strokeStyle='#9fb5d0';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,7);ctx.lineTo(0,-35);ctx.stroke();ctx.fillStyle='#c8d9eb';ctx.beginPath();ctx.moveTo(-7,-28);ctx.lineTo(0,-40);ctx.lineTo(7,-28);ctx.fill();ctx.restore();
  if(projectile)drawOrb(projectile.x,projectile.y,projectile.color);else if(!game.over&&!game.won)drawOrb(C.LAUNCH.x,C.LAUNCH.y,game.current,C.R*.98);
  for(const p of particles){ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.duration);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore()}
  ctx.fillStyle='#abc7db55';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.fillText('PAUSE  /  BUBBLE STUDIO',C.W/2,C.H-13);
 }
 function setCanvas(){const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(C.W*dpr);canvas.height=Math.round(C.H*dpr);ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);paint()}
 function announceEnd(){if(!game.won&&!game.over)return;gameShell.paused=true;save();if(game.won)exFinish('버블 모두 클리어!','벽 반사와 연결 제거를 활용해 모든 버블을 정리했어요.');else exFinish('버블이 위험선에 닿았어요','다음에는 천장 연결부를 먼저 노려보세요.');}
 function settle(pos,hit){const cell=C.nearestOpen(game.board,pos,hit);projectile=null;
  if(cell<0){game.over=true;status('둘 공간이 없어요. 게임 오버!');save();stats();paint();announceEnd();return}
  const prior=game.board.slice();const output=C.applyShot(game,cell);if(!output.ok){game.over=true;save();announceEnd();return}
  game=output.state;
  if(output.popped){const removed=prior.map((x,i)=>x!==null&&game.board[i]===null?i:-1).filter(x=>x>=0);
    if(!reduced)for(const i of removed.slice(0,32)){const p=C.center(Math.floor(i/C.COLS),i%C.COLS);for(let k=0;k<4;k++){const a=Math.random()*Math.PI*2,sp=40+Math.random()*120;particles.push({x:p.x,y:p.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:2+Math.random()*3,color:C.colors[prior[i]],life:.4,duration:.4})}};
    status(`${output.popped}개 터뜨림${output.dropped?` · ${output.dropped}개 낙하!`:''}${game.streak>1?` · ${game.streak}연속 콤보`:''}`);
  }else status(output.advanced?'천장이 한 줄 내려왔어요!':'연결된 같은 색 3개를 노려보세요.');
  if(game.score>playStore.number(bestKey(game.tier)))playStore.putNumber(bestKey(game.tier),game.score);
  save();stats();paint();if(game.won||game.over){announceEnd();return}
  if(particles.length&&!reduced)start();
 }
 function frame(now){raf=0;if(!root||gameShell.paused)return;let dt=last?Math.min(.032,(now-last)/1000):.016;last=now;
  if(projectile){let steps=Math.max(1,Math.ceil(dt/.007));for(let k=0;k<steps;k++){
   const d=dt/steps;projectile.x+=projectile.vx*d;projectile.y+=projectile.vy*d;
   if(projectile.x<C.R){projectile.x=2*C.R-projectile.x;projectile.vx=Math.abs(projectile.vx)}else if(projectile.x>C.W-C.R){projectile.x=2*(C.W-C.R)-projectile.x;projectile.vx=-Math.abs(projectile.vx)}
   let hit=null;if(projectile.y<=C.TOP)hit={cell:null};else for(let i=0;i<game.board.length;i++)if(game.board[i]!==null){const p=C.center(Math.floor(i/C.COLS),i%C.COLS);if((p.x-projectile.x)**2+(p.y-projectile.y)**2<=(C.D-1)**2){hit={cell:i};break}}
   if(hit){settle({x:projectile.x,y:projectile.y},hit.cell);break}
  }}
  if(particles.length)particles=particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;return p.life>0});
  paint();if(projectile||particles.length)raf=requestAnimationFrame(frame);
 }
 function start(){if(!raf&&root&&!gameShell.paused){last=0;raf=requestAnimationFrame(frame)}}
 function shoot(){if(gameShell.paused||game.over||game.won||projectile)return;const speed=680;projectile={x:C.LAUNCH.x,y:C.LAUNCH.y,color:game.current,vx:Math.sin(aim)*speed,vy:-Math.cos(aim)*speed};status('발사 중…');stats();start()}
 function swap(){if(gameShell.paused||game.won||game.over||projectile)return;[game.current,game.next]=[game.next,game.current];save();stats();paint()}
 function setAngle(x,y){const a=Math.atan2(x-C.LAUNCH.x,C.LAUNCH.y-y);aim=Math.max(-1.31,Math.min(1.31,a));paint()}
 function pointerLoc(e){const box=canvas.getBoundingClientRect();return{x:(e.clientX-box.left)*C.W/box.width,y:(e.clientY-box.top)*C.H/box.height}}
 function onDown(e){if(gameShell.paused||game.over||game.won||projectile)return;if(e.pointerType==='mouse'&&e.button!==0)return;gesture=e.pointerId;canvas.setPointerCapture(e.pointerId);const p=pointerLoc(e);setAngle(p.x,p.y)}
 function onMove(e){if(gameShell.paused||game.over||game.won||projectile)return;if(gesture===null&&e.pointerType!=='mouse')return;const p=pointerLoc(e);setAngle(p.x,p.y)}
 function onUp(e){if(gesture!==e.pointerId)return;gesture=null;const p=pointerLoc(e);setAngle(p.x,p.y);if(e.type==='pointerup')shoot()}
 function onKey(e){if(!root||gameShell.paused||document.activeElement?.matches('input,textarea,select'))return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();aim=Math.max(-1.31,Math.min(1.31,aim+(e.key==='ArrowLeft'?-0.085:0.085)));paint()}
  else if([' ','Enter'].includes(e.key)){e.preventDefault();shoot()}
  else if(['x','X','s','S'].includes(e.key)){e.preventDefault();swap()}
 }
 function chooseTier(t){if(!C.tiers[t]||t===game.tier||projectile)return;save();const stored=playStore.read(`bubble-premium-v1-${t}`,null);game=C.validState(stored)?stored:C.fresh(t);projectile=null;particles=[];gameShell.paused=false;hideMask();status('스와이프해서 조준하고 손을 떼면 발사해요.');save();stats();paint()}
 function onClick(e){const tier=e.target.closest('[data-bsp-tier]');if(tier){chooseTier(tier.dataset.bspTier);return}
  if(e.target.closest('[data-bsp-swap]'))swap();else if(e.target.closest('[data-bsp-fire]'))shoot();else if(e.target.closest('[data-bsp-glyph]')){showSymbols=!showSymbols;orbAtlas.clear();root.querySelector('[data-bsp-glyph]').setAttribute('aria-pressed',String(showSymbols));paint();}}
 return{markup:()=>`<div class="bsp-wrap"><div class="bsp-toolbar"><div class="bsp-heading"><strong>Bubble Studio</strong><small>조준하고 · 연결하고 · 터뜨리기</small></div><div class="bsp-difficulties" data-bsp-tiers role="group" aria-label="버블 슈터 난이도"><button type="button" data-bsp-tier="easy">쉬움</button><button type="button" data-bsp-tier="normal">보통</button><button type="button" data-bsp-tier="hard">어려움</button></div></div><div class="bsp-scoreboard"><div class="bsp-stat"><span>현재 점수</span><b data-bsp-score>0</b></div><div class="bsp-stat"><span>최고 기록</span><b data-bsp-best>0</b></div><div class="bsp-stat"><span>새 줄까지</span><b data-bsp-left>5회</b></div></div><div class="bsp-game-area"><div class="bsp-canvas-frame"><canvas id="bubblePremiumCanvas" width="340" height="513" aria-label="버블 슈터 게임판. 마우스나 손가락으로 조준하고 놓으면 발사합니다."></canvas><div class="bsp-info"><span class="bsp-chip">3개 이상 연결</span><span class="bsp-chip danger">위험선 주의</span></div></div></div><div class="bsp-bottom"><button type="button" data-bsp-swap aria-label="현재 버블과 다음 버블 교체"><span class="bsp-swatch" data-bsp-current></span>⇄<span class="bsp-swatch" data-bsp-next></span> 교체</button><button type="button" class="bsp-fire" data-bsp-fire>↗ 발사하기</button><button type="button" data-bsp-glyph aria-pressed="true" aria-label="버블 심볼 표시 켜기 또는 끄기">◈ 심볼</button></div><p class="bsp-status" data-bsp-message role="status" aria-live="polite">스와이프해서 조준하고 손을 떼면 발사해요.</p><p class="bsp-guide"><span data-bsp-current-color></span> · 마우스 클릭 / 터치 놓기 발사 · ← → 각도 조절 · 스페이스 발사 · X 교체</p></div>`,
 help:'벌집 형태의 버블을 3개 이상 연결하세요. 좌우 벽에 반사시키고, 천장과 연결이 끊긴 버블을 떨어뜨려 점수를 얻어요.',
 mount(){root=document.querySelector('.bsp-wrap');canvas=root.querySelector('#bubblePremiumCanvas');reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
  const old=playStore.read('bubble-premium-v1',null);game=C.validState(old)?old:C.fresh('normal');projectile=null;particles=[];guide=true;showSymbols=true;gesture=null;aim=0;
  setCanvas();root.addEventListener('click',onClick);canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);document.addEventListener('keydown',onKey);
  stats();paint();save();if(game.won||game.over)status('이전 게임은 종료됐어요. 새 게임을 시작할 수 있어요.');
  return{pause(){save();if(raf)cancelAnimationFrame(raf);raf=0},resume(){paint();if(projectile||particles.length)start()},reset(){game=C.fresh(game.tier);projectile=null;particles=[];save();stats();hideMask();status('새 게임! 같은 색 3개를 연결해 보세요.');paint()},dispose(){save();if(raf)cancelAnimationFrame(raf);raf=0;root.removeEventListener('click',onClick);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);document.removeEventListener('keydown',onKey);root=null;canvas=null;ctx=null;}}
  }
 }
})();
