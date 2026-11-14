import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 c=b.new_context(viewport={'width':390,'height':844},has_touch=True)
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_content(html)
 page.locator('#gamesGrid [data-play="poker"]').first.click()
 page.once('dialog',lambda d:d.dismiss())
 page.locator('#pkMode').select_option('hard')
 assert page.evaluate("pkS.mode==='normal'")
 page.once('dialog',lambda d:d.accept())
 page.locator('#pkMode').select_option('hard')
 assert page.evaluate("pkS.mode==='hard'")
 assert page.evaluate('pkValid(pkS)')
 # Fold is available only when a bet is outstanding; test through same actions.
 res=page.evaluate('''() => {
  let s=pkNew('hard');
  if(!pkAct(s,0,'bet'))throw Error('bet failed');
  if(!pkAct(s,1,'fold'))throw Error('fold failed');
  const fold=s.phase==='result'&&s.result.winner===0&&s.stacks[0]+s.stacks[1]===2000;
  s=pkNew('hard');
  if(!pkAct(s,0,'bet'))throw Error('bet failed');
  if(!pkAct(s,1,'raise'))throw Error('raise failed');
  const blocked=pkAct(s,0,'raise')===false;
  const call=pkAct(s,0,'call');
  const raised=blocked&&call&&s.phase==='draw'&&s.pot===100;
  s=pkNew('normal');s.phase='draw';s.selected=[0,2,4];
  const original=s.hand.slice(),before=new Set([...s.deck,...s.hand,...s.cpu]);
  if(!pkExchange(s))throw Error('exchange failed');
  const newcards=[0,2,4].every(i=>s.hand[i]!==original[i]);
  const held=[1,3].every(i=>s.hand[i]===original[i]);
  const valid=pkValid(s);
  return {fold,raised,held,newcards,valid};
 }''')
 assert all(res.values()),res
 # A fresh keyboard selection check, during DRAW only.
 page.evaluate("pkS.phase='draw';pkS.selected=[];pkDraw()")
 page.keyboard.press('1')
 assert page.evaluate('pkS.selected.includes(0)')
 page.keyboard.press('1')
 assert page.evaluate('pkS.selected.length===0')
 assert not errors,errors
 print('PASS difficulty confirmation, fold, raise cap, discard/hold, keyboard controls',res)
 b.close()
