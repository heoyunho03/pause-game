import os
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for w,height in [(1440,900),(768,1024),(390,844),(320,700)]:
  context=browser.new_context(viewport={'width':w,'height':height},has_touch=w<=390,device_scale_factor=1)
  page=context.new_page();err=[];page.on('pageerror',lambda x:err.append(str(x)))
  page.set_content(h)
  page.locator('#gamesGrid [data-play="bubble"]').first.click()
  assert page.locator('#bubblePremiumCanvas').is_visible()
  assert page.evaluate('gameShell.id')=='bubble'
  assert page.evaluate('bubbleCore.ROWS')==12
  assert page.evaluate('bubbleCore.COLORS === undefined') # use intended API
  assert page.locator('[data-bsp-tier]').count()==3
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'), f'overflow {w}'
  # Underlying pure logic: six neighbors, symmetric relation and group/fall.
  assert page.evaluate('''()=>{const B=bubbleCore,b=Array(B.ROWS*B.COLS).fill(null);return B.neighbors(B.index(5,3)).length===6&&B.neighbors(B.index(4,3)).includes(B.index(5,3))}''')
  result=page.evaluate('''()=>{const B=bubbleCore,b=Array(B.ROWS*B.COLS).fill(null);
    b[B.index(0,0)]=0;b[B.index(1,0)]=0;b[B.index(2,0)]=1;
    const j=B.index(1,1);b[j]=0;const out=B.removeClusters(b,j);
    return {pop:out.popped,drop:out.dropped,empty:out.board.every(v=>v===null)};}''')
  assert result=={'pop':3,'drop':1,'empty':True},(w,result)
  tiers=page.evaluate('''()=>Object.keys(bubbleCore.tiers).map(x=>[x,bubbleCore.fresh(x).board.filter(v=>v!==null).length])''')
  assert tiers[0][1]<tiers[2][1],tiers
  # Browser click and save.
  page.locator('[data-bsp-tier="easy"]').click()
  initial=page.evaluate('playStore.read("bubble-premium-v1",null).shots')
  page.locator('[data-bsp-fire]').click();page.wait_for_function('(n)=>playStore.read("bubble-premium-v1",null).shots===n', arg=initial+1, timeout=8000)
  assert page.evaluate('playStore.read("bubble-premium-v1",null).shots')==initial+1
  page.locator('[data-bsp-swap]').click()
  # Pause/resume and save.
  page.locator('[data-shell-action="pause"]').first.click()
  assert page.evaluate('gameShell.paused')
  page.locator('[data-shell-action="resume"]').first.click()
  assert not page.evaluate('gameShell.paused')
  snapshot=page.evaluate('playStore.read("bubble-premium-v1",null)')
  page.locator('#closeModal').click()
  page.locator('#gamesGrid [data-play="bubble"]').first.click()
  restored=page.evaluate('playStore.read("bubble-premium-v1",null)')
  assert restored==snapshot
  page.locator('[data-bsp-tier="normal"]').click()
  page.locator('[data-bsp-tier="easy"]').click()
  assert page.evaluate('playStore.read("bubble-premium-v1",null).shots')==initial+1
  assert not err,(w,err)
  print('PASS',w,'desktop/mobile input, game rules, persistence, pause, no errors',flush=True)
  context.close()
 browser.close()
