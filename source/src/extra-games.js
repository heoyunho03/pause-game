/* PAUSE v0.5 - ten playable standalone minigames; no server or external game dependencies. */
const exRand=n=>Math.floor(Math.random()*n);
const exShuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=exRand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const exStats=pairs=>{const el=$('#shellStats');if(el)el.innerHTML=pairs.map(([k,v])=>`<div class="shell-stat-item"><span>${k}</span><strong>${v}</strong></div>`).join('')};
function exRecord(id,n,smaller=false){const key=`best-${id}`,old=playStore.number(key);if(!old||(smaller?n<old:n>old))playStore.putNumber(key,n);return playStore.number(key)}
function exFinish(title,desc){gameShell.paused=true;pauseMask(title,desc,`<button class="shell-button primary-action" data-shell-action="restart">↻ 다시 하기</button><button class="shell-button subdued" data-shell-action="home">게임 목록</button>`)}
function exButton(text,act,cls=''){return `<button class="ex-button ${cls}" data-${act}>${text}</button>`}
const exBg=['#4371AA','#D49A73','#7B9EC7','#E1B58D','#507EA7','#D78D73'];

/*__PAUSE_BLOCK_PREMIUM__*/

/*__PAUSE_SUDOKU_PREMIUM__*/

/*__PAUSE_TRAFFIC_PREMIUM__*/

/*__PAUSE_HEXA_PREMIUM__*/

/*__PAUSE_BUBBLE_PREMIUM__*/

// Standard 52-card deck utilities shared with ONE CARD. Poker Premium is injected separately.
const SUITS=['♠','♥','♦','♣'];const RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function newDeck(){return exShuffle(Array.from({length:52},(_,i)=>i))}
const rank=c=>c%13+2,suit=c=>Math.floor(c/13),face=c=>RANKS[rank(c)-2]+SUITS[suit(c)];
function cardHtml(c,extra=''){return `<span class="playing-card ${(suit(c)===1||suit(c)===2)?'red':''} ${extra}"><b>${RANKS[rank(c)-2]}</b><strong>${SUITS[suit(c)]}</strong></span>`}
/*__PAUSE_POKER_PREMIUM__*/

/*__PAUSE_ONECARD_PREMIUM__*/

/*__PAUSE_KNIFE_PREMIUM__*/

