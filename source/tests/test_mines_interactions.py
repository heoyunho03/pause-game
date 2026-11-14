import os
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True)
 page=ctx.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.set_content(HTML);page.locator('[data-play="mines"]').first.click()
 # touch long press should flag once, and subsequent click must not open flagged cell
 tile=page.locator('[data-mine="4"]');box=tile.bounding_box()
 page.dispatch_event('[data-mine="4"]','pointerdown',{'pointerType':'touch','pointerId':7,'clientX':box['x']+12,'clientY':box['y']+12})
 page.wait_for_timeout(570)
 page.dispatch_event('[data-mine="4"]','pointerup',{'pointerType':'touch','pointerId':7,'clientX':box['x']+12,'clientY':box['y']+12})
 page.dispatch_event('[data-mine="4"]','click')
 assert page.evaluate('mineState.flags[4] && !mineState.revealed[4]')
 page.locator('[data-mine="4"]').click(button='right')
 assert not page.evaluate('mineState.flags[4]')
 # seeded board, mark a proven mine as hint, no random guess
 page.locator('[data-mine="40"]').click()
 result=page.evaluate('''()=>{const h=mineLogicalHint();return h&&{i:h.index,type:h.type,correct:(h.type==='safe'?mineState.grid[h.index]!==-1:mineState.grid[h.index]===-1)}}''')
 if result:assert result['correct'],result
 # pause stops precise time; resume advances
 page.locator('[data-shell-action="pause"]').first.click()
 before=page.evaluate('mineElapsed()');page.wait_for_timeout(300);after=page.evaluate('mineElapsed()')
 assert abs(after-before)<25,(before,after)
 page.locator('[data-shell-action="resume"]').click();page.wait_for_timeout(300)
 assert page.evaluate('mineElapsed()')>after+200
 # save elapsed then switch away should pause; loaded record resumes without reset
 page.locator('#closeModal').click()
 page.locator('[data-play="mines"]').first.click()
 assert page.evaluate('mineState.started && mineElapsed() > 400')
 assert not errors,errors
 print(json.dumps({'longPressFlag':True,'noGhostClick':True,'hintVerified':result,'pauseClock':True,'sessionRestore':True,'pageErrors':errors},ensure_ascii=False))
 b.close()
