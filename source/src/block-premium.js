/* PAUSE Block Premium v0.8: 9x9 row/column/3x3 box puzzle; locally saved independent mode.
   Piece algorithms and visual components are original. */
const BP_N=9, BP_STORAGE='block9', BP_BEST='best-block9';
const BP_SHAPES=[
 [[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],
 [[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]],[[1,0],[0,1],[1,1]],[[0,0],[0,1],[1,1]],
 [[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[0,3]],
 [[0,0],[1,0],[2,0],[1,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[2,1]],
 [[0,0],[1,0],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],
 [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]],
 [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],
];
const BP_COLORS=['#668dbf','#d59b74','#739ec1','#c58b70','#8ba2be','#e1b18a'];
let bpState=null,bpSelection=0,bpHover=null,bpRoot=null,bpDrag=null,bpFocus=40,bpTimer=0,bpPulse=new Set(),bpFreshTiles=new Set();
function bpNew(){return{version:2,board:Array(81).fill(0),tray:[],score:0,turn:0,combo:0,missed:0,bestCombo:0,cleared:0,clearedBoxes:0,over:false,startedAt:Date.now()}}
function bpShapeSize(shape){return [Math.max(...shape.map(c=>c[0]))+1,Math.max(...shape.map(c=>c[1]))+1]}
function bpFits(board,shape,x,y){return shape.every(([dx,dy])=>x+dx>=0&&x+dx<9&&y+dy>=0&&y+dy<9&&!board[(y+dy)*9+x+dx]);}
function bpPossible(board,piece){if(piece===null||!BP_SHAPES[piece])return false;for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(bpFits(board,BP_SHAPES[piece],x,y))return true;return false}
function bpTargets(board){const rows=[],cols=[],boxes=[],cleared=new Set();
 for(let r=0;r<9;r++)if(board.slice(r*9,r*9+9).every(Boolean)){rows.push(r);for(let c=0;c<9;c++)cleared.add(r*9+c)}
 for(let c=0;c<9;c++)if(Array.from({length:9},(_,r)=>board[r*9+c]).every(Boolean)){cols.push(c);for(let r=0;r<9;r++)cleared.add(r*9+c)}
 for(let br=0;br<3;br++)for(let bc=0;bc<3;bc++){const ids=[];for(let y=0;y<3;y++)for(let x=0;x<3;x++)ids.push((br*3+y)*9+bc*3+x);if(ids.every(i=>board[i])){boxes.push(br*3+bc);ids.forEach(i=>cleared.add(i))}}
 return{rows,cols,boxes,cleared:[...cleared],groups:rows.length+cols.length+boxes.length};
}
function bpValidSave(s){return s&&s.version===2&&Array.isArray(s.board)&&s.board.length===81&&s.board.every(n=>Number.isInteger(n)&&n>=0&&n<=6)&&Array.isArray(s.tray)&&s.tray.length===3&&s.tray.every(n=>n===null||(Number.isInteger(n)&&n>=0&&n<BP_SHAPES.length))&&Number.isFinite(s.score)&&s.score>=0&&Number.isInteger(s.turn)&&s.turn>=0;}
function bpSave(){if(bpState)playStore.write(BP_STORAGE,bpState)}
function bpDeal(){const legal=BP_SHAPES.map((s,i)=>bpPossible(bpState.board,i)?i:null).filter(n=>n!==null);if(!legal.length){bpState.tray=[null,null,null];bpState.over=true;return}
 const tray=Array.from({length:3},()=>exRand(BP_SHAPES.length));tray[exRand(3)]=legal[exRand(legal.length)];bpState.tray=tray;bpSelection=0;
}
function bpCanPlay(){return bpState.tray.some(id=>bpPossible(bpState.board,id))}
function bpCandidate(p,x,y){const id=bpState.tray[p];if(id===null||!BP_SHAPES[id])return null;const shape=BP_SHAPES[id];let ids=shape.map(([dx,dy])=>(y+dy)*9+x+dx);return{p,x,y,ids,valid:bpFits(bpState.board,shape,x,y)}}
function bpSetHover(candidate){bpHover=candidate;const cells=bpRoot?.querySelectorAll('[data-block9-cell]');if(!cells)return;const highlight=new Set(candidate?.valid?candidate.ids:[]);let clear=new Set();if(candidate?.valid){const board=bpState.board.slice();candidate.ids.forEach(i=>board[i]=candidate.p+1);clear=new Set(bpTargets(board).cleared)}cells.forEach((el,i)=>{el.classList.toggle('bp-target',highlight.has(i));el.classList.toggle('bp-invalid',Boolean(candidate&&!candidate.valid&&candidate.ids.includes(i)));el.classList.toggle('bp-clearing',clear.has(i));});}
function bpPieceDots(id){if(id===null)return'<span class="bp-done" aria-hidden="true">✓</span>';const shape=BP_SHAPES[id],dim=bpShapeSize(shape);return `<span class="bp-mini" style="--w:${dim[0]};--h:${dim[1]}">${shape.map(([x,y])=>`<span class="bp-mini-unit" style="grid-column:${x+1};grid-row:${y+1}"></span>`).join('')}</span>`}
function bpRender(){if(!bpRoot)return;const board=bpRoot.querySelector('#bpBoard'),tray=bpRoot.querySelector('#bpTray');board.innerHTML=bpState.board.map((v,i)=>`<button type="button" class="bp-cell ${v?'occupied':''} ${bpPulse.has(i)?'bp-cleared':''} ${bpFreshTiles.has(i)?'bp-placed':''} ${(Math.floor(i/9)%3===2)?'bp-bottom':''} ${i%9===2||i%9===5?'bp-right':''}" style="--tile:${BP_COLORS[(v-1+6)%6]}" data-block9-cell="${i}" aria-label="${Math.floor(i/9)+1}행 ${i%9+1}열 ${v?'채워짐':'비어 있음'}" tabindex="${i===bpFocus?0:-1}"></button>`).join('');
 tray.innerHTML=bpState.tray.map((id,i)=>`<button type="button" class="bp-piece ${i===bpSelection?'picked':''}" data-block9-piece="${i}" ${id===null?'disabled':''} aria-pressed="${i===bpSelection}" aria-label="블록 ${i+1}, ${id===null?'배치 완료':BP_SHAPES[id].length+'칸'}">${bpPieceDots(id)}</button>`).join('');
 const over=bpState.over?'완료':'플레이 중';bpRoot.querySelector('#bpStatus').textContent=over;
 bpRoot.querySelector('#bpCombo').textContent=bpState.combo>1?`COMBO ×${bpState.combo}`:'차분하게, 다음 한 수';
 bpRoot.querySelector('#bpMoves').textContent=`${bpState.turn}회 배치 · ${bpState.cleared}구역 정리`;
 const pts=playStore.number(BP_BEST);exStats([['현재 점수',formatNum(bpState.score)],['9×9 최고 점수',formatNum(Math.max(pts,bpState.score))],['최고 콤보',`×${bpState.bestCombo}`],['완성한 3×3 구역',bpState.clearedBoxes]]);
 bpRoot.querySelector('#bpEnd').hidden=!bpState.over;bpRoot.querySelector('#bpProgress').textContent=`${bpState.tray.filter(x=>x!==null).length}개 남음`;
 bpSetHover(bpHover);
}
function bpFlash(message){const el=bpRoot?.querySelector('#bpFeedback');if(!el)return;el.textContent=message;el.classList.remove('bp-pop');void el.offsetWidth;el.classList.add('bp-pop')}
function bpPlace(piece,x,y){if(gameShell.paused||bpState.over)return false;const c=bpCandidate(piece,x,y);if(!c||!c.valid){bpFlash('이 위치에는 놓을 수 없어요');return false}const shape=BP_SHAPES[bpState.tray[piece]];c.ids.forEach(i=>bpState.board[i]=piece+1);bpFreshTiles=new Set(c.ids);bpState.tray[piece]=null;bpState.turn++;
 const clear=bpTargets(bpState.board);bpState.score+=shape.length;
 if(clear.groups){bpState.combo=bpState.missed>=3?1:bpState.combo+1;bpState.missed=0;bpState.bestCombo=Math.max(bpState.bestCombo,bpState.combo);bpState.cleared+=clear.groups;bpState.clearedBoxes+=clear.boxes.length;bpState.score+=clear.cleared.length*10*bpState.combo+Math.max(0,clear.groups-1)*36*bpState.combo;clear.cleared.forEach(i=>bpState.board[i]=0);bpPulse=new Set(clear.cleared);bpFreshTiles=new Set(c.ids.filter(i=>!bpPulse.has(i)));if(bpState.board.every(n=>n===0))bpState.score+=180;bpFlash(`${clear.groups}구역 정리! ${bpState.combo>1?'콤보 ×'+bpState.combo:'좋은 배치'}`);}
 else{bpState.missed++;if(bpState.missed>=3)bpState.combo=0;bpFlash(`+${shape.length}점 · 다음 배치를 생각해 보세요`)}
 exRecord('block9',bpState.score);if(bpState.tray.every(n=>n===null))bpDeal();bpSelection=Math.max(0,bpState.tray.findIndex(n=>n!==null));bpState.over=bpState.over||!bpCanPlay();bpHover=null;bpSave();bpRender();clearTimeout(bpTimer);bpTimer=setTimeout(()=>{bpPulse=new Set();bpFreshTiles=new Set();if(bpRoot)bpRoot.querySelectorAll('.bp-cleared,.bp-placed').forEach(el=>el.classList.remove('bp-cleared','bp-placed'))},430);if(bpState.over){bpFlash('보드가 가득 찼어요. 기록에 도전해 보세요!');exFinish('블록 퍼즐 종료',`이번 점수 ${formatNum(bpState.score)}점 · 최고 콤보 ×${bpState.bestCombo}`)}return true;
}
function bpCellAt(clientX,clientY,isTouch){let target=document.elementFromPoint(clientX,clientY-(isTouch?66:0));const cell=target?.closest?.('[data-block9-cell]');if(!cell||!bpRoot?.contains(cell))return null;return +cell.dataset.block9Cell}
function bpPointerCandidate(e){const idx=bpCellAt(e.clientX,e.clientY,bpDrag?.touch);if(idx===null)return null;const shape=BP_SHAPES[bpState.tray[bpDrag?.piece??bpSelection]];if(!shape)return null;const [w,h]=bpShapeSize(shape);return bpCandidate(bpDrag?.piece??bpSelection,idx%9-Math.floor(w/2),Math.floor(idx/9)-Math.floor(h/2))}
function bpDragVisual(e){if(!bpDrag?.ghost)return;bpDrag.ghost.style.left=e.clientX+'px';bpDrag.ghost.style.top=(e.clientY-(bpDrag.touch?70:24))+'px';}
const blockModule={
 markup:()=>`<section class="bp-game" aria-label="9x9 블록 퍼즐">
 <div class="bp-top"><span class="bp-mode">9 × 9 · CLASSIC</span><span id="bpStatus">플레이 중</span></div>
 <div class="bp-board" id="bpBoard" role="grid" aria-label="9행 9열 블록 퍼즐판"></div>
 <div class="bp-score-banner"><strong id="bpCombo">차분하게, 다음 한 수</strong><small id="bpMoves">0회 배치</small></div>
 <div class="bp-tray-head"><span>다음 블록</span><span id="bpProgress">3개 남음</span></div>
 <div class="bp-tray" id="bpTray"></div><p id="bpFeedback" aria-live="polite" class="bp-feedback">블록을 잡아 끌거나 선택한 뒤 격자를 누르세요</p>
 <p class="bp-instructions">가로·세로 9칸 또는 3×3 구역을 채우면 사라집니다. 블록은 회전하지 않아요.</p><div id="bpEnd" hidden></div>
 </section>`,
 help:'9×9 퍼즐 · 가로/세로 한 줄 또는 3×3 구역을 완성하세요. 블록은 회전하지 않으며 3개를 모두 놓으면 새 블록을 받습니다.',
 mount(){const saved=playStore.read(BP_STORAGE,null);bpState=bpValidSave(saved)?saved:bpNew();if(!bpValidSave(saved)){bpDeal();bpSave()};bpSelection=Math.max(0,bpState.tray.findIndex(n=>n!==null));bpFocus=40;bpRoot=document.querySelector('.bp-game');bpHover=null;bpPulse=new Set();bpFreshTiles=new Set();bpRender();let suppress=0;
 const click=e=>{if(Date.now()<suppress)return;const piece=e.target.closest('[data-block9-piece]');if(piece){bpSelection=+piece.dataset.block9Piece;bpRender();return}const cell=e.target.closest('[data-block9-cell]');if(cell&&bpState.tray[bpSelection]!==null){const i=+cell.dataset.block9Cell;bpPlace(bpSelection,i%9,Math.floor(i/9))}};
 const move=e=>{if(bpDrag){if(bpDrag.pointer!==e.pointerId)return;bpDragVisual(e);bpSetHover(bpPointerCandidate(e));return}if(e.pointerType==='mouse'&&e.target.closest('[data-block9-cell]')){const i=+e.target.closest('[data-block9-cell]').dataset.block9Cell;bpSetHover(bpCandidate(bpSelection,i%9,Math.floor(i/9)))}};
 const down=e=>{const p=e.target.closest('[data-block9-piece]');if(!p||bpState.tray[+p.dataset.block9Piece]===null||gameShell.paused||bpState.over)return;bpSelection=+p.dataset.block9Piece;const touch=e.pointerType!=='mouse';bpDrag={pointer:e.pointerId,piece:bpSelection,touch,moved:false,originX:e.clientX,originY:e.clientY,ghost:document.createElement('div')};bpDrag.ghost.className='bp-drag-ghost';bpDrag.ghost.innerHTML=bpPieceDots(bpState.tray[bpSelection]);document.body.appendChild(bpDrag.ghost);bpDragVisual(e);try{e.target.closest('[data-block9-piece]')?.setPointerCapture?.(e.pointerId)}catch{/* Synthetic pointer events have no active pointer to capture. */}};
 const up=e=>{if(!bpDrag||bpDrag.pointer!==e.pointerId)return;let c=bpPointerCandidate(e);if(c?.valid){bpPlace(c.p,c.x,c.y);suppress=Date.now()+360}else{bpSelection=bpDrag.piece;}bpDrag.ghost?.remove();bpDrag=null;bpSetHover(null);if(!c?.valid)bpRender()};
 const leave=e=>{if(bpDrag&&e.pointerId===bpDrag.pointer){bpDrag.ghost?.remove();bpDrag=null;bpSetHover(null)}};
 const key=e=>{if(gameShell.id!=='block'||gameShell.paused||bpState.over)return;if(e.key>='1'&&e.key<='3'){bpSelection=Number(e.key)-1;bpRender();return}const active=document.activeElement;if(!bpRoot.contains(active))return;if(e.key==='Enter'||e.key===' '){if(active?.hasAttribute('data-block9-cell')){e.preventDefault();let i=+active.dataset.block9Cell;bpPlace(bpSelection,i%9,Math.floor(i/9))}}const dif={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[e.key];if(dif){e.preventDefault();const next=bpFocus+dif;if(next>=0&&next<81&&!(dif===1&&bpFocus%9===8)&&!(dif===-1&&bpFocus%9===0)){bpFocus=next;bpRoot.querySelectorAll('[data-block9-cell]').forEach(el=>el.tabIndex=+el.dataset.block9Cell===next?0:-1);bpRoot.querySelector(`[data-block9-cell="${next}"]`)?.focus({preventScroll:true})}}};
 bpRoot.addEventListener('click',click);bpRoot.addEventListener('pointerdown',down);bpRoot.addEventListener('pointermove',move);bpRoot.addEventListener('pointerup',up);bpRoot.addEventListener('pointercancel',leave);bpRoot.addEventListener('pointerleave',()=>{if(!bpDrag)bpSetHover(null)});document.addEventListener('keydown',key);
 return{pause(){bpSave();if(bpDrag){bpDrag.ghost?.remove();bpDrag=null;bpSetHover(null)}},resume(){bpRender()},reset(){clearTimeout(bpTimer);bpPulse=new Set();bpFreshTiles=new Set();bpState=bpNew();bpDeal();bpSelection=0;bpSave();bpRender();hideMask()},dispose(){clearTimeout(bpTimer);bpSave();bpDrag?.ghost?.remove();bpRoot.removeEventListener('click',click);bpRoot.removeEventListener('pointerdown',down);bpRoot.removeEventListener('pointermove',move);bpRoot.removeEventListener('pointerup',up);bpRoot.removeEventListener('pointercancel',leave);document.removeEventListener('keydown',key);bpRoot=null;bpDrag=null}};
 }
};
