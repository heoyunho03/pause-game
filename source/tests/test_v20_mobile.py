import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 for width in [390,320]:
  b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':width,'height':844})
  e=[];page.on('pageerror',lambda x:e.append(str(x)))
  page.set_content(html,wait_until='domcontentloaded',timeout=15000)
  print(width,'cards',page.locator('.game-card').count(),'overflow',page.evaluate('document.documentElement.scrollWidth-window.innerWidth'),flush=True)
  assert page.locator('.game-card').count()==12
  if width==390:page.screenshot(path='/mnt/data/PAUSE_v2_0_Mobile.png',full_page=True,animations='disabled',timeout=10000)
  page.locator('[data-play="sudoku"]').first.click(timeout=3000)
  print('sudoku',page.evaluate('gameShell.id'),'shell',page.locator('.pause-shell').count(),flush=True)
  assert page.locator('.pause-shell').count()==1
  if width==390:page.screenshot(path='/mnt/data/PAUSE_v2_0_Game_Mobile.png',animations='disabled',timeout=10000)
  page.locator('#closeModal').click(timeout=3000)
  print('errors',e,flush=True)
  b.close()
