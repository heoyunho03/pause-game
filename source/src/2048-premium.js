// PAUSE 2048 Premium: pure deterministic swipe engine, responsive UI and local-first progress.
// The original 4x4 2048 rules are preserved; no remote assets or services.
const game2048={grid:Array(16).fill(0),score:0,moves:0,over:false,won:false,undo:null};
const fresh2048=()=>({grid:Array(16).fill(0),score:0,moves:0,over:false,won:false,undo:null});
const valid2048=g=>!!(g&&Array.isArray(g.grid)&&g.grid.length===16&&g.grid.every(v=>Number.isSafeInteger(v)&&v>=0&&(v===0||(v&(v-1))===0))&&Number.isSafeInteger(g.score)&&g.score>=0&&Number.isSafeInteger(g.moves)&&g.moves>=0);
function compute2048Step(grid,dir){
  if(!['left','right','up','down'].includes(dir))return {grid:grid.slice(),points:0,tracks:[],merged:[],changed:false};
  const next=Array(16).fill(0),tracks=[],merged=[];let points=0;
  for(let line=0;line<4;line++){
    const indices=Array.from({length:4},(_,k)=>dir==='left'?line*4+k:dir==='right'?line*4+3-k:dir==='up'?k*4+line:(3-k)*4+line);
    const source=indices.filter(i=>grid[i]!==0).map(i=>({i,value:grid[i]}));let dest=0;
    for(let j=0;j<source.length;j++){
      const first=source[j],second=source[j+1],to=indices[dest++];
      if(second&&first.value===second.value){
        const mergedValue=first.value*2;next[to]=mergedValue;points+=mergedValue;
        tracks.push({from:first.i,to,value:first.value},{from:second.i,to,value:second.value});
        merged.push(to);j++;
      }else{next[to]=first.value;tracks.push({from:first.i,to,value:first.value});}
    }
  }
  return {grid:next,points,tracks,merged,changed:next.some((v,i)=>v!==grid[i])};
}
function has2048Moves(){const a=game2048.grid;return a.some(v=>v===0)||a.some((v,i)=>(i%4<3&&v===a[i+1])||(i<12&&v===a[i+4]));}
function spawn2048(){const empty=game2048.grid.map((v,i)=>v===0?i:-1).filter(i=>i>=0);if(!empty.length)return -1;const idx=empty[Math.floor(Math.random()*empty.length)];game2048.grid[idx]=Math.random()<.9?2:4;return idx;}
const pause2048Fx={active:false,timeout:null,queue:[],epoch:0};
let pause2048Touch=null, pause2048Sound=false, pause2048Audio=null;
function clear2048Fx(){pause2048Fx.epoch++;clearTimeout(pause2048Fx.timeout);pause2048Fx.timeout=null;pause2048Fx.active=false;pause2048Fx.queue.length=0;const b=$('#board');if(b){b.classList.remove('is-moving');b.querySelector('.floating-layer')?.remove();}}
function reset2048(){clear2048Fx();Object.assign(game2048,fresh2048());spawn2048();spawn2048();save2048();render2048();hideMask();announce2048('새 게임을 시작했습니다.');}
function read2048(){
 const saved=playStore.read('2048',null);
 if(valid2048(saved)){
  const {grid,score,moves,over,won,undo}=saved;
  Object.assign(game2048,{grid:grid.slice(),score,moves,over:Boolean(over),won:Boolean(won),undo:valid2048(undo)?{grid:undo.grid.slice(),score:undo.score,moves:undo.moves,over:Boolean(undo.over),won:Boolean(undo.won)}:null});
 }else{
  const legacy=getJSON('pause:2048state',null);
  if(legacy&&Array.isArray(legacy.grid)&&legacy.grid.length===16&&legacy.grid.every(v=>Number.isSafeInteger(v)&&v>=0&&(v===0||(v&(v-1))===0))&&Number.isSafeInteger(legacy.score)&&legacy.score>=0){
   Object.assign(game2048,{...fresh2048(),grid:legacy.grid.slice(),score:legacy.score,over:Boolean(legacy.over)});
  }else{Object.assign(game2048,fresh2048());spawn2048();spawn2048();}
 }
 if(!game2048.grid.some(Boolean)){Object.assign(game2048,fresh2048());spawn2048();spawn2048();}
 if(!has2048Moves())game2048.over=true;
 pause2048Sound=safeStorage.getItem('pause:2048:sound')==='1';
 save2048();
}
function save2048(){
 // Never embed nested undo history; keep old v0.4/v0.5 save key for migration.
 const copy={...game2048,grid:game2048.grid.slice(),undo:game2048.undo?{...game2048.undo,grid:game2048.undo.grid.slice(),undo:null}:null};
 playStore.write('2048',copy);
 const old=Math.max(playStore.number('2048best'),Number(safeStorage.getItem('pause:2048best')||0));
 const best=Math.max(old,game2048.score);playStore.putNumber('2048best',best);
 try{safeStorage.setItem('pause:2048best',String(best));}catch{}
}
function announce2048(message){const el=$('#announcer2048');if(el)el.textContent=message;}
function play2048Tone(points){
 if(!pause2048Sound||!points)return;
 try{
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
  pause2048Audio??=new Ctx();if(pause2048Audio.state==='suspended')pause2048Audio.resume();
  const at=pause2048Audio.currentTime,osc=pause2048Audio.createOscillator(),gain=pause2048Audio.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(330+Math.min(Math.log2(points)*38,360),at);
  osc.frequency.exponentialRampToValueAtTime(420+Math.min(Math.log2(points)*46,420),at+.075);
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.045,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+.145);
  osc.connect(gain);gain.connect(pause2048Audio.destination);osc.start(at);osc.stop(at+.15);
 }catch{};
}
function markup2048(){return `<section class="premium-2048" aria-label="2048 게임판">
 <div class="premium-intro"><div><span class="premium-eyebrow">THE NUMBER GAME · CLASSIC 4×4</span><strong>숫자에 집중하는 순간.</strong></div><button class="mini-audio" data-game-action="sound" id="sound2048" aria-pressed="false" title="효과음 켜기">♪ <span>사운드 끔</span></button></div>
 <div class="premium-score-row"><div class="premium-score" id="score2048Box"><span>현재 점수</span><strong id="premiumScore2048">0</strong><span class="premium-score-gain" id="gain2048"></span></div><div class="premium-score"><span>최고 점수</span><strong id="premiumBest2048">0</strong></div><div class="premium-score premium-score-small"><span>이동</span><strong id="premiumMoves2048">0</strong></div></div>
 <div class="premium-board-frame"><div class="premium-board-aura" aria-hidden="true"></div><div class="play-board premium-play-board" id="board" role="grid" aria-label="2048 숫자판" aria-describedby="boardHelp" tabindex="0"></div></div>
 <div class="premium-afterboard"><div class="premium-board-message"><span class="premium-live-dot"></span><span id="boardHelp">방향키 또는 스와이프로 숫자를 합쳐보세요.</span></div><span class="premium-autosave">✓ 자동 저장</span></div>
 <div class="premium-actions"><button class="premium-quiet-button" data-game-action="undo" id="undoButton" title="이전 이동으로 되돌리기 (Z)">↶ <span>되돌리기</span> <kbd>Z</kbd></button><button class="premium-quiet-button" data-game-action="help" id="helpButton2048" aria-expanded="false" aria-controls="tips2048">ⓘ <span>플레이 방법</span></button></div>
 <div id="tips2048" class="premium-tips" hidden><strong>같은 숫자끼리 합치세요</strong><p>방향키 또는 WASD를 누르면 모든 타일이 한 방향으로 움직입니다. 같은 숫자 두 개가 만나면 합쳐져요. 2048을 만들면 승리하며, 이후에도 계속 플레이할 수 있어요.</p><p>모바일에서는 게임판을 스와이프하세요. 이동할 수 있는 칸이 모두 사라지면 게임이 종료됩니다.</p></div>
 <div class="premium-direction" aria-label="화면 조작 버튼"><span>터치 / 키보드 컨트롤</span><div class="direction-cluster"><button data-game-action="up" aria-label="위로 이동">↑</button><div><button data-game-action="left" aria-label="왼쪽으로 이동">←</button><button data-game-action="down" aria-label="아래로 이동">↓</button><button data-game-action="right" aria-label="오른쪽으로 이동">→</button></div></div></div>
 <p class="sr-only" id="announcer2048" role="status" aria-live="polite"></p>
 </section>`;}
