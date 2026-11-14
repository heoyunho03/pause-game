import os
"""Regression + gameplay acceptance for PAUSE 2048 Premium; Chromium desktop/mobile emulation."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
REPORT=[]
def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  for width,height in [(320,720),(390,844),(768,1024),(1440,900)]:
   context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<500,device_scale_factor=1)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(HTML,wait_until='domcontentloaded');page.wait_for_timeout(80)
   page.locator('#gamesGrid [data-play="2048"]').first.click();page.wait_for_timeout(90)
   assert page.locator('#premiumScore2048').is_visible()
   assert page.locator('#board .game-cell').count()==16
   assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth+2'), f'horizontal overflow {width}'
   assert not page.evaluate('document.querySelector(".modal").scrollWidth>document.querySelector(".modal").clientWidth+2'), f'modal overflow {width}'
   assert page.locator('#undoButton').is_disabled()
   assert page.locator('[data-game-action="sound"]').get_attribute('aria-pressed')=='false'
   # Inject known configuration; real user input must apply full original merge rules.
   page.evaluate('''()=>{Object.assign(game2048,fresh2048(),{grid:[2,2,2,2, 0,0,0,0, 4,0,4,0, 0,0,0,0]});render2048()}''')
   page.keyboard.press('ArrowLeft');page.wait_for_timeout(250)
   result=page.evaluate('''()=>({grid:game2048.grid,score:game2048.score,moves:game2048.moves,undo:!!game2048.undo})''')
   assert result['grid'][:2]==[4,4] and sum(1 for v in result['grid'] if v>0)==4,result
   assert result['score']==16,result
   assert result['moves']==1 and result['undo'],result
   page.locator('#undoButton').click();page.wait_for_timeout(40)
   undo=page.evaluate('''()=>({grid:game2048.grid,score:game2048.score,moves:game2048.moves,undo:game2048.undo})''')
   assert undo['grid'][:4]==[2,2,2,2] and undo['score']==0 and undo['moves']==0 and undo['undo'] is None,undo
   # Help accessible; touch controls are real buttons, not decorative.
   page.locator('#helpButton2048').click();assert page.locator('#tips2048').is_visible()
   page.locator('#helpButton2048').click();assert page.locator('#tips2048').is_hidden()
   (page.locator('[data-game-action="right"]').click() if width<=850 else page.keyboard.press('ArrowRight'));page.wait_for_timeout(240)
   assert page.evaluate('game2048.score')==16
   # Reload game and verify saved state, best never decreases.
   grid=page.evaluate('game2048.grid.slice()');best=page.evaluate('playStore.number("2048best")')
   page.locator('#closeModal').click();page.locator('#gamesGrid [data-play="2048"]').first.click();page.wait_for_timeout(50)
   assert page.evaluate('game2048.grid.slice()')==grid
   assert page.evaluate('playStore.number("2048best")')>=best
   page.locator('#sound2048').click();assert page.locator('#sound2048').get_attribute('aria-pressed')=='true'
   # Pause/resume and restart-confirm cancel.
   page.locator('[data-shell-action="pause"]').first.click();assert page.locator('#shellScreenMask').is_visible()
   page.locator('[data-shell-action="resume"]').click();assert page.locator('#shellScreenMask').is_hidden()
   page.locator('[data-shell-action="restart"]').first.click();assert page.locator('#shellScreenMask').is_visible()
   page.locator('[data-shell-action="cancel-restart"]').click();assert page.locator('#shellScreenMask').is_hidden()
   # Win prompt and continue.
   page.evaluate('''()=>{Object.assign(game2048,fresh2048(),{grid:[1024,1024,0,0,...Array(12).fill(0)]});save2048();render2048()}''')
   page.keyboard.press('ArrowLeft');page.wait_for_timeout(230)
   assert page.evaluate('game2048.won===true')
   assert page.locator('#shellScreenMask').is_visible()
   page.locator('[data-shell-action="continue-win"]').click();assert page.locator('#shellScreenMask').is_hidden()
   assert page.evaluate('gameShell.paused===false')
   # Invalid moves must not spawn tile, expend undo or increment moves.
   page.evaluate('''()=>{Object.assign(game2048,fresh2048(),{grid:[2,4,8,16,...Array(12).fill(0)]});render2048()}''')
   page.keyboard.press('ArrowLeft');page.wait_for_timeout(60)
   assert page.evaluate('game2048.moves===0')
   assert not errors,errors
   if width==1440:page.screenshot(path='/mnt/data/PAUSE_v06_2048_desktop.png',full_page=True)
   if width==390:page.screenshot(path='/mnt/data/PAUSE_v06_2048_mobile.png',full_page=True)
   REPORT.append({'viewport':width,'merge':True,'undo':True,'save':True,'winContinue':True,'errors':errors})
   context.close()
  # Pure logic, including direction correctness and merge only once.
  context=browser.new_context();page=context.new_page();page.set_content(HTML)
  steps=[
   ([2,2,2,2]+[0]*12,'left',[4,4,0,0],8),
   ([2,2,2,2]+[0]*12,'right',[0,0,4,4],8),
   ([2,2,2,2]+[0]*12,'up',[2,2,2,2]+[0]*12,0),
   ([2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0],'down',[0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0],8),
   ([4,4,8,8]+[0]*12,'left',[8,16,0,0],24),
   ([2,2,4,0]+[0]*12,'left',[4,4,0,0],4),
  ]
  for board,dir,expected,points in steps:
   out=page.evaluate('([b,d])=>compute2048Step(b,d)',[board,dir])
   if dir in ('left','right'):
    assert out['grid'][:4]==expected,(dir,out)
   else:assert out['grid']==expected,(dir,out)
   assert out['points']==points,(dir,out)
  assert page.evaluate('compute2048Step([2,4,...Array(14).fill(0)],"left").changed') is False
  print(json.dumps({'regression':REPORT,'ruleCases':len(steps),'status':'PASS'},ensure_ascii=False,indent=2))
  browser.close()
if __name__=='__main__':main()
