from pathlib import Path
root=Path(__file__).parent/'src'
p=root/'sky-premium.js';s=p.read_text()
s=s.replace('const skyClamp=', "const SKY_MODES={relaxed:{name:'편안하게',speed:.80,spawn:.72},classic:{name:'클래식',speed:1,spawn:1},precision:{name:'챌린지',speed:1.15,spawn:1.23}};\nconst skyMode=s=>SKY_MODES[s?.mode]?s.mode:'classic';\nconst skyClamp=")
s=s.replace('function skyNew(seed){return{version:1,seed:',"function skyNew(seed,mode='classic'){return{version:1,mode,seed:")
s=s.replace('const difficult=Math.min(1,index/65),prev=s.safeLane;', 'const difficult=Math.min(1,index/65),prev=s.safeLane,modifier=SKY_MODES[skyMode(s)].spawn;')
s=s.replace('let chance=.20+difficult*.22;', 'let chance=Math.min(.80,(.20+difficult*.22)*modifier);')
s=s.replace("if(rnd()<chance)hazard", "if(rnd()<chance)hazard")
s=s.replace('function skySpeed(dist){return 14+Math.min(17,Math.sqrt(dist)*.55)}','function skySpeed(dist,mode=\'classic\'){return (14+Math.min(17,Math.sqrt(dist)*.55))*(SKY_MODES[mode]||SKY_MODES.classic).speed}')
s=s.replace('const speed=skySpeed(s.distance);','const speed=skySpeed(s.distance,skyMode(s));')
s=s.replace('<section class="sky-premium" aria-label="스카이 롤 무한 3D 게임"><div class="sky-hud">', '<section class="sky-premium" aria-label="스카이 롤 무한 3D 게임"><div class="arcade-options"><label>난이도 <select id="skyDifficulty"><option value="relaxed">편안하게</option><option value="classic">클래식</option><option value="precision">챌린지</option></select></label><span>거리 기록은 난이도별로 관리돼요.</span></div><div class="sky-hud">')
s=s.replace('if(s.over)s=skyNew();s.running=false;skyEnsure(s);', 'if(s.over)s=skyNew(undefined,skyMode(s));s.running=false;skyEnsure(s);')
s=s.replace("if(s.distance>playStore.number('best-rolling3d'))playStore.putNumber('best-rolling3d',Math.floor(s.distance))", "if(s.distance>playStore.number('best-rolling3d-'+skyMode(s)))playStore.putNumber('best-rolling3d-'+skyMode(s),Math.floor(s.distance));if(skyMode(s)==='classic'&&s.distance>playStore.number('best-rolling3d'))playStore.putNumber('best-rolling3d',Math.floor(s.distance))")
s=s.replace("playStore.number('best-rolling3d'),Math.floor(s.distance)","Math.max(playStore.number('best-rolling3d-'+skyMode(s)),skyMode(s)==='classic'?playStore.number('best-rolling3d'):0),Math.floor(s.distance)")
s=s.replace('skySpeed(s.distance).toFixed(0)', 'skySpeed(s.distance,skyMode(s)).toFixed(0)')
s=s.replace(' const launch=()=>', " const diff=root.querySelector('#skyDifficulty');diff.value=skyMode(s);const onDifficulty=e=>{const mode=e.target.value;if(!SKY_MODES[mode]||mode===skyMode(s))return;if(s.distance>0&&!window.confirm('난이도를 바꾸면 진행 중인 주행이 초기화돼요. 계속할까요?')){diff.value=skyMode(s);return}s=skyNew(undefined,mode);skyEnsure(s);skyActive.state=s;start.hidden=false;gameShell.paused=false;hideMask();save();stats()};diff.addEventListener('change',onDifficulty);\n const launch=()=>")
s=s.replace('reset(){s=skyNew();skyEnsure(s);','reset(){s=skyNew(undefined,skyMode(s));skyEnsure(s);')
s=s.replace('controls.forEach(b=>{b.removeEventListener(', "diff.removeEventListener('change',onDifficulty);controls.forEach(b=>{b.removeEventListener(")
p.write_text(s)
p=root/'runner-premium.js';s=p.read_text()
s=s.replace('const runClamp=', "const RUN_MODES={relaxed:{name:'편안하게',speed:.83,spawn:.72},classic:{name:'클래식',speed:1,spawn:1},precision:{name:'챌린지',speed:1.16,spawn:1.24}};\nconst runMode=s=>RUN_MODES[s?.mode]?s.mode:'classic';\nconst runClamp=")
s=s.replace('function runFresh(seed){return{version:1,seed:',"function runFresh(seed,mode='classic'){return{version:1,mode,seed:")
s=s.replace('function runSpeed(d){return 13+Math.min(15,Math.sqrt(Math.max(0,d))*.58)}', 'function runSpeed(d,mode=\'classic\'){return (13+Math.min(15,Math.sqrt(Math.max(0,d))*.58))*(RUN_MODES[mode]||RUN_MODES.classic).speed}')
s=s.replace('const challenge=Math.min(1,index/62),hazards=[];', 'const challenge=Math.min(1,index/62),hazards=[],modifier=RUN_MODES[runMode(s)].spawn;')
s=s.replace('if(r()<.74+challenge*.2)', 'if(r()<Math.min(.98,(.74+challenge*.2)*modifier))')
s=s.replace('let count=(r()<.12+challenge*.37)?2:1;', 'let count=(r()<Math.min(.85,(.12+challenge*.37)*modifier))?2:1;')
s=s.replace('if(index>14&&r()<.12+challenge*.18)', 'if(index>14&&r()<Math.min(.85,(.12+challenge*.18)*modifier))')
s=s.replace('s.distance+=runSpeed(s.distance)*dt;', 's.distance+=runSpeed(s.distance,runMode(s))*dt;')
s=s.replace(' <div class="run-hud">', ' <div class="arcade-options"><label>난이도 <select id="runDifficulty"><option value="relaxed">편안하게</option><option value="classic">클래식</option><option value="precision">챌린지</option></select></label><span>선택한 난이도별 최고 거리를 기록해요.</span></div><div class="run-hud">')
s=s.replace('if(s.over)s=runFresh();s.running=false;runEnsure(s);','if(s.over)s=runFresh(undefined,runMode(s));s.running=false;runEnsure(s);')
s=s.replace("if(s.distance>playStore.number(RUN_RECORD))playStore.putNumber(RUN_RECORD,Math.floor(s.distance))", "if(s.distance>playStore.number(RUN_RECORD+'-'+runMode(s)))playStore.putNumber(RUN_RECORD+'-'+runMode(s),Math.floor(s.distance));if(runMode(s)==='classic'&&s.distance>playStore.number(RUN_RECORD))playStore.putNumber(RUN_RECORD,Math.floor(s.distance))")
s=s.replace('playStore.number(RUN_RECORD)',"Math.max(playStore.number(RUN_RECORD+'-'+runMode(s)),runMode(s)==='classic'?playStore.number(RUN_RECORD):0)")
# previous replacement accidentally replaces inside save after string replace? examine on build
s=s.replace('runSpeed(s.distance))', 'runSpeed(s.distance,runMode(s)))')
s=s.replace(' const launch=()=>', " const diff=root.querySelector('#runDifficulty');diff.value=runMode(s);const onDifficulty=e=>{const mode=e.target.value;if(!RUN_MODES[mode]||mode===runMode(s))return;if(s.distance>0&&!window.confirm('난이도를 바꾸면 진행 중인 달리기가 초기화돼요. 계속할까요?')){diff.value=runMode(s);return}s=runFresh(undefined,mode);runEnsure(s);runnerActive.state=s;start.hidden=false;gameShell.paused=false;hideMask();save();stats()};diff.addEventListener('change',onDifficulty);\n const launch=()=>")
s=s.replace('reset(){s=runFresh();runEnsure(s);','reset(){s=runFresh(undefined,runMode(s));runEnsure(s);')
s=s.replace("root.querySelector('.run-pad').removeEventListener('click',onPad);", "root.querySelector('.run-pad').removeEventListener('click',onPad);diff.removeEventListener('change',onDifficulty);")
p.write_text(s)
css='''\n/* Shared accessible arcade difficulty control */
.arcade-options{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #4a67817b;border-radius:13px;background:#172b45;padding:9px 12px;color:#adc6df;font-size:11px}
.arcade-options label{display:flex;gap:11px;align-items:center;font-weight:800;white-space:nowrap}
.arcade-options select{min-height:36px;background:#263e5d;color:#f4f5f8;border:1px solid #7190b37d;border-radius:9px;padding:6px 10px;font:inherit;font-size:12px;font-weight:800}
.arcade-options span{font-size:10px;color:#a0b5cb;text-align:right}
@media(max-width:390px){.arcade-options{gap:6px}.arcade-options span{max-width:135px}}
'''
for name in ['sky-premium.css','runner-premium.css']:
 p=root/name;p.write_text(p.read_text()+css)
print('arcade options patched')
