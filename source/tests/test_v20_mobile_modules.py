import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
ids=['2048','mines','block','sudoku','arrow','hexa','bubble','knife','poker','onecard','rolling','runner']
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':390,'height':844});e=[];page.on('pageerror',lambda x:e.append(str(x)))
 page.set_content(h)
 for gid in ids:
  page.evaluate('(id)=>openModal(id)',gid)
  assert page.evaluate('Boolean(gameShell.controller)')
  over=page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
  assert over<=1,(gid,over)
  if gid in ['knife','runner']:
   page.screenshot(path=f'/mnt/data/PAUSE_v2_0_{gid}_Mobile.png',animations='disabled',timeout=8000)
  page.evaluate('closeModal()')
  print('PASS mobile',gid,flush=True)
 assert not e,e
 b.close()
