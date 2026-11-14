import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for w,touch in [(1440,False),(390,True)]:
  ctx=b.new_context(viewport={'width':w,'height':900},has_touch=touch)
  page=ctx.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html);page.locator('[data-play="block"]').first.click()
  tray=page.locator('[data-block9-piece="0"]'); cell=page.locator('[data-block9-cell="40"]'); rect=tray.bounding_box(); dest=cell.bounding_box();
  x=rect['x']+rect['width']/2;y=rect['y']+rect['height']/2;tx=dest['x']+dest['width']/2;ty=dest['y']+dest['height']/2;
  if touch:
   # Simulates a finger placed 66px below the projected block anchor.
   finger_y=ty+66
   d={'pointerId':9,'pointerType':'touch','clientX':x,'clientY':y,'isPrimary':True}
   tray.dispatch_event('pointerdown',d)
   tray.dispatch_event('pointermove',{**d,'clientX':tx,'clientY':finger_y})
   tray.dispatch_event('pointerup',{**d,'clientX':tx,'clientY':finger_y})
  else:
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(tx,ty,steps=8);page.mouse.up()
  assert page.evaluate('bpState.score')>0,(w,page.evaluate('bpState'))
  assert page.evaluate('!bpDrag')
  assert not errors,errors
  print('drag PASS',w,'score',page.evaluate('bpState.score'))
  ctx.close()
 b.close()
