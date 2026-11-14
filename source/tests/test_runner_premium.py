import os
from pathlib import Path
from playwright.sync_api import sync_playwright
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(1440,900),(390,844),(320,760),(768,1024)]:
  page=b.new_page(viewport={'width':width,'height':height});errs=[];page.on('pageerror',lambda e:errs.append(str(e)));page.set_content(h,wait_until='domcontentloaded')
  assert page.locator('.game-card').count()==12
  page.locator('[data-play="runner"]').first.click();page.wait_for_timeout(350)
  assert page.locator('.run-premium').is_visible()
  assert page.locator('#runUnavailable').is_hidden(),(width,'no renderer')
  assert page.evaluate('Boolean(document.querySelector("#runCanvas").width)')
  page.locator('#runPlay').click();page.wait_for_timeout(670)
  assert page.evaluate('runnerActive.state.distance')>5,(width,'no movement')
  old=page.evaluate('runnerActive.state.lane');page.keyboard.press('ArrowLeft');page.wait_for_timeout(70)
  new=page.evaluate('runnerActive.state.lane');assert new==max(0,old-1),(width,'key left',new)
  page.locator('[data-run="up"]').click();assert page.evaluate('runnerActive.state.jumpTime')>0
  page.locator('[data-shell-action="pause"]').first.click();pause=page.evaluate('runnerActive.state.distance');page.wait_for_timeout(140);assert abs(page.evaluate('runnerActive.state.distance')-pause)<.001
  page.get_by_role('button',name='▶ 이어하기').click()
  page.locator('#closeModal').click();page.locator('[data-play="runner"]').first.click()
  assert page.evaluate('runnerActive.state.distance')>=pause-1,(width,'restore')
  page.wait_for_timeout(200)
  if width in (1440,390): page.screenshot(path=f'/mnt/data/PAUSE_v17_runner_{width}.png')
  assert not errs,(width,errs)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(width,'horizontal overflow')
  print('PASS width',width,'dist',round(pause,1),'errors',errs,flush=True)
  page.close()
 b.close()
