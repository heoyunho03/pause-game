// PAUSE Game Runtime v0.4 — reusable game shell and 2048/Minesweeper modules.
// No backend required. Games expose mount / pause / resume / dispose through registry.
const playStore={
  read(key,fallback){return getJSON(`pause:v04:${key}`,fallback)},
  write(key,value){try{safeStorage.setItem(`pause:v04:${key}`,JSON.stringify(value))}catch{}},
  number(key){const n=Number(safeStorage.getItem(`pause:v04:${key}`));return Number.isFinite(n)?n:0},
  putNumber(key,n){try{safeStorage.setItem(`pause:v04:${key}`,String(n))}catch{}}
};
let gameShell={id:null,controller:null,paused:false,returnFocus:null};
document.addEventListener('pause:cloud-snapshot',()=>closeModal());
const formatNum=n=>Number(n||0).toLocaleString('ko-KR');
const buttonIcon={pause:'Ⅱ',play:'▶',home:'⌂',restart:'↻'};
const shellPersonalities={
'2048':['NUMBER FLOW','서로 다른 숫자가 만나는 순간'],block:['SHAPE STUDIO','빈칸을 기회로 바꾸는 한 수'],mines:['TACTICAL GRID','숫자 너머의 안전한 답'],sudoku:['QUIET LOGIC','차분하게 완성하는 아홉 칸'],rolling:['MOTION LAB','관성을 읽고 균형을 지키세요'],runner:['PARKOUR CITY','타이밍이 스타일을 만듭니다'],poker:['THE TABLE','패를 읽고 선택을 만드세요'],onecard:['QUICK CARDS','한 장으로 흐름을 바꾸세요'],hexa:['HEXA SORT','같은 색을 모아 비우는 즐거움'],bubble:['COLOR SHOT','각도를 읽으면 길이 보입니다'],arrow:['TRAFFIC ESCAPE','길을 열고 탈출하세요'],knife:['PRECISION ARCADE','완벽한 순간만 남기세요']};
const shellArrow=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>`;
function shellHtml(gameInfo,body,options={}){
 const vibe=shellPersonalities[gameInfo.id]||['PAUSE / PLAY','한 판의 작은 휴식'];
  return `<div class="pause-shell" data-current-game="${gameInfo.id}">
    <div class="shell-subhead"><span class="shell-kicker"><span class="shell-live-point"></span> PAUSE · ${vibe[0]}</span><span class="shell-save-label"><span class="save-dot"></span>기기에 자동 저장</span></div>
    <div class="shell-main"><div class="shell-stage">
      <div class="shell-stage-top"><div><span class="game-category-pill">${gameInfo.category} / PERSONAL ARCADE</span><h3>${gameInfo.title}</h3></div><div class="shell-stage-top-actions"><button class="shell-icon" data-shell-action="pause" title="일시정지" aria-label="일시정지">Ⅱ</button><button class="shell-icon" data-shell-action="restart" title="처음부터" aria-label="새 게임">↻</button></div></div>
      ${body}
      <div class="shell-screen-mask" id="shellScreenMask" hidden></div>
    </div><aside class="shell-side" aria-label="게임 정보"><div class="shell-side-label">FIELD NOTES · ${vibe[0]}</div><div class="shell-side-title">${vibe[1]}</div>
      <p class="shell-side-desc">${gameInfo.description}</p><div class="shell-stat-stack" id="shellStats"></div>
      <div class="shell-side-divider"></div><div class="shell-tip-label">HOW TO PLAY</div><div class="shell-side-help">${options.help||'언제든 나갔다 다시 돌아올 수 있어요.'}</div>
      <div class="shell-side-actions"><button class="shell-button subdued" data-shell-action="home">← 게임 목록</button><button class="shell-button primary-action" data-shell-action="restart">↻ 새 게임</button></div>
      <div class="shell-side-foot"><span class="shell-brand-dot"></span> PAUSE / DEEP SUNSET · v2.0</div>
    </aside></div>
    <div class="shell-footer-note"><span>딥 블루 × 뮤트 선셋</span><span>게스트 플레이 · 계정 백업 선택</span></div>
  </div>`;
}
function pauseMask(title,desc,buttons){const mask=$('#shellScreenMask');if(!mask)return;mask.hidden=false;mask.innerHTML=`<div class="shell-mask-panel"><div class="mask-symbol" aria-hidden="true">Ⅱ</div><h3>${title}</h3><p>${desc}</p><div class="mask-actions">${buttons}</div></div>`;}
function hideMask(){const mask=$('#shellScreenMask');if(mask){mask.hidden=true;mask.innerHTML=''}}
function showGameConfirm(){if(!gameShell.controller)return;const wasPaused=gameShell.paused;gameShell.paused=true;gameShell.controller.pause();pauseMask('새 게임을 시작할까요?','현재 진행 중인 게임판은 초기화됩니다.',`<button data-shell-action="confirm-restart" class="shell-button primary-action">새 게임 시작</button><button data-shell-action="cancel-restart" class="shell-button subdued">돌아가기</button>`);gameShell._pauseBeforeConfirm=wasPaused}
function togglePause(force){if(!gameShell.controller||!['2048','mines'].includes(gameShell.id))return;if($('#shellScreenMask')?.dataset?.confirm==='1')return;const want=typeof force==='boolean'?force:!gameShell.paused;gameShell.paused=want;if(want){gameShell.controller.pause();pauseMask('잠시 쉬어가요.','게임은 자동으로 보관되었어요. 편할 때 이어서 해요.',`<button class="shell-button primary-action" data-shell-action="resume">▶ 이어하기</button><button class="shell-button subdued" data-shell-action="home">게임 목록으로</button>`)}else{hideMask();gameShell.controller.resume()}const btn=$('[data-shell-action="pause"]');if(btn){btn.textContent=want?'▶':'Ⅱ';btn.setAttribute('aria-label',want?'이어하기':'일시정지')}}
function openModal(id){const g=games.find(x=>x.id===id);if(!g)return;if(gameModules[id]){playHistory=[id,...playHistory.filter(x=>x!==id)].slice(0,12);try{safeStorage.setItem('pause:v20:recent',JSON.stringify(playHistory))}catch{}}gameShell.returnFocus=document.activeElement;gameShell.id=id;gameShell.paused=false;gameShell.controller=null;$('#modalTitle').textContent=g.title;$('#modalBackdrop').classList.add('open');document.body.style.overflow='hidden';$('#modal').classList.toggle('is-game',Boolean(gameModules[id]));$('#modal').scrollTop=0;
 if(!gameModules[id]){ $('#modalBody').innerHTML=shellHtml(g,`<div class="coming-soon"><div class="preview-emoji">${g.emoji}</div><div class="coming-kicker">COMING LATER</div><h4>${g.title}</h4><p>현재는 게임별 디자인·규칙을 준비 중이에요.<br>공통 PAUSE 화면에 게임 모듈을 연결할 예정입니다.</p><span class="coming-notice">플레이 미지원 · 화면 미리보기</span></div>`,{help:'게임이 추가되면 이 자리에서 즉시 플레이할 수 있어요.'}); $('#shellStats').innerHTML='<div class="shell-stat-item"><span>개발 상태</span><strong>준비 중</strong></div>';const pauseBtn=$('[data-shell-action="pause"]');if(pauseBtn)pauseBtn.disabled=true;return; }
 $('#modalBody').innerHTML=shellHtml(g,gameModules[id].markup(),{help:gameModules[id].help});gameShell.controller=gameModules[id].mount();gameShell.controller.resume();$('#closeModal').focus();
}
function closeModal(){if(!$('#modalBackdrop').classList.contains('open'))return;gameShell.controller?.dispose();gameShell.controller=null;gameShell.paused=false;gameShell.id=null;$('#modalBackdrop').classList.remove('open');document.body.style.overflow='';updateStats();gameShell.returnFocus?.focus?.();render()}

/*__PAUSE_2048_PREMIUM__*/

/*__PAUSE_MINES_PREMIUM__*/
const gameModules={'2048':game2048Module,mines:mineModule};
// Public extension contract: register another game in `gameModules[id]` with markup() and mount().
function handleGameAction(action){if(!gameShell.id)return;switch(action){case'home':closeModal();break;case'pause':togglePause();break;case'resume':togglePause(false);break;case'restart':showGameConfirm();break;case'confirm-restart':gameShell.paused=false;gameShell.controller?.reset();gameShell.controller?.resume();break;case'cancel-restart':gameShell.paused=Boolean(gameShell._pauseBeforeConfirm);if(gameShell.paused)togglePause(true);else togglePause(false);break;case'continue-win':gameShell.paused=false;hideMask();break;}}
$('#modalBody').addEventListener('click',e=>{const shell=e.target.closest('[data-shell-action]');if(shell){handleGameAction(shell.dataset.shellAction);return}const gameAction=e.target.closest('[data-game-action]');if(gameAction){
    const action=gameAction.dataset.gameAction;
    if(action==='undo')gameShell.controller?.undo?.();
    if(gameShell.id==='2048'){
      if(['up','down','left','right'].includes(action))gameShell.controller?.move?.(action);
      if(action==='sound'){pause2048Sound=!pause2048Sound;try{safeStorage.setItem('pause:2048:sound',pause2048Sound?'1':'0')}catch{};const btn=$('#sound2048');btn.setAttribute('aria-pressed',String(pause2048Sound));btn.querySelector('span').textContent=pause2048Sound?'사운드 켬':'사운드 끔';}
      if(action==='help'){const tips=$('#tips2048'),btn=$('#helpButton2048');tips.hidden=!tips.hidden;btn.setAttribute('aria-expanded',String(!tips.hidden));}
    }
    return;
  }});
function updateStats(){const best=Math.max(playStore.number('2048best'),Number(safeStorage.getItem('pause:2048best')||0));$('#bestSidebar').innerHTML=`${formatNum(best)}<span class="mini-unit">pts</span>`;const hasSession=Boolean(playStore.read('2048',null)||playStore.read('mines',null)||getJSON('pause:2048state',null));const recent=playHistory.length?games.find(g=>g.id===playHistory[0]):null;
 const recentName=recent?.title||'2048';
 const w=$('.recent-item');if(w){const title=w.querySelector('strong');if(title)title.textContent=recentName;const i=w.querySelector('.recent-icon');if(i)i.textContent=recent?.emoji||'2⁸';const btn=w.querySelector('[data-play]');if(btn){btn.dataset.play=recent?.id||'2048';btn.setAttribute('aria-label',recentName+' 이어하기')}}
 $('#recentText').textContent=recent?'마지막 플레이 · 같은 게임 다시 열기':hasSession?'이 기기의 로컬 진행 기록 보관 중':'아직 기록이 없어요 · 한 판 시작해요';const tip=$('.widget-tip span');if(tip)tip.textContent='2048과 지뢰찾기 플레이 가능 · 다른 게임은 준비 중이에요.';}
function move(dir){gameShell.controller?.move?.(dir)}