function render2048({newAt=-1,merged=[]}={}){
 const b=$('#board');if(!b)return;
 b.innerHTML=game2048.grid.map((v,i)=>`<div class="game-cell${i===newAt?' cell-new':''}${merged.includes(i)?' cell-merged':''}" data-v="${v||0}" role="gridcell" aria-label="${Math.floor(i/4)+1}행 ${i%4+1}열 ${v||'빈 칸'}">${v||''}</div>`).join('');
 const best=playStore.number('2048best');
 $('#premiumScore2048').textContent=formatNum(game2048.score);$('#premiumBest2048').textContent=formatNum(best);$('#premiumMoves2048').textContent=formatNum(game2048.moves);
 const undo=$('#undoButton');undo.disabled=!game2048.undo;
 $('#sound2048').setAttribute('aria-pressed',String(pause2048Sound));$('#sound2048').querySelector('span').textContent=pause2048Sound?'사운드 켬':'사운드 끔';
 $('#boardHelp').textContent=game2048.over?'움직일 수 있는 칸이 없어요.':game2048.won?'2048 달성! 더 높은 숫자에도 도전해보세요.':'같은 숫자 두 개를 합쳐 2048을 완성하세요.';
 const maxTile=Math.max(...game2048.grid),nextTile=Math.min(2048,Math.max(4,maxTile*2));const completed=Math.min(100,Math.round((Math.log2(Math.max(2,maxTile))/11)*100));
 $('#shellStats').innerHTML=`<div class="shell-stat-item"><span>가장 큰 타일</span><strong class="grad-text">${formatNum(maxTile)}</strong></div><div class="shell-stat-item"><span>다음 목표 타일</span><strong>${game2048.won?'계속 도전':formatNum(nextTile)}</strong></div><div class="shell-stat-item"><span>타일 단계 진행</span><strong>${completed}%</strong></div><div class="shell-2048-progress" aria-label="2048까지 타일 단계 ${completed}퍼센트"><span style="width:${completed}%"></span></div>`;
}
function animate2048Step(tracks,merged,newAt,oldRects,onDone){
 const b=$('#board');if(!b){onDone();return;}
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(reduce||!b.animate||!oldRects||!oldRects.length){onDone();return;}
 const allCells=[...b.querySelectorAll('.game-cell')];const boardRect=b.getBoundingClientRect();const layer=document.createElement('div');layer.className='floating-layer';b.classList.add('is-moving');b.append(layer);
 for(const track of tracks){const a=oldRects[track.from],to=allCells[track.to]?.getBoundingClientRect();if(!a||!to)continue;
  const tile=document.createElement('div');tile.className='game-cell floating-tile';tile.dataset.v=String(track.value);tile.textContent=String(track.value);
  Object.assign(tile.style,{left:`${a.left-boardRect.left}px`,top:`${a.top-boardRect.top}px`,width:`${a.width}px`,height:`${a.height}px`});layer.append(tile);
  tile.animate([{transform:'translate(0, 0)'},{transform:`translate(${to.left-a.left}px, ${to.top-a.top}px)`}],{duration:150,easing:'cubic-bezier(.22,.72,.29,1)',fill:'forwards'});
 }
 const epoch=++pause2048Fx.epoch;pause2048Fx.active=true;
 pause2048Fx.timeout=setTimeout(()=>{
  if(epoch!==pause2048Fx.epoch)return;
  b.classList.remove('is-moving');layer.remove();
  // Pop only the newly spawned and merged tiles after the slide.
  merged.forEach(i=>allCells[i]?.classList.add('cell-merged'));
  if(newAt>=0)allCells[newAt]?.classList.add('cell-new');
  pause2048Fx.active=false;pause2048Fx.timeout=null;
  onDone();
  const queued=pause2048Fx.queue.shift();if(queued)play2048(queued);
 },155);
}
function play2048(dir){
 if(gameShell.id!=='2048'||gameShell.paused||game2048.over||!$('#board'))return;
 if(pause2048Fx.active){if(pause2048Fx.queue.length<3)pause2048Fx.queue.push(dir);return;}
 const outcome=compute2048Step(game2048.grid,dir);if(!outcome.changed)return;
 const oldRects=[...$('#board').querySelectorAll('.game-cell')].map(el=>el.getBoundingClientRect());
 game2048.undo={grid:game2048.grid.slice(),score:game2048.score,moves:game2048.moves,over:game2048.over,won:game2048.won};
 game2048.grid=outcome.grid;game2048.score+=outcome.points;game2048.moves++;
 const newAt=spawn2048();game2048.over=!has2048Moves();const justWon=!game2048.won&&game2048.grid.some(v=>v>=2048);game2048.won ||= justWon;
 save2048();render2048();updateStats();
 if(outcome.points){const gain=$('#gain2048');gain.textContent=`+${formatNum(outcome.points)}`;gain.classList.remove('gain-play');void gain.offsetWidth;gain.classList.add('gain-play');play2048Tone(outcome.points);}
 announce2048(outcome.points?`${formatNum(outcome.points)}점 획득. 현재 ${formatNum(game2048.score)}점`:`${game2048.moves}번째 이동`);
 animate2048Step(outcome.tracks,outcome.merged,newAt,oldRects,()=>{
  if(gameShell.id!=='2048')return;
  if(game2048.over){gameShell.paused=true;pauseMask('이번 판은 여기까지.','모든 칸이 막혔어요. 지금까지의 기록은 안전하게 저장했어요.',`<button class="shell-button primary-action" data-shell-action="restart">↻ 다시 도전</button><button class="shell-button subdued" data-shell-action="home">게임 목록</button>`);}
  else if(justWon){gameShell.paused=true;pauseMask('2048, 달성했어요!','멋진 집중이었어요. 계속해서 더 높은 숫자도 만들어볼까요?',`<button class="shell-button primary-action" data-shell-action="continue-win">계속하기 →</button><button class="shell-button subdued" data-shell-action="home">게임 목록</button>`);}
 });
}
function undo2048(){if(!game2048.undo||gameShell.paused)return;clear2048Fx();const undo=game2048.undo;Object.assign(game2048,{...undo,grid:undo.grid.slice(),undo:null});save2048();render2048();hideMask();announce2048('마지막 이동을 되돌렸습니다.');}
const game2048Module={
 markup:markup2048,
 help:'클래식 4×4 규칙 · 같은 숫자를 합쳐 2048을 완성하세요. 방향키/WASD·스와이프·화면 방향 버튼을 지원하며, Z로 한 번 되돌릴 수 있습니다.',
 mount(){read2048();render2048();const board=$('#board');
  board.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;pause2048Touch={x:e.clientX,y:e.clientY,id:e.pointerId};});
  board.addEventListener('pointerup',e=>{if(!pause2048Touch||pause2048Touch.id!==e.pointerId)return;const dx=e.clientX-pause2048Touch.x,dy=e.clientY-pause2048Touch.y;pause2048Touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;play2048(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});
  board.addEventListener('pointercancel',()=>pause2048Touch=null);
  return{pause(){clear2048Fx();save2048();},resume(){},reset:reset2048,dispose(){clear2048Fx();save2048();},undo:undo2048,move:play2048};
 }
};
