/* PAUSE Traffic Escape Premium — algorithmic, solver-verified on-demand stages.
   Seed boards are independently generated templates, never copied puzzle cards.
   All accepted instances are checked with an optimal-move breadth-first search. */
const TRAFFIC_SEEDS=[{"level":1,"optimal":2,"cars":[{"axis":"h","fixed":2,"len":2,"pos":1,"kind":"ice","id":"ice"},{"axis":"v","fixed":5,"len":3,"pos":2,"id":"car1"},{"axis":"h","fixed":3,"len":2,"pos":2,"id":"car2"},{"axis":"h","fixed":5,"len":2,"pos":3,"id":"car3"},{"axis":"v","fixed":0,"len":3,"pos":2,"id":"car4"},{"axis":"h","fixed":4,"len":2,"pos":3,"id":"car5"}]},{"level":2,"optimal":2,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":2,"id":"car1"},{"axis":"h","fixed":4,"len":2,"pos":2,"id":"car2"},{"axis":"v","fixed":0,"len":2,"pos":4,"id":"car3"},{"axis":"h","fixed":1,"len":2,"pos":2,"id":"car4"},{"axis":"v","fixed":1,"len":2,"pos":2,"id":"car5"},{"axis":"h","fixed":1,"len":2,"pos":0,"id":"car6"},{"axis":"h","fixed":1,"len":2,"pos":4,"id":"car7"},{"axis":"h","fixed":0,"len":2,"pos":2,"id":"car8"}]},{"level":3,"optimal":2,"cars":[{"axis":"h","fixed":2,"len":2,"pos":0,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":2,"pos":2,"id":"car1"},{"axis":"h","fixed":4,"len":3,"pos":2,"id":"car2"},{"axis":"v","fixed":1,"len":3,"pos":3,"id":"car3"},{"axis":"h","fixed":1,"len":2,"pos":2,"id":"car4"},{"axis":"h","fixed":5,"len":2,"pos":3,"id":"car5"}]},{"level":4,"optimal":3,"cars":[{"axis":"h","fixed":2,"len":2,"pos":1,"kind":"ice","id":"ice"},{"axis":"v","fixed":3,"len":2,"pos":2,"id":"car1"},{"axis":"h","fixed":1,"len":2,"pos":0,"id":"car2"},{"axis":"v","fixed":4,"len":2,"pos":1,"id":"car3"},{"axis":"h","fixed":5,"len":2,"pos":0,"id":"car4"},{"axis":"h","fixed":0,"len":2,"pos":0,"id":"car5"},{"axis":"v","fixed":5,"len":2,"pos":4,"id":"car6"},{"axis":"v","fixed":3,"len":2,"pos":0,"id":"car7"},{"axis":"v","fixed":2,"len":2,"pos":0,"id":"car8"},{"axis":"v","fixed":2,"len":3,"pos":3,"id":"car9"},{"axis":"h","fixed":3,"len":2,"pos":0,"id":"car10"},{"axis":"h","fixed":0,"len":2,"pos":4,"id":"car11"}]},{"level":5,"optimal":3,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":5,"len":2,"pos":1,"id":"car1"},{"axis":"h","fixed":3,"len":2,"pos":3,"id":"car2"},{"axis":"h","fixed":4,"len":2,"pos":1,"id":"car3"},{"axis":"h","fixed":1,"len":2,"pos":1,"id":"car4"},{"axis":"h","fixed":4,"len":2,"pos":3,"id":"car5"},{"axis":"v","fixed":4,"len":2,"pos":1,"id":"car6"},{"axis":"v","fixed":3,"len":2,"pos":0,"id":"car7"},{"axis":"v","fixed":0,"len":3,"pos":3,"id":"car8"},{"axis":"h","fixed":3,"len":2,"pos":1,"id":"car9"},{"axis":"h","fixed":0,"len":2,"pos":1,"id":"car10"},{"axis":"v","fixed":0,"len":2,"pos":1,"id":"car11"}]},{"level":6,"optimal":4,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":1,"id":"car1"},{"axis":"v","fixed":1,"len":2,"pos":4,"id":"car2"},{"axis":"v","fixed":0,"len":2,"pos":2,"id":"car3"},{"axis":"v","fixed":3,"len":2,"pos":0,"id":"car4"},{"axis":"h","fixed":5,"len":2,"pos":3,"id":"car5"},{"axis":"v","fixed":5,"len":2,"pos":0,"id":"car6"},{"axis":"v","fixed":1,"len":2,"pos":0,"id":"car7"},{"axis":"v","fixed":2,"len":2,"pos":4,"id":"car8"},{"axis":"v","fixed":5,"len":2,"pos":4,"id":"car9"}]},{"level":7,"optimal":4,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":2,"pos":1,"id":"car1"},{"axis":"h","fixed":1,"len":2,"pos":0,"id":"car2"},{"axis":"h","fixed":0,"len":2,"pos":4,"id":"car3"},{"axis":"h","fixed":4,"len":2,"pos":1,"id":"car4"},{"axis":"h","fixed":0,"len":2,"pos":2,"id":"car5"},{"axis":"v","fixed":5,"len":2,"pos":3,"id":"car6"},{"axis":"h","fixed":5,"len":3,"pos":2,"id":"car7"},{"axis":"h","fixed":3,"len":2,"pos":0,"id":"car8"},{"axis":"v","fixed":4,"len":2,"pos":3,"id":"car9"},{"axis":"h","fixed":3,"len":2,"pos":2,"id":"car10"}]},{"level":8,"optimal":4,"cars":[{"axis":"h","fixed":2,"len":2,"pos":1,"kind":"ice","id":"ice"},{"axis":"v","fixed":5,"len":3,"pos":0,"id":"car1"},{"axis":"h","fixed":0,"len":2,"pos":1,"id":"car2"},{"axis":"h","fixed":3,"len":2,"pos":3,"id":"car3"},{"axis":"h","fixed":4,"len":2,"pos":1,"id":"car4"},{"axis":"v","fixed":4,"len":3,"pos":0,"id":"car5"}]},{"level":9,"optimal":4,"cars":[{"axis":"h","fixed":2,"len":2,"pos":0,"kind":"ice","id":"ice"},{"axis":"v","fixed":2,"len":2,"pos":2,"id":"car1"},{"axis":"h","fixed":3,"len":2,"pos":4,"id":"car2"},{"axis":"h","fixed":0,"len":3,"pos":3,"id":"car3"},{"axis":"h","fixed":1,"len":2,"pos":3,"id":"car4"},{"axis":"h","fixed":0,"len":2,"pos":1,"id":"car5"},{"axis":"h","fixed":4,"len":2,"pos":2,"id":"car6"},{"axis":"h","fixed":5,"len":2,"pos":0,"id":"car7"},{"axis":"v","fixed":3,"len":2,"pos":2,"id":"car8"}]},{"level":10,"optimal":4,"cars":[{"axis":"h","fixed":2,"len":2,"pos":1,"kind":"ice","id":"ice"},{"axis":"v","fixed":3,"len":3,"pos":2,"id":"car1"},{"axis":"h","fixed":4,"len":2,"pos":0,"id":"car2"},{"axis":"h","fixed":0,"len":2,"pos":3,"id":"car3"},{"axis":"v","fixed":5,"len":3,"pos":2,"id":"car4"},{"axis":"h","fixed":1,"len":2,"pos":0,"id":"car5"},{"axis":"h","fixed":0,"len":2,"pos":0,"id":"car6"},{"axis":"h","fixed":1,"len":2,"pos":3,"id":"car7"},{"axis":"v","fixed":4,"len":2,"pos":2,"id":"car8"}]},{"level":11,"optimal":5,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":0,"id":"car1"},{"axis":"v","fixed":1,"len":2,"pos":3,"id":"car2"},{"axis":"h","fixed":4,"len":2,"pos":2,"id":"car3"},{"axis":"h","fixed":3,"len":2,"pos":3,"id":"car4"},{"axis":"h","fixed":5,"len":2,"pos":1,"id":"car5"},{"axis":"v","fixed":3,"len":2,"pos":0,"id":"car6"},{"axis":"v","fixed":1,"len":2,"pos":1,"id":"car7"},{"axis":"h","fixed":5,"len":2,"pos":4,"id":"car8"},{"axis":"h","fixed":0,"len":2,"pos":0,"id":"car9"}]},{"level":12,"optimal":6,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":0,"id":"car1"},{"axis":"v","fixed":2,"len":2,"pos":0,"id":"car2"},{"axis":"h","fixed":5,"len":2,"pos":1,"id":"car3"},{"axis":"h","fixed":4,"len":2,"pos":1,"id":"car4"},{"axis":"v","fixed":0,"len":2,"pos":4,"id":"car5"},{"axis":"h","fixed":3,"len":2,"pos":0,"id":"car6"},{"axis":"h","fixed":5,"len":2,"pos":4,"id":"car7"}]},{"level":13,"optimal":6,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":5,"len":3,"pos":1,"id":"car1"},{"axis":"v","fixed":2,"len":3,"pos":3,"id":"car2"},{"axis":"v","fixed":0,"len":3,"pos":3,"id":"car3"},{"axis":"h","fixed":4,"len":2,"pos":4,"id":"car4"},{"axis":"h","fixed":0,"len":2,"pos":2,"id":"car5"},{"axis":"v","fixed":3,"len":2,"pos":3,"id":"car6"},{"axis":"v","fixed":1,"len":2,"pos":4,"id":"car7"}]},{"level":14,"optimal":7,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":2,"pos":1,"id":"car1"},{"axis":"v","fixed":0,"len":2,"pos":1,"id":"car2"},{"axis":"h","fixed":0,"len":2,"pos":3,"id":"car3"},{"axis":"v","fixed":2,"len":2,"pos":4,"id":"car4"},{"axis":"v","fixed":1,"len":2,"pos":3,"id":"car5"},{"axis":"v","fixed":2,"len":2,"pos":0,"id":"car6"},{"axis":"h","fixed":4,"len":2,"pos":3,"id":"car7"},{"axis":"v","fixed":5,"len":2,"pos":3,"id":"car8"}]},{"level":15,"optimal":7,"cars":[{"axis":"h","fixed":2,"len":2,"pos":0,"kind":"ice","id":"ice"},{"axis":"v","fixed":2,"len":2,"pos":1,"id":"car1"},{"axis":"h","fixed":3,"len":2,"pos":1,"id":"car2"},{"axis":"v","fixed":3,"len":3,"pos":0,"id":"car3"},{"axis":"v","fixed":0,"len":2,"pos":3,"id":"car4"},{"axis":"v","fixed":4,"len":3,"pos":1,"id":"car5"},{"axis":"h","fixed":4,"len":3,"pos":2,"id":"car6"},{"axis":"h","fixed":5,"len":2,"pos":0,"id":"car7"},{"axis":"h","fixed":1,"len":2,"pos":0,"id":"car8"}]},{"level":16,"optimal":7,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":0,"id":"car1"},{"axis":"h","fixed":4,"len":2,"pos":4,"id":"car2"},{"axis":"h","fixed":5,"len":2,"pos":0,"id":"car3"},{"axis":"v","fixed":1,"len":2,"pos":3,"id":"car4"},{"axis":"h","fixed":0,"len":2,"pos":2,"id":"car5"},{"axis":"h","fixed":2,"len":2,"pos":0,"id":"car6"},{"axis":"v","fixed":5,"len":2,"pos":0,"id":"car7"},{"axis":"h","fixed":3,"len":2,"pos":4,"id":"car8"},{"axis":"h","fixed":3,"len":2,"pos":2,"id":"car9"}]},{"level":17,"optimal":8,"cars":[{"axis":"h","fixed":2,"len":2,"pos":1,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":2,"id":"car1"},{"axis":"h","fixed":0,"len":3,"pos":2,"id":"car2"},{"axis":"v","fixed":3,"len":2,"pos":2,"id":"car3"},{"axis":"h","fixed":1,"len":2,"pos":1,"id":"car4"},{"axis":"v","fixed":1,"len":3,"pos":3,"id":"car5"},{"axis":"h","fixed":5,"len":2,"pos":4,"id":"car6"},{"axis":"h","fixed":5,"len":2,"pos":2,"id":"car7"},{"axis":"v","fixed":5,"len":2,"pos":1,"id":"car8"},{"axis":"v","fixed":2,"len":2,"pos":3,"id":"car9"}]},{"level":18,"optimal":8,"cars":[{"axis":"h","fixed":2,"len":2,"pos":1,"kind":"ice","id":"ice"},{"axis":"v","fixed":5,"len":3,"pos":0,"id":"car1"},{"axis":"h","fixed":4,"len":2,"pos":4,"id":"car2"},{"axis":"v","fixed":0,"len":2,"pos":4,"id":"car3"},{"axis":"h","fixed":0,"len":2,"pos":0,"id":"car4"},{"axis":"v","fixed":3,"len":2,"pos":2,"id":"car5"},{"axis":"h","fixed":0,"len":2,"pos":2,"id":"car6"},{"axis":"h","fixed":4,"len":2,"pos":2,"id":"car7"},{"axis":"v","fixed":4,"len":3,"pos":0,"id":"car8"}]},{"level":19,"optimal":9,"cars":[{"axis":"h","fixed":2,"len":2,"pos":0,"kind":"ice","id":"ice"},{"axis":"v","fixed":2,"len":3,"pos":1,"id":"car1"},{"axis":"v","fixed":0,"len":2,"pos":0,"id":"car2"},{"axis":"v","fixed":5,"len":3,"pos":3,"id":"car3"},{"axis":"h","fixed":0,"len":2,"pos":1,"id":"car4"},{"axis":"h","fixed":5,"len":3,"pos":1,"id":"car5"},{"axis":"v","fixed":4,"len":2,"pos":2,"id":"car6"},{"axis":"v","fixed":0,"len":2,"pos":4,"id":"car7"},{"axis":"h","fixed":4,"len":2,"pos":3,"id":"car8"}]},{"level":20,"optimal":9,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":2,"id":"car1"},{"axis":"v","fixed":5,"len":3,"pos":0,"id":"car2"},{"axis":"v","fixed":3,"len":2,"pos":0,"id":"car3"},{"axis":"h","fixed":2,"len":2,"pos":0,"id":"car4"},{"axis":"h","fixed":4,"len":2,"pos":0,"id":"car5"},{"axis":"v","fixed":2,"len":2,"pos":4,"id":"car6"},{"axis":"v","fixed":1,"len":2,"pos":0,"id":"car7"},{"axis":"h","fixed":3,"len":3,"pos":1,"id":"car8"},{"axis":"h","fixed":5,"len":2,"pos":4,"id":"car9"}]},{"level":21,"optimal":10,"cars":[{"axis":"h","fixed":2,"len":2,"pos":2,"kind":"ice","id":"ice"},{"axis":"v","fixed":4,"len":3,"pos":1,"id":"car1"},{"axis":"h","fixed":0,"len":3,"pos":2,"id":"car2"},{"axis":"v","fixed":3,"len":2,"pos":3,"id":"car3"},{"axis":"h","fixed":5,"len":3,"pos":2,"id":"car4"},{"axis":"h","fixed":1,"len":3,"pos":1,"id":"car5"},{"axis":"v","fixed":2,"len":2,"pos":3,"id":"car6"},{"axis":"v","fixed":0,"len":2,"pos":4,"id":"car7"},{"axis":"h","fixed":4,"len":2,"pos":4,"id":"car8"}]},{"level":22,"optimal":11,"cars":[{"axis":"h","fixed":2,"len":2,"pos":0,"kind":"ice","id":"ice"},{"axis":"v","fixed":3,"len":3,"pos":2,"id":"car1"},{"axis":"h","fixed":3,"len":3,"pos":0,"id":"car2"},{"axis":"v","fixed":4,"len":3,"pos":2,"id":"car3"},{"axis":"h","fixed":1,"len":2,"pos":0,"id":"car4"},{"axis":"v","fixed":5,"len":3,"pos":2,"id":"car5"},{"axis":"h","fixed":5,"len":3,"pos":1,"id":"car6"},{"axis":"v","fixed":5,"len":2,"pos":0,"id":"car7"},{"axis":"v","fixed":4,"len":2,"pos":0,"id":"car8"},{"axis":"v","fixed":0,"len":2,"pos":4,"id":"car9"},{"axis":"h","fixed":0,"len":2,"pos":0,"id":"car10"}]},{"level":23,"optimal":12,"cars":[{"axis":"h","fixed":2,"len":2,"pos":0,"kind":"ice","id":"ice"},{"axis":"v","fixed":2,"len":3,"pos":2,"id":"car1"},{"axis":"h","fixed":0,"len":2,"pos":4,"id":"car2"},{"axis":"v","fixed":5,"len":2,"pos":1,"id":"car3"},{"axis":"v","fixed":3,"len":2,"pos":4,"id":"car4"},{"axis":"v","fixed":1,"len":2,"pos":0,"id":"car5"},{"axis":"v","fixed":5,"len":2,"pos":3,"id":"car6"},{"axis":"v","fixed":3,"len":2,"pos":1,"id":"car7"},{"axis":"h","fixed":5,"len":3,"pos":0,"id":"car8"}]},{"level":24,"optimal":13,"cars":[{"axis":"h","fixed":2,"len":2,"pos":0,"kind":"ice","id":"ice"},{"axis":"v","fixed":2,"len":3,"pos":0,"id":"car1"},{"axis":"v","fixed":3,"len":2,"pos":3,"id":"car2"},{"axis":"v","fixed":5,"len":3,"pos":3,"id":"car3"},{"axis":"h","fixed":0,"len":2,"pos":3,"id":"car4"},{"axis":"v","fixed":3,"len":2,"pos":1,"id":"car5"},{"axis":"v","fixed":4,"len":3,"pos":2,"id":"car6"},{"axis":"v","fixed":0,"len":3,"pos":3,"id":"car7"},{"axis":"v","fixed":1,"len":2,"pos":0,"id":"car8"},{"axis":"v","fixed":5,"len":2,"pos":0,"id":"car9"}]}];
const TRAFFIC_TIERS={easy:{label:'쉬움',min:2,max:5},normal:{label:'보통',min:6,max:9},hard:{label:'어려움',min:10,max:18}};
const TRAFFIC_COLORS=['#86B8D0','#D1A077','#6489B3','#A9BAA3','#B9A6A0','#849DAD','#CE9672','#93AEBC','#B3A18F','#657EAB','#C5AF97','#8D9FB7','#B2BEBA'];
let trafficS=null,trafficSelected=0,trafficDrag=null,trafficTimer=null,trafficRoot=null,trafficHint=null,trafficGenerating=false;
const trafficRandom=n=>Math.floor(Math.random()*n);
const trafficCopy=x=>JSON.parse(JSON.stringify(x));
const trafficKey=p=>p.join('');
function trafficOccupancy(cars,positions){const occ=new Int8Array(36);for(let i=0;i<cars.length;i++){const c=cars[i],pos=positions[i];for(let j=0;j<c.len;j++){const index=c.axis==='h'?c.fixed*6+pos+j:(pos+j)*6+c.fixed;if(index<0||index>=36||occ[index])return null;occ[index]=i+1;}}return occ;}
function trafficAvailable(cars,positions,occ=trafficOccupancy(cars,positions)){
 if(!occ)return[];const moves=[];
 for(let i=0;i<cars.length;i++){const c=cars[i],p=positions[i];for(const d of [-1,1]){
  for(let step=1;step<=5;step++){
   const next=p+d*step;if(next<0||next+c.len>6)break;
   const lead=d<0?next:next+c.len-1;
   if(occ[c.axis==='h'?c.fixed*6+lead:lead*6+c.fixed])break;
   moves.push({i,to:next});
  }
 }}return moves;
}
function trafficSolve(cars,start,limit=32000){
 if(!trafficOccupancy(cars,start))return null;
 const nodes=[{p:start.slice(),prev:-1,move:null}],visited=new Set([trafficKey(start)]);
 for(let head=0;head<nodes.length&&nodes.length<=limit;head++){
  const node=nodes[head];
  if(node.p[0]===4){const path=[];let idx=head;while(nodes[idx].prev!==-1){path.push(nodes[idx].move);idx=nodes[idx].prev;}path.reverse();return{moves:path.length,path,seen:nodes.length};}
  const occ=trafficOccupancy(cars,node.p);
  for(const m of trafficAvailable(cars,node.p,occ)){
   const next=node.p.slice();next[m.i]=m.to;const key=trafficKey(next);
   if(visited.has(key))continue;visited.add(key);nodes.push({p:next,prev:head,move:m});
   if(nodes.length>limit)return null;
  }
 }
 return null;
}
function trafficSave(){if(!trafficS)return;trafficS.savedAt=Date.now();playStore.write('traffic-v1-'+trafficS.tier,trafficS);playStore.write('traffic-v1-active',trafficS.tier)}
function trafficSeed(tier){const cfg=TRAFFIC_TIERS[tier];const seeds=TRAFFIC_SEEDS.filter(v=>v.optimal>=cfg.min&&v.optimal<=cfg.max);return trafficCopy(seeds[trafficRandom(seeds.length)]||TRAFFIC_SEEDS[trafficRandom(TRAFFIC_SEEDS.length)]);}
function trafficHistory(){const a=playStore.read('traffic-v1-seen',[]);return Array.isArray(a)?a.slice(-48):[]}
function trafficGenerate(tier){
 const cfg=TRAFFIC_TIERS[tier],seen=trafficHistory();let fallback=null;
 for(let attempt=0;attempt<75;attempt++){
  const seed=trafficSeed(tier),cars=seed.cars,positions=cars.map(c=>c.pos);const count=2+trafficRandom(13);
  for(let k=0;k<count;k++){
   const moves=trafficAvailable(cars,positions);if(!moves.length)break;
   // Bias toward actual changes and different vehicles, while staying legally solvable.
   const pick=moves[trafficRandom(moves.length)];positions[pick.i]=pick.to;
  }
  const solution=trafficSolve(cars,positions);if(!solution||solution.moves<cfg.min||solution.moves>cfg.max)continue;
  const hash=JSON.stringify(cars.map((c,i)=>[c.axis,c.fixed,c.len,positions[i]]));
  const candidate={tier,cars,positions,original:positions.slice(),optimal:solution.moves,moves:0,seconds:0,hints:0,won:false,undo:[],createdAt:Date.now(),hash};
  if(!fallback)fallback=candidate;
  if(!seen.includes(hash)){playStore.write('traffic-v1-seen',[...seen,hash].slice(-48));return candidate;}
 }
 if(fallback)return fallback;
 // Hard cap fallback: seeds themselves were BFS-verified during build.
 const seed=trafficSeed(tier),cars=seed.cars,positions=cars.map(c=>c.pos),sol=trafficSolve(cars,positions);
 return{tier,cars,positions,original:positions.slice(),optimal:sol?.moves||seed.optimal,moves:0,seconds:0,hints:0,won:false,undo:[],createdAt:Date.now(),hash:'seed-'+seed.level};
}
function trafficGood(s){return !!(s&&TRAFFIC_TIERS[s.tier]&&Array.isArray(s.cars)&&s.cars.length>=2&&Array.isArray(s.positions)&&s.positions.length===s.cars.length&&s.cars[0].axis==='h'&&s.cars[0].fixed===2&&s.cars[0].len===2&&trafficOccupancy(s.cars,s.positions));}
function trafficLoad(tier,forceNew=false){
 const existing=!forceNew?playStore.read('traffic-v1-'+tier,null):null;
 trafficS=trafficGood(existing)&&!existing.won?existing:trafficGenerate(tier);
 trafficSelected=0;trafficHint=null;trafficSave();trafficDraw();
}
function trafficMove(i,pos){
 if(!trafficS||gameShell.paused||trafficS.won)return false;
 const old=trafficS.positions[i];if(old===pos)return false;
 const possible=trafficAvailable(trafficS.cars,trafficS.positions).some(m=>m.i===i&&m.to===pos);
 if(!possible)return false;
 trafficS.undo=Array.isArray(trafficS.undo)?trafficS.undo.slice(-24):[];
 trafficS.undo.push({i,from:old,to:pos});trafficS.positions[i]=pos;trafficS.moves++;trafficHint=null;
 if(trafficS.positions[0]===4){
  trafficS.won=true;const key='best-traffic-'+trafficS.tier;const best=playStore.number(key);
  if(!trafficS.hints&&(!best||trafficS.moves<best))playStore.putNumber(key,trafficS.moves);
 }
 trafficSave();trafficDraw();
 if(trafficS.won){exFinish('아이스크림 트럭 탈출!','총 '+trafficS.moves+'번 이동 · 최적 '+trafficS.optimal+'번 · '+(trafficS.hints?'힌트 사용':'힌트 없이 성공')+' · 새 퍼즐에 도전해 보세요.');}
 return true;
}
function trafficUndo(){if(gameShell.paused||!trafficS?.undo?.length||trafficS.won)return;const m=trafficS.undo.pop();trafficS.positions[m.i]=m.from;trafficS.moves=Math.max(0,trafficS.moves-1);trafficHint=null;trafficSave();trafficDraw();}
function trafficHintNow(){
 if(gameShell.paused||!trafficS||trafficS.won)return;
 const solution=trafficSolve(trafficS.cars,trafficS.positions);
 if(!solution||!solution.path.length){toast('현재 판에서 힌트를 계산할 수 없어요.');return;}
 trafficS.hints++;trafficHint=solution.path[0];trafficSelected=trafficHint.i;trafficSave();trafficDraw();
 const c=trafficS.cars[trafficHint.i];const direction=trafficHint.to>trafficS.positions[trafficHint.i]?(c.axis==='h'?'오른쪽':'아래'):(c.axis==='h'?'왼쪽':'위');
 $('#trafficHintText').textContent=`강조된 ${trafficHint.i===0?'아이스크림 트럭':'차량'}을 ${direction}으로 ${Math.abs(trafficHint.to-trafficS.positions[trafficHint.i])}칸 움직여 보세요.`;
}
function trafficStateLabel(){const cfg=TRAFFIC_TIERS[trafficS.tier];const best=playStore.number('best-traffic-'+trafficS.tier);exStats([['난이도',cfg.label],['현재 이동',trafficS.moves+'회'],['최소 이동',trafficS.optimal+'회'],['최고 기록',best?best+'회':'—']]);}
function trafficDraw(){
 const board=$('#trafficBoard');if(!board||!trafficS)return;
 const a=trafficS.cars;
 board.innerHTML='<div class="traffic-grid">'+Array.from({length:36},()=>'<div class="traffic-cell"></div>').join('')+'</div><div class="traffic-exit" aria-hidden="true">EXIT →</div>'+a.map((c,i)=>{
  const p=trafficS.positions[i],h=c.axis==='h',x=h?p:c.fixed,y=h?c.fixed:p;
  const color=i===0?'#D58D61':TRAFFIC_COLORS[i%TRAFFIC_COLORS.length];
  return `<button class="traffic-car ${i===0?'ice-van':''} ${trafficSelected===i?'chosen':''} ${trafficHint?.i===i?'hinted':''}" data-traffic-car="${i}" aria-label="${i===0?'아이스크림 트럭':`차량 ${i}`} ${h?'가로':'세로'} ${p+1}번 칸" style="left:${(x/6)*100}%;top:${(y/6)*100}%;width:${((h?c.len:1)/6)*100}%;height:${((h?1:c.len)/6)*100}%;--car-color:${color}"><span class="traffic-car-body">${i===0?'🍦':c.len===3?'▰':'•'}<span class="traffic-car-detail">${i===0?'PAUSE':''}</span></span></button>`;
 }).join('');
 const ctrl=$('#trafficControls');if(ctrl){const c=a[trafficSelected]||a[0];ctrl.innerHTML=`<button data-traffic-step="-1" aria-label="선택 차량 뒤로 이동">${c.axis==='h'?'←':'↑'}</button><span>차량을 끌거나 선택 후 방향키로 이동</span><button data-traffic-step="1" aria-label="선택 차량 앞으로 이동">${c.axis==='h'?'→':'↓'}</button>`;}
 const info=$('#trafficHintText');if(info&&!trafficHint)info.textContent='차량은 차체의 길이 방향으로만 움직여요. 오른쪽 출구로 아이스크림 트럭을 빼내세요.';
 $('#trafficMoveCount').textContent=trafficS.moves;
 $('#trafficTime').textContent=trafficTimeFormat(trafficS.seconds||0);
 trafficStateLabel();
}
function trafficTimeFormat(sec){const s=Math.floor(sec);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function trafficStopTimer(){if(trafficTimer){clearInterval(trafficTimer);trafficTimer=null}}
function trafficStartTimer(){trafficStopTimer();trafficTimer=setInterval(()=>{if(!trafficS||gameShell.paused||trafficS.won||trafficGenerating)return;trafficS.seconds=(trafficS.seconds||0)+1;const el=$('#trafficTime');if(el)el.textContent=trafficTimeFormat(trafficS.seconds);if(trafficS.seconds%5===0)trafficSave()},1000)}
function trafficStep(delta){const i=trafficSelected,c=trafficS?.cars[i];if(!c)return;trafficMove(i,trafficS.positions[i]+delta);}
const trafficModule={
 markup:()=>`<div class="traffic-premium"><div class="traffic-head"><div><span class="traffic-eyebrow">TRAFFIC ESCAPE · INFINITE PUZZLES</span><h3>아이스크림 트럭 탈출</h3><p>막힌 길을 열고 오른쪽 출구까지!</p></div><div class="traffic-watch"><span>이동 <strong id="trafficMoveCount">0</strong></span><span>시간 <strong id="trafficTime">00:00</strong></span></div></div><div class="traffic-difficulty" role="group" aria-label="퍼즐 난이도"><button data-traffic-tier="easy">쉬움</button><button data-traffic-tier="normal">보통</button><button data-traffic-tier="hard">어려움</button></div><div class="traffic-layout"><div class="traffic-board-shell"><div class="traffic-board" id="trafficBoard" aria-label="6 곱하기 6 차량 탈출 퍼즐판"></div></div><div class="traffic-utilities"><div class="traffic-hint" id="trafficHintText" role="status" aria-live="polite">차량은 차체 방향으로만 움직일 수 있어요.</div><div class="traffic-controls" id="trafficControls"></div><div class="traffic-buttons"><button data-traffic-action="hint">✦ 힌트</button><button data-traffic-action="undo">↶ 되돌리기</button><button class="traffic-new" data-traffic-action="new">↻ 같은 난이도 새 퍼즐</button></div><p class="traffic-footnote">매번 새로운 차량 배치를 만들고 탐색 알고리즘으로 풀 수 있는지 검사합니다. 힌트 사용 시 최고 기록은 갱신되지 않아요.</p></div></div></div>`,
 help:'빙글빙글 돌아가지 않아요. 차량은 가로·세로 자기 방향으로만 이동합니다. PC 마우스·모바일 터치 드래그 또는 키보드·화살표 버튼을 사용하세요.',
 mount(){
  trafficRoot=$('.traffic-premium');let tier=playStore.read('traffic-v1-active','easy');if(!TRAFFIC_TIERS[tier])tier='easy';trafficLoad(tier);
  const onClick=e=>{
   if(gameShell.paused||trafficGenerating)return;
   const tierBtn=e.target.closest('[data-traffic-tier]');if(tierBtn){const tier=tierBtn.dataset.trafficTier;if(tier!==trafficS.tier){trafficSave();trafficLoad(tier);trafficMarkTier()}return;}
   const action=e.target.closest('[data-traffic-action]')?.dataset.trafficAction;
   if(action){if(action==='hint')trafficHintNow();if(action==='undo')trafficUndo();if(action==='new'){trafficLoad(trafficS.tier,true);trafficMarkTier();}return;}
   const step=e.target.closest('[data-traffic-step]');if(step){trafficStep(+step.dataset.trafficStep);return;}
   const car=e.target.closest('[data-traffic-car]');if(car){trafficSelected=+car.dataset.trafficCar;trafficDraw();}
  };
  const onDown=e=>{const car=e.target.closest('[data-traffic-car]');if(!car||gameShell.paused||trafficS.won)return;
   e.preventDefault();trafficSelected=+car.dataset.trafficCar;
   trafficDrag={id:trafficSelected,el:car,startX:e.clientX,startY:e.clientY,origin:trafficS.positions[trafficSelected],size:$('#trafficBoard').getBoundingClientRect().width/6};
   car.setPointerCapture(e.pointerId);car.classList.add('dragging');
  };
  const onMove=e=>{if(!trafficDrag)return;const d=trafficDrag,c=trafficS.cars[d.id];const shift=c.axis==='h'?e.clientX-d.startX:e.clientY-d.startY;
   d.offset=shift;d.el.style.transform=c.axis==='h'?`translateX(${shift}px)`:`translateY(${shift}px)`;
  };
  const onUp=e=>{if(!trafficDrag)return;const d=trafficDrag;trafficDrag=null;d.el.style.transform='';d.el.classList.remove('dragging');
   const c=trafficS.cars[d.id];const delta=Math.round((d.offset||0)/d.size);if(delta) {
    const suggested=d.origin+delta,options=trafficAvailable(trafficS.cars,trafficS.positions).filter(m=>m.i===d.id).map(m=>m.to);
    const allowed=options.filter(x=>delta>0?x>d.origin:x<d.origin).sort((a,b)=>Math.abs(a-suggested)-Math.abs(b-suggested));
    if(allowed.length)trafficMove(d.id,allowed[0]);else trafficDraw();
   }else trafficDraw();
  };
  const onKey=e=>{if(gameShell.paused||!trafficS||['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    const c=trafficS.cars[trafficSelected],valid=c.axis==='h'?['ArrowLeft','ArrowRight']:['ArrowUp','ArrowDown'];if(valid.includes(e.key)){
     e.preventDefault();trafficStep(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);
    }
   }else if(e.key==='Backspace'){e.preventDefault();trafficUndo();}
  };
  const trafficMarkTier=()=>trafficRoot.querySelectorAll('[data-traffic-tier]').forEach(b=>{const selected=b.dataset.trafficTier===trafficS.tier;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  trafficRoot.addEventListener('click',onClick);trafficRoot.addEventListener('pointerdown',onDown);trafficRoot.addEventListener('pointermove',onMove);trafficRoot.addEventListener('pointerup',onUp);trafficRoot.addEventListener('pointercancel',onUp);document.addEventListener('keydown',onKey);trafficMarkTier();trafficStartTimer();
  return{pause(){trafficStopTimer();trafficSave()},resume(){if(!trafficS?.won)trafficStartTimer()},reset(){trafficLoad(trafficS.tier,true);trafficMarkTier();trafficStartTimer();hideMask()},dispose(){trafficStopTimer();trafficSave();trafficRoot.removeEventListener('click',onClick);trafficRoot.removeEventListener('pointerdown',onDown);trafficRoot.removeEventListener('pointermove',onMove);trafficRoot.removeEventListener('pointerup',onUp);trafficRoot.removeEventListener('pointercancel',onUp);document.removeEventListener('keydown',onKey);trafficRoot=null;}};
 }
};
