import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
ids=['2048','mines','block','sudoku','arrow','hexa','bubble','knife','poker','onecard','rolling','runner']
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']); context=b.new_context(viewport={'width':1280,'height':850}); page=context.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 for id in ids:
  page.locator(f'#gamesGrid [data-play="{id}"]').first.click(timeout=6000)
  assert page.evaluate('gameShell.id')==id,id
  assert page.evaluate('!!gameShell.controller'),id
  page.locator('#closeModal').click()
  print('PASS game module:',id,flush=True)
 assert not errors,errors
 b.close()
