import os
from pathlib import Path
from playwright.sync_api import sync_playwright
content=Path('/mnt/data/PAUSE_v04_dev/index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,height,label in [(1440,900,'desktop'),(390,844,'mobile'),(320,720,'small')]:
  ctx=b.new_context(viewport={'width':width,'height':height});page=ctx.new_page();page.set_content(content)
  page.locator('[data-play="2048"]').first.click();page.screenshot(path=f'/mnt/data/PAUSE_v04_{label}_2048.png',full_page=False)
  page.locator('[data-shell-action="home"]').first.click();page.locator('[data-play="mines"]').first.click();page.locator('.mine-cell').first.click();page.screenshot(path=f'/mnt/data/PAUSE_v04_{label}_mines.png',full_page=False)
  ctx.close()
 b.close()
