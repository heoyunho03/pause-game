import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from statistics import mean
h=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,height in [(1440,900),(768,1000),(390,844),(320,740)]:
  context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<=390)
  page=context.new_page();errs=[];page.on('pageerror',lambda x: errs.append(str(x)))
  page.set_content(h)
  page.locator('[data-play="arrow"]').first.click()
  assert page.locator('.traffic-car').count()>=5
  assert page.locator('.traffic-grid .traffic-cell').count()==36
  assert page.locator('.traffic-difficulty button').count()==3
  print('width',width,'initial',page.evaluate('({tier:trafficS.tier,depth:trafficS.optimal,vehicles:trafficS.cars.length})'),flush=True)
  for tier in ['easy','normal','hard']:
   page.locator(f'[data-traffic-tier="{tier}"]').click()
   depths=[];hashes=[]
   for i in range(3):
    d=page.evaluate('''()=>{const sol=trafficSolve(trafficS.cars,trafficS.positions);return {depth:sol?.moves,optimal:trafficS.optimal,hash:trafficS.hash}}''')
    assert d['depth'] == d['optimal'],(width,tier,i,d)
    assert {'easy':(2,5),'normal':(6,9),'hard':(10,18)}[tier][0] <= d['depth'] <= {'easy':(2,5),'normal':(6,9),'hard':(10,18)}[tier][1],(width,tier,i,d)
    depths.append(d['depth']);hashes.append(d['hash'])
    page.locator('[data-traffic-action="new"]').click()
   print(' ',tier,depths,'unique',len(set(hashes)),flush=True)
  page.locator('[data-traffic-tier="easy"]').click()
  page.locator('.traffic-car').first.click()
  sol=page.evaluate('trafficSolve(trafficS.cars,trafficS.positions).path')
  first=sol[0]
  page.evaluate('(m)=>{trafficMove(m.i,m.to)}',first)
  assert page.evaluate('trafficS.moves')==1
  page.locator('[data-traffic-action="undo"]').click()
  assert page.evaluate('trafficS.moves')==0
  page.locator('[data-traffic-action="hint"]').click()
  assert page.evaluate('trafficS.hints')==1
  page.locator('[data-shell-action="pause"]').first.click()
  assert page.evaluate('gameShell.paused')
  page.locator('[data-shell-action="resume"]').click()
  assert not page.evaluate('gameShell.paused')
  s=page.evaluate('trafficS.hash')
  page.locator('#closeModal').click()
  page.locator('[data-play="arrow"]').first.click()
  assert page.evaluate('trafficS.hash') == s
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2'),width
  assert not errs,(width,errs)
  if width==1440:page.screenshot(path='/mnt/data/PAUSE_v11_traffic_desktop.png',full_page=False)
  if width==390:page.screenshot(path='/mnt/data/PAUSE_v11_traffic_mobile.png',full_page=False)
  context.close()
 browser.close()
