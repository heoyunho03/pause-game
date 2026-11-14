import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
ids=['2048','mines','block','sudoku','arrow','hexa','bubble','knife','poker','onecard','rolling','runner']
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 for w,hgt in [(1440,900),(768,1024),(390,844),(320,720)]:
  c=b.new_context(viewport={'width':w,'height':hgt},device_scale_factor=1)
  page=c.new_page(); errors=[]
  page.on('pageerror',lambda x:errors.append(str(x)))
  page.set_content(h,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_timeout(180)
  n=page.locator('#gamesGrid .game-card').count()
  overflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth+1')
  assert n==12,(w,n,errors)
  assert not overflow,(w,'overflow',page.evaluate('document.documentElement.scrollWidth'))
  assert page.locator('.cover-launch').count()==12
  page.locator('#librarySort').select_option('short')
  assert page.locator('.game-card').first.get_attribute('data-game-id') in ['rolling','runner','knife']
  page.locator('#librarySort').select_option('default')
  page.locator('#searchBox').click()
  page.locator('#searchInput').fill('스도쿠')
  assert page.locator('.game-card').count()==1
  page.locator('#searchInput').fill('')
  if w==1440:
   page.screenshot(path='/mnt/data/PAUSE_v2_0_Desktop.png',full_page=True,animations='disabled')
  if w==390:
   page.screenshot(path='/mnt/data/PAUSE_v2_0_Mobile.png',full_page=True,animations='disabled')
  # test library launch and pause shell from the new markup
  page.locator('[data-play="2048"]').first.click()
  assert page.locator('.pause-shell').is_visible()
  assert page.locator('.shell-tip-label').count()==1
  assert page.locator('.game-cell').count()==16
  page.keyboard.press('ArrowLeft')
  page.locator('[data-shell-action="pause"]').click()
  assert page.get_by_text('잠시 쉬어가요.').is_visible()
  page.locator('[data-shell-action="resume"]').click()
  page.locator('#closeModal').click()
  assert not errors,(w,errors)
  print('PASS viewport',w,'cards',n,'overflow',overflow,'errors',len(errors),flush=True)
  c.close()
 # run per-game mount/close with standalone page, faster test
 c=b.new_context(viewport={'width':1280,'height':800})
 page=c.new_page(); errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
 page.set_content(h,wait_until='domcontentloaded',timeout=30000)
 for gid in ids:
  page.locator(f'[data-play="{gid}"]').first.click(timeout=6000)
  assert page.evaluate('gameShell.id')==gid,gid
  assert page.evaluate('!!gameShell.controller'),gid
  assert page.locator('.pause-shell .shell-stage').count()==1
  page.locator('#closeModal').click(timeout=6000)
  print('PASS game',gid,flush=True)
 assert not errors,errors
 page.locator('#randomGameButton').click()
 assert page.evaluate('!!gameShell.controller')
 page.locator('#closeModal').click()
 print('PASS random play',flush=True)
 c.close();b.close()
