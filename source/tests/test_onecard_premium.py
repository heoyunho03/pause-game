import os
from pathlib import Path
from playwright.sync_api import sync_playwright

html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for w,h in [(1440,900),(768,1024),(390,844),(320,700)]:
  ctx=b.new_context(viewport={'width':w,'height':h},has_touch=w<=390)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda err: errors.append(str(err)))
  page.set_content(html)
  page.locator('#gamesGrid [data-play="onecard"]').first.click()
  assert page.locator('#ocGame').is_visible()
  assert page.locator('#ocHand .oc-card-button').count()==7
  assert page.locator('.oc-bot').count()==2
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),w
  assert page.evaluate('ocValid(ocState)')
  assert page.evaluate('ocState.hands.flat().length+ocState.discard.length+ocState.deck.length')==54
  # Opponent attack: when human turn is under attack, cannot place ordinary card.
  assert page.evaluate('''()=>{let s=ocMake();s.turn=0;s.debt=2;s.attack=2;s.hands[0]=[1,12,52];return !ocLegal(s,0,1)&&ocLegal(s,0,52)}''') # 0=2, allowed even though >=2; correction below
  page.locator('#ocDraw').click()
  page.wait_for_timeout(1200)
  assert page.evaluate('ocValid(ocState)')
  page.locator('[data-shell-action="pause"]').first.click()
  assert page.evaluate('gameShell.paused')
  page.locator('[data-shell-action="resume"]').click()
  assert not page.evaluate('gameShell.paused')
  page.locator('#closeModal').click()
  page.locator('#gamesGrid [data-play="onecard"]').first.click()
  assert page.evaluate('ocValid(ocState)')
  assert not errors,errors
  if w==1440:
   page.screenshot(path='/mnt/data/PAUSE_v13_onecard_desktop.png',full_page=False)
  if w==390:
   page.screenshot(path='/mnt/data/PAUSE_v13_onecard_mobile.png',full_page=False)
  print('PASS viewport',w,'layout/launch/draw/CPU/pause/reopen')
  ctx.close()

 # Test pure game logic using full legal state simulation without UI/timers.
 page=b.new_page();page.set_content(html)
 page.locator('#gamesGrid [data-play="onecard"]').first.click()
 result=page.evaluate('''() => {
   // Core 54-card invariants, attack stacking, wild cards, K/J/Q effects.
   const out={};
   for (const mode of ['easy','normal','hard']) {
     for(let round=0;round<45;round++) {
       let s=ocMake(mode), steps=0;
       while(s.phase==='playing'&&steps++<520){
         if(!ocValid(s))throw Error('corrupt cards at '+mode+'/'+round+'/'+steps);
         const p=s.turn,opts=ocOptions(s,p);
         if(opts.length && (p===0||Math.random()>.18)) {
           const c=p===0?opts[Math.floor(Math.random()*opts.length)]:ocCpuChoice(s,p);
           if(!ocPlay(s,p,c,ocRank(c)===7?ocChooseSuit(s,p):undefined,p!==0||s.hands[p].length===2))throw Error('play rejected');
         } else ocTake(s,p);
       }
       if(!ocValid(s))throw Error('corrupt at finish');
     }
     out[mode]=45;
   }
   let s=ocMake(); s.turn=0;s.debt=5;s.attack=5;
   const c2=s.hands[0][0];s.hands[0]=[0,12,52,53];
   out.attack=ocLegal(s,0,52)&&ocLegal(s,0,53)&&!ocLegal(s,0,0)&&!ocLegal(s,0,12);
   // Fake 7 as a legal card, validate turn changes in isolation (without deck validity).
   const x=ocMake();x.turn=0;x.dir=1;x.hands[0].push(10); // Q of spades? rank(10)=12
   // Ensure Q is legal, same suit via forced activeSuit.
   x.activeSuit=0;ocPlay(x,0,10);out.reverse=x.dir===-1&&x.turn===2;
   return out;
 }''')
 assert result['easy']==45 and result['normal']==45 and result['hard']==45
 assert result['attack'] and result['reverse'],result
 print('PASS 135 randomized rounds/attack/reverse',result)
 b.close()
