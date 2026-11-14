import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for name,w,h in [('desktop',1440,1000),('mobile',390,844)]:
  c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,has_touch=w<500)
  page=c.new_page();page.set_content(html)
  page.locator('[data-play="sudoku"]').first.click()
  page.locator('#modal').screenshot(path=f'/mnt/data/PAUSE_v09_sudoku_{name}_clean.png',animations='disabled')
  c.close()
 browser.close()
