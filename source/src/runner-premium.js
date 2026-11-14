/* PAUSE / Infinite Runner Premium v1.7 — original no-server endless runner.
   Pure rules are intentionally separate from rendering and game-shell state. */
const RUN_KEY='runner-parkour-v2',RUN_RECORD='best-runner3d',RUN_STEP=17.5,RUN_LANES=[-2.18,0,2.18];
const RUN_MODES={relaxed:{name:'편안하게',speed:.83,spawn:.72},classic:{name:'클래식',speed:1,spawn:1},precision:{name:'챌린지',speed:1.16,spawn:1.24}};
const runMode=s=>RUN_MODES[s?.mode]?s.mode:'classic';
const runClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function runRand(seed){let x=(seed||1)>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function runFresh(seed,mode='classic'){return{version:1,mode,seed:(seed??((Math.random()*4294967294+1)>>>0)),distance:0,score:0,gems:0,passed:0,combo:0,maxCombo:0,stunts:0,style:0,age:0,lane:1,x:0,safeLane:1,jumpTime:0,slideTime:0,nextRow:0,rows:[],running:false,over:false,reason:'',savedAt:0}}
function runSpeed(d,mode='classic'){return (13+Math.min(15,Math.sqrt(Math.max(0,d))*.58))*(RUN_MODES[mode]||RUN_MODES.classic).speed}
function runJumpHeight(s){if(s.jumpTime<=0)return 0;const p=1-s.jumpTime/.86;return Math.max(0,4*p*(1-p)*2.1)}
function runBuildRow(s){const index=s.nextRow++,r=runRand((s.seed^Math.imul(index+29,2654435761))>>>0),prev=s.safeLane;
 const safe=runClamp(prev+Math.floor(r()*3)-1,0,2);s.safeLane=safe;
 const challenge=Math.min(1,index/62),hazards=[],modifier=RUN_MODES[runMode(s)].spawn;
 if(index>=4){let options=[0,1,2].filter(i=>i!==safe);if(r()<Math.min(.98,(.74+challenge*.2)*modifier)){let count=(r()<Math.min(.85,(.12+challenge*.37)*modifier))?2:1;while(count--&&options.length){const p=Math.floor(r()*options.length),lane=options.splice(p,1)[0],t=r(),type=t<.30?'pillar':t<.56?'hurdle':t<.79?'gate':'gap';hazards.push({lane,type})}}
 // Occasionally challenge the guaranteed corridor, but only with a jump/slide-able obstacle.
 if(index>14&&r()<Math.min(.85,(.12+challenge*.18)*modifier))hazards.push({lane:safe,type:r()<.5?'hurdle':'gate'});
 }
 const gems=[];if(index>1&&r()<.84){let lane=(r()<.76?safe:Math.floor(r()*3));if(!hazards.some(h=>h.lane===lane))gems.push({lane,got:false})}
 const row={index,hazards,gems,checked:false};s.rows.push(row);return row}
function runEnsure(s){while(s.nextRow<Math.floor(s.distance/RUN_STEP)+11)runBuildRow(s);s.rows=s.rows.filter(row=>row.index*RUN_STEP>=s.distance-24)}
function runMove(s,direction){if(s.over||!s.running)return false;
 if(direction==='left'||direction==='right'){const next=runClamp(s.lane+(direction==='left'?-1:1),0,2);if(next===s.lane)return false;s.lane=next;return true}
 if(direction==='up'){if(s.jumpTime>0||s.slideTime>0)return false;s.jumpTime=.86;return true}
 if(direction==='down'){if(s.jumpTime>0)return false;s.slideTime=.72;return true}return false}
// Consistent hitboxes with rendered obstacles; avoid nearest-lane snap during transitions.
const RUN_PLAYER_RADIUS=.34;
function runHazardHit(s,h){
 const halfWidth=({pillar:.725,hurdle:.825,gate:1.025,gap:1.025})[h.type]??.72;
 const inX=Math.abs(s.x-RUN_LANES[h.lane])<halfWidth+RUN_PLAYER_RADIUS-.08;
 if(!inX)return false;
 const jump=runJumpHeight(s),slide=s.slideTime>0;
 if(h.type==='hurdle'||h.type==='gap')return jump<=.50;
 if(h.type==='gate')return !slide;
 return true;
}
function runStep(s,dt){if(!s.running||s.over)return;dt=runClamp(dt,0,.05);const previous=s.distance;s.age+=dt;s.jumpTime=Math.max(0,s.jumpTime-dt);s.slideTime=Math.max(0,s.slideTime-dt);
 s.x+=runClamp(RUN_LANES[s.lane]-s.x,-dt*15,dt*15);
 s.distance+=runSpeed(s.distance,runMode(s))*dt;runEnsure(s);
 for(const row of s.rows){const at=row.index*RUN_STEP;if(row.checked||at> s.distance||at<previous)continue;
 row.checked=true;for(const h of row.hazards){
 if(runHazardHit(s,h)){s.combo=0;s.over=true;s.reason=h.type==='gate'?'낮은 게이트 아래로 슬라이딩해야 해요':h.type==='gap'?'끊어진 다리를 점프로 넘어야 해요':h.type==='hurdle'?'장애물을 점프로 넘어야 해요':'장애물에 부딪혔어요';break}
 }
 if(!s.over){
 // Successful jumps/slides past hazards in the player's lane grow a skill combo.
 const escaped=row.hazards.filter(h=>h.lane===s.lane&&(h.type==='gate'||h.type==='hurdle'||h.type==='gap')).length;
 if(escaped){s.stunts=(s.stunts||0)+escaped;s.combo=(s.combo||0)+escaped;s.maxCombo=Math.max(s.maxCombo||0,s.combo);s.style=(s.style||0)+escaped*60*Math.min(5,s.combo)}
 s.passed+=row.hazards.length;for(const c of row.gems){if(!c.got&&Math.abs(s.x-RUN_LANES[c.lane])<.85){c.got=true;s.gems++}}}if(s.over)break;
 }
 s.score=Math.floor(s.distance)+s.gems*35+(s.style||0);return s.distance-previous
}
let runnerActive=null;
const runnerModule={
 markup(){return`<section class="run-premium" aria-label="PAUSE 무한 달리기 프리미엄">
 <div class="arcade-options"><label>난이도 <select id="runDifficulty"><option value="relaxed">편안하게</option><option value="classic">클래식</option><option value="precision">챌린지</option></select></label><span>점프 · 슬라이딩으로 액션 콤보를 연결하세요.</span></div><div class="run-hud"><div><span>주행 거리</span><strong id="runDistance">0 <small>m</small></strong></div><div><span>최고 기록</span><strong id="runBest">0 <small>m</small></strong></div><div><span>파쿠르 콤보</span><strong id="runCombo">×0</strong><strong id="runSpeed" hidden>13 <small>m/s</small></strong></div></div>
 <div class="run-viewport" id="runViewport"><canvas id="runCanvas" aria-label="3D 무한 달리기. 왼쪽·오른쪽으로 차선을 바꾸고 위로 점프하거나 아래로 슬라이딩하세요."></canvas>
 <div class="run-tag" id="runZone">SUNSET <em>•</em> PARKOUR CITY</div><div class="run-gems" id="runGems">◆ 0</div>
 <div class="run-launch" id="runLaunch"><div class="run-title-mark">◆</div><b>ENDLESS RUN</b><p>노을이 지는 도시의 옥상에서 액션 콤보를 완성하세요.</p><button id="runPlay">▶ 달리기 시작</button><small>← → 차선 · ↑ 점프 · ↓ 슬라이드 / 모바일 스와이프</small></div>
 <div class="run-unavailable" id="runUnavailable" hidden>이 브라우저에서는 그래픽을 시작할 수 없어요.</div></div>
 <div class="run-pad"><button type="button" data-run="left" aria-label="왼쪽 차선">←</button><button type="button" data-run="up" aria-label="점프">↑ <span>점프</span></button><button type="button" data-run="down" aria-label="슬라이드">↓ <span>슬라이드</span></button><button type="button" data-run="right" aria-label="오른쪽 차선">→</button></div>
 <p class="run-note">도심 파쿠르: 벽은 점프 · 낮은 게이트는 슬라이드 · 위험하면 차선 전환</p>
 <p class="run-subnote">스테이지 없음 · 절차적 무한맵 · 기기 내 자동 저장 · 최고 거리 도전</p>
 </section>`},
 help:'도시 옥상에서 펼쳐지는 무한 파쿠르입니다. 3차선 전환과 점프·슬라이딩을 정확히 연결하면 콤보 점수가 올라갑니다. 처음 네 구간은 연습용입니다.',
 mount(){const root=document.querySelector('.run-premium'),start=root.querySelector('#runLaunch'),canvas0=root.querySelector('canvas');let canvas=canvas0;let s=playStore.read(RUN_KEY,null);if(!(s?.version===1&&Array.isArray(s.rows)&&Number.isFinite(s.distance)))s=runFresh();if(s.over)s=runFresh(undefined,runMode(s));s.running=false;runEnsure(s);
 let visual=null,disposed=false,raf=0,prev=0,lastStats=0,errOnce=false;
 try{visual=runMakeWebGL(canvas)}catch(error){console.warn('Runner WebGL unavailable',error)}
 if(!visual){const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement;visual=runMakeCanvas(canvas)}
 if(!visual){root.querySelector('#runUnavailable').hidden=false;start.hidden=true}
 const save=()=>{try{playStore.write(RUN_KEY,{...s,running:false});if(s.distance>playStore.number(RUN_RECORD+'-'+runMode(s)))playStore.putNumber(RUN_RECORD+'-'+runMode(s),Math.floor(s.distance));if(runMode(s)==='classic'&&s.distance>playStore.number(RUN_RECORD))playStore.putNumber(RUN_RECORD,Math.floor(s.distance))}catch(e){console.warn('Runner local save unavailable',e)}};
 const stats=()=>{root.querySelector('#runDistance').innerHTML=`${Math.floor(s.distance).toLocaleString('ko-KR')} <small>m</small>`;root.querySelector('#runBest').innerHTML=`${Math.max(Math.floor(s.distance),Math.max(playStore.number(RUN_RECORD+'-'+runMode(s)),runMode(s)==='classic'?playStore.number(RUN_RECORD):0)).toLocaleString('ko-KR')} <small>m</small>`;root.querySelector('#runSpeed').innerHTML=`${Math.round(runSpeed(s.distance,runMode(s)))} <small>m/s</small>`;root.querySelector('#runGems').textContent='◆ '+s.gems;
 root.querySelector('#runCombo').textContent='×'+(s.combo||0);
 const districts=['SUNSET MARKET','ROOFTOP CIRCUIT','NEON QUARTER'];root.querySelector('#runZone').innerHTML= districts[Math.floor(s.distance/420)%3]+' <em>•</em> PARKOUR';exStats([['현재 거리',Math.floor(s.distance)+'m'],['최고 기록',Math.max(Math.floor(s.distance),Math.max(playStore.number(RUN_RECORD+'-'+runMode(s)),runMode(s)==='classic'?playStore.number(RUN_RECORD):0))+'m'],['빛 조각',s.gems+'개'],['회피한 장애물',s.passed+'개'],['파쿠르 콤보',String(s.maxCombo||0)],['스타일 보너스',String(s.style||0)]])};
 const diff=root.querySelector('#runDifficulty');diff.value=runMode(s);const onDifficulty=e=>{const mode=e.target.value;if(!RUN_MODES[mode]||mode===runMode(s))return;if(s.distance>0&&!window.confirm('난이도를 바꾸면 진행 중인 달리기가 초기화돼요. 계속할까요?')){diff.value=runMode(s);return}s=runFresh(undefined,mode);runEnsure(s);runnerActive.state=s;start.hidden=false;gameShell.paused=false;hideMask();save();stats()};diff.addEventListener('change',onDifficulty);
 const launch=()=>{if(disposed||!visual)return;s.running=true;start.hidden=true;prev=0};const playBtn=root.querySelector('#runPlay');playBtn.addEventListener('click',launch);
 const command=d=>{if(disposed||gameShell.paused||s.over||!s.running)return;runMove(s,d);save()};
 const onKey=e=>{if(gameShell.id!=='runner')return;const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down',' ':'up'};const dir=map[e.key]||map[e.key.toLowerCase?.()];if(!dir)return;e.preventDefault();if(!e.repeat)command(dir)};
 window.addEventListener('keydown',onKey);
 let ptr=null;const onDown=e=>{if(!s.running||s.over||gameShell.paused)return;ptr={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)};
 const onUp=e=>{if(!ptr||e.pointerId!==ptr.id)return;const dx=e.clientX-ptr.x,dy=e.clientY-ptr.y;ptr=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;command(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')};
 canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
 const onPad=e=>{const button=e.target.closest('[data-run]');if(button)command(button.dataset.run)};root.querySelector('.run-pad').addEventListener('click',onPad);
 const frame=now=>{if(disposed)return;const dt=prev?Math.min(.05,(now-prev)/1000):0;prev=now;
 if(!gameShell.paused&&s.running&&!s.over){runStep(s,dt);if(s.over){save();stats();exFinish('달리기가 끝났어요',`${s.reason} · ${Math.floor(s.distance)}m 달렸어요.`)}else if(s.distance-s.savedAt>=18){s.savedAt=s.distance;save()}}
 if(visual){try{visual.render(s)}catch(e){if(!errOnce){console.error('Runner render failed',e);errOnce=true} s.running=false;root.querySelector('#runUnavailable').hidden=false;start.hidden=true}}
 if(now-lastStats>140){lastStats=now;stats()}raf=requestAnimationFrame(frame)};
 raf=requestAnimationFrame(frame);stats();runnerActive={state:s,step:runStep,move:runMove};return{move:command,pause(){save()},resume(){prev=0},reset(){s=runFresh(undefined,runMode(s));runEnsure(s);runnerActive.state=s;save();hideMask();gameShell.paused=false;start.hidden=false;stats()},dispose(){disposed=true;cancelAnimationFrame(raf);save();visual?.destroy();window.removeEventListener('keydown',onKey);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);root.querySelector('.run-pad').removeEventListener('click',onPad);diff.removeEventListener('change',onDifficulty);runnerActive=null}}
 }
};
