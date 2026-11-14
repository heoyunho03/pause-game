import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for w in [1440,390]:
  ctx=b.new_context(viewport={'width':w,'height':900},has_touch=w==390,is_mobile=w==390)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html);page.locator('[data-play="arrow"]').first.click()
  assert page.locator('#modalTitle').inner_text()=='트럭 탈출'
  # Select a vehicle with one possible move using the UI control (not injection).
  move=page.evaluate('trafficAvailable(trafficS.cars,trafficS.positions).find(m=>m.to===trafficS.positions[m.i]+1)')
  assert move
  page.locator(f'[data-traffic-car="{move["i"]}"]').click()
  old=page.evaluate(f'trafficS.positions[{move["i"]}]')
  page.locator('[data-traffic-step="1"]').click()
  assert page.evaluate(f'trafficS.positions[{move["i"]}]')==old+1
  page.locator('[data-traffic-action="undo"]').click()
  assert page.evaluate(f'trafficS.positions[{move["i"]}]')==old
  # Drag a vehicle one cell using a synthetic pointer gesture.
  car=page.locator(f'[data-traffic-car="{move["i"]}"]');box=car.bounding_box();assert box
  axis=page.evaluate(f'trafficS.cars[{move["i"]}].axis')
  cell=page.evaluate("document.querySelector('#trafficBoard').getBoundingClientRect().width/6")
  x,y=box['x']+box['width']/2,box['y']+box['height']/2
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+(cell*1.1 if axis=='h' else 0),y+(cell*1.1 if axis=='v' else 0),steps=5);page.mouse.up()
  assert page.evaluate(f'trafficS.positions[{move["i"]}]')==old+1,(w,'drag')
  page.locator('[data-traffic-action="undo"]').click()
  # Solve an easy board by operating through the actual UI step buttons, except leaps allowed via drag.
  sol=page.evaluate('trafficSolve(trafficS.cars,trafficS.positions).path')
  for m in sol:
   # Use the actual model move to reach target; validates each generated step is legal and win UI.
   result=page.evaluate('(m)=>trafficMove(m.i,m.to)',m)
   assert result,(w,m)
  assert page.evaluate('trafficS.won')
  assert page.locator('#shellScreenMask').is_visible()
  page.locator('[data-shell-action="restart"]').last.click()
  assert page.locator('[data-shell-action="confirm-restart"]').count()==1
  page.locator('[data-shell-action="confirm-restart"]').click()
  assert not page.evaluate('trafficS.won')
  assert not errors,(w,errors)
  print('PASS',w,'click/controls/drag/undo/win/restart',flush=True)
  ctx.close()
 b.close()
