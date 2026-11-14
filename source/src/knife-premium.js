/* PAUSE v1.2 — Knife Timing Premium. Original timing-arcade implementation.
   Standalone browser game; no network, external assets or monetization. */
const tau=Math.PI*2;
const KP_SAVE='knife-premium-v1';
const kpWrap=a=>((a%tau)+tau)%tau;
const kpAngularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const kpRandom=(a,b)=>a+Math.random()*(b-a);
const kpAngle=()=>kpRandom(0,tau);
const kpLevels=['첫걸음','리듬','회전','역전','BOSS'];
const KP_MODES={relaxed:{name:'편안하게',speed:.76,more:0,knives:-1,points:.8},classic:{name:'클래식',speed:1,more:0,knives:0,points:1},precision:{name:'챌린지',speed:1.24,more:1,knives:1,points:1.5}};
const KP_SKINS={sunset:{name:'선셋 우드',rim:'#7a4a39',wood:['#f0c496','#bb805a','#704a42'],grain:'#f5dbb075',metal:'#dbe7f3',handle:'#375678',glow:'#e8a778'},marine:{name:'딥 오션',rim:'#234b69',wood:['#8bb4ce','#456e93','#1d3c58'],grain:'#d2e7f17d',metal:'#ecf4fc',handle:'#b67c5d',glow:'#659ccb'},onyx:{name:'미드나이트',rim:'#343c4d',wood:['#a4acb9','#606d80','#283447'],grain:'#cfd6de75',metal:'#f1e6d6',handle:'#bf9269',glow:'#9babc6'}};
const kpMode=s=>KP_MODES[s?.mode]?s.mode:'classic';
const kpSkin=s=>KP_SKINS[s?.skin]?s.skin:'sunset';

