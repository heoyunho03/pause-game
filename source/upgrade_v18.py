from pathlib import Path
p=Path(__file__).parent/'src/knife-premium.js'
s=p.read_text()
s=s.replace("const kpLevels=['첫걸음','리듬','회전','역전','BOSS'];", """const kpLevels=['첫걸음','리듬','회전','역전','BOSS'];
const KP_MODES={relaxed:{name:'편안하게',speed:.76,more:0,knives:-1,points:.8},classic:{name:'클래식',speed:1,more:0,knives:0,points:1},precision:{name:'챌린지',speed:1.24,more:1,knives:1,points:1.5}};
const KP_SKINS={sunset:{name:'선셋 우드',rim:'#7a4a39',wood:['#f0c496','#bb805a','#704a42'],grain:'#f5dbb075',metal:'#dbe7f3',handle:'#375678',glow:'#e8a778'},marine:{name:'딥 오션',rim:'#234b69',wood:['#8bb4ce','#456e93','#1d3c58'],grain:'#d2e7f17d',metal:'#ecf4fc',handle:'#b67c5d',glow:'#659ccb'},onyx:{name:'미드나이트',rim:'#343c4d',wood:['#a4acb9','#606d80','#283447'],grain:'#cfd6de75',metal:'#f1e6d6',handle:'#bf9269',glow:'#9babc6'}};
const kpMode=s=>KP_MODES[s?.mode]?s.mode:'classic';
const kpSkin=s=>KP_SKINS[s?.skin]?s.skin:'sunset';
""")
s=s.replace('function knifePreset(level){\n  const boss=level%5===0,band=(level-1)%5;\n  return {boss,need:Math.min(8,4+Math.floor(level/3)+(boss?2:0)),\n    speed:Math.min(2.85,1.17+(level-1)*.115),', '''function knifePreset(level,mode='classic'){
  const boss=level%5===0,band=(level-1)%5,p=KP_MODES[mode]||KP_MODES.classic;
  return {boss,need:Math.max(2,Math.min(9,4+Math.floor(level/3)+(boss?2:0)+p.knives)),
    speed:Math.min(4.1,(1.17+(level-1)*.115)*p.speed),''')
s=s.replace('presetKnives:level===1?0:Math.min(3,Math.floor((level+1)/4)),','presetKnives:level===1?0:Math.min(4,Math.floor((level+1)/4)+p.more),')
s=s.replace('function knifeNewStage(stage,score=0,apples=0){\n const cfg=knifePreset(stage),obstacles=[];', '''function knifeNewStage(stage,score=0,apples=0,mode='classic',skin='sunset'){
 const cfg=knifePreset(stage,mode),obstacles=[];''')
