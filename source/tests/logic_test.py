import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=Path('/mnt/data/PAUSE_v04_dev/index.html').read_text()
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1200,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.locator('[data-play="2048"]').first.click()
  page.evaluate('''() => { Object.assign(game2048,{grid:[2,2,4,4,0,0,0,0,0,0,0,0,0,0,0,0],score:0,moves:0,undo:null,over:false,won:false});save2048();render2048(); }''')
  page.keyboard.press('ArrowLeft')
  state=page.evaluate('''() => ({row:game2048.grid.slice(0,4),score:game2048.score,moves:game2048.moves,best:playStore.number('2048best')})''')
  print('2048 merge:',state)
  assert state['row'][:2]==[4,8] and state['score']==12 and state['moves']==1
  page.locator('#undoButton').click()
  state=page.evaluate('''() => ({row:game2048.grid.slice(0,4),score:game2048.score,moves:game2048.moves})''')
  print('undo:',state)
  assert state['row']==[2,2,4,4] and state['score']==0 and state['moves']==0
  page.locator('[data-shell-action="home"]').first.click()
  page.locator('[data-play="2048"]').first.click()
  assert page.evaluate('game2048.grid.slice(0,4)')==[2,2,4,4], 'resume local state'
  page.locator('[data-shell-action="restart"]').last.click()
  assert page.get_by_text('새 게임을 시작할까요?').is_visible()
  page.get_by_role('button',name='돌아가기').click()
  assert page.evaluate('game2048.grid.slice(0,4)')==[2,2,4,4]
  page.locator('[data-shell-action="restart"]').last.click()
  page.get_by_role('button',name='새 게임 시작').click()
  assert page.evaluate('game2048.grid.filter(Boolean).length')==2
  page.locator('[data-shell-action="home"]').first.click()
  page.locator('[data-play="mines"]').first.click()
  page.locator('.mine-cell').nth(40).click()
  assert page.evaluate('mineState.grid[40]')!=-1
  assert page.evaluate('mineState.seeded')
  page.locator('[data-shell-action="home"]').first.click()
  page.locator('[data-play="mines"]').first.click()
  assert page.evaluate('mineState.revealed[40]')
  page.locator('[data-shell-action="home"]').first.click()
  search=page.locator('#searchInput');search.fill('헥사');assert page.locator('.game-card').count()==1
  search.fill(''); page.locator('.game-card [data-fav="2048"]').click()
  page.locator('[data-nav="favorites"]').first.click();assert page.locator('.game-card').count()==1
  print('search, favorites, persistence: passed. page errors:',errors)
  assert not errors
  browser.close()
