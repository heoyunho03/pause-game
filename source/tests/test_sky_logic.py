import os
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page()
 page.set_content(Path(__file__).resolve().parents[1].joinpath('index.html').read_text())
 result=page.evaluate('''() => {
  const results=[];for(let seed=1;seed<=50;seed++){
    let state=skyNew(seed);skyEnsure(state);let minFree=5,rows=0;for(let idx=0;idx<350;idx++){
      state.distance=idx*SKY_STEP;skyEnsure(state);
      let row=state.near.find(r=>r.index===idx);if(!row)return{error:'missing row '+idx,seed};
      let free=[0,1,2,3,4].filter(k=>!row.hazard.some(h=>h.lane===k));if(!free.length)return{error:'all blocked',idx,seed};minFree=Math.min(minFree,free.length);rows++;
      let max=Math.max(0,...row.hazard.map(h=>h.lane));if(max>4)return{error:'bad lane',idx,seed};
    }
    results.push({seed,rows,minFree});
  }
  let test=skyNew(123);skyEnsure(test);test.running=true;test.target=0;
  for(let i=0;i<600;i++){skyTick(test,1/60);if(test.over)break;}
  let unbounded=skyNew(123);skyEnsure(unbounded);unbounded.distance=100000;skyEnsure(unbounded);
  return {trials:results.length,rows:results.reduce((s,t)=>s+t.rows,0),speed0:skySpeed(0),speed1000:skySpeed(1000),speedInf:skySpeed(100000),memoryRows:unbounded.near.length,nearCount:unbounded.nextRow,snapshot:{dist:test.distance,over:test.over}};
 }''')
 assert result['trials']==50 and result['rows']==17500 and result['memoryRows']<30,result
 assert result['speed0']<result['speed1000']<=result['speedInf'],result
 print('PASS procedural generation & memory bounds:',result,flush=True)
 b.close()
