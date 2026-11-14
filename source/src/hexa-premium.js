/* PAUSE Hexa Ques Premium — self-contained, offline hex stack sorting game.
   A stack is an array bottom-to-top. One placement consumes one of three offered stacks.
   Adjacent equal exposed top-color runs merge into the destination; 8/10 clears the top run.
   No network calls and no access to other games' data. */
const HS_SAVE='hexa-premium-v1',HS_BEST='hexa-premium-record';
const HS_MODES={easy:{label:'쉬움',radius:2,colors:3,clear:8,goal:80,layers:[2,4]},normal:{label:'보통',radius:3,colors:4,clear:10,goal:180,layers:[2,4]},hard:{label:'어려움',radius:3,colors:5,clear:10,goal:300,layers:[3,5]}};
const HS_COLORS=['#5488C7','#DB946D','#76B9B2','#E1BC75','#C88A9C'];
const HS_SYMBOLS=['◆','✦','●','▲','✳'];
let hsState=null,hsRoot=null,hsChosen=0,hsHint=-1,hsPulse=-1,hsTimer=0;
function hsCells(radius){const a=[];for(let r=-radius;r<=radius;r++)for(let q=-radius;q<=radius;q++)if(Math.abs(q+r)<=radius)a.push([q,r]);return a}
const hsCoords={2:hsCells(2),3:hsCells(3)};
function hsNeighbors(radius,index){const [q,r]=hsCoords[radius][index];return hsCoords[radius].flatMap(([x,y],i)=>Math.max(Math.abs(x-q),Math.abs(y-r),Math.abs((x+y)-(q+r)))===1?[i]:[])}
function hsTop(stack){return Array.isArray(stack)&&stack.length?stack[stack.length-1]:-1}
function hsTopCount(stack){const c=hsTop(stack);if(c<0)return 0;let n=0;for(let i=stack.length-1;i>=0&&stack[i]===c;i--)n++;return n}
function hsOffer(s){const cfg=HS_MODES[s.mode], n=cfg.layers[0]+Math.floor(Math.random()*(cfg.layers[1]-cfg.layers[0]+1));const boardColors=s.board.filter(x=>x?.length).map(hsTop);const available=[...boardColors,...s.tray.filter(Boolean).map(hsTop)];const color=(available.length&&Math.random()<.68)?available[Math.floor(Math.random()*available.length)]:Math.floor(Math.random()*cfg.colors);
 const stack=Array.from({length:n},()=>Math.floor(Math.random()*cfg.colors));let run=Math.max(1,Math.min(n,1+Math.floor(Math.random()*3)));for(let i=0;i<run;i++)stack[n-1-i]=color;return stack;
}
function hsNew(mode='normal'){const cfg=HS_MODES[mode]||HS_MODES.normal,s={v:1,mode,board:Array(hsCoords[cfg.radius].length).fill(null),tray:[],score:0,moves:0,cleared:0,longest:0,assisted:false,done:false,goalHit:false,message:'아래 스택을 골라 빈 육각 칸에 놓아보세요.',history:[]};s.tray=[hsOffer(s),hsOffer(s),hsOffer(s)];return s}
function hsValid(s){if(!s||s.v!==1||!HS_MODES[s.mode]||!Array.isArray(s.board)||!Array.isArray(s.tray)||s.tray.length!==3||!Number.isFinite(s.score)||s.score<0||!Number.isInteger(s.moves)||s.moves<0)return false;
 const cfg=HS_MODES[s.mode];if(s.board.length!==hsCoords[cfg.radius].length)return false;
 const test=x=>x===null||(Array.isArray(x)&&x.length>0&&x.length<200&&x.every(v=>Number.isInteger(v)&&v>=0&&v<cfg.colors));
 return s.board.every(test)&&s.tray.every(test);
}
function hsSave(){if(hsValid(hsState))playStore.write(HS_SAVE,hsState)}
function hsStats(){return playStore.read(HS_BEST,{easy:0,normal:0,hard:0,played:0})}
function hsRecord(s){const stats=hsStats();stats[s.mode]=Math.max(stats[s.mode]||0,s.score);playStore.write(HS_BEST,stats)}
function hsSnapshot(s){return {board:s.board.map(x=>x?[...x]:null),tray:s.tray.map(x=>x?[...x]:null),score:s.score,moves:s.moves,cleared:s.cleared,longest:s.longest,goalHit:s.goalHit,done:s.done}}
function hsRestore(s,snap){for(const k of ['board','tray','score','moves','cleared','longest','goalHit','done'])s[k]=structuredClone(snap[k])}
function hsResolve(s,origin){const cfg=HS_MODES[s.mode],radius=cfg.radius;let chain=0,removed=0,merges=0;let queue=[origin],steps=0;
 // Re-evaluate all occupied cells after each transfer, including newly exposed underlayers.
 // A merge consumes at least one nonempty stack, a clear consumes tiles; finite progress guaranteed.
 while(steps++<300){let changed=false;const ordered=[...new Set([...queue,...s.board.map((x,i)=>x?.length?i:-1).filter(x=>x>=0)])];
  outer:for(const i of ordered){const target=s.board[i];if(!target?.length)continue;const color=hsTop(target),run=hsTopCount(target);
   if(run>=cfg.clear){target.splice(target.length-run,run);s.cleared+=run;removed+=run;chain++;s.longest=Math.max(s.longest,chain);s.score+=run*10*chain+(chain>1?20:0);if(!target.length)s.board[i]=null;queue=[i,...hsNeighbors(radius,i)];changed=true;break outer}
   for(const j of hsNeighbors(radius,i)){
    if(!s.board[j]?.length||hsTop(s.board[j])!==color)continue;
    const count=hsTopCount(s.board[j]);const tiles=s.board[j].splice(-count,count);target.push(...tiles);if(!s.board[j].length)s.board[j]=null;merges++;queue=[i,j,...hsNeighbors(radius,j)];changed=true;break outer;
   }
  }
  if(!changed)break;
 }
 if(steps>=300)throw Error('Hex merge convergence exceeded bound');
 return {chain,removed,merges};
}
function hsPlace(s,trayIndex,cellIndex){if(s.done||!Number.isInteger(trayIndex)||trayIndex<0||trayIndex>2||!s.tray[trayIndex]||!Number.isInteger(cellIndex)||cellIndex<0||cellIndex>=s.board.length||s.board[cellIndex])return null;
 s.history=(s.history||[]).slice(-4);s.history.push(hsSnapshot(s));s.board[cellIndex]=s.tray[trayIndex];s.tray[trayIndex]=null;s.moves++;s.score+=s.board[cellIndex].length*2;
 const result=hsResolve(s,cellIndex);
 if(s.tray.every(x=>!x))s.tray=[hsOffer(s),hsOffer(s),hsOffer(s)];
 const justHitGoal=!s.goalHit&&s.score>=HS_MODES[s.mode].goal;
 if(justHitGoal)s.goalHit=true;
 s.done=s.board.every(x=>x?.length);
 s.message=s.done?'보드가 가득 찼어요. 최고 기록에 다시 도전해 보세요.':justHitGoal?'목표 달성! 계속 배치해 최고 점수에 도전하세요.':result.chain>1?`${result.chain}연쇄! ${result.removed}개 타일을 제거했어요.`:result.chain===1?`${result.removed}개 타일 제거! 멋진 선택이에요.`:result.merges?`${result.merges}개 스택이 합쳐졌어요.`:'다음 스택을 이어 배치해 보세요.';
 return result;
}
function hsColorTile(c,count,small=false){return `<span class="hs-hex-shape hs-color-${c} ${small?'hs-mini':''}" style="--hs-color:${HS_COLORS[c]}"><span class="hs-glyph">${HS_SYMBOLS[c]}</span>${count?`<span class="hs-count">${count}</span>`:''}</span>`}
function hsRender(){if(!hsRoot||!hsState)return;const s=hsState,cfg=HS_MODES[s.mode],coords=hsCoords[cfg.radius],best=hsStats(),goal=cfg.goal;
 hsRoot.querySelector('#hsBoard').className='hs-board hs-radius-'+cfg.radius;
 hsRoot.querySelector('#hsBoard').innerHTML=coords.map(([q,r],i)=>{
  const stack=s.board[i],top=hsTop(stack),layers=stack?.length||0,x=50+(q+r/2)*(cfg.radius===2?19.5:14),y=50+r*(cfg.radius===2?16.8:12);
  return `<button class="hs-slot ${stack?'hs-occupied':'hs-open'} ${i===hsHint?'hs-hint':''} ${i===hsPulse?'hs-pulse':''}" style="left:${x}%;top:${y}%;" data-hs-cell="${i}" aria-label="${stack?`${i+1}번 칸 ${HS_SYMBOLS[top]} ${layers}장`:`비어 있는 ${i+1}번 칸`}">${stack?`<span class="hs-stack-shadow"></span>${hsColorTile(top,layers)}<span class="hs-underlayer" style="--hs-under:${HS_COLORS[stack[Math.max(0,stack.length-2)]]}"></span>`:'<span class="hs-vacant">+</span>'}</button>`}).join('');
 hsRoot.querySelector('#hsTray').innerHTML=s.tray.map((stack,i)=>`<button class="hs-offer ${hsChosen===i?'hs-selected':''}" data-hs-tray="${i}" ${!stack||s.done?'disabled':''} aria-pressed="${hsChosen===i}" aria-label="${i+1}번 스택 ${stack?.length||0}장"><span class="hs-offer-number">0${i+1}</span>${stack?hsColorTile(hsTop(stack),stack.length,true):'<span class="hs-used">배치 완료</span>'}<span class="hs-layer-row">${(stack||[]).slice(-4).reverse().map(c=>`<i style="background:${HS_COLORS[c]}"></i>`).join('')}</span></button>`).join('');
 hsRoot.querySelector('#hsScore').textContent=s.score.toLocaleString();hsRoot.querySelector('#hsBest').textContent=(best[s.mode]||0).toLocaleString();hsRoot.querySelector('#hsMoves').textContent=s.moves;hsRoot.querySelector('#hsProgress').style.width=Math.min(100,Math.round(s.score/goal*100))+'%';hsRoot.querySelector('#hsGoalNum').textContent=goal.toLocaleString();
 hsRoot.querySelector('#hsMessage').textContent=s.message;hsRoot.querySelector('#hsBoard').classList.toggle('hs-goal-hit',s.goalHit);hsRoot.querySelector('#hsUndo').disabled=!s.history?.length;hsRoot.querySelector('#hsHint').disabled=s.done;
 hsRoot.querySelectorAll('[data-hs-mode]').forEach(el=>{el.classList.toggle('is-active',el.dataset.hsMode===s.mode);el.setAttribute('aria-pressed',String(el.dataset.hsMode===s.mode))});
 hsRoot.querySelector('#hsFinish').hidden=!s.done;
 if(s.done)hsRoot.querySelector('#hsFinishText').textContent=`${s.score.toLocaleString()}점 · ${s.moves}회 배치 · ${s.cleared}개 제거`;
 exStats([['점수',s.score.toLocaleString()],['최고 점수',(best[s.mode]||0).toLocaleString()],['배치 횟수',s.moves]]);
}
function hsHintCell(s){const free=s.board.map((x,i)=>x===null?i:-1).filter(i=>i>=0);if(!free.length)return -1;const candidates=free.map(i=>{const radius=HS_MODES[s.mode].radius, top=hsTop(s.tray[hsChosen]||s.tray.find(Boolean));const same=hsNeighbors(radius,i).reduce((a,j)=>a+(hsTop(s.board[j])===top?hsTopCount(s.board[j]):0),0);return {i,v:same*12+hsNeighbors(radius,i).filter(j=>s.board[j]).length}});candidates.sort((a,b)=>b.v-a.v);return candidates[0].i}
function hsCommit(index){
 if(!hsState||gameShell.paused)return false;
 if(!hsState.tray[hsChosen])hsChosen=hsState.tray.findIndex(Boolean);
 const result=hsPlace(hsState,hsChosen,index);
 if(!result){if(hsState.board[index])hsState.message='이미 놓인 칸이에요. 비어 있는 칸을 고르세요.';hsRender();return false;}
 hsPulse=index;hsHint=-1;hsChosen=hsState.tray.findIndex(Boolean);if(hsChosen<0)hsChosen=0;
 hsRecord(hsState);hsSave();hsRender();clearTimeout(hsTimer);
 hsTimer=setTimeout(()=>{hsPulse=-1;hsRender()},260);return true;
}
const hexaModule={help:'세 가지 육각형 스택 중 하나를 선택하고 빈 칸을 탭하세요. 이웃한 같은 색 맨 위 타일이 자동으로 합쳐져요. 같은 색 타일 8개(쉬움) 또는 10개(보통·어려움)가 한곳에 모이면 제거됩니다.',markup:()=>`<section id="hsGame" class="hs-game"><header class="hs-header"><div><span class="hs-overline">HEXA QUES · COLOR STACK</span><h4>색을 모으고, 공간을 비우세요.</h4></div><div class="hs-mode-row" aria-label="난이도 선택"><button data-hs-mode="easy">쉬움</button><button data-hs-mode="normal">보통</button><button data-hs-mode="hard">어려움</button></div></header><div class="hs-scorebar"><div><span>현재 점수</span><strong id="hsScore">0</strong></div><div><span>최고 기록</span><strong id="hsBest">0</strong></div><div><span>놓은 스택</span><strong id="hsMoves">0</strong></div></div><div class="hs-goal-label"><span>이번 목표</span><strong id="hsGoalNum">180</strong></div><div class="hs-progress"><span id="hsProgress"></span></div><div class="hs-board" id="hsBoard" aria-label="육각형 스택 보드"></div><div class="hs-bottom"><div class="hs-tray-head"><strong>다음 스택</strong><span>선택 후 빈 공간을 터치하세요</span></div><div class="hs-tray" id="hsTray"></div><div class="hs-actions"><button id="hsUndo">↶ 한 수 되돌리기</button><button id="hsHint">✦ 자리 추천</button><button id="hsHelp" aria-expanded="false">ⓘ 규칙</button></div><p id="hsMessage" class="hs-message" role="status" aria-live="polite"></p><p id="hsRules" hidden class="hs-rules">스택을 선택하고 빈 육각형 칸을 탭하거나 드래그하세요. 인접한 같은 색 맨 위 타일이 자동으로 이동해 쌓입니다. 기준 장수를 채우면 해당 색이 제거되며 연쇄 보너스 점수를 획득합니다. 게임판을 꽉 채우지 않고 목표 점수에 도전하세요. 힌트는 현재 보드의 색 배치를 바탕으로 추천하는 자리이며 항상 최적해는 아닙니다.</p></div><div id="hsFinish" class="hs-finish" hidden><h4>이번 도전 종료</h4><p id="hsFinishText"></p><button data-hs-again>다시 도전하기</button></div></section>`,mount(){
 hsRoot=document.querySelector('#hsGame');const saved=playStore.read(HS_SAVE,null);hsState=hsValid(saved)?saved:hsNew('normal');hsState.history=Array.isArray(hsState.history)?hsState.history:[];hsChosen=hsState.tray.findIndex(Boolean);if(hsChosen<0)hsChosen=0;hsHint=-1;hsPulse=-1;
 const onClick=e=>{if(gameShell.paused)return;const mode=e.target.closest('[data-hs-mode]');if(mode){const selected=mode.dataset.hsMode;if(selected!==hsState.mode){if(!confirm('새 난이도로 시작하면 현재 진행 중인 보드가 초기화됩니다. 계속할까요?'))return;hsState=hsNew(selected);hsChosen=0;hsHint=-1;hsSave();hsRender();}return}
 const tray=e.target.closest('[data-hs-tray]');if(tray){hsChosen=+tray.dataset.hsTray;hsHint=-1;hsRender();return}
 const slot=e.target.closest('[data-hs-cell]');if(slot){hsCommit(+slot.dataset.hsCell);return}
 if(e.target.closest('#hsUndo')){const snap=hsState.history?.pop();if(snap){hsRestore(hsState,snap);hsState.message='직전 배치를 되돌렸어요.';hsHint=-1;hsSave();hsRender()}return}
 if(e.target.closest('#hsHint')){hsHint=hsHintCell(hsState);hsState.message='밝게 표시된 칸을 추천해요. 최선의 수를 보장하지는 않아요.';hsRender();return}
 if(e.target.closest('#hsHelp')){const rules=hsRoot.querySelector('#hsRules');rules.hidden=!rules.hidden;e.target.setAttribute('aria-expanded',String(!rules.hidden));return}
 if(e.target.closest('[data-hs-again]')){hsState=hsNew(hsState.mode);hsChosen=0;hsSave();hsRender();return}
 };
 let hsDrag=null,hsGhost=null;
 const onPointerDown=e=>{if(gameShell.paused||hsState.done||e.button!==0)return;const btn=e.target.closest('[data-hs-tray]');if(!btn||!hsState.tray[+btn.dataset.hsTray])return;hsDrag={id:e.pointerId,index:+btn.dataset.hsTray,x:e.clientX,y:e.clientY,moving:false};};
 const onPointerMove=e=>{if(!hsDrag||hsDrag.id!==e.pointerId)return;const distance=Math.hypot(e.clientX-hsDrag.x,e.clientY-hsDrag.y);if(distance<11&&!hsDrag.moving)return;
  hsDrag.moving=true;hsChosen=hsDrag.index;
  if(!hsGhost){hsGhost=document.createElement('div');hsGhost.className='hs-drag-ghost';hsGhost.innerHTML=hsColorTile(hsTop(hsState.tray[hsDrag.index]),hsState.tray[hsDrag.index].length,true);document.body.appendChild(hsGhost);}
  hsGhost.style.left=e.clientX+'px';hsGhost.style.top=(e.clientY-36)+'px';
  const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-hs-cell]');const idx=el?+el.dataset.hsCell:-1;
  hsRoot.querySelectorAll('.hs-drag-target').forEach(x=>x.classList.remove('hs-drag-target'));
  if(idx>=0&&!hsState.board[idx])el.classList.add('hs-drag-target');
  if(e.cancelable)e.preventDefault();
 };
 const onPointerUp=e=>{if(!hsDrag||hsDrag.id!==e.pointerId)return;const drag=hsDrag;hsDrag=null;
  if(drag.moving){const slot=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-hs-cell]');if(slot&&hsRoot.contains(slot)){hsChosen=drag.index;hsCommit(+slot.dataset.hsCell);}}
  if(hsGhost){hsGhost.remove();hsGhost=null;}
  hsRoot.querySelectorAll('.hs-drag-target').forEach(x=>x.classList.remove('hs-drag-target'));
 };
 hsRoot.addEventListener('pointerdown',onPointerDown);document.addEventListener('pointermove',onPointerMove,{passive:false});document.addEventListener('pointerup',onPointerUp);document.addEventListener('pointercancel',onPointerUp);
 hsRoot.addEventListener('click',onClick);const onKey=e=>{if(gameShell.id!=='hexa'||gameShell.paused||['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(['1','2','3'].includes(e.key)){const idx=Number(e.key)-1;if(hsState.tray[idx]){hsChosen=idx;hsHint=-1;hsRender()}}};document.addEventListener('keydown',onKey);
 hsRender();return{pause(){hsSave()},resume(){hsRender()},reset(){hsState=hsNew(hsState?.mode||'normal');hsChosen=0;hsHint=-1;hsSave();hideMask();hsRender()},dispose(){hsRoot?.removeEventListener('click',onClick);hsRoot?.removeEventListener('pointerdown',onPointerDown);document.removeEventListener('pointermove',onPointerMove);document.removeEventListener('pointerup',onPointerUp);document.removeEventListener('pointercancel',onPointerUp);document.removeEventListener('keydown',onKey);if(hsGhost)hsGhost.remove();clearTimeout(hsTimer);hsSave();hsRoot=null}};
 }};
