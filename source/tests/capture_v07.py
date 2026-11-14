import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for w,h,label in [(1440,900,'desktop'),(390,844,'mobile')]:
  c=b.new_context(viewport={'width':w,'height':h},has_touch=w<500,device_scale_factor=1)
  page=c.new_page();page.set_content(HTML);page.locator('#gamesGrid [data-play="mines"]').first.click();page.evaluate('''()=>{mineSeedBoard(40,Math.random);mineState.started=true;mineFlood(40,[]);mineSave();mineRender();document.querySelector('#modal').scrollTop=0}''')
  page.wait_for_timeout(180);page.screenshot(path=f'/mnt/data/PAUSE_v07_{label}_top.png')
  c.close()
 b.close()
a=Image.open('/mnt/data/PAUSE_v07_desktop_top.png').convert('RGB');m=Image.open('/mnt/data/PAUSE_v07_mobile_top.png').convert('RGB')
W=1640;H=980
canvas=Image.new('RGB',(W,H),'#101A2A');canvas.paste(a.resize((1200,750)),(20,120));canvas.paste(m.resize((348,752)),(1260,115))
d=ImageDraw.Draw(canvas);font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
try: f=ImageFont.truetype(font,32);small=ImageFont.truetype(font,15)
except: f=None;small=None
d.text((32,30),'PAUSE / MINESWEEPER PREMIUM  v0.7',font=f,fill='#f1f3fc')
d.line((32,88,1598,88),fill='#D58D61',width=2)
d.text((30,899),'Desktop  /  1440px     +     Mobile  /  390px     |     Deep Blue × Muted Sunset',font=small,fill='#a5b9d2')
canvas.save('/mnt/data/PAUSE_v07_미리보기.png',quality=93)
print('saved')
