import os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,height,label in [(1440,900,'desktop'),(390,844,'mobile')]:
  ctx=b.new_context(viewport={'width':width,'height':height},device_scale_factor=1,has_touch=width<500)
  page=ctx.new_page();page.set_content(html);page.locator('#gamesGrid [data-play="2048"]').first.click()
  page.evaluate('''()=>{
     Object.assign(game2048,fresh2048(),{grid:[0,2,4,8,0,4,16,32,0,0,64,128,0,0,256,512],score:1468,moves:74});
     save2048();render2048();
  }''')
  page.wait_for_timeout(90)
  page.locator('#modal').screenshot(path=f'/mnt/data/PAUSE_v06_{label}_play.png',animations='disabled')
  # verify actual visual motion: tiles float briefly then leave no ghost layer.
  page.keyboard.press('ArrowLeft')
  page.wait_for_timeout(40)
  assert page.locator('#board .floating-layer').count()==1, 'sliding overlay missing'
  assert page.locator('#board .floating-tile').count()>0, 'moving sprites missing'
  page.wait_for_timeout(210)
  assert page.locator('#board .floating-layer').count()==0, 'sliding overlay not cleaned'
  print(label,'slide animation verified','board',page.evaluate('game2048.grid'))
  if width<500:
   # simulate mobile finger swipe with pointer event, using real page coords.
   board=page.locator('#board');box=board.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   before=page.evaluate('game2048.moves')
   page.dispatch_event('#board','pointerdown',{'pointerId':3,'pointerType':'touch','clientX':x,'clientY':y})
   page.dispatch_event('#board','pointerup',{'pointerId':3,'pointerType':'touch','clientX':x+80,'clientY':y})
   page.wait_for_timeout(220)
   assert page.evaluate('game2048.moves')==before+1,'finger swipe did not move'
   print('mobile swipe verified')
  ctx.close()
 b.close()
