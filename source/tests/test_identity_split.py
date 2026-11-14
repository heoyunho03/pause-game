import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)));page.set_content(h,wait_until='domcontentloaded')
 ans=page.evaluate('''() => {
  const same=[skyCurve(123,0),skyCurve(123,180),skyCurve(123,360)];
  if(new Set(same.map(x=>x.toFixed(3))).size<3)throw Error('sky curve static');
  let ball=skyNew(123);ball.running=true;ball.target=3;skyEnsure(ball);
  skyTick(ball,1/60);const inertia=ball.vx,oldX=ball.x;
  if(!(inertia>0&&ball.x>0&&ball.x<.4))throw Error('no inertia');
  ball.target=ball.x;skyTick(ball,1/60);if(!(ball.x>oldX))throw Error('no continued glide');
  let fall=skyNew(123);fall.running=true;fall.x=8;fall.target=8;skyEnsure(fall);skyTick(fall,1/60);if(!fall.over||!fall.reason.includes('떨어졌'))throw Error('no edge fall');
  let run=runFresh(123);run.running=true;run.rows=[{index:1,hazards:[{lane:1,type:'gate'}],gems:[],checked:false}];run.nextRow=2;run.distance=RUN_STEP-.3;run.slideTime=.65;runStep(run,.05);if(run.over||run.stunts!==1||run.combo!==1||run.style<=0)throw Error('runner does not reward parkour');
  const other=runFresh(123);other.running=true;other.rows=[{index:1,hazards:[{lane:1,type:'pillar'}],gems:[],checked:false}];other.nextRow=2;other.distance=RUN_STEP-.3;runStep(other,.05);if(!other.over)throw Error('runner obstacle missing');
  return {curve:same,inertia,ballX:ball.x,fall:fall.reason,combo:run.combo,style:run.style};
 }''')
 assert not errs,errs
 print('PASS independent physics, track curve, fall, parkour action-combo',ans,flush=True)
 for game in ['rolling','runner']:
  page.locator('[data-play="'+game+'"]').first.click();page.wait_for_timeout(160)
  assert (page.locator('.sky-premium') if game=='rolling' else page.locator('.run-premium')).is_visible()
  if game=='rolling':assert page.locator('#skyFlow').count()==1
  else:assert page.locator('#runCombo').count()==1
  page.screenshot(path=f'/mnt/data/PAUSE_v19_{game}_mobile.png')
  page.locator('[data-shell-action="home"]').first.click()
 assert not errs,errs
 assert page.locator('.game-card').count()==12
 print('PASS mobile preview both games 12 card regression',flush=True)
 page.close();browser.close()
