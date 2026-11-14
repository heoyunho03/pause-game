import os
from playwright.sync_api import sync_playwright
import threading, http.server, socketserver, os, time, json
ROOT=os.path.dirname(os.path.dirname(__file__))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
os.chdir(ROOT)
srv=socketserver.TCPServer(('127.0.0.1',0),Quiet)
port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
results=[]; all_errors=[]
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  for viewport in [(1440,900),(390,844),(320,720)]:
    ctx=browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},device_scale_factor=1,has_touch=viewport[0]<500)
    page=ctx.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(open(ROOT+'/index.html',encoding='utf8').read(),wait_until='domcontentloaded')
    page.wait_for_timeout(250)
    count=page.locator('.game-card').count()
    overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+2')
    if viewport[0]==1440:
      page.screenshot(path='/mnt/data/PAUSE_v05_desktop.png',full_page=True)
    if viewport[0]==390:
      page.screenshot(path='/mnt/data/PAUSE_v05_mobile.png',full_page=True)
    results.append(('home',viewport,count,overflow))
    for gid in ['2048','mines','block','sudoku','arrow','hexa','bubble','poker','onecard','knife','rolling','runner']:
      page.locator(f'#gamesGrid [data-play="{gid}"]').first.click()
      page.wait_for_timeout(150 if gid not in ['knife','rolling','runner'] else 280)
      mounted=page.evaluate('gameShell.id === '+json.dumps(gid)+' && Boolean(gameShell.controller)')
      visible=page.locator('.pause-shell').is_visible()
      marker={'2048':'#board','mines':'#mineBoardPremium','block':'#bpBoard','sudoku':'#exSudoku','arrow':'#exArrowBoard','hexa':'#exHexBoard','bubble':'#bubbleBoard','poker':'#pokerHand','onecard':'#oneHand','knife':'#knifeCanvas','rolling':'#arcCanvas','runner':'#arcCanvas'}[gid]
      grid=page.locator(marker).count()==1
      if viewport[0]==1440 and gid=='runner':page.screenshot(path='/mnt/data/PAUSE_v05_runner.png')
      if viewport[0]==390 and gid=='block':page.screenshot(path='/mnt/data/PAUSE_v05_mobile_block.png')
      if viewport[0]==390 and gid=='sudoku':page.screenshot(path='/mnt/data/PAUSE_v05_mobile_sudoku.png')
      if gid=='2048':page.keyboard.press('ArrowLeft')
      elif gid=='mines':page.locator('[data-mine="40"]').click()
      elif gid=='block':page.locator('[data-block9-cell="0"]').click()
      elif gid=='sudoku':page.locator('[data-sudo-num="1"]').click()
      elif gid=='arrow':page.locator('.arrow-tile.ready').first.click()
      elif gid=='hexa':page.locator('[data-hex="0"]').click();page.locator('[data-hex="1"]').click()
      elif gid=='bubble':page.locator('[data-bubble-col="0"]').click()
      elif gid=='poker':page.locator('#pokerAction').click()
      elif gid=='onecard':page.locator('#oneDraw').click()
      elif gid=='knife':page.locator('#knifeThrow').click()
      elif gid in ('rolling','runner'):page.locator('[data-arc="right"]').click()
      page.wait_for_timeout(80)
      results.append((gid,viewport,mounted,visible,grid))
      page.locator('#closeModal').click()
      page.wait_for_timeout(40)
    all_errors.extend([(viewport,e) for e in errors])
    ctx.close()
  browser.close()
srv.shutdown()
for res in results:print(res)
print('PAGE_ERRORS:',json.dumps(all_errors,ensure_ascii=False,indent=2))
assert not all_errors
assert all(row[2]==12 and not row[3] for row in results if row[0]=='home')
assert all(all(row[2:]) for row in results if row[0]!='home')