s=s.replace('return {schema:1,level:stage,score,apples,angle:kpRandom(0,tau),elapsed:0,knives:[],obstacles,fruit,','return {schema:1,level:stage,score,apples,mode,skin,angle:kpRandom(0,tau),elapsed:0,knives:[],obstacles,fruit,')
s=s.replace('const cfg=knifePreset(knifeS.level),remaining=', 'const cfg=knifePreset(knifeS.level,kpMode(knifeS)),remaining=')
s=s.replace("q('kpBest').textContent=playStore.number('best-knife').toLocaleString();", "q('kpBest').textContent=playStore.number('best-knife-'+kpMode(knifeS)).toLocaleString();")
s=s.replace("q('kpSound').textContent=knifeS.sound?'효과음 켜짐':'효과음 꺼짐';", "q('kpMode').value=kpMode(knifeS);q('kpSkin').value=kpSkin(knifeS);q('kpSound').textContent=knifeS.sound?'효과음 켜짐':'효과음 꺼짐';")
s=s.replace("function kpCollision(s,impactAngle){const local=kpWrap(impactAngle-s.angle);const occupied=[...s.obstacles,...s.knives];return occupied.some(a=>kpAngularDistance(a,local)<.24)}", '''// Collision is calculated from the same blade dimensions and transforms as rendering.
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
}''')
# fix advanced collision geometry: original rotation: original atan? c.rotate(s.angle) then c.rotate(a-PI/2), yes matches.
s=s.replace('const cfg=knifePreset(s.level),t=s.elapsed,v=cfg.speed;', 'const cfg=knifePreset(s.level,kpMode(s)),t=s.elapsed,v=cfg.speed;')
s=s.replace('knifeFlight={progress:0,duration:.175};', 'knifeFlight={progress:0,duration:.175};')
s=s.replace("const hit=kpCollision(knifeS,Math.PI/2);knifeFlight=null;", "const hit=kpCollision(knifeS,Math.PI/2,1);knifeFlight=null;")
s=s.replace("if(hit){knifeS.over=true;knifeFlash=1;knifeSparks(310,284,'#f18a78',32);knifePlayTone(130,.24,'sawtooth');kpVibrate([45,45,80]);knifePersist();knifeUpdateHud();knifeAnnounce('칼이 부딪혔어요. 다시 도전할 수 있어요.');exFinish('칼이 부딪혔어요','꽂혀 있는 칼을 피해 빈 공간이 올 때 던져 보세요.');return}", "if(hit){knifeFail();return}")
s=s.replace(' knifeS.score+=10;const gotApple=', ' knifeS.score+=Math.round(10*KP_MODES[kpMode(knifeS)].points);const gotApple=')
s=s.replace('knifeS.score+=35;', 'knifeS.score+=Math.round(35*KP_MODES[kpMode(knifeS)].points);')
s=s.replace('const cfg=knifePreset(knifeS.level),level=knifeS.level;', 'const cfg=knifePreset(knifeS.level,kpMode(knifeS)),level=knifeS.level;')
s=s.replace('knifeS.score+=80+level*20;', 'knifeS.score+=Math.round((80+level*20)*KP_MODES[kpMode(knifeS)].points);')
s=s.replace("exRecord('knife',knifeS.score);knifePersist();", "exRecord('knife',knifeS.score);if(knifeS.score>playStore.number('best-knife-'+kpMode(knifeS)))playStore.putNumber('best-knife-'+kpMode(knifeS),knifeS.score);knifePersist();")
s=s.replace('knifeS=knifeNewStage(stage,score,apples);', 'knifeS=knifeNewStage(stage,score,apples,kpMode(knifeS),kpSkin(knifeS));')
s=s.replace("function knifeDrawBlade(c,x,y,scale=1,rotation=0,glow=false){", "function knifeDrawBlade(c,x,y,scale=1,rotation=0,glow=false){const skin=KP_SKINS[kpSkin(knifeS)];")
s=s.replace("if(glow){c.shadowColor='#8babe3';", "if(glow){c.shadowColor=skin.glow;")
s=s.replace("c.fillStyle='#e7edf4';", "c.fillStyle=skin.metal;")
s=s.replace("c.fillStyle='#324d6f';", "c.fillStyle=skin.handle;")
s=s.replace("c.fillStyle='#d99d70';", "c.fillStyle=skin.glow;")
s=s.replace(" const glow=c.createRadialGradient(x,y,50,x,y,280);", " const skin=KP_SKINS[kpSkin(knifeS)];const glow=c.createRadialGradient(x,y,50,x,y,280);")
s=s.replace("glow.addColorStop(0,'#db9d7652');glow.addColorStop(.46,'#3d669c31');", "glow.addColorStop(0,skin.glow+'55');glow.addColorStop(.46,'#3d669c31');")
s=s.replace("c.shadowColor='#dd946b77';c.shadowBlur=24;c.fillStyle='#985b43';", "c.shadowColor=skin.glow;c.shadowBlur=22;c.fillStyle=skin.rim;")
s=s.replace("wood.addColorStop(0,knifePreset(knifeS.level).boss?'#e3ad72':'#d9aa7e');wood.addColorStop(.7,'#b67b5b');wood.addColorStop(1,'#714c45');", "wood.addColorStop(0,skin.wood[0]);wood.addColorStop(.7,skin.wood[1]);wood.addColorStop(1,skin.wood[2]);")
s=s.replace("c.strokeStyle=radius%2===1?'#81554372':'#eac49b7a';", "c.strokeStyle=radius%2===1?'#20314888':skin.grain;")
s=s.replace("c.fillStyle='#e89a55';", "c.fillStyle='#e89a55';")
s=s.replace("knifePreset(knifeS.level).boss?'★ BOSS ROUND'", "knifePreset(knifeS.level,kpMode(knifeS)).boss?'★ BOSS ROUND'")
# full flight substep: need fail function before knifeResolve
s=s.replace('function knifeResolve(){', '''function knifeFail(){
 knifeFlight=null;knifeS.over=true;knifeFlash=1;knifeSparks(310,284,'#f18a78',32);knifePlayTone(130,.24,'sawtooth');kpVibrate([45,45,80]);knifePersist();knifeUpdateHud();knifeAnnounce('칼이 부딪혔어요. 다시 도전할 수 있어요.');exFinish('칼이 부딪혔어요','꽂혀 있는 칼을 피해 빈 공간이 올 때 던져 보세요.');
}
function knifeResolve(){''')
old="if(knifeFlight){knifeFlight.progress+=dt/knifeFlight.duration;if(knifeFlight.progress>=1)knifeResolve()}"
new="""if(knifeFlight){
  // Multiple substeps prevent tunnelling when frame rate drops or wheel reverses.
  const n=Math.max(1,Math.ceil(dt/.006));for(let i=0;i<n&&knifeFlight;i++){
   knifeFlight.progress=Math.min(1,knifeFlight.progress+dt/(knifeFlight.duration*n));
   if(kpCollision(knifeS,Math.PI/2,knifeFlight.progress)){knifeFail();break}
   if(knifeFlight.progress>=1){knifeResolve();break}
  }
 }"""