// Sky Roll and Runner are independent 3D modules; older 2.5D methods retained solely for compatibility.
/*__PAUSE_SKY_PREMIUM__*/
let arcadeS,arcRAF=0,arcTime=0,arcRoot;
function arcFresh(kind){return{kind,lane:0,dist:0,score:0,passed:0,jump:0,slide:0,obstacles:[],spawn:0,over:false,finished:false}}
const arcadeCols=['#568AC4','#E0A079','#90B5D2','#D88A69'];
function arcLine(ctx,x,y,X,Y,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke()}
function arcProject(lane,z,w,h){const depth=Math.max(0,Math.min(1,1-z/80)),p=Math.pow(depth,1.7),horizon=h*.30,base=h*.90,half=35+depth*w*.35;return{x:w/2+lane*half*.55,y:horizon+(base-horizon)*p,scale:.22+1.25*p,half}}
function arcadePaint(){const el=$('#arcCanvas');if(!el)return;const c=el.getContext('2d'),w=el.width,h=el.height;c.clearRect(0,0,w,h);const grd=c.createLinearGradient(0,0,w,h);grd.addColorStop(0,'#142F55');grd.addColorStop(.6,'#101C34');grd.addColorStop(1,'#372F32');c.fillStyle=grd;c.fillRect(0,0,w,h);
// Backdrop: sunrise, distant ridges.
const glow=c.createRadialGradient(w*.75,h*.3,4,w*.75,h*.3,w*.32);glow.addColorStop(0,'#DA986A9C');glow.addColorStop(1,'#DA986A00');c.fillStyle=glow;c.fillRect(0,0,w,h*.85);c.fillStyle='#1A2F4B';c.beginPath();c.moveTo(0,h*.44);for(let i=0;i<=w;i+=20)c.lineTo(i,h*.39+Math.sin(i*.012)*16+Math.cos(i*.032)*8);c.lineTo(w,h);c.lineTo(0,h);c.fill();
const hy=h*.30,by=h*.92;
c.fillStyle='#273F64';c.beginPath();c.moveTo(w*.475,hy);c.lineTo(w*.525,hy);c.lineTo(w*.96,by);c.lineTo(w*.04,by);c.closePath();c.fill();c.strokeStyle='#6D93C0';c.lineWidth=3;c.stroke();for(let l=-1.5;l<=1.5;l++){const a=arcProject(l,80,w,h),b=arcProject(l,0,w,h);arcLine(c,a.x,a.y,b.x,b.y,l===0?'#8AA0BE4B':'#C6B9A75C',l===0?1:2)}for(let z=10;z<80;z+=10){const d=(z+arcadeS.dist*4)%80;const a=arcProject(-1.5,d,w,h),b=arcProject(1.5,d,w,h);arcLine(c,a.x,a.y,b.x,b.y,'#E0AF8150',1)}
// Obstacles, far -> near.
[...arcadeS.obstacles].sort((a,b)=>b.z-a.z).forEach(o=>{const p=arcProject(o.lane,o.z,w,h);const sx=p.scale*25,sy=p.scale*28;c.shadowColor=o.type==='gap'?'#13131E':'#ECAB6B';c.shadowBlur=9;if(o.type==='gap'){c.fillStyle='#050A14';c.fillRect(p.x-sx,p.y-sy*.2,sx*2,sy*.5)}else{c.fillStyle=o.type==='low'?'#8EBDE3':'#DF9767';c.fillRect(p.x-sx,p.y-sy*1.5,sx*2,sy*1.5);c.fillStyle='#E5CFB0';c.fillRect(p.x-sx,p.y-sy*1.5,sx*2,sy*.23)}c.shadowBlur=0});
const pl=arcProject(arcadeS.lane,0,w,h),lift=arcadeS.jump>0?Math.sin(Math.PI*Math.min(1,arcadeS.jump))*.25*h:0;
if(arcadeS.kind==='rolling'){c.shadowColor='#619BE6';c.shadowBlur=22;let r=27;c.fillStyle='#355A91';c.beginPath();c.ellipse(pl.x,pl.y,35,10,0,0,tau);c.fill();let ball=c.createRadialGradient(pl.x-12,pl.y-48,2,pl.x,pl.y-40,r);ball.addColorStop(0,'#DAEDFF');ball.addColorStop(.45,'#699CCD');ball.addColorStop(1,'#183C74');c.fillStyle=ball;c.beginPath();c.arc(pl.x,pl.y-45,r,0,tau);c.fill()}else{c.shadowColor='#D69C72';c.shadowBlur=10;c.fillStyle='#E7B48B';c.beginPath();c.arc(pl.x,pl.y-85-lift,13,0,tau);c.fill();c.lineCap='round';arcLine(c,pl.x,pl.y-70-lift,pl.x,pl.y-33-lift,'#E8EAF4',11);let bend=arcadeS.slide>0?13:0;arcLine(c,pl.x,pl.y-34-lift,pl.x-15,pl.y-7-lift+bend,'#A7C3E2',8);arcLine(c,pl.x,pl.y-34-lift,pl.x+15,pl.y-12-lift+bend,'#A7C3E2',8)}c.shadowBlur=0;c.font='bold 13px sans-serif';c.fillStyle='#DCE9FE';c.fillText(arcadeS.kind==='rolling'?'FINISH · '+Math.max(0,Math.floor(900-arcadeS.dist))+'m':'RUN · '+Math.floor(arcadeS.dist)+'m',15,26)}
function arcUpdate(t){if(!gameShell.id||!['runner','rolling'].includes(gameShell.id))return;const dt=Math.min(.055,(t-(arcTime||t))/1000);arcTime=t;if(!gameShell.paused&&!arcadeS.over&&!arcadeS.finished){const speed=arcadeS.kind==='rolling'?16:18+Math.min(16,arcadeS.dist/80);arcadeS.dist+=speed*dt;arcadeS.spawn+=dt;arcadeS.jump=Math.max(0,arcadeS.jump-dt/0.85);arcadeS.slide=Math.max(0,arcadeS.slide-dt);const gap=arcadeS.kind==='rolling'?1.3:1.0;if(arcadeS.spawn>gap){arcadeS.spawn=0;const type=arcadeS.kind==='rolling'?(Math.random()<.22?'gap':'block'):(Math.random()<.25?'low':Math.random()<.35?'gap':'block');arcadeS.obstacles.push({lane:exRand(3)-1,type,z:80})}arcadeS.obstacles.forEach(o=>o.z-=speed*dt*2.3);const hits=arcadeS.obstacles.filter(o=>o.z<4&&o.z>-4&&o.lane===arcadeS.lane);if(hits.some(o=>arcadeS.kind==='rolling'||(o.type==='low'?arcadeS.slide<=0:o.type==='gap'?arcadeS.jump<=0:arcadeS.jump<=0))){arcadeS.over=true;exRecord(arcadeS.kind,Math.floor(arcadeS.dist));playStore.write(arcadeS.kind,arcadeS);arcadeStats();exFinish('장애물에 부딪혔어요','방향을 바꿔 다음 장애물을 피해 보세요.')}const passed=arcadeS.obstacles.filter(o=>o.z<-5).length;if(passed){arcadeS.passed+=passed;arcadeS.obstacles=arcadeS.obstacles.filter(o=>o.z>=-5)}arcadeS.score=Math.floor(arcadeS.dist);if(arcadeS.kind==='rolling'&&arcadeS.dist>=900){arcadeS.finished=true;exRecord(arcadeS.kind,Math.floor(arcadeS.dist));playStore.write(arcadeS.kind,arcadeS);arcadeStats();exFinish('스테이지 완료!','트랙 끝까지 무사히 달렸어요.')}if(Math.floor(arcadeS.dist/10)>Math.floor((arcadeS.lastSaved||0)/10)){arcadeS.lastSaved=arcadeS.dist;exRecord(arcadeS.kind,arcadeS.score);playStore.write(arcadeS.kind,arcadeS);arcadeStats()}}arcadePaint();arcRAF=requestAnimationFrame(arcUpdate)}
function arcadeStats(){exStats([['이동 거리',Math.floor(arcadeS.dist)+'m'],['최고 거리',playStore.number('best-'+arcadeS.kind)+'m'],['통과 장애물',arcadeS.passed]])}
function arcCommand(d){if(gameShell.paused||arcadeS.over||arcadeS.finished)return;if(d==='left')arcadeS.lane=Math.max(-1,arcadeS.lane-1);if(d==='right')arcadeS.lane=Math.min(1,arcadeS.lane+1);if(d==='up'&&arcadeS.kind==='runner')arcadeS.jump=1;if(d==='down'&&arcadeS.kind==='runner')arcadeS.slide=.6;arcadePaint()}
function arcadeModule(kind){return{markup:()=>`<div class="ex-content ex-arcade"><canvas id="arcCanvas" width="620" height="385" aria-label="원근감 있는 ${kind==='rolling'?'구체 굴리기':'무한 달리기'} 게임"></canvas><div class="arc-controls"><button data-arc="left" aria-label="왼쪽 이동">←</button>${kind==='runner'?'<button data-arc="up">↑ 점프</button><button data-arc="down">↓ 숙이기</button>':'<span>좌우 이동으로 장애물 회피</span>'}<button data-arc="right" aria-label="오른쪽 이동">→</button></div><p class="play-instructions">방향키 또는 버튼 · ${kind==='runner'?'위 스와이프 점프 / 아래 스와이프 숙이기':'좌우 스와이프로 레인 변경'}</p></div>`,help:kind==='rolling'?'900m의 트랙을 완주하세요. 현재 버전은 원근 투영 2.5D 기본형입니다.':'장애물을 피해 최대한 멀리 달리세요. 원근 투영 2.5D 기본형입니다.',mount(){const s=playStore.read(kind,null);arcadeS=s?.kind===kind&&Array.isArray(s.obstacles)?s:arcFresh(kind);arcTime=0;const root=$('.ex-arcade');let sx=0,sy=0;const click=e=>{const b=e.target.closest('[data-arc]');if(b)arcCommand(b.dataset.arc)};const down=e=>{sx=e.clientX;sy=e.clientY};const up=e=>{if(e.target.closest('[data-arc]'))return;let dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<26)return;arcCommand(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')};root.addEventListener('click',click);root.addEventListener('pointerdown',down);root.addEventListener('pointerup',up);arcRAF=requestAnimationFrame(arcUpdate);arcadePaint();arcadeStats();return{move:arcCommand,pause(){playStore.write(kind,arcadeS)},resume(){arcTime=0},reset(){arcadeS=arcFresh(kind);playStore.write(kind,arcadeS);arcadeStats();hideMask()},dispose(){cancelAnimationFrame(arcRAF);root.removeEventListener('click',click);root.removeEventListener('pointerdown',down);root.removeEventListener('pointerup',up);playStore.write(kind,arcadeS)}}}}}
Object.assign(gameModules,{block:blockModule,sudoku:sudokuModule,arrow:trafficModule,hexa:hexaModule,bubble:bubbleModule,poker:pokerModule,onecard:onecardModule,knife:knifeModule,rolling:skyModule,runner:runnerModule});
