import os
from pathlib import Path
from playwright.sync_api import sync_playwright
HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(1440,900),(390,844)]:
  c=browser.new_context(viewport={'width':width,'height':height},has_touch=width<500)
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_content(HTML)
  page.locator('#gamesGrid [data-play="hexa"]').first.click()
  page.locator('[data-hs-mode="easy"]').click()
  if page.evaluate("hsState.mode")!='easy':
   page.once('dialog',lambda d:d.accept());page.locator('[data-hs-mode="easy"]').click()
  tray=page.locator('[data-hs-tray="0"]');slot=page.locator('[data-hs-cell="9"]')
  # Ensure both elements appear in the same scroll viewport in a usable region.
  tray.scroll_into_view_if_needed();a=tray.bounding_box();b=slot.bounding_box()
  print('visibility positions:',width,'tray',a,'slot',b,flush=True)
  if b['y'] < 0:
   page.evaluate('document.querySelector("#modal").scrollTop -= 80')
   a=tray.bounding_box();b=slot.bounding_box()
  # A gesture from the tray to board; mouse synthesizes PointerEvents used by touch and mouse.
  page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2)
  page.mouse.down();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=12);page.mouse.up()
  state=page.evaluate('({moves:hsState.moves,slot:hsState.board[9]})')
  print('DRAG',width,state,flush=True)
  assert state['moves']==1,state
  assert state['slot'] is not None
  assert not errors,errors
  c.close()
 browser.close()
