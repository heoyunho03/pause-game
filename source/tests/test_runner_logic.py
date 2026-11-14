import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page();page.set_content(h)
 result=page.evaluate('''() => {
 let n=0, maxRows=0, hasHazards=0;
 for(let seed=1;seed<=80;seed++){
   let s=runFresh(seed);s.running=true;
   // Generate 500 rows, guarantee never block all three lanes and no unsafe initial stage.
   for(let i=0;i<500;i++) {let row=runBuildRow(s);n++;
      if(row.hazards.length)hasHazards++;
      if(row.hazards.length>3)throw Error('too many hazards');
      let dead=[0,1,2].every(j=>row.hazards.some(h=>h.lane===j && h.type==='pillar'));
      if(dead)throw Error('all lanes unavoidably blocked');
      if(i<4&&row.hazards.length)throw Error('tutorial unsafe');
   }
   s.distance=100000;runEnsure(s);maxRows=Math.max(maxRows,s.rows.length);
   if(s.rows.length>13)throw Error('unbounded row storage');
 }
 // Test all obstacle classes and actual impact / prevention.
 for(const type of ['pillar','gap','hurdle','gate']){
   let s=runFresh(123);s.rows=[{index:1,hazards:[{lane:1,type}],gems:[],checked:false}];s.nextRow=2;s.running=true;s.distance=RUN_STEP-.5;runStep(s,.05);
   if(!s.over)throw Error(type+' should collide');
 }
 let jump=runFresh(234);jump.running=true;jump.jumpTime=.70;jump.distance=RUN_STEP-.5;jump.rows=[{index:1,hazards:[{lane:1,type:'gap'}],gems:[],checked:false}];jump.nextRow=2;runStep(jump,.05);if(jump.over)throw Error('jump should clear gap');
 let slide=runFresh(235);slide.running=true;slide.slideTime=.6;slide.distance=RUN_STEP-.5;slide.rows=[{index:1,hazards:[{lane:1,type:'gate'}],gems:[],checked:false}];slide.nextRow=2;runStep(slide,.05);if(slide.over)throw Error('slide should clear gate');
 let stuck=runFresh(1);stuck.running=true;runMove(stuck,'left');if(stuck.lane!==0)throw Error('left lane');runMove(stuck,'left');if(stuck.lane!==0)throw Error('overshoot');
 return {generated:n,withHazards:hasHazards,maxRows};}''')
 print('PASS generator',result)
 assert result['generated']==40000
 assert result['withHazards']>15000
 page.close();b.close()
