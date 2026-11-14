/* PAUSE Poker Premium — five-card draw, local practice chips only.
 * Both actors receive hidden hands from the same shuffled 52-card deck.
 * Strategy never reads the opponent's cards. No purchases, transfers, withdrawals or cash-out.
 */
const PK_SAVE='poker-premium-v1', PK_RECORD='poker-premium-record';
const PK_DIFFICULTY={easy:'쉬움',normal:'보통',hard:'어려움'};
const PK_CATEGORIES=['하이 카드','원 페어','투 페어','트리플','스트레이트','플러시','풀하우스','포카드','스트레이트 플러시'];
const PK_UNIT={bet1:20,bet2:40};
let pkS=null,pkRoot=null;
const pkMsg=(s,msg)=>{s.message=msg;s.log=[msg,...(s.log||[])].slice(0,4)};
function pkEval(hand){
  if(!Array.isArray(hand)||hand.length!==5)throw Error('Five cards required');
  const vals=hand.map(rank).sort((a,b)=>b-a),counts=new Map();vals.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
  const distinct=[...new Set(vals)],fl=hand.every(c=>suit(c)===suit(hand[0]));
  const straight=distinct.length===5 ? (distinct[0]-distinct[4]===4?distinct[0]:(distinct.join(',')==='14,5,4,3,2'?5:0)) : 0;
  const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  let category,kickers;
  if(fl&&straight){category=8;kickers=[straight]}
  else if(groups[0][1]===4){category=7;kickers=[groups[0][0],groups[1][0]]}
  else if(groups[0][1]===3&&groups[1][1]===2){category=6;kickers=[groups[0][0],groups[1][0]]}
  else if(fl){category=5;kickers=vals}
  else if(straight){category=4;kickers=[straight]}
  else if(groups[0][1]===3){category=3;kickers=[groups[0][0],...groups.slice(1).map(g=>g[0]).sort((a,b)=>b-a)]}
  else if(groups[0][1]===2&&groups[1][1]===2){category=2;kickers=[Math.max(groups[0][0],groups[1][0]),Math.min(groups[0][0],groups[1][0]),groups[2][0]]}
  else if(groups[0][1]===2){category=1;kickers=[groups[0][0],...groups.slice(1).map(g=>g[0]).sort((a,b)=>b-a)]}
  else {category=0;kickers=vals}
  return {category,kickers,name:category===8&&straight===14?'로열 플러시':PK_CATEGORIES[category]};
}
function pkCompare(a,b){const x=pkEval(a),y=pkEval(b);if(x.category!==y.category)return Math.sign(x.category-y.category);for(let i=0;i<Math.max(x.kickers.length,y.kickers.length);i++){if((x.kickers[i]||0)!==(y.kickers[i]||0))return Math.sign((x.kickers[i]||0)-(y.kickers[i]||0))}return 0}
function pkRecord(){return playStore.read(PK_RECORD,{wins:0,losses:0,ties:0,played:0,streak:0,best:0})}
function pkNew(mode='normal',previous=null){
  const deck=newDeck(),hand=deck.splice(0,5),cpu=deck.splice(0,5);
  const stacks=previous?.stacks?.slice()||[1000,1000],note=[];
  for(let i=0;i<2;i++)if(stacks[i]<80){stacks[i]=1000;note.push(i===0?'내 연습칩':'컴퓨터 연습칩')}
  // Each hand starts with equal 10-chip antes. Only virtual free practice chips.
  stacks[0]-=10;stacks[1]-=10;
  const s={v:1,mode,deck,hand,cpu,muck:[],selected:[],stacks,pot:20,street:[0,0],actor:0,raises:0,acted:[false,false],phase:'bet1',handNo:(previous?.handNo||0)+1,message:'첫 베팅: 체크하거나 20칩을 베팅하세요.',log:[],result:null,cpuChanged:0};
  if(note.length)pkMsg(s,`${note.join('·')}을 무료로 1,000개 보충했어요.`);
  return s;
}
function pkValid(s){
 if(!s||s.v!==1||!PK_DIFFICULTY[s.mode]||!['bet1','draw','bet2','result'].includes(s.phase))return false;
 if(!Array.isArray(s.hand)||s.hand.length!==5||!Array.isArray(s.cpu)||s.cpu.length!==5||!Array.isArray(s.deck)||!Array.isArray(s.muck)||!Array.isArray(s.selected)||!Array.isArray(s.stacks)||s.stacks.length!==2||!Array.isArray(s.street)||s.street.length!==2||!Array.isArray(s.acted)||s.acted.length!==2)return false;
 const cards=[...s.hand,...s.cpu,...s.deck,...s.muck];
 return cards.length===52&&cards.every(c=>Number.isInteger(c)&&c>=0&&c<52)&&new Set(cards).size===52&&s.stacks.every(n=>Number.isInteger(n)&&n>=0)&&s.street.every(n=>Number.isInteger(n)&&n>=0)&&Number.isInteger(s.pot)&&s.pot>=0&&[0,1].includes(s.actor)&&Number.isInteger(s.raises)&&s.raises>=0&&s.raises<=1&&s.selected.every(i=>Number.isInteger(i)&&i>=0&&i<5)&&new Set(s.selected).size===s.selected.length;
}
function pkSave(){if(pkValid(pkS))playStore.write(PK_SAVE,pkS)}
function pkPay(s,who,amount){if(!Number.isInteger(amount)||amount<0||s.stacks[who]<amount)return false;s.stacks[who]-=amount;s.street[who]+=amount;s.pot+=amount;return true}
function pkAward(s,winner,description){
 if(winner===-1){const a=Math.floor(s.pot/2);s.stacks[0]+=a;s.stacks[1]+=s.pot-a;}
 else s.stacks[winner]+=s.pot;
 const rec=pkRecord();rec.played++;
 if(winner===0){rec.wins++;rec.streak++;rec.best=Math.max(rec.best,rec.streak);playStore.putNumber('pokerWins',rec.wins)}
 else if(winner===1){rec.losses++;rec.streak=0}else{rec.ties++;rec.streak=0}
 playStore.write(PK_RECORD,rec);
 s.result={winner,description,player:pkEval(s.hand).name,cpu:pkEval(s.cpu).name,pot:s.pot};
 s.phase='result';s.actor=0;pkMsg(s,description);return s;
}
function pkFinishStreet(s){
 if(s.phase==='bet1'){s.phase='draw';s.selected=[];pkMsg(s,'카드를 눌러 교환할 카드를 선택하세요. 유지할 카드는 선택하지 마세요.')}
 else if(s.phase==='bet2'){const cmp=pkCompare(s.hand,s.cpu);pkAward(s,cmp>0?0:cmp<0?1:-1,cmp>0?'내 승리!':cmp<0?'컴퓨터 승리':'무승부 · 팟을 나눴어요.')}
}
function pkOptions(s){
 if(!['bet1','bet2'].includes(s.phase)||s.actor!==0)return [];
 const owed=Math.max(...s.street)-s.street[0],unit=PK_UNIT[s.phase],opts=[];
 if(owed===0){opts.push('check');if(s.stacks[0]>=unit&&s.stacks[1]>=unit&&Math.max(...s.street)===0)opts.push('bet')}
 else{opts.push('fold');if(s.stacks[0]>=owed)opts.push('call');if(s.raises<1&&s.stacks[0]>=owed+unit&&s.stacks[1]>=unit)opts.push('raise')}
 return opts;
}
function pkAct(s,who,action){
 if(!['bet1','bet2'].includes(s.phase)||s.actor!==who)return false;
 const opp=1-who,owed=Math.max(...s.street)-s.street[who],unit=PK_UNIT[s.phase];
 if(action==='fold'&&owed>0){pkAward(s,opp,who===0?'폴드 · 컴퓨터가 팟을 가져갔어요.':'컴퓨터 폴드 · 내가 팟을 획득했어요.');return true}
 if(action==='check'&&owed===0){s.acted[who]=true;pkMsg(s,who===0?'체크했어요.':'컴퓨터 체크');}
 else if(action==='bet'&&owed===0&&Math.max(...s.street)===0&&s.stacks[opp]>=unit&&pkPay(s,who,unit)){s.acted=[false,false];s.acted[who]=true;pkMsg(s,who===0?`베팅 ${unit}`:`컴퓨터 베팅 ${unit}`)}
 else if(action==='call'&&owed>0&&pkPay(s,who,owed)){s.acted[who]=true;pkMsg(s,who===0?`${owed}칩 콜`:`컴퓨터 ${owed}칩 콜`)}
 else if(action==='raise'&&owed>0&&s.raises<1&&s.stacks[opp]>=unit&&pkPay(s,who,owed+unit)){s.raises++;s.acted=[false,false];s.acted[who]=true;pkMsg(s,who===0?`${owed+unit}칩 레이즈`:`컴퓨터 ${owed+unit}칩 레이즈`)}
 else return false;
 if(s.acted.every(Boolean)&&s.street[0]===s.street[1])pkFinishStreet(s);
 else s.actor=opp;
 if(s.phase==='draw'||s.phase==='result')s.actor=0;
 return true;
}
// This heuristic sees only CPU hand, bets and public actions; not the human's hidden cards.
function pkCpuAction(s){
 const ev=pkEval(s.cpu),owed=Math.max(...s.street)-s.street[1],unit=PK_UNIT[s.phase];
 const score=ev.category*1.4+ev.kickers[0]/25;const m=s.mode;
 const risk=m==='hard'?0.20:m==='normal'?0.08:0.02;
 if(owed>0){
  if(s.stacks[1]<owed)return 'fold';
  if(score<1.15&&Math.random()<(m==='easy'?.26:m==='normal'?.58:.75))return 'fold';
  if(s.raises===0&&s.stacks[1]>=owed+unit&&s.stacks[0]>=unit&&score>=3&&Math.random()<(m==='hard'?.35:.15))return 'raise';
  return 'call';
 }
 if(Math.max(...s.street)===0&&s.stacks[1]>=unit&&s.stacks[0]>=unit&&(score>1.45&&Math.random()<.72||Math.random()<risk))return 'bet';
 return 'check';
}
function pkDriveCpu(s){let steps=0;while(s.actor===1&&['bet1','bet2'].includes(s.phase)&&steps++<4){const act=pkCpuAction(s);if(!pkAct(s,1,act))throw Error('CPU invalid action '+act)}return s}
function pkDiscardChoice(cards){
 const e=pkEval(cards);if(e.category>=4)return [];
 const groups={};cards.forEach(c=>groups[rank(c)]=(groups[rank(c)]||0)+1);
 if(e.category>=1)return cards.flatMap((c,i)=>groups[rank(c)]===1?[i]:[]).slice(0,3);
 const suits={};cards.forEach(c=>suits[suit(c)]=(suits[suit(c)]||0)+1);
 const fourSuit=Object.entries(suits).find(([,n])=>n===4);if(fourSuit)return cards.flatMap((c,i)=>suit(c)===Number(fourSuit[0])?[]:[i]);
 const vals=cards.map(rank);for(let start=1;start<=10;start++){const seq=start===1?[14,2,3,4,5]:[start,start+1,start+2,start+3,start+4];const matched=cards.flatMap((c,i)=>seq.includes(rank(c))?[i]:[]);if(matched.length===4)return cards.map((_,i)=>i).filter(i=>!matched.includes(i))}
 const good=cards.map((c,i)=>({c,i})).sort((a,b)=>rank(b.c)-rank(a.c));
 return good.slice(2).map(x=>x.i); // Prefer two high cards over random replacement.
}
function pkExchange(s){
 if(s.phase!=='draw')return false;
 for(const i of s.selected.slice().sort((a,b)=>a-b)){const next=s.deck.shift();if(next===undefined)return false;s.muck.push(s.hand[i]);s.hand[i]=next}
 const aiDiscard=pkDiscardChoice(s.cpu);for(const i of aiDiscard){const next=s.deck.shift();if(next===undefined)break;s.muck.push(s.cpu[i]);s.cpu[i]=next}
 s.cpuChanged=aiDiscard.length;s.phase='bet2';s.street=[0,0];s.acted=[false,false];s.raises=0;s.actor=0;pkMsg(s,`내 카드 ${s.selected.length}장 · 컴퓨터 ${aiDiscard.length}장 교환. 최종 베팅!`);s.selected=[];return true;
}
function pkCard(c,back=false){if(back)return '<span class="pk-card back" aria-label="뒷면 카드"><em>PAUSE</em><b>✦</b></span>';return `<span class="pk-card ${[1,2].includes(suit(c))?'red':''}"><span class="pk-card-corner">${RANKS[rank(c)-2]}<small>${SUITS[suit(c)]}</small></span><span class="pk-card-center">${SUITS[suit(c)]}</span><span class="pk-card-foot">${RANKS[rank(c)-2]}</span></span>`}
function pkMarkup(){return `<section class="pk-premium" id="pkGame" aria-label="포커 게임">
  <div class="pk-heading"><span class="pk-kicker">PAUSE · CARD STUDIO / 09</span><strong>FIVE CARD <i>DRAW</i></strong><span>한 번의 교환, 두 번의 베팅. 나만의 승부.</span></div>
  <div class="pk-toolbar"><label>난이도 <select id="pkMode"><option value="easy">쉬움</option><option value="normal">보통</option><option value="hard">어려움</option></select></label><span id="pkRound">ROUND 01</span><span class="pk-no-money">무료 연습칩 · 현금 사용 없음</span></div>
  <div class="pk-table">
    <div class="pk-opponent"><div class="pk-avatar">AI</div><div><b id="pkCpuName">컴퓨터</b><small id="pkCpuMoney"></small></div><span id="pkCpuStatus">대기</span></div>
    <div class="pk-cpu-hand" id="pkCpu" aria-label="상대 카드"></div>
    <div class="pk-center"><div class="pk-pot"><small>현재 팟</small><strong id="pkPot">20</strong><span>CHIPS</span></div><div class="pk-chip-stack" aria-hidden="true"><i></i><i></i><i></i></div></div>
    <div class="pk-my-status"><b>내 카드</b><small id="pkMyMoney"></small><span id="pkHandName">-</span></div>
    <div class="pk-my-hand" id="pkHand" aria-label="내 카드"></div>
  </div>
  <div class="pk-turn-info"><span id="pkPhase" class="pk-phase-pill">1차 베팅</span><span id="pkMessage" role="status" aria-live="polite"></span></div>
  <div class="pk-controls" id="pkControls"></div>
  <div class="pk-result" id="pkResult" hidden></div>
  <details class="pk-help"><summary>규칙과 족보 보기</summary><p>52장 · 조커 없음 · 각자 5장 · 1차 베팅 → 최대 5장 교환 → 2차 베팅 → 패 공개. 베팅은 20/40 연습칩, 각 베팅 단계에서 레이즈는 1회만 허용해요. 동일 족보는 높은 숫자와 키커로 결정하고 무늬의 우열은 없어요. 칩은 무료로 보충되며 구매·환전·온라인 대결은 없어요.</p><p>족보: 로열/스트레이트 플러시 · 포카드 · 풀하우스 · 플러시 · 스트레이트 · 트리플 · 투페어 · 원페어 · 하이카드</p></details>
 </section>`}
