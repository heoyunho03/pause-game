import os
from pathlib import Path
from playwright.sync_api import sync_playwright
HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for w,h in [(1440,900),(768,920),(390,844),(320,740)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=w<=390)
  page=ctx.new_page();err=[];page.on('pageerror',lambda e:err.append(str(e)))
  page.set_content(HTML)
  page.locator('#gamesGrid [data-play="block"]').first.click()
  assert page.locator('#bpBoard .bp-cell').count()==81,(w,'cells')
  assert page.locator('#bpTray [data-block9-piece]').count()==3
  assert page.evaluate('bpState.board.length')==81
  assert page.evaluate('bpValidSave(bpState)')
  initial=page.evaluate('bpState.score')
  page.locator('[data-block9-cell="0"]').click()
  assert page.evaluate('bpState.score')>initial,(w,'move failed')
  # direct injected board: single missing row/column/box intersections should clear exactly once
  target=page.evaluate('''()=>{const b=Array(81).fill(0);for(let c=0;c<9;c++)b[c]=1;for(let r=0;r<9;r++)b[r*9]=1;for(let r=0;r<3;r++)for(let c=0;c<3;c++)b[r*9+c]=1;const r=bpTargets(b);return {rows:r.rows,cols:r.cols,boxes:r.boxes,groups:r.groups,cleared:r.cleared.length}}''')
  assert target=={'rows':[0],'cols':[0],'boxes':[0],'groups':3,'cleared':21},target
  page.locator('[data-shell-action="pause"]').first.click()
  assert page.evaluate('gameShell.paused')
  page.locator('[data-shell-action="resume"]').click()
  assert not page.evaluate('gameShell.paused')
  page.locator('#closeModal').click()
  page.locator('#gamesGrid [data-play="block"]').first.click()
  assert page.evaluate('bpState.score')>initial
  xoverflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+2');assert not xoverflow,(w,'overflow')
  assert not err,(w,err)
  if w==1440:page.screenshot(path='/mnt/data/PAUSE_v08_block_desktop.png')
  if w==390:page.screenshot(path='/mnt/data/PAUSE_v08_block_mobile.png')
  page.locator('#closeModal').click();ctx.close()
  print('PASS',w,'board9', 'score',target, 'pause','restore','no_overflow')
 browser.close()