assert old in s
s=s.replace(old,new)
# rewrite same tick to substep rotation too, not just projectile, by moving s.angle/elapsed into substeps
s=s.replace('knifeS.elapsed+=dt;knifeS.angle=kpWrap(knifeS.angle+kpSpeed(knifeS)*dt);if(knifeFlight){', 'if(knifeFlight){')
s=s.replace('knifeFlight.progress=Math.min(1,knifeFlight.progress+dt/(knifeFlight.duration*n));', 'knifeS.elapsed+=dt/n;knifeS.angle=kpWrap(knifeS.angle+kpSpeed(knifeS)*dt/n);knifeFlight.progress=Math.min(1,knifeFlight.progress+dt/(knifeFlight.duration*n));')
s=s.replace('if(knifeFlight.progress>=1){knifeResolve();break}\n  }\n }', 'if(knifeFlight.progress>=1){knifeResolve();break}\n  }\n }else{knifeS.elapsed+=dt;knifeS.angle=kpWrap(knifeS.angle+kpSpeed(knifeS)*dt)}')
# ui
s=s.replace('<div class="kp-hud">','''<div class="kp-tuning"><label>난이도<select id="kpMode" aria-label="칼 타이밍 난이도"><option value="relaxed">편안하게</option><option value="classic">클래식</option><option value="precision">챌린지</option></select></label><label>통나무 스킨<select id="kpSkin" aria-label="통나무 스킨"><option value="sunset">선셋 우드</option><option value="marine">딥 오션</option><option value="onyx">미드나이트</option></select></label><p>스킨은 기록에 영향을 주지 않아요. 난이도 변경 시 새 게임을 시작해요.</p></div><div class="kp-hud">''')
s=s.replace("if(knifeS.over){knifeS=knifeNewStage(1,0,0)} else if(knifeS.clear){knifeS=knifeNewStage(knifeS.level+1,knifeS.score,knifeS.apples)}", "if(knifeS.over){knifeS=knifeNewStage(1,0,0,kpMode(knifeS),kpSkin(knifeS))} else if(knifeS.clear){knifeS=knifeNewStage(knifeS.level+1,knifeS.score,knifeS.apples,kpMode(knifeS),kpSkin(knifeS))}")
# handlers on mode, skin
s=s.replace("const next=e=>{if(e.target.closest('#kpNextStage'))", """const tune=e=>{if(e.target.id==='kpSkin'){knifeS.skin=e.target.value in KP_SKINS?e.target.value:'sunset';knifePersist();knifeUpdateHud();return}
 if(e.target.id==='kpMode'){const mode=e.target.value;if(!KP_MODES[mode]||mode===kpMode(knifeS))return;if(!window.confirm('난이도를 변경하면 현재 스테이지가 초기화돼요. 계속할까요?')){e.target.value=kpMode(knifeS);return}
 const sound=knifeS.sound,skin=kpSkin(knifeS);knifeS=knifeNewStage(1,0,0,mode,skin);knifeS.sound=sound;knifeFlight=null;knifeParticles=[];knifeFlash=0;knifeLast=0;gameShell.paused=false;hideMask();knifePersist();knifeUpdateHud()}};
 knifeRoot.addEventListener('change',tune);
 const next=e=>{if(e.target.closest('#kpNextStage'))""")
s=s.replace("reset(){const sound=knifeS.sound;knifeS=knifeNewStage(1);knifeS.sound=sound;", "reset(){const sound=knifeS.sound,mode=kpMode(knifeS),skin=kpSkin(knifeS);knifeS=knifeNewStage(1,0,0,mode,skin);knifeS.sound=sound;")
s=s.replace("knifeRoot?.removeEventListener('click',click);", "knifeRoot?.removeEventListener('click',click);knifeRoot?.removeEventListener('change',tune);")
p.write_text(s)
css=Path(__file__).parent/'src/knife-premium.css';c=css.read_text();c+='''\n/* v1.8: accessible game difficulty and visual-only skins */
.kp-tuning{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center}
.kp-tuning label{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#162b46;color:#b8cee4;border:1px solid #46688999;border-radius:12px;padding:6px 9px;font-size:12px;font-weight:800}
.kp-tuning select{min-width:0;max-width:66%;border:1px solid #7092b35c;border-radius:8px;background:#243d5d;color:#f4f5f8;font-size:12px;font-weight:800;padding:8px 9px;outline-offset:3px}
.kp-tuning p{grid-column:1/-1;font-size:11px;color:#a6bcd3;margin:0 2px 2px}
@media(max-width:390px){.kp-tuning label{flex-direction:column;align-items:stretch}.kp-tuning select{max-width:none;width:100%}}
''';css.write_text(c)
print('patched knife',len(s),len(c))