let knifeS,knifeRoot=null,knifeRAF=0,knifeLast=0,knifeFlight=null,knifeFlash=0,knifeParticles=[],knifeAudio=null,knifeSavedAt=0;
function knifePreset(level,mode='classic'){
  const boss=level%5===0,band=(level-1)%5,p=KP_MODES[mode]||KP_MODES.classic;
  const presetKnives=level===1?0:Math.min(3,Math.floor((level+1)/4)+p.more);
  return {boss,need:Math.max(2,Math.min(11-presetKnives,9,4+Math.floor(level/3)+(boss?2:0)+p.knives)),
    speed:Math.min(4.1,(1.17+(level-1)*.115)*p.speed),
    pattern:boss?'boss':band<2?'steady':band===2?'pulse':'reverse',
    label:boss?'선셋 보스':kpLevels[band],
    presetKnives,
    apples:boss?2:level<3?1:level%3===0?1:0};
}
function knifeNewStage(stage,score=0,apples=0,mode='classic',skin='sunset'){
 const cfg=knifePreset(stage,mode),obstacles=[];
 // Angles are local to the rotating target, and are spaced apart to keep the board fair.
 let attempts=0;while(obstacles.length<cfg.presetKnives&&attempts++<200){const a=kpAngle();if(obstacles.every(x=>kpAngularDistance(x,a)>.62))obstacles.push(a)}
 const fruit=[];attempts=0;while(fruit.length<cfg.apples&&attempts++<200){const a=kpAngle();if(obstacles.every(x=>kpAngularDistance(x,a)>.48)&&fruit.every(x=>kpAngularDistance(x,a)>.48))fruit.push(a)}
 return {schema:1,level:stage,score,apples,mode,skin,angle:kpRandom(0,tau),elapsed:0,knives:[],obstacles,fruit,
  shots:0,over:false,clear:false,seed:Math.random(),sound:false,pattern:cfg.pattern};
}
function knifeValid(s){return s&&s.schema===1&&Number.isInteger(s.level)&&s.level>0&&s.level<10000&&Number.isFinite(s.angle)&&Number.isFinite(s.score)&&Array.isArray(s.knives)&&Array.isArray(s.obstacles)&&Array.isArray(s.fruit)&&s.knives.length<24&&s.obstacles.length<16&&s.fruit.length<8}
function knifePersist(){if(!knifeS)return;playStore.write(KP_SAVE,knifeS);knifeSavedAt=performance.now()}
function knifeUpdateHud(){if(!knifeRoot||!knifeS)return;const cfg=knifePreset(knifeS.level,kpMode(knifeS)),remaining=Math.max(0,cfg.need-knifeS.shots);const q=id=>knifeRoot.querySelector('#'+id);
 q('kpLevel').textContent=String(knifeS.level).padStart(2,'0');q('kpTarget').textContent=cfg.label;q('kpRemaining').textContent=remaining;q('kpScore').textContent=knifeS.score.toLocaleString();q('kpBest').textContent=playStore.number('best-knife-'+kpMode(knifeS)).toLocaleString();q('kpApples').textContent=knifeS.apples;q('kpPattern').textContent=cfg.pattern==='reverse'?'방향 반전':cfg.pattern==='pulse'?'속도 변화':cfg.pattern==='boss'?'불규칙 회전':'일정한 회전';
 q('kpShots').innerHTML=Array.from({length:cfg.need},(_,i)=>`<span class="${i<knifeS.shots?'done':''}" aria-hidden="true"></span>`).join('');
 q('kpShoot').disabled=gameShell.paused||knifeS.over||knifeS.clear||!!knifeFlight;
 q('kpMode').value=kpMode(knifeS);q('kpSkin').value=kpSkin(knifeS);q('kpSound').textContent=knifeS.sound?'효과음 켜짐':'효과음 꺼짐';q('kpSound').setAttribute('aria-pressed',String(knifeS.sound));
 exStats([['스테이지',knifeS.level],['현재 점수',knifeS.score.toLocaleString()],['최고 점수',playStore.number('best-knife').toLocaleString()],['사과',knifeS.apples]]);
}
function knifeAnnounce(message){const target=knifeRoot?.querySelector('#kpLive');if(target)target.textContent=message}
function knifePlayTone(freq=330,dur=.055,wave='sine'){
 if(!knifeS?.sound)return;
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;knifeAudio=knifeAudio||new C();if(knifeAudio.state==='suspended')knifeAudio.resume().catch(()=>{});const o=knifeAudio.createOscillator(),g=knifeAudio.createGain(),t=knifeAudio.currentTime;o.type=wave;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(65,freq*.64),t+dur);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(knifeAudio.destination);o.start(t);o.stop(t+dur+.01)}catch{}
}
function kpVibrate(ms){if(typeof navigator.vibrate==='function')try{navigator.vibrate(ms)}catch{}}
// Collision is calculated from the same blade dimensions and transforms as rendering.
// A SAT convex polygon test avoids the old angular-only hitbox and supports flight-time checks.
const KP_BLADE_HALF=11,KP_BLADE_TIP=-5,KP_BLADE_END=84, KP_TARGET_RADIUS=91;
function kpBladePolygon(x,y,rotation=0){
 const c=Math.cos(rotation),s=Math.sin(rotation);
 return [[-8,-5],[8,-5],[10,19],[11,48],[11,84],[-11,84],[-11,48],[-10,19]].map(([a,b])=>[x+a*c-b*s,y+a*s+b*c]);
}
function kpBladeOverlap(a,b){
 for(const shape of [a,b])for(let i=0;i<shape.length;i++){
  const p=shape[i],q=shape[(i+1)%shape.length],nx=-(q[1]-p[1]),ny=q[0]-p[0];
  let a0=Infinity,a1=-Infinity,b0=Infinity,b1=-Infinity;
  for(const v of a){const d=v[0]*nx+v[1]*ny;a0=Math.min(a0,d);a1=Math.max(a1,d)}
  for(const v of b){const d=v[0]*nx+v[1]*ny;b0=Math.min(b0,d);b1=Math.max(b1,d)}
  if(a1<=b0+1e-6||b1<=a0+1e-6)return false;
 }
 return true;
}
function kpCollision(s,impactAngle,progress=1){
 // The launch origin moves upward from 389 to 272 in canvas coordinates.
 const easing=1-Math.pow(1-Math.min(1,Math.max(0,progress)),3),tipY=389-117*easing;
 const incoming=kpBladePolygon(310,tipY),angle=Number.isFinite(impactAngle)?impactAngle:Math.PI/2;
 return [...s.obstacles,...s.knives].some(local=>{
  const theta=s.angle+local-Math.PI/2;
  const x=310-Math.sin(theta)*KP_TARGET_RADIUS,y=176+Math.cos(theta)*KP_TARGET_RADIUS;
  // theta acts on the local (0,91) offset: (-sin(theta),cos(theta))
  return kpBladeOverlap(incoming,kpBladePolygon(x,y,theta));
 });
}
function kpFruitHit(s,impactAngle){const local=kpWrap(impactAngle-s.angle);const i=s.fruit.findIndex(a=>kpAngularDistance(a,local)<.25);if(i<0)return false;s.fruit.splice(i,1);return true}
function kpSpeed(s){const cfg=knifePreset(s.level,kpMode(s)),t=s.elapsed,v=cfg.speed;
 if(cfg.pattern==='steady')return v*(s.level%2?-1:1);
 if(cfg.pattern==='pulse')return v*(.65+.60*(.5+.5*Math.sin(t*2.3)))*(s.level%2?-1:1);
 if(cfg.pattern==='reverse'){const cycle=Math.floor(t/3.8);return v*(.85+.18*Math.sin(t*2))*(cycle%2===0?1:-1)}
 const phase=t%6.5;return v*(phase<.55?.32:phase<2.4?1.25:phase<3.0?.48:phase<5.1?-1.12:-.3);
}
function knifeSparks(x,y,color='#efb17b',count=13){for(let i=0;i<count;i++){const a=kpAngle(),v=kpRandom(65,205);knifeParticles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color,r:kpRandom(2,5)})}}
function knifeLaunch(){
 if(!knifeS||gameShell.id!=='knife'||gameShell.paused||knifeS.over||knifeS.clear||knifeFlight)return;
 knifeFlight={progress:0,duration:.175};knifePlayTone(400,.045,'triangle');knifeUpdateHud();
}
function knifeFail(){
 knifeFlight=null;knifeS.over=true;knifeFlash=1;knifeSparks(310,284,'#f18a78',32);knifePlayTone(130,.24,'sawtooth');kpVibrate([45,45,80]);knifePersist();knifeUpdateHud();knifeAnnounce('칼이 부딪혔어요. 다시 도전할 수 있어요.');exFinish('칼이 부딪혔어요','꽂혀 있는 칼을 피해 빈 공간이 올 때 던져 보세요.');
}
function knifeResolve(){
 if(!knifeFlight||knifeS.over)return;
 const hit=kpCollision(knifeS,Math.PI/2,1);knifeFlight=null;
 if(hit){knifeFail();return}
 const local=kpWrap(Math.PI/2-knifeS.angle);knifeS.knives.push(local);knifeS.shots++;
 knifeS.score+=Math.round(10*KP_MODES[kpMode(knifeS)].points);const gotApple=kpFruitHit(knifeS,Math.PI/2);if(gotApple){knifeS.apples++;knifeS.score+=Math.round(35*KP_MODES[kpMode(knifeS)].points);knifeSparks(310,281,'#f5b15b',18)}else knifeSparks(310,280,'#9ebde6',8);
 knifePlayTone(gotApple?740:560,.09,'triangle');kpVibrate(12);
 const cfg=knifePreset(knifeS.level,kpMode(knifeS)),level=knifeS.level;
 if(knifeS.shots>=cfg.need){knifeS.score+=Math.round((80+level*20)*KP_MODES[kpMode(knifeS)].points);knifeS.clear=true;knifeSparks(310,168,'#dca076',44);knifePlayTone(850,.16,'sine');}
 exRecord('knife',knifeS.score);if(knifeS.score>playStore.number('best-knife-'+kpMode(knifeS)))playStore.putNumber('best-knife-'+kpMode(knifeS),knifeS.score);knifePersist();knifeUpdateHud();
 knifeAnnounce(knifeS.clear?`스테이지 ${level} 클리어!`:(gotApple?'사과 획득! ':'')+`남은 칼 ${cfg.need-knifeS.shots}개`);
 if(knifeS.clear){gameShell.paused=true;pauseMask('스테이지 클리어!',`${level}단계를 통과했어요. 보너스 점수를 획득했어요.`, `<button class="shell-button primary-action" id="kpNextStage">다음 스테이지 →</button><button class="shell-button subdued" data-shell-action="home">게임 목록으로</button>`)}
}
function knifeNextStage(){if(!knifeS?.clear)return;const sound=knifeS.sound,stage=knifeS.level+1,score=knifeS.score,apples=knifeS.apples;knifeS=knifeNewStage(stage,score,apples,kpMode(knifeS),kpSkin(knifeS));knifeS.sound=sound;knifeFlight=null;knifeFlash=0;knifeParticles=[];gameShell.paused=false;knifeLast=0;hideMask();knifePersist();knifeUpdateHud();knifeAnnounce(`스테이지 ${stage} 시작`)}
function knifeDrawBlade(c,x,y,scale=1,rotation=0,glow=false){const skin=KP_SKINS[kpSkin(knifeS)];c.save();c.translate(x,y);c.rotate(rotation);c.scale(scale,scale);if(glow){c.shadowColor=skin.glow;c.shadowBlur=14}c.fillStyle=skin.metal;c.beginPath();c.moveTo(0,-5);c.lineTo(-8,18);c.lineTo(-7,48);c.lineTo(7,48);c.lineTo(8,18);c.closePath();c.fill();c.fillStyle='#a6c0df';c.fillRect(-3,22,3,25);c.fillStyle=skin.handle;c.fillRect(-9,44,18,36);c.fillStyle=skin.glow;c.fillRect(-9,48,18,6);c.fillStyle='#456888';c.fillRect(-11,78,22,6);c.restore()}
function knifeDraw(){const can=knifeRoot?.querySelector('#kpCanvas');if(!can||!knifeS)return;const c=can.getContext('2d'),w=620,h=470,x=310,y=176,r=96;c.clearRect(0,0,w,h);
 const bg=c.createLinearGradient(0,0,620,470);bg.addColorStop(0,'#102541');bg.addColorStop(.55,'#142438');bg.addColorStop(1,'#30283a');c.fillStyle=bg;c.fillRect(0,0,w,h);
 const skin=KP_SKINS[kpSkin(knifeS)];const glow=c.createRadialGradient(x,y,50,x,y,280);glow.addColorStop(0,skin.glow+'55');glow.addColorStop(.46,'#3d669c31');glow.addColorStop(1,'#1a274500');c.fillStyle=glow;c.fillRect(0,0,w,h);
 for(let j=0;j<7;j++){c.strokeStyle=`rgba(155,185,217,${.03+j*.005})`;c.lineWidth=1;c.beginPath();c.arc(x,y,130+j*23,0,tau);c.stroke()}
 c.save();c.translate(x,y);c.rotate(knifeS.angle);
 c.shadowColor=skin.glow;c.shadowBlur=22;c.fillStyle=skin.rim;c.beginPath();c.arc(0,0,r+7,0,tau);c.fill();c.shadowBlur=0;
 const wood=c.createRadialGradient(-28,-38,8,0,0,110);wood.addColorStop(0,skin.wood[0]);wood.addColorStop(.7,skin.wood[1]);wood.addColorStop(1,skin.wood[2]);c.fillStyle=wood;c.beginPath();c.arc(0,0,r,0,tau);c.fill();
 for(let radius of [19,39,60,81]){c.beginPath();c.arc(0,0,radius,0,tau);c.strokeStyle=radius%2===1?'#20314888':skin.grain;c.lineWidth=radius===81?6:3;c.stroke()}
 c.strokeStyle='#ffffff30';c.lineWidth=4;for(let z=0;z<12;z++){const a=z*tau/12;c.beginPath();c.moveTo(Math.cos(a)*84,Math.sin(a)*84);c.lineTo(Math.cos(a)*96,Math.sin(a)*96);c.stroke()}
 for(let i=0;i<knifeS.fruit.length;i++){const a=knifeS.fruit[i];c.save();c.translate(Math.cos(a)*89,Math.sin(a)*89);c.rotate(a-Math.PI/2);c.shadowBlur=9;c.shadowColor='#f2ac69';c.fillStyle='#e89a55';c.beginPath();c.ellipse(0,0,10,11,0,0,tau);c.fill();c.fillStyle='#a7cfa2';c.beginPath();c.ellipse(4,-11,5,2,.4,0,tau);c.fill();c.restore()}
 for(const a of [...knifeS.obstacles,...knifeS.knives]){c.save();c.rotate(a-Math.PI/2);knifeDrawBlade(c,0,91,1,0,false);c.restore()}
 c.restore();
 if(knifeS.clear){c.fillStyle='#ffebcf';c.font='900 17px sans-serif';c.textAlign='center';c.fillText('STAGE CLEAR',x,y+7)}
 if(knifeFlight){const p=Math.min(1,knifeFlight.progress),e=1-Math.pow(1-p,3),tip=389-(389-272)*e;knifeDrawBlade(c,x,tip,1,0,true)}else if(!knifeS.over&&!knifeS.clear){knifeDrawBlade(c,x,389,1,0,true)}
 for(const p of knifeParticles){c.globalAlpha=Math.max(0,p.life);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.r,0,tau);c.fill()}c.globalAlpha=1;
 if(knifeFlash>0){c.fillStyle=`rgba(240,112,96,${Math.min(.36,knifeFlash*.3)})`;c.fillRect(0,0,w,h)}
 c.fillStyle='#a3b8d0';c.font='700 11px system-ui,sans-serif';c.textAlign='left';c.fillText('PAUSE  ·  KNIFE TIMING',22,29);
 c.textAlign='right';c.fillStyle='#dbac86';c.fillText(knifePreset(knifeS.level,kpMode(knifeS)).boss?'★ BOSS ROUND':'TIMING ARCADE',w-24,29);
}
function knifeTick(t){if(gameShell.id!=='knife'||!knifeS)return;const dt=Math.max(0,Math.min(.04,(t-(knifeLast||t))/1000));knifeLast=t;if(!gameShell.paused&&!knifeS.over&&!knifeS.clear){if(knifeFlight){
  // Multiple substeps prevent tunnelling when frame rate drops or wheel reverses.
  const n=Math.max(1,Math.ceil(dt/.006));for(let i=0;i<n&&knifeFlight;i++){
   knifeS.elapsed+=dt/n;knifeS.angle=kpWrap(knifeS.angle+kpSpeed(knifeS)*dt/n);knifeFlight.progress=Math.min(1,knifeFlight.progress+dt/(knifeFlight.duration*n));
   if(kpCollision(knifeS,Math.PI/2,knifeFlight.progress)){knifeFail();break}
   if(knifeFlight.progress>=1){knifeResolve();break}
  }
 }else{knifeS.elapsed+=dt;knifeS.angle=kpWrap(knifeS.angle+kpSpeed(knifeS)*dt)}}
 if(!gameShell.paused){knifeParticles=knifeParticles.filter(p=>p.life>.02);for(const p of knifeParticles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;p.life-=dt*1.8}knifeFlash=Math.max(0,knifeFlash-dt*2)}
 knifeDraw();knifeRAF=requestAnimationFrame(knifeTick)}
