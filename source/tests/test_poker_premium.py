import os
from pathlib import Path
from playwright.sync_api import sync_playwright

HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for w,h in [(1440,900),(768,1024),(390,844),(320,700)]:
  context=browser.new_context(viewport={'width':w,'height':h},has_touch=w<=390)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML)
  page.locator('#gamesGrid [data-play="poker"]').first.click()
  assert page.locator('#pkGame').is_visible()
  assert page.locator('#pkHand .pk-card-button').count()==5
  assert page.evaluate('pkValid(pkS)')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
  assert page.locator('#pkPot').inner_text()=='20'
  assert page.locator('#pkControls [data-pk-action="check"]').is_visible()
  page.locator('#pkControls [data-pk-action="check"]').click()
  # If CPU bets, call (or fold as fallback). Otherwise the draw phase starts.
  if page.evaluate("pkS.phase==='bet1'"):
   assert page.locator('[data-pk-action="call"]').is_visible()
   page.locator('[data-pk-action="call"]').click()
  assert page.evaluate("pkS.phase==='draw'"),page.evaluate('pkS.phase')
  page.locator('[data-pk-card="0"]').click()
  assert page.locator('[data-pk-card="0"]').get_attribute('aria-pressed')=='true'
  page.locator('[data-pk-action="exchange"]').click()
  assert page.evaluate("pkS.phase==='bet2'")
  assert page.evaluate('pkValid(pkS)')
  page.locator('[data-pk-action="check"]').click()
  if page.evaluate("pkS.phase==='bet2'"):
   page.locator('[data-pk-action="call"]').click()
  assert page.evaluate("pkS.phase==='result'")
  assert page.locator('#pkResult').is_visible()
  assert page.evaluate('pkValid(pkS)')
  page.locator('[data-pk-action="next"]').click()
  assert page.evaluate("pkS.phase==='bet1'")
  page.locator('[data-shell-action="pause"]').first.click()
  assert page.evaluate('gameShell.paused')
  page.locator('[data-shell-action="resume"]').click()
  assert not page.evaluate('gameShell.paused')
  page.locator('#closeModal').click()
  page.locator('#gamesGrid [data-play="poker"]').first.click()
  assert page.evaluate('pkValid(pkS)')
  assert not errors,errors
  if w in [1440,390]:
   page.screenshot(path=f'/mnt/data/PAUSE_v14_poker_{w}.png')
  print('PASS viewport',w,'launch/betting/draw/showdown/restart/pause/reopen')
  context.close()
 page=browser.new_page();page.set_content(HTML)
 page.locator('#gamesGrid [data-play="poker"]').first.click()
 res=page.evaluate('''() => {
  const cid=(r,s)=>s*13+r-2;
  const hand=(ranks,suits)=>ranks.map((r,i)=>cid(r,suits[i]));
  const evaluate=(rs,ss)=>pkEval(hand(rs,ss));
  const tests={};
  tests.royal=evaluate([10,11,12,13,14],[0,0,0,0,0]).name==='로열 플러시';
  tests.wheel=evaluate([14,2,3,4,5],[0,1,2,3,0]).kickers[0]===5;
  tests.quads=evaluate([9,9,9,9,14],[0,1,2,3,0]).category===7;
  tests.full=evaluate([7,7,7,2,2],[0,1,2,0,1]).category===6;
  tests.flush=evaluate([2,4,8,10,13],[1,1,1,1,1]).category===5;
  tests.straight=evaluate([3,4,5,6,7],[0,1,0,1,2]).category===4;
  tests.triple=evaluate([8,8,8,2,14],[0,1,2,0,0]).category===3;
  tests.twopair=evaluate([13,13,5,5,14],[0,1,0,1,0]).category===2;
  tests.pair=evaluate([3,3,6,9,12],[0,1,0,1,0]).category===1;
  tests.high=evaluate([2,4,7,10,13],[0,1,0,1,2]).category===0;
  tests.kicker=pkCompare(hand([9,9,14,10,6],[0,1,2,3,0]),hand([9,9,13,10,6],[2,3,0,1,2]))>0;
  tests.suitTie=pkCompare(hand([2,4,6,8,10],[0,0,0,0,0]),hand([2,4,6,8,10],[2,2,2,2,2]))===0;
  tests.duplicateBlocked=!pkValid({...pkNew(),hand:[0,0,1,2,3]});
  // Run games by automatically choosing only legal moves (no test-only win hooks).
  const counts={easy:0,normal:0,hard:0};
  for(const mode of Object.keys(counts)){
   let s=pkNew(mode);
   for(let handNo=0;handNo<80;handNo++){
    if(!pkValid(s))throw Error('invalid poker deck before '+mode+' '+handNo);
    const chipsAtStart=s.stacks[0]+s.stacks[1]+s.pot;
    let actions=0;
    while(s.phase!=='result'&&actions++<30){
      if(s.phase==='draw'){s.selected=pkDiscardChoice(s.hand);if(!pkExchange(s))throw Error('bad draw');continue}
      if(s.actor===1){pkDriveCpu(s);continue}
      const options=pkOptions(s);
      if(!options.length)throw Error('no legal actions in '+s.phase);
      const preferred=options.includes('check')?'check':options.includes('call')?'call':options.includes('fold')?'fold':options[0];
      if(!pkAct(s,0,preferred))throw Error('rejected '+preferred);
      if(s.phase!=='result')pkDriveCpu(s);
    }
    if(s.phase!=='result'||!pkValid(s))throw Error('did not settle '+mode+' '+handNo);
    if(s.stacks.reduce((a,b)=>a+b,0)!==chipsAtStart)throw Error('chip conservation failed');
    s=pkNew(mode,s);counts[mode]++;
   }
  }
  return {tests,counts};
 }''')
 assert all(res['tests'].values()),res['tests']
 assert res['counts']=={'easy':80,'normal':80,'hard':80},res
 print('PASS hand ranking/kickers/deck/chips',res)
 browser.close()
