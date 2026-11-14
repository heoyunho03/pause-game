import os
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).resolve().parents[1]/'index.html'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(1440,900),(390,844),(320,760),(768,1024)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(src.read_text(),wait_until='domcontentloaded')
  assert page.locator('.game-card').count()==12
  page.locator('[data-play="rolling"]').first.click()
  page.wait_for_timeout(400)
  assert page.locator('#skyView').is_visible()
  assert page.locator('#skyFallback').is_hidden(),(width, page.locator('#skyFallback').text_content())
  assert page.evaluate('Boolean(document.querySelector("#skyCanvas").getContext("webgl") || document.querySelector("#skyCanvas").getContext("2d"))'),('no renderer',width)
  print('viewport',width,'canvas',page.evaluate('({w:document.querySelector("#skyCanvas").width,h:document.querySelector("#skyCanvas").height})'),'err',errors,flush=True)
  if width in [1440,390]:page.screenshot(path=f'/mnt/data/PAUSE_v16_sky_{width}_pre.png')
  page.locator('#skyPlay').click()
  page.wait_for_timeout(1000)
  assert page.evaluate('skyActive?.state.running')
  dist=page.evaluate('skyActive.state.distance')
  assert dist>10,(width,dist)
  rect=page.locator('#skyCanvas').bounding_box()
  page.mouse.move(rect['x']+rect['width']*.5,rect['y']+rect['height']*.7);page.mouse.down();page.mouse.move(rect['x']+rect['width']*.7,rect['y']+rect['height']*.7,steps=4);page.mouse.up()
  page.keyboard.down('ArrowLeft');page.wait_for_timeout(110);page.keyboard.up('ArrowLeft')
  page.locator('[data-shell-action="pause"]').first.click()
  paused=page.evaluate('skyActive.state.distance')
  page.wait_for_timeout(180)
  assert abs(page.evaluate('skyActive.state.distance')-paused)<.001,(width,'pause not working')
  page.get_by_role('button',name='▶ 이어하기').click()
  page.locator('[data-shell-action="home"]').first.click()
  assert not page.locator('#modalBackdrop').evaluate('(el)=>el.classList.contains("open")')
  page.locator('[data-play="rolling"]').first.click()
  restored=page.evaluate('skyActive.state.distance')
  assert restored>=dist-2,(width,'not restored',restored,dist)
  if width in [1440,390]:
   page.screenshot(path=f'/mnt/data/PAUSE_v16_sky_{width}.png')
  assert not errors,(width,errors)
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),width
  print('PASS',width,'distance',round(dist,1),'restored',round(restored,1),flush=True)
  page.close()
 b.close()