function pkDraw(){
 if(!pkRoot||!pkS)return;
 const s=pkS;pkRoot.querySelector('#pkMode').value=s.mode;
 pkRoot.querySelector('#pkRound').textContent=`ROUND ${String(s.handNo).padStart(2,'0')}`;
 pkRoot.querySelector('#pkCpuName').textContent=({easy:'ROOKIE',normal:'ACE',hard:'SHARK'})[s.mode]+' · CPU';
 pkRoot.querySelector('#pkCpuMoney').textContent=`${s.stacks[1].toLocaleString()}칩`;
 pkRoot.querySelector('#pkMyMoney').textContent=`${s.stacks[0].toLocaleString()}칩`;
 pkRoot.querySelector('#pkPot').textContent=s.pot.toLocaleString();
 const isResult=s.phase==='result';const isDraw=s.phase==='draw';
 pkRoot.querySelector('#pkCpu').innerHTML=s.cpu.map(c=>pkCard(c,!isResult)).join('');
 pkRoot.querySelector('#pkHand').innerHTML=s.hand.map((c,i)=>`<button data-pk-card="${i}" class="pk-card-button ${s.selected.includes(i)?'chosen':''}" ${!isDraw||gameShell.paused?'disabled':''} aria-pressed="${s.selected.includes(i)}" aria-label="${face(c)} ${s.selected.includes(i)?'교환 선택됨':'교환 선택'}">${pkCard(c)}</button>`).join('');
 pkRoot.querySelector('#pkHandName').textContent=pkEval(s.hand).name;
 pkRoot.querySelector('#pkPhase').textContent=({bet1:'1차 베팅',draw:'카드 교환',bet2:'최종 베팅',result:'결과 확인'})[s.phase];
 pkRoot.querySelector('#pkMessage').textContent=s.message;
 pkRoot.querySelector('#pkCpuStatus').textContent=isResult?pkEval(s.cpu).name:isDraw?'교환 대기':(s.actor===0?'내 차례':'상대 차례');
 let buttons='';
 if(['bet1','bet2'].includes(s.phase)){
  const owed=Math.max(...s.street)-s.street[0],unit=PK_UNIT[s.phase],opts=pkOptions(s);
  const names={check:'체크',bet:`베팅 ${unit}`,fold:'폴드',call:`콜 ${owed}`,raise:`레이즈 +${unit}`};
  buttons=opts.map(a=>`<button data-pk-action="${a}" class="pk-action ${a==='bet'||a==='call'?'primary':''} ${a==='fold'?'negative':''}">${names[a]}</button>`).join('');
 }else if(isDraw)buttons=`<button class="pk-action secondary" data-pk-action="clear">선택 해제</button><button class="pk-action primary" data-pk-action="exchange">${s.selected.length?'선택한 '+s.selected.length+'장 교환':'전부 유지하기'}</button>`;
 else buttons='<button class="pk-action primary" data-pk-action="next">다음 라운드 →</button>';
 pkRoot.querySelector('#pkControls').innerHTML=buttons;
 const result=pkRoot.querySelector('#pkResult');result.hidden=!isResult;
 if(isResult&&s.result)result.innerHTML=`<span class="pk-result-tag">SHOWDOWN</span><strong>${s.result.description}</strong><p>내 패 ${s.result.player} / 상대 패 ${s.result.cpu}</p>`;
 const rec=pkRecord();exStats([['전적',`${rec.wins}승 · ${rec.losses}패`],['승률',`${rec.played?Math.round(rec.wins/rec.played*100):0}%`],['최고 연승',rec.best],['내 연습칩',s.stacks[0].toLocaleString()]]);
}
function pkUserAction(action){
 if(!pkS||gameShell.paused)return;
 if(pkS.phase==='result'&&action==='next'){pkS=pkNew(pkS.mode,pkS);pkSave();pkDraw();return}
 if(pkS.phase==='draw'){
  if(action==='clear'){pkS.selected=[];pkSave();pkDraw();return}
  if(action==='exchange'&&pkExchange(pkS)){pkSave();pkDraw();return}
 }
 if(['bet1','bet2'].includes(pkS.phase)&&pkOptions(pkS).includes(action)&&pkAct(pkS,0,action)){
  if(pkS.phase!=='result')pkDriveCpu(pkS);pkSave();pkDraw();
 }
}
const pokerModule={markup:pkMarkup,help:'정통 5장 드로우! 체크·베팅·콜·폴드·레이즈와 카드 교환을 이용해 CPU를 이겨 보세요. 실제 돈 사용 없음.',mount(){
 pkRoot=document.querySelector('#pkGame');const saved=playStore.read(PK_SAVE,null);pkS=pkValid(saved)?saved:pkNew();pkSave();
 const click=e=>{const btn=e.target.closest('[data-pk-card]');if(btn&&pkS.phase==='draw'&&!gameShell.paused){const index=Number(btn.dataset.pkCard);pkS.selected=pkS.selected.includes(index)?pkS.selected.filter(v=>v!==index):[...pkS.selected,index];pkSave();pkDraw();return}const action=e.target.closest('[data-pk-action]');if(action)pkUserAction(action.dataset.pkAction)};
 const change=e=>{if(e.target.id!=='pkMode'||!PK_DIFFICULTY[e.target.value]||e.target.value===pkS.mode)return;const mode=e.target.value;if(pkS.phase!=='result'&&!window.confirm('현재 진행 중인 판을 종료하고 새 난이도로 시작할까요?')){e.target.value=pkS.mode;return}pkS=pkNew(mode,pkS);pkSave();pkDraw()};
 const keydown=e=>{if(!gameShell.paused&&gameShell.id==='poker'&&pkS.phase==='draw'&&/^[1-5]$/.test(e.key)&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();const index=Number(e.key)-1;pkS.selected=pkS.selected.includes(index)?pkS.selected.filter(i=>i!==index):[...pkS.selected,index];pkSave();pkDraw()}};
 pkRoot.addEventListener('click',click);pkRoot.addEventListener('change',change);document.addEventListener('keydown',keydown);pkDraw();return{pause(){pkSave()},resume(){},reset(){pkS=pkNew(pkS.mode,pkS);pkSave();pkDraw();hideMask()},dispose(){pkRoot.removeEventListener('click',click);pkRoot.removeEventListener('change',change);document.removeEventListener('keydown',keydown);pkSave();pkRoot=null}};
}};