const knifeModule={
 markup:()=>`<div class="ex-content kp-game ex-knife"><div class="kp-header"><div><span class="kp-kicker">KNIFE TIMING · PREMIUM</span><h3>STAGE <span id="kpLevel">01</span> <small id="kpTarget">첫걸음</small></h3></div><div class="kp-apples" aria-label="사과 보너스">◈ <span id="kpApples">0</span></div></div><div class="kp-tuning"><label>난이도<select id="kpMode" aria-label="칼 타이밍 난이도"><option value="relaxed">편안하게</option><option value="classic">클래식</option><option value="precision">챌린지</option></select></label><label>통나무 스킨<select id="kpSkin" aria-label="통나무 스킨"><option value="sunset">선셋 우드</option><option value="marine">딥 오션</option><option value="onyx">미드나이트</option></select></label><p>스킨은 기록에 영향을 주지 않아요. 난이도 변경 시 새 게임을 시작해요.</p></div><div class="kp-hud"><div><span>현재 점수</span><strong id="kpScore">0</strong></div><div><span>최고 점수</span><strong id="kpBest">0</strong></div><div><span>남은 칼</span><strong id="kpRemaining">4</strong></div></div><div class="kp-board-wrap"><canvas id="kpCanvas" width="620" height="470" role="button" tabindex="0" aria-label="회전하는 통나무. 터치 또는 스페이스 키로 칼 던지기"></canvas><span class="kp-wheel-pattern" id="kpPattern">일정한 회전</span></div><div class="kp-progress" id="kpShots" aria-label="칼 투척 진행률"></div><button id="kpShoot" class="kp-shoot" type="button">칼 던지기 <span>SPACE / TAP</span></button><div class="kp-footer"><span>꽂힌 칼을 피해 빈 공간에 던지세요</span><button id="kpSound" type="button" aria-pressed="false">효과음 꺼짐</button></div><div class="kp-live" id="kpLive" aria-live="polite" aria-atomic="true"></div></div>`,
 help:'통나무가 돌아가는 타이밍을 읽고 탭·클릭·Space로 칼을 던져요. 기존 칼과 부딪히면 실패합니다. 사과 보너스, 방향 반전, 5단계마다 보스가 등장해요.',
 mount(){const previous=playStore.read(KP_SAVE,null);knifeS=knifeValid(previous)?previous:knifeNewStage(1);knifeRoot=document.querySelector('.kp-game');knifeFlight=null;knifeFlash=0;knifeParticles=[];knifeLast=0;
 if(knifeS.over){knifeS=knifeNewStage(1,0,0,kpMode(knifeS),kpSkin(knifeS))} else if(knifeS.clear){knifeS=knifeNewStage(knifeS.level+1,knifeS.score,knifeS.apples,kpMode(knifeS),kpSkin(knifeS))}
 const canvas=knifeRoot.querySelector('#kpCanvas'),shoot=knifeRoot.querySelector('#kpShoot'),sound=knifeRoot.querySelector('#kpSound');
 const canvasDown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();knifeLaunch()};const click=e=>{if(e.target.closest('#kpShoot'))knifeLaunch();if(e.target.closest('#kpSound')){knifeS.sound=!knifeS.sound;knifePersist();knifeUpdateHud()}};
 const key=e=>{if(gameShell.id!=='knife'||gameShell.paused||e.altKey||e.ctrlKey||e.metaKey)return;if(e.code==='Space'&&!['INPUT','TEXTAREA','BUTTON','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();knifeLaunch()}};
 const tune=e=>{if(e.target.id==='kpSkin'){knifeS.skin=e.target.value in KP_SKINS?e.target.value:'sunset';knifePersist();knifeUpdateHud();return}
 if(e.target.id==='kpMode'){const mode=e.target.value;if(!KP_MODES[mode]||mode===kpMode(knifeS))return;if(!window.confirm('난이도를 변경하면 현재 스테이지가 초기화돼요. 계속할까요?')){e.target.value=kpMode(knifeS);return}
 const sound=knifeS.sound,skin=kpSkin(knifeS);knifeS=knifeNewStage(1,0,0,mode,skin);knifeS.sound=sound;knifeFlight=null;knifeParticles=[];knifeFlash=0;knifeLast=0;gameShell.paused=false;hideMask();knifePersist();knifeUpdateHud()}};
 knifeRoot.addEventListener('change',tune);
 const next=e=>{if(e.target.closest('#kpNextStage')){e.preventDefault();knifeNextStage()}};
 canvas.addEventListener('pointerdown',canvasDown);knifeRoot.addEventListener('click',click);document.addEventListener('keydown',key);document.querySelector('#shellScreenMask')?.addEventListener('click',next);
 knifePersist();knifeUpdateHud();knifeRAF=requestAnimationFrame(knifeTick);
 return {pause(){knifePersist();knifeLast=0},resume(){knifeLast=0;knifeUpdateHud()},reset(){const sound=knifeS.sound,mode=kpMode(knifeS),skin=kpSkin(knifeS);knifeS=knifeNewStage(1,0,0,mode,skin);knifeS.sound=sound;knifeFlight=null;knifeParticles=[];knifeFlash=0;gameShell.paused=false;hideMask();knifePersist();knifeUpdateHud()},dispose(){cancelAnimationFrame(knifeRAF);canvas.removeEventListener('pointerdown',canvasDown);knifeRoot?.removeEventListener('click',click);knifeRoot?.removeEventListener('change',tune);document.removeEventListener('keydown',key);document.querySelector('#shellScreenMask')?.removeEventListener('click',next);knifePersist();knifeRoot=null}}
 }
};
