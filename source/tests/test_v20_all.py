import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
games=['2048','mines','block','sudoku','arrow','hexa','bubble','knife','poker','onecard','rolling','runner']
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1366,'height':830})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(h,wait_until='domcontentloaded',timeout=25000)
 for gid in games:
  try:
   page.evaluate('(id)=>openModal(id)',gid)
   ok=page.evaluate('(id)=>gameShell.id===id && Boolean(gameShell.controller) && document.querySelector(".pause-shell")?.dataset.currentGame===id',gid)
   assert ok,gid
   page.evaluate('closeModal()')
   print('PASS',gid,flush=True)
  except Exception as e:
   print('FAIL',gid,str(e)[:300],flush=True)
   raise
 print('JS errors',errors[:3],flush=True)
 assert not errors,errors
 page.evaluate("openModal('onecard')")
 page.evaluate('closeModal()')
 page.evaluate("chooseNav('continue')")
 print('recent ids',page.locator('.game-card').count(),page.locator('.game-card').first.get_attribute('data-game-id'),flush=True)
 assert page.locator('.game-card').first.get_attribute('data-game-id')=='onecard'
 assert page.locator('.game-card').count()==12
 page.evaluate("chooseNav('favorites')")
 assert page.locator('.game-card').count()==0
 page.locator('#emptyReset').click(timeout=5000)
 assert page.locator('.game-card').count()==12
 page.locator('#randomGameButton').click(timeout=5000)
 assert page.evaluate('Boolean(gameShell.controller)')
 print('PASS recent, empty-reset, random, 12 modules',flush=True)
 b.close()
