import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for name in ['rolling','runner']:
  page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_content(h,wait_until='domcontentloaded')
  page.locator(f'[data-play="{name}"]').first.click();page.locator('#skyPlay' if name=='rolling' else '#runPlay').click()
  page.wait_for_timeout(450)
  page.screenshot(path=f'/mnt/data/PAUSE_v19_{name}_playing_390.png')
  if name=='rolling':
   print(name,page.evaluate('({distance:skyActive.state.distance,x:skyActive.state.x,curve:skyCurve(skyActive.state.seed,skyActive.state.distance),flow:skyActive.state.flow})'),flush=True)
  else:
   page.locator('[data-run="up"]').click();page.wait_for_timeout(100)
   print(name,page.evaluate('({distance:runnerActive.state.distance,lane:runnerActive.state.lane,combo:runnerActive.state.combo,stunts:runnerActive.state.stunts})'),flush=True)
  print('errors',errors,flush=True);assert not errors
  page.close()
 b.close()
