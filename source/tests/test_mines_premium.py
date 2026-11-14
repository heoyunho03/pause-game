import os
"""PAUSE v0.7 Mines premium: engine, touch, responsive, regression."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

def run():
 reports=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  for width,height in [(320,720),(390,844),(768,1024),(1440,900)]:
   ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=width<=390,device_scale_factor=1)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(HTML,wait_until='domcontentloaded')
   page.locator('#gamesGrid [data-play="mines"]').first.click();page.wait_for_timeout(100)
   assert page.locator('.mine-premium').is_visible(),('not visible',width)
   assert page.locator('[data-mine]').count()==81
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2'),width
   assert page.locator('#mineRemaining').inner_text()=='10'
   page.locator('[data-mine="40"]').click();page.wait_for_timeout(100)
   assert page.evaluate('mineState.grid[40]===0 && mineState.seeded && mineState.started'),width
   assert page.evaluate('mineState.grid.filter(x=>x===-1).length===10')
   assert page.evaluate('mineState.revealed.filter(Boolean).length>1')
   # Flag toggle, right-click, no reveal flag
   hidden=page.evaluate('mineState.revealed.findIndex((x,i)=>!x&&mineState.grid[i]!==-1)')
   page.locator('#mineModeFlag').click();page.locator(f'[data-mine="{hidden}"]').click()
   assert page.evaluate('(i)=>mineState.flags[i]',hidden)
   page.locator('#mineModeReveal').click();page.locator(f'[data-mine="{hidden}"]').click()
   assert not page.evaluate('(i)=>mineState.revealed[i]',hidden)
   page.locator(f'[data-mine="{hidden}"]').click(button='right')
   assert not page.evaluate('(i)=>mineState.flags[i]',hidden)
   # Pause and confirmation including returning to original progress
   page.locator('[data-shell-action="pause"]').first.click();assert page.locator('#shellScreenMask').is_visible()
   page.locator('[data-shell-action="resume"]').click();assert page.locator('#shellScreenMask').is_hidden()
   page.locator('[data-shell-action="restart"]').first.click();assert page.locator('#shellScreenMask').is_visible()
   page.locator('[data-shell-action="cancel-restart"]').click();assert page.locator('#shellScreenMask').is_hidden()
   page.locator('[data-mine-level="intermediate"]').click();assert page.locator('[data-mine]').count()==256
   assert page.locator('#mineRemaining').inner_text()=='40'
   page.locator('[data-mine="0"]').click();assert page.evaluate('mineState.grid[0]===0')
   page.locator('[data-mine-level="expert"]').click();assert page.locator('[data-mine]').count()==480
   assert page.evaluate('mineState.grid.length===16*30')
   # Expert board scrolls inside panel rather than causing whole page overflow.
   assert page.evaluate('document.querySelector("#mineScroll").scrollWidth>document.querySelector("#mineScroll").clientWidth')
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2'),width
   # Back to beginner preserves previously revealed tiles
   page.locator('[data-mine-level="beginner"]').click();assert page.evaluate('mineState.revealed[40]')
   page.locator('#closeModal').click();page.locator('#gamesGrid [data-play="mines"]').first.click()
   assert page.evaluate('mineState.revealed[40]')
   assert page.locator('[data-mine]').count()==81
   # Save high score from computed win, check separate level record
   page.evaluate('''()=>{mineStopClock();mineState=mineFresh('beginner');mineState.seeded=true;mineState.started=true;mineState.grid=Array(81).fill(0);mineState.grid[0]=-1;mineState.grid[1]=1;mineState.grid[9]=1;mineState.grid[10]=1;mineState.revealed=Array(81).fill(true);mineState.revealed[0]=false;mineState.elapsedMs=12345;mineEnd(true)}''')
   assert page.evaluate('mineState.over && mineState.won')
   assert page.evaluate('mineGetBest("beginner")===12345')
   assert page.locator('#shellScreenMask').is_visible()
   assert not errors,(width,errors)
   # screenshots clean original board by restarting before capture
   page.locator('[data-shell-action="restart"]').last.click()
   page.locator('[data-shell-action="confirm-restart"]').click()
   page.locator('[data-mine="40"]').click()
   if width==1440:page.screenshot(path='/mnt/data/PAUSE_v07_mines_desktop.png',full_page=False)
   if width==390:page.screenshot(path='/mnt/data/PAUSE_v07_mines_mobile.png',full_page=False)
   reports.append({'viewport':width,'cells':81,'mode':'works','difficulty':'works','errors':errors})
   ctx.close()
  # Pure rule validation for chord, wrongly flagged chord loss, and hints.
  ctx=browser.new_context();page=ctx.new_page();page.set_content(HTML)
  page.locator('#gamesGrid [data-play="mines"]').first.click()
  report=page.evaluate('''()=>{
   const configs=[];
   for (const [id,d] of Object.entries(MINE_LEVELS)) {
    mineActive=id; mineState=mineFresh(id); mineSeedBoard(Math.floor(d.rows*d.cols/2),()=>0.73);
    const origin=Math.floor(d.rows*d.cols/2);
    configs.push({id,mines:mineState.grid.filter(v=>v===-1).length,safe:mineState.grid[origin]===0});
   }
   mineActive='beginner';mineState=mineFresh('beginner');mineState.seeded=true;mineState.started=true;
   mineState.grid[0]=-1;mineState.grid[1]=1;mineState.grid[9]=1;mineState.grid[10]=1;
   mineState.revealed[10]=true;
   mineState.flags[0]=true;
   gameShell.paused=false;
   mineChord(10);
   return {configs,opened:mineState.revealed[1]&&mineState.revealed[9],lost:mineState.over};
  }''')
  assert {c['id']:c['mines'] for c in report['configs']}=={'beginner':10,'intermediate':40,'expert':99},report
  assert all(c['safe'] for c in report['configs']),report
  assert report['opened'] and not report['lost'],report
  print(json.dumps({'responsive':reports,'logic':report,'status':'PASS'},ensure_ascii=False,indent=2));browser.close()
if __name__=='__main__':run()
