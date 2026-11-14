/* PAUSE · ONE CARD PREMIUM. Original client-only Korean house-rule implementation.
   Card IDs 0–51 follow existing rank()/suit() helpers. 52=black joker, 53=red joker. */
const OC_SAVE='onecard-premium-v1', OC_STATS='onecard-premium-stats';
const OC_SUITS=['♠','♥','♦','♣'];
const OC_NAMES=['스페이드','하트','다이아','클로버'];
const OC_MODES={easy:'쉬움',normal:'보통',hard:'어려움'};
const OC_SYMBOLS=['◆','●','▲','✦'];
let ocState=null,ocRoot=null,ocTimer=0,ocPendingWild=-1,ocHistory=[];
const ocStep=(p,dir=ocState.dir)=>(p+dir+3)%3;
const ocIsJoker=c=>c>=52;
const ocSuit=c=>ocIsJoker(c)?-1:suit(c);
const ocRank=c=>ocIsJoker(c)?0:rank(c);
const ocAttack=c=>c===53?7:c===52?5:ocRank(c)===14?3:ocRank(c)===2?2:0;
const ocCardText=c=>c===52?'BLACK JOKER':c===53?'COLOR JOKER':`${RANKS[rank(c)-2]}${OC_SUITS[suit(c)]}`;
const ocName=p=>p===0?'나':`컴퓨터 ${p}`;
function ocMake(mode='normal'){
  const cards=exShuffle(Array.from({length:54},(_,i)=>i));
  let start=cards.findIndex(c=>ocRank(c)>=3&&ocRank(c)<=6 || ocRank(c)>=8&&ocRank(c)<=10);
  [cards[21],cards[start]]=[cards[start],cards[21]];
  return {v:1,mode,deck:cards.slice(22),hands:[cards.slice(0,7),cards.slice(7,14),cards.slice(14,21)],discard:[cards[21]],activeSuit:ocSuit(cards[21]),turn:0,dir:1,debt:0,attack:0,called:false,winner:-1,phase:'playing',moves:0,emptyDraws:0,message:'같은 무늬나 숫자를 내세요.',logs:['게임 시작 · 각자 7장 배분'],round:0};
}
function ocValid(s){
 if(!s||s.v!==1||!OC_MODES[s.mode]||!Array.isArray(s.hands)||s.hands.length!==3||!Array.isArray(s.discard)||!s.discard.length||!Array.isArray(s.deck)||![-1,1].includes(s.dir)||![0,1,2].includes(s.turn)||s.debt<0||s.activeSuit<0||s.activeSuit>3)return false;
 const all=[...s.deck,...s.discard,...s.hands.flat()];
 return all.length===54 && new Set(all).size===54 && all.every(c=>Number.isInteger(c)&&c>=0&&c<54);
}
function ocSave(){if(ocValid(ocState))playStore.write(OC_SAVE,ocState)}
function ocStat(){return playStore.read(OC_STATS,{wins:0,losses:0,rounds:0,streak:0,best:0})}
function ocPush(s,msg){s.message=msg;s.logs=[msg,...s.logs].slice(0,7)}
function ocNext(s,p=s.turn,skip=1){s.turn=(p+s.dir*skip+9)%3}
function ocRefill(s){if(s.deck.length)return; if(s.discard.length>1){const last=s.discard.pop();s.deck=exShuffle(s.discard);s.discard=[last]}}
function ocDraw(s,p,n=1){let got=0;for(let i=0;i<n;i++){ocRefill(s);if(s.deck.length){s.hands[p].push(s.deck.pop());got++}}return got}
function ocLegal(s,p,c){if(s.phase!=='playing'||s.turn!==p||!s.hands[p].includes(c))return false;
 const power=ocAttack(c);
 if(s.debt>0)return power>0&&power>=s.attack;
 return ocIsJoker(c)||ocRank(c)===7||ocRank(c)===ocRank(s.discard.at(-1))||ocSuit(c)===s.activeSuit;
}
function ocOptions(s,p){return s.hands[p].filter(c=>ocLegal(s,p,c))}
function ocFinish(s,winner){s.phase='finished';s.winner=winner;const st=ocStat();st.rounds++;if(winner===0){st.wins++;st.streak++;st.best=Math.max(st.best,st.streak)}else{st.losses++;st.streak=0}playStore.write(OC_STATS,st);ocPush(s,winner===0?'🎉 승리! 모든 카드를 냈어요.':`${ocName(winner)} 승리! 다음 판에서 다시 도전해 보세요.`)}
function ocPlay(s,p,c,pickedSuit,declare=false){
 if(!ocLegal(s,p,c))return false;
 if(ocRank(c)===7&&(!Number.isInteger(pickedSuit)||pickedSuit<0||pickedSuit>3))return false;
 const hand=s.hands[p],idx=hand.indexOf(c);hand.splice(idx,1);s.discard.push(c);s.moves++;s.emptyDraws=0;
 s.activeSuit=ocRank(c)===7?pickedSuit:ocIsJoker(c)?s.activeSuit:ocSuit(c);
 const power=ocAttack(c);if(power){s.debt+=power;s.attack=power}else{s.attack=0}
 if(ocRank(c)===12)s.dir*=-1; // Q reverses direction
 const final=hand.length===0;
 if(final){ocFinish(s,p);return true}
 if(p===0&&hand.length===1&&!declare){const amount=ocDraw(s,p,2);ocPush(s,`원카드 선언을 놓쳐 벌칙 ${amount}장!`)}
 else if(hand.length===1)ocPush(s,`${ocName(p)} · 원카드!`);
 else ocPush(s,`${ocName(p)} · ${ocCardText(c)}${ocRank(c)===7?' · '+OC_NAMES[pickedSuit]+' 선택':''}`);
 if(ocRank(c)===11)ocNext(s,p,2); // J skips next player
 else if(ocRank(c)===13)s.turn=p; // K grants another turn
 else ocNext(s,p,1);
 s.called=false;
 return true;
}
function ocTake(s,p){
 if(s.phase!=='playing'||s.turn!==p)return 0;
 const n=s.debt||1,got=ocDraw(s,p,n);s.debt=0;s.attack=0;s.called=false;s.moves++;
 if(!got)s.emptyDraws++;else s.emptyDraws=0;
 ocPush(s,`${ocName(p)} · ${got}장 가져감${n>1?' (공격 받음)':''}`);ocNext(s,p);
 if(s.emptyDraws>=9||s.moves>=500){s.phase='finished';s.winner=-1;ocPush(s,'무승부 · 새로운 게임을 시작해 주세요.')}
 return got;
}
function ocChooseSuit(s,p){const counts=[0,1,2,3].map(i=>s.hands[p].filter(c=>ocSuit(c)===i).length);let m=Math.max(...counts);return counts.findIndex(x=>x===m)}
function ocCpuChoice(s,p){const opts=ocOptions(s,p);if(!opts.length)return null;
 if(s.mode==='easy')return opts[exRand(opts.length)];
 const hand=s.hands[p],left=s.hands[0].length,other=s.hands[ocStep(p)].length;
 const rated=opts.map(c=>{
   const rest=hand.filter(x=>x!==c),same=rest.filter(x=>ocSuit(x)===ocSuit(c)).length;
   let v=same*.75+(s.mode==='hard'?ocAttack(c)*.38:ocAttack(c)*.15);
   if(ocRank(c)===7)v+=rest.length?1.2:0;
   if(ocRank(c)===11||ocRank(c)===13)v+=other<=2?5:1.2;
   if(ocRank(c)===12)v+=1;
   if(ocIsJoker(c))v-=left>3?2:0;
   if(s.debt)v+=ocAttack(c)*3;
   if(rest.length===0)v+=100;
   if(s.mode==='hard'){const nextHand=s.hands[ocStep(p)];if(nextHand.length<=2&&(ocAttack(c)>0||ocRank(c)===11))v+=8;v+=(rest.filter(x=>ocSuit(x)===ocSuit(c)).length)*.4;}
   return {c,v:v+Math.random()*.25};
 });rated.sort((a,b)=>b.v-a.v);return rated[0].c;
}
function ocCpuTurn(){
 ocTimer=0;
 if(!ocState||gameShell.id!=='onecard'||gameShell.paused||ocState.phase!=='playing'||ocState.turn===0)return;
 const s=ocState,p=s.turn,c=ocCpuChoice(s,p);
 if(c===null){ocTake(s,p)}else{const selected=ocRank(c)===7?ocChooseSuit(s,p):undefined;ocPlay(s,p,c,selected,true)}
 ocSave();ocRender();if(s.phase==='playing'&&s.turn!==0)ocSchedule();
}
function ocSchedule(){if(ocTimer)clearTimeout(ocTimer);ocTimer=setTimeout(ocCpuTurn,520)}
function ocRecordRound(){ocSave();ocRender();if(ocState?.phase==='playing'&&ocState.turn!==0)ocSchedule()}
function ocCard(c,options={}){
 const joker=ocIsJoker(c),s=ocSuit(c),r=ocRank(c),name=ocCardText(c),red=joker?c===53:s===1||s===2;
 return `<span class="oc-card ${joker?'oc-joker':''} ${red?'oc-red':''}"><span class="oc-corner">${joker?'★':RANKS[r-2]}<small>${joker?'':OC_SUITS[s]}</small></span><span class="oc-glyph">${joker?(c===53?'✦':'✧'):OC_SUITS[s]}</span><span class="oc-foot">${joker?(c===53?'COLOR':'BLACK'):RANKS[r-2]}</span></span>`;
}
function ocRender(){
 if(!ocRoot||!ocState)return;
 const s=ocState,turn=s.turn===0?'내 차례':`컴퓨터 ${s.turn} 차례`,top=s.discard.at(-1),st=ocStat();
 ocRoot.querySelector('#ocStatus').textContent=s.phase==='finished'?(s.winner===0?'승리!':s.winner<0?'무승부':`${ocName(s.winner)} 승리`):turn;
 ocRoot.querySelector('#ocMessage').textContent=s.message;
 ocRoot.querySelector('#ocTop').innerHTML=ocCard(top);
 ocRoot.querySelector('#ocSuit').textContent=OC_SUITS[s.activeSuit];
 ocRoot.querySelector('#ocAttack').hidden=!s.debt;
 ocRoot.querySelector('#ocAttackNum').textContent=s.debt;
 ocRoot.querySelector('#ocDeckCount').textContent=String(s.deck.length);
 ocRoot.querySelector('#ocDirection').textContent=s.dir===1?'↻ 시계 방향':'↺ 반시계 방향';
 ocRoot.querySelector('#ocHand').innerHTML=s.hands[0].map((c,i)=>`<button type="button" class="oc-card-button ${ocLegal(s,0,c)?'oc-playable':''}" data-oc-card="${i}" ${s.phase!=='playing'||s.turn!==0||gameShell.paused||!ocLegal(s,0,c)?'disabled':''} aria-label="${ocCardText(c)}${ocLegal(s,0,c)?', 낼 수 있는 카드':', 지금 낼 수 없음'}">${ocCard(c)}</button>`).join('');
 for(const p of [1,2]){
  const box=ocRoot.querySelector(`#ocBot${p}`);const n=s.hands[p].length;
  box.querySelector('.oc-bot-count').textContent=n+'장';box.classList.toggle('oc-active',s.turn===p&&s.phase==='playing');box.classList.toggle('oc-winner',s.winner===p);
  box.querySelector('.oc-bot-fan').innerHTML=Array.from({length:Math.min(n,7)},()=>'<i></i>').join('');
 }
 ocRoot.querySelector('#ocDraw').textContent=s.debt>0?`공격 받기 · ${s.debt}장`:'카드 1장 뽑고 턴 넘기기';
 ocRoot.querySelector('#ocDraw').disabled=s.phase!=='playing'||s.turn!==0||gameShell.paused;
 const canCall=s.phase==='playing'&&s.turn===0&&s.hands[0].length===2;
 const call=ocRoot.querySelector('#ocCall');call.disabled=!canCall||gameShell.paused;call.classList.toggle('oc-declared',!!s.called);call.textContent=s.called?'✓ 원카드 선언 완료':'원카드! 선언';
 ocRoot.querySelector('#ocPickSuit').hidden=ocPendingWild<0;
 const result=ocRoot.querySelector('#ocFinish');result.hidden=s.phase!=='finished';
 if(s.phase==='finished')result.innerHTML=`<div class="oc-finish-badge">${s.winner===0?'WINNER':s.winner<0?'DRAW':'ROUND OVER'}</div><h4>${s.winner===0?'이번 판 승리!':s.winner<0?'무승부':'다음 판에 다시 도전!'}</h4><p>${s.message}</p><button type="button" id="ocNextRound">↻ 다시 플레이</button>`;
 ocRoot.querySelector('#ocLogs').innerHTML=s.logs.slice(0,4).map(x=>`<li>${x.replaceAll('<','&lt;').replaceAll('>','&gt;')}</li>`).join('');
 ocRoot.querySelector('#ocAnnounce').textContent=s.message;
 exStats([['현재 상황',s.phase==='playing'?turn:'라운드 종료'],['누적 승리',st.wins],['최고 연승',st.best],['공격 누적',s.debt]]);
}
function ocNewRound(mode){clearTimeout(ocTimer);ocTimer=0;ocPendingWild=-1;ocState=ocMake(mode);ocRecordRound()}
function ocHumanCard(i){
 const s=ocState;if(!s||s.turn!==0||s.phase!=='playing'||gameShell.paused)return;
 const c=s.hands[0][i];if(!ocLegal(s,0,c))return;
 if(ocRank(c)===7){ocPendingWild=i;ocRender();return}
 ocPlay(s,0,c,undefined,s.called);ocPendingWild=-1;ocRecordRound();
}
function ocHumanSuit(i){if(ocPendingWild<0)return;const c=ocState.hands[0][ocPendingWild];if(c===undefined)return;ocPlay(ocState,0,c,i,ocState.called);ocPendingWild=-1;ocRecordRound()}
const onecardModule={
 markup:()=>`<div class="oc-premium" id="ocGame">
  <div class="oc-heading"><div><span class="oc-kicker">PAUSE CARDS · PREMIUM</span><strong>ONE CARD <span class="oc-spark">✦</span></strong></div><label class="oc-select">난이도 <select id="ocDifficulty"><option value="easy">쉬움</option><option value="normal">보통</option><option value="hard">어려움</option></select></label></div>
  <div class="oc-table">
   <div class="oc-bots"><div id="ocBot1" class="oc-bot"><div class="oc-avatar">A</div><div class="oc-bot-info"><b>컴퓨터 A</b><span class="oc-bot-count">7장</span></div><div class="oc-bot-fan"></div></div><div id="ocBot2" class="oc-bot"><div class="oc-avatar">B</div><div class="oc-bot-info"><b>컴퓨터 B</b><span class="oc-bot-count">7장</span></div><div class="oc-bot-fan"></div></div></div>
   <div class="oc-pile-zone"><div class="oc-pile-col"><div class="oc-card oc-card-back"><span>PAUSE</span><strong>Ⅱ</strong></div><span class="oc-mini">남은 카드 <b id="ocDeckCount">31</b></span></div><div class="oc-pile-col"><div id="ocTop"></div><span class="oc-mini">현재 무늬 <b id="ocSuit">♠</b></span></div></div>
   <div class="oc-round-meta"><span id="ocDirection">↻ 시계 방향</span><span id="ocAttack" class="oc-debt" hidden>⚡ 공격 <b id="ocAttackNum">0</b>장</span></div>
   <div class="oc-turn-status"><b id="ocStatus">내 차례</b><span id="ocMessage">같은 무늬나 숫자를 내세요.</span></div>
  </div>
  <div class="oc-hand-label"><b>내 카드 <span class="oc-small-caption">· 빛나는 카드 선택</span></b><button type="button" id="ocCall">원카드! 선언</button></div>
  <div class="oc-hand-scroller"><div class="oc-hand" id="ocHand" aria-label="내 카드 목록"></div></div>
  <div id="ocPickSuit" class="oc-suit-picker" hidden><span>7 카드를 냈어요. 무늬를 선택하세요.</span><div>${OC_SUITS.map((s,i)=>`<button type="button" data-oc-suit="${i}" aria-label="${OC_NAMES[i]}">${s}</button>`).join('')}</div><button type="button" id="ocCancelSuit">취소</button></div>
  <button type="button" class="oc-draw" id="ocDraw">카드 1장 뽑고 턴 넘기기</button>
  <div class="oc-help"><details><summary>PAUSE 원카드 규칙 보기</summary><p>같은 무늬 또는 숫자를 내면 돼요. 7은 무늬 변경, J는 한 명 건너뛰기, Q는 방향 반전, K는 한 번 더 내기예요. 2는 +2, A는 +3, 검정 조커는 +5, 컬러 조커는 +7 공격이에요. 공격을 받으면 같은 단계 이상의 공격 카드로 막거나 누적된 장수를 받아야 해요. 카드가 두 장 남았을 때 ‘원카드!’를 선언하지 않고 내서 한 장이 남으면 벌칙 2장입니다. 모든 카드를 먼저 내면 승리해요.</p></details></div>
  <div class="oc-logs"><b>최근 플레이</b><ol id="ocLogs"></ol></div><div id="ocFinish" class="oc-result" hidden></div><span id="ocAnnounce" class="oc-sr" role="status" aria-live="polite"></span>
 </div>`,
 help:'PAUSE 표준 원카드: 컴퓨터 2명, 54장(조커 포함). 2/A/조커 공격 누적, 7 무늬 지정, J 건너뛰기, Q 방향 반전, K 추가 턴. 현금·베팅 없음.',
 mount(){ocRoot=document.querySelector('#ocGame');const prev=playStore.read(OC_SAVE,null);ocState=ocValid(prev)?prev:ocMake();ocPendingWild=-1;
  ocRoot.querySelector('#ocDifficulty').value=ocState.mode;
  const click=e=>{const btn=e.target.closest('button');if(!btn)return;
   if(btn.dataset.ocCard!==undefined){ocHumanCard(Number(btn.dataset.ocCard));return}
   if(btn.dataset.ocSuit!==undefined){ocHumanSuit(Number(btn.dataset.ocSuit));return}
   if(btn.id==='ocCancelSuit'){ocPendingWild=-1;ocRender();return}
   if(btn.id==='ocCall'&&ocState.hands[0].length===2&&ocState.turn===0&&!gameShell.paused){ocState.called=!ocState.called;ocPush(ocState,ocState.called?'원카드 선언! 다음 카드로 한 장 남겨보세요.':'원카드 선언 취소');ocSave();ocRender();return}
   if(btn.id==='ocDraw'&&ocState.turn===0&&!gameShell.paused&&ocState.phase==='playing'){ocPendingWild=-1;ocTake(ocState,0);ocRecordRound();return}
   if(btn.id==='ocNextRound'&&ocState.phase==='finished'){ocNewRound(ocState.mode)}
  };
  const change=e=>{if(e.target.id==='ocDifficulty'){const mode=e.target.value;const msg=`난이도 ${OC_MODES[mode]}로 변경하려면 새 판을 시작합니다.`;if(window.confirm(msg))ocNewRound(mode);else e.target.value=ocState.mode}};
  ocRoot.addEventListener('click',click);ocRoot.addEventListener('change',change);
  ocSave();ocRender();if(ocState.turn!==0&&ocState.phase==='playing')ocSchedule();
  return {pause(){clearTimeout(ocTimer);ocTimer=0;ocSave();ocRender()},resume(){ocRender();if(ocState.turn!==0&&ocState.phase==='playing')ocSchedule()},reset(){ocNewRound(ocState?.mode||'normal');hideMask()},dispose(){clearTimeout(ocTimer);ocTimer=0;ocSave();ocRoot?.removeEventListener('click',click);ocRoot?.removeEventListener('change',change);ocRoot=null}}
 }
};
