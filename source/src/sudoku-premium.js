/* PAUSE v0.9 — Sudoku Premium. Original implementation; no online dependencies. */
const SUDO_PATTERN=(r,c)=>(r*3+Math.floor(r/3)+c)%9;
const SUDO_MODES={easy:{label:'초급',remove:35},normal:{label:'중급',remove:43},hard:{label:'고급',remove:49},expert:{label:'전문가',remove:53}};
let sudokuS=null,sudokuTimer=null,sudokuLastTick=0,sudokuFocus=40,sudokuTip='',sudokuTipCell=-1;
function sudokuSolutionCount(board,limit=2){
 let found=0;
 function search(){let best=-1,options=null;
  for(let i=0;i<81;i++)if(!board[i]){const opts=sudokuCandidates(board,i);if(!opts.length)return;if(!options||opts.length<options.length){best=i;options=opts;if(opts.length===1)break}}
  if(best<0){found++;return}
  for(const n of options){board[best]=n;search();board[best]=0;if(found>=limit)return}
 }
 search();return found;
}
function sudokuPeers(i){const row=Math.floor(i/9),col=i%9,out=new Set();for(let k=0;k<9;k++){out.add(row*9+k);out.add(k*9+col);out.add((Math.floor(row/3)*3+Math.floor(k/3))*9+Math.floor(col/3)*3+k%3)}out.delete(i);return [...out]}
const sudokuPeerMap=Array.from({length:81},(_,i)=>sudokuPeers(i));
function sudokuCandidates(board,i){if(board[i])return[];const used=new Set(sudokuPeerMap[i].map(k=>board[k]));return [1,2,3,4,5,6,7,8,9].filter(n=>!used.has(n))}
function sudokuGenerate(mode='normal'){
 const m=SUDO_MODES[mode]||SUDO_MODES.normal;
 const nums=exShuffle([1,2,3,4,5,6,7,8,9]);
 const groups=()=>exShuffle([0,1,2]).flatMap(g=>exShuffle([0,1,2]).map(i=>3*g+i));
 const rr=groups(),cc=groups(),answer=rr.flatMap(r=>cc.map(c=>nums[SUDO_PATTERN(r,c)]));
 const original=[...answer];let removed=0;
 // Uniqueness checked after every removal; difficulty uses clue count, not a promise of advanced solving technique.
 for(const i of exShuffle(Array.from({length:81},(_,j)=>j))){const v=original[i];original[i]=0;if(sudokuSolutionCount([...original],2)!==1)original[i]=v;else removed++;if(removed>=m.remove)break}
 return {version:2,mode,original,answer,board:[...original],notes:Array.from({length:81},()=>[]),selected:40,
  pencil:false,entryMode:'cell',held:1,showMistakes:false,mistakes:0,hints:0,elapsed:0,completed:false,
  history:[],future:[],savedAt:Date.now()};
}
function sudokuValid(s){return Boolean(s&&s.board?.length===81&&s.original?.length===81&&s.answer?.length===81&&s.original.every((v,i)=>v===0||v===s.answer[i])&&s.board.every(n=>Number.isInteger(n)&&n>=0&&n<=9))}
function sudokuNormalize(raw){
 if(!sudokuValid(raw))return null;
 const s={...raw};s.version=2;s.mode=SUDO_MODES[s.mode]?s.mode:'normal';s.notes=Array.from({length:81},(_,i)=>Array.isArray(s.notes?.[i])?s.notes[i].filter(n=>Number.isInteger(n)&&n>=1&&n<=9):[]);
 s.selected=Number.isInteger(s.selected)&&s.selected>=0&&s.selected<81?s.selected:40;
 s.pencil=Boolean(s.pencil);s.entryMode=s.entryMode==='number'?'number':'cell';s.held=Number.isInteger(s.held)&&s.held>=1&&s.held<=9?s.held:1;
 s.showMistakes=Boolean(s.showMistakes);s.mistakes=Math.max(0,Number(s.mistakes)||0);s.hints=Math.max(0,Number(s.hints)||0);
 s.elapsed=Math.max(0,Number(s.elapsed)||0);s.completed=Boolean(s.completed);s.history=[];s.future=[];return s;
}
const sudokuFormatTime=ms=>{const seconds=Math.floor(Math.max(0,ms)/1000);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`};
function sudokuPersist(){if(sudokuS){sudokuS.savedAt=Date.now();playStore.write('sudoku9',sudokuS)}}
function sudokuClock(){if(!sudokuS)return;const now=performance.now();if(sudokuLastTick&&!gameShell.paused&&!sudokuS.completed)sudokuS.elapsed+=Math.max(0,Math.min(now-sudokuLastTick,1500));sudokuLastTick=now;sudokuDrawClock()}
function sudokuDrawClock(){const t=$('#sudokuTime');if(t)t.textContent=sudokuFormatTime(sudokuS.elapsed);const best=$('#sudokuBest');if(best)best.textContent=playStore.number('sudoku9-best-'+sudokuS.mode)?sudokuFormatTime(playStore.number('sudoku9-best-'+sudokuS.mode)):'--:--';}
function sudokuConflicts(){const result=new Set();sudokuS.board.forEach((n,i)=>{if(!n)return;for(const peer of sudokuPeerMap[i])if(sudokuS.board[peer]===n){result.add(i);result.add(peer)}});return result}
function sudokuSaveUndo(){sudokuS.history.push({board:[...sudokuS.board],notes:sudokuS.notes.map(a=>[...a]),mistakes:sudokuS.mistakes});if(sudokuS.history.length>120)sudokuS.history.shift();sudokuS.future=[]}
function sudokuUndo(redo=false){if(!sudokuS||gameShell.paused||sudokuS.completed)return;const from=redo?sudokuS.future:sudokuS.history,to=redo?sudokuS.history:sudokuS.future;if(!from.length)return;to.push({board:[...sudokuS.board],notes:sudokuS.notes.map(a=>[...a]),mistakes:sudokuS.mistakes});const old=from.pop();sudokuS.board=old.board;sudokuS.notes=old.notes;sudokuS.mistakes=old.mistakes;sudokuTip='';sudokuPersist();sudokuDraw()}
function sudokuFinish(){if(sudokuS.completed)return;sudokuS.completed=true;const bestKey='sudoku9-best-'+sudokuS.mode;const best=playStore.number(bestKey);if(sudokuS.hints===0&&sudokuS.mistakes===0&&(!best||sudokuS.elapsed<best))playStore.putNumber(bestKey,Math.max(1,Math.round(sudokuS.elapsed)));
 playStore.putNumber('sudoku9-wins-'+sudokuS.mode,playStore.number('sudoku9-wins-'+sudokuS.mode)+1);
 sudokuPersist();exFinish('스도쿠 완성!','멋진 집중력이에요. '+sudokuFormatTime(sudokuS.elapsed)+'에 완성했어요.'+(sudokuS.hints||sudokuS.mistakes?' 힌트·오답 없는 기록만 최고 시간에 반영돼요.':''));
}
function sudokuEnter(n,index=sudokuS?.selected){if(!sudokuS||gameShell.paused||sudokuS.completed||!Number.isInteger(index)||index<0||index>=81||sudokuS.original[index])return;
 if(sudokuS.entryMode==='number'&&n>0)sudokuS.held=n;
 sudokuSaveUndo();const old=sudokuS.board[index];if(sudokuS.pencil&&n>0){if(!old){const set=new Set(sudokuS.notes[index]);set.has(n)?set.delete(n):set.add(n);sudokuS.notes[index]=[...set].sort((a,b)=>a-b)}}else{
 sudokuS.board[index]=n;sudokuS.notes[index]=[];
 if(n&&old!==n&&n!==sudokuS.answer[index]&&sudokuS.showMistakes)sudokuS.mistakes++;
 if(n)for(const peer of sudokuPeerMap[index])sudokuS.notes[peer]=sudokuS.notes[peer].filter(v=>v!==n);
 }
 sudokuTip='';sudokuTipCell=-1;sudokuPersist();sudokuDraw();if(sudokuS.board.every((v,i)=>v===sudokuS.answer[i]))sudokuFinish();
}
function sudokuAutoNotes(){if(gameShell.paused||sudokuS.completed)return;sudokuSaveUndo();sudokuS.notes=sudokuS.board.map((v,i)=>v?[]:sudokuCandidates(sudokuS.board,i));sudokuTip='남은 숫자 후보를 메모에 채웠어요. 정답을 자동 입력하지는 않아요.';sudokuTipCell=-1;sudokuPersist();sudokuDraw()}
function sudokuHint(){if(!sudokuS||gameShell.paused||sudokuS.completed)return;
 const b=sudokuS.board;let target=-1,message='';
 for(let i=0;i<81;i++)if(!b[i]){const c=sudokuCandidates(b,i);if(c.length===1){target=i;message=`${Math.floor(i/9)+1}행 ${i%9+1}열은 후보가 ${c[0]} 하나뿐이에요. 관련 행·열·박스를 살펴보세요.`;break}}
 if(target<0){const units=[];for(let r=0;r<9;r++){units.push(Array.from({length:9},(_,c)=>r*9+c));units.push(Array.from({length:9},(_,k)=>k*9+r));const rr=Math.floor(r/3)*3,cc=r%3*3;units.push(Array.from({length:9},(_,k)=>(rr+Math.floor(k/3))*9+cc+k%3))}
  outer:for(const unit of units)for(let n=1;n<=9;n++){if(unit.some(i=>b[i]===n))continue;const opts=unit.filter(i=>!b[i]&&sudokuCandidates(b,i).includes(n));if(opts.length===1){target=opts[0];message=`${n}을 넣을 수 있는 자리가 이 행·열·구역에는 한 칸뿐이에요.`;break outer}}}
 if(target<0){target=b.findIndex(n=>!n);message='기본 후보 하나로 결정되는 칸이 없어요. 메모를 정리하고 숫자가 제한되는 구역을 비교해 보세요. 필요한 경우 선택한 칸의 후보부터 확인해 보세요.'}
 if(target>=0){sudokuS.selected=target;sudokuTipCell=target;sudokuTip=message;sudokuS.hints++;sudokuPersist();sudokuDraw()}
}
function sudokuDraw(){if(!sudokuS)return;const board=$('#exSudoku');if(!board)return;const sel=sudokuS.selected,related=new Set(sudokuPeerMap[sel]),conf=sudokuConflicts(),selectedValue=sudokuS.board[sel];
 board.innerHTML=sudokuS.board.map((v,i)=>{const notes=sudokuS.notes[i];const wrong=Boolean(v&&(conf.has(i)||(sudokuS.showMistakes&&v!==sudokuS.answer[i])));const classes=['sudoku9-cell',sudokuS.original[i]?'given':'entry',i===sel?'selected':'',related.has(i)?'related':'',selectedValue&&v===selectedValue?'matching':'',wrong?'wrong':'',i===sudokuTipCell?'hinted':''].filter(Boolean).join(' ');
 const label=`${Math.floor(i/9)+1}행 ${i%9+1}열, ${v?'숫자 '+v:notes.length?'메모 '+notes.join(' '):'빈칸'}${wrong?', 규칙 중복 또는 오류':''}`;
 return `<button type="button" data-sudo="${i}" class="${classes}" style="--subrow:${i<72&&Math.floor(i/9)%3===2?'2px':'1px'};--subcol:${i%9===2||i%9===5?'2px':'1px'}" aria-label="${label}" aria-pressed="${i===sel}">${v?`<span class="sudoku9-digit">${v}</span>`:notes.length?`<span class="sudoku9-notes">${Array.from({length:9},(_,k)=>`<i>${notes.includes(k+1)?k+1:''}</i>`).join('')}</span>`:''}</button>`}).join('');
 const prompt=$('#sudokuTip');if(prompt){prompt.textContent=sudokuTip||'같은 숫자와 선택한 칸의 행·열·3×3 영역을 함께 표시해요.';prompt.classList.toggle('active',Boolean(sudokuTip))}
 const note=$('#sudokuPencil');if(note){note.setAttribute('aria-pressed',String(sudokuS.pencil));note.classList.toggle('active',sudokuS.pencil)}
 const mistake=$('#sudokuAutoCheck');if(mistake){mistake.setAttribute('aria-pressed',String(sudokuS.showMistakes));mistake.textContent=`오류 검사 ${sudokuS.showMistakes?'켬':'끔'}`}
 const mode=$('#sudokuEntryMode');if(mode)mode.textContent=sudokuS.entryMode==='cell'?'칸 먼저':'숫자 먼저';
 const difficulty=$('#sudokuDifficulty');if(difficulty)difficulty.value=sudokuS.mode;
 const stats=$('#sudokuSummary');if(stats)stats.innerHTML=`<span>채운 칸 <strong>${sudokuS.board.filter(Boolean).length}/81</strong></span><span>힌트 <strong>${sudokuS.hints}</strong></span><span>오답 <strong>${sudokuS.mistakes}</strong></span>`;
 const pad=$('#sudokuPad');if(pad)pad.innerHTML=Array.from({length:9},(_,i)=>{const n=i+1,remaining=9-sudokuS.board.filter(v=>v===n).length;return `<button type="button" class="sudoku9-num ${sudokuS.entryMode==='number'&&sudokuS.held===n?'active':''}" data-sudo-num="${n}" aria-label="${n} 입력, 남은 개수 ${Math.max(0,remaining)}">${n}<small>${remaining>0?remaining:'✓'}</small></button>`}).join('');
 exStats([['난이도',SUDO_MODES[sudokuS.mode].label],['풀이 시간',sudokuFormatTime(sudokuS.elapsed)],['오답·힌트',`${sudokuS.mistakes} · ${sudokuS.hints}`],['완료 횟수',playStore.number('sudoku9-wins-'+sudokuS.mode)]]);
 sudokuDrawClock();
}
const sudokuModule={
 markup:()=>`<div class="ex-content sudoku9-premium"><div class="sudoku9-top"><label for="sudokuDifficulty">난이도 <select id="sudokuDifficulty">${Object.entries(SUDO_MODES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label><div class="sudoku9-clock"><span>TIME</span><strong id="sudokuTime">00:00</strong></div><button type="button" id="sudokuAutoCheck" class="sudoku9-quiet" aria-pressed="false">오류 검사 끔</button></div>
 <div id="sudokuSummary" class="sudoku9-summary" aria-live="polite"></div><div class="sudoku9-board" id="exSudoku" role="group" aria-label="9행 9열 스도쿠 게임판"></div>
 <div class="sudoku9-tools"><button type="button" id="sudokuUndo">↶ 되돌리기</button><button type="button" id="sudokuRedo">↷ 다시하기</button><button type="button" id="sudokuPencil" aria-pressed="false">✎ 메모</button><button type="button" id="sudokuAutoNotes">후보 자동</button><button type="button" id="sudokuHint">✦ 힌트</button></div>
 <div class="sudoku9-pad" id="sudokuPad" role="group" aria-label="숫자 입력"></div><div class="sudoku9-bottom"><button type="button" id="sudokuErase">⌫ 지우기</button><button type="button" id="sudokuEntryMode">칸 먼저</button><span>최고 시간 <strong id="sudokuBest">--:--</strong></span></div><p id="sudokuTip" class="sudoku9-tip" role="status">같은 숫자와 선택한 칸의 행·열·3×3 영역을 함께 표시해요.</p><p class="play-instructions">칸을 누른 뒤 숫자를 선택하세요. 키보드 1~9 · 방향키 · N 메모 · Ctrl+Z 되돌리기.</p></div>`,
 help:'행·열·3×3에 1~9가 중복되지 않도록 채우세요. 힌트는 먼저 확실한 한 칸을 논리로 안내하고, 기록에 별도 표시됩니다.',
 mount(){let s=sudokuNormalize(playStore.read('sudoku9',null));if(!s){s=sudokuNormalize(playStore.read('sudoku',null));if(s){s.mode='normal';sudokuTip='기존 스도쿠 게임을 이어서 불러왔어요.'}}sudokuS=s||sudokuGenerate('normal');sudokuFocus=sudokuS.selected;sudokuLastTick=performance.now();const root=$('.sudoku9-premium');
 const click=e=>{const target=e.target.closest('button');if(!target||gameShell.paused||sudokuS.completed)return;
  if(target.hasAttribute('data-sudo')){const i=+target.dataset.sudo;sudokuS.selected=i;sudokuFocus=i;if(sudokuS.entryMode==='number')sudokuEnter(sudokuS.held,i);else sudokuDraw();return}
  if(target.hasAttribute('data-sudo-num')){const n=+target.dataset.sudoNum;if(sudokuS.entryMode==='number'){sudokuS.held=n;sudokuDraw()}else sudokuEnter(n);return}
  switch(target.id){case'sudokuPencil':sudokuS.pencil=!sudokuS.pencil;sudokuDraw();break;
   case'sudokuAutoNotes':sudokuAutoNotes();break;case'sudokuHint':sudokuHint();break;case'sudokuUndo':sudokuUndo();break;case'sudokuRedo':sudokuUndo(true);break;
   case'sudokuErase':sudokuEnter(0);break;case'sudokuAutoCheck':sudokuS.showMistakes=!sudokuS.showMistakes;sudokuDraw();break;
   case'sudokuEntryMode':sudokuS.entryMode=sudokuS.entryMode==='cell'?'number':'cell';sudokuDraw();break}
  sudokuPersist()
 };
 const change=e=>{if(e.target.id!=='sudokuDifficulty')return;const mode=e.target.value;if(!SUDO_MODES[mode]||mode===sudokuS.mode)return;
  if(sudokuS.board.some((v,i)=>!sudokuS.original[i]&&v!==0)&&!window.confirm('현재 진행 중인 스도쿠를 종료하고 새 난이도로 시작할까요?')){e.target.value=sudokuS.mode;return}
  sudokuS=sudokuGenerate(mode);sudokuTip='새 퍼즐을 생성했어요. 모든 퍼즐에는 하나의 해답만 있어요.';sudokuTipCell=-1;sudokuLastTick=performance.now();sudokuPersist();sudokuDraw()
 };
 const key=e=>{if(gameShell.id!=='sudoku'||gameShell.paused||sudokuS.completed||e.altKey||e.metaKey)return;if(e.target?.tagName==='SELECT')return;
  if(e.ctrlKey&&(e.key.toLowerCase()==='z'||e.key.toLowerCase()==='y')){e.preventDefault();sudokuUndo(e.key.toLowerCase()==='y'||e.shiftKey);return}
  if(e.key>='1'&&e.key<='9'&&e.key.length===1){e.preventDefault();sudokuEnter(+e.key);return}
  if(e.key==='Backspace'||e.key==='Delete'||e.key==='0'){e.preventDefault();sudokuEnter(0);return}
  if(e.key==='n'||e.key==='N'){e.preventDefault();sudokuS.pencil=!sudokuS.pencil;sudokuDraw();return}
  if(e.key==='h'||e.key==='H'){e.preventDefault();sudokuHint();return}
  const dirs={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};if(dirs[e.key]){e.preventDefault();const [dr,dc]=dirs[e.key],r=Math.max(0,Math.min(8,Math.floor(sudokuS.selected/9)+dr)),c=Math.max(0,Math.min(8,sudokuS.selected%9+dc));sudokuS.selected=r*9+c;sudokuFocus=sudokuS.selected;sudokuDraw()}
 };
 root.addEventListener('click',click);root.addEventListener('change',change);document.addEventListener('keydown',key);
 sudokuTimer=setInterval(()=>{sudokuClock();if(Math.floor(sudokuS.elapsed/8000)!==Math.floor((sudokuS.lastAutoSave||0)/8000)){sudokuS.lastAutoSave=sudokuS.elapsed;sudokuPersist()}},250);
 sudokuDraw();return {pause(){sudokuClock();sudokuPersist()},resume(){sudokuLastTick=performance.now()},reset(){sudokuS=sudokuGenerate(sudokuS.mode);sudokuTip='새 게임을 시작했어요.';sudokuTipCell=-1;sudokuLastTick=performance.now();sudokuPersist();sudokuDraw();hideMask()},dispose(){clearInterval(sudokuTimer);sudokuTimer=null;sudokuClock();root.removeEventListener('click',click);root.removeEventListener('change',change);document.removeEventListener('keydown',key);sudokuPersist()}};
 }
};
