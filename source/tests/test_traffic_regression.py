import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for w,hg in [(1440,900),(390,844)]:
  page=b.new_page(viewport={'width':w,'height':hg});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(h)
  assert page.locator('.game-card').count()==12
  for gid in ['2048','mines','block','sudoku','rolling','runner','poker','onecard','hexa','bubble','arrow','knife']:
   page.locator(f'[data-play="{gid}"]').first.click()
   assert page.evaluate('gameShell.id')==gid,(w,gid)
   assert page.locator('.pause-shell').is_visible(),(w,gid)
   page.locator('#closeModal').click()
  assert not errors,(w,errors)
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2')
  print('PASS',w,'12 playable modules','no pageerrors',flush=True)
  if w==1440:
   page.locator('[data-play="arrow"]').first.click();page.screenshot(path='/mnt/data/PAUSE_v11_traffic_desktop.png')
  if w==390:
   page.locator('[data-play="arrow"]').first.click();page.screenshot(path='/mnt/data/PAUSE_v11_traffic_mobile.png')
  page.close()
 b.close()
