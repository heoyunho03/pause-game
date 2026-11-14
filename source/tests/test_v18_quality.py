import os
from pathlib import Path
from playwright.sync_api import sync_playwright
HTML=(Path(__file__).parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(1440,900),(390,844),(320,700)]:
  context=b.new_context(viewport={'width':width,'height':height},has_touch=width<=390)
  page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(HTML,wait_until='domcontentloaded')
  assert page.locator('#gamesGrid [data-play]').count()>=12
  # SAT hitboxes correspond to the rendered blade dimensions at any angular position.
  page.locator('#gamesGrid [data-play="knife"]').first.click()
  result=page.evaluate('''() => {
    let s={angle:0,knives:[],obstacles:[Math.PI/2]};
    let direct={start:kpCollision(s,Math.PI/2,0),middle:kpCollision(s,Math.PI/2,.5),finish:kpCollision(s,Math.PI/2,1)};
    let far=kpCollision({angle:0,knives:[],obstacles:[0]},Math.PI/2,1);
    let caps=[];for(let i=1;i<=150;i++)for(let mode of Object.keys(KP_MODES)){let a=knifePreset(i,mode);if(a.need+a.presetKnives>11)throw Error('unfair knife count '+i+'/'+mode);caps.push(a.need+a.presetKnives)}
    return {direct,far,capsMaximum:Math.max(...caps)}
  }''')
  assert result['direct']=={'start':False,'middle':True,'finish':True},(width,result)
  assert result['far'] is False,(width,result)
  assert result['capsMaximum']<=11
  page.locator('#kpSkin').select_option('marine');assert page.evaluate('knifeS.skin')=='marine'
  page.locator('#kpSkin').select_option('onyx');assert page.evaluate('knifeS.skin')=='onyx'
  page.on('dialog',lambda dialog:dialog.accept())
  page.locator('#kpMode').select_option('precision');assert page.evaluate('knifeS.mode')=='precision'
  assert page.evaluate('knifeS.level')==1
  # Enemy at target centre path: a swept check must fail during flight, not only at arrival.
  page.evaluate('''() => {knifeS.angle=0;knifeS.obstacles=[Math.PI/2+.10];knifeS.knives=[];knifeS.fruit=[];knifeS.over=false;knifeS.clear=false;knifeS.elapsed=0;knifePersist()}''')
  page.locator('#kpShoot').click();page.wait_for_function('knifeS.over',timeout=2500)
  assert page.evaluate('knifeFlight===null')
  page.locator('[data-shell-action="restart"]').last.click()
  page.locator('[data-shell-action="confirm-restart"]').last.click()
  assert page.evaluate('knifeS.mode')=='precision'
  assert page.evaluate('knifeS.skin')=='onyx'
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+2')
  if width in (1440,390):page.screenshot(path=f'/mnt/data/PAUSE_v18_Knife_{width}.png',full_page=False)
  page.locator('#closeModal').click()
  # Validate runner hitboxes during actual lane transitions; jumping and sliding avoid corresponding obstacles.
  result=page.evaluate('''() => {
    let s=runFresh(123);s.running=true;s.x=RUN_LANES[1];
    const pillar={lane:1,type:'pillar'},near={lane:0,type:'pillar'};
    const centre=runHazardHit(s,pillar);s.x=RUN_LANES[1]+1.8;const edge=runHazardHit(s,pillar);
    s.x=RUN_LANES[1];s.jumpTime=.70;const jump=runHazardHit(s,{lane:1,type:'gap'});
    s.jumpTime=0;s.slideTime=.60;const slide=runHazardHit(s,{lane:1,type:'gate'});
    return {centre,edge,jump,slide,relaxed:runSpeed(0,'relaxed'),classic:runSpeed(0),precision:runSpeed(0,'precision')}
  }''')
  assert result['centre'] is True and not result['edge'] and not result['jump'] and not result['slide'],result
  assert result['relaxed']<result['classic']<result['precision'],result
  page.locator('#gamesGrid [data-play="runner"]').first.click()
  page.locator('#runDifficulty').select_option('relaxed');assert page.evaluate('runnerActive.state.mode')=='relaxed'
  page.locator('#runDifficulty').select_option('precision');assert page.evaluate('runnerActive.state.mode')=='precision'
  page.locator('#closeModal').click()
  page.locator('#gamesGrid [data-play="rolling"]').first.click()
  page.locator('#skyDifficulty').select_option('relaxed');assert page.evaluate('skyActive.state.mode')=='relaxed'
  page.locator('#skyDifficulty').select_option('precision');assert page.evaluate('skyActive.state.mode')=='precision'
  x=page.evaluate('''() => {
    let s=skyNew(123);s.age=0;s.x=SKY_LANES[2];const hit=skyHazardHit(s,{lane:2,type:'wall',phase:0});
    s.x=SKY_LANES[3];const safe=!skyHazardHit(s,{lane:2,type:'wall',phase:0});
    return{hit,safe,relaxed:skySpeed(0,'relaxed'),classic:skySpeed(0),precision:skySpeed(0,'precision')}
  }''')
  assert x['hit'] and x['safe'] and x['relaxed']<x['classic']<x['precision'],x
  page.locator('#closeModal').click()
  assert not errors,(width,errors)
  print('PASS',width,'knife SAT + flight collision / skins / difficulty / runner+sky hitboxes / JS errors',flush=True)
  context.close()
 b.close()
