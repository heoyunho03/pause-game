import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 for width,height in [(1440,900),(768,1000),(390,844),(320,740)]:
  ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=width<500)
  page=ctx.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html);page.locator('[data-play="sudoku"]').first.click()
  assert page.locator('.sudoku9-cell').count()==81
  assert page.locator('.sudoku9-num').count()==9
  d=page.evaluate('''()=>({unique:sudokuSolutionCount([...sudokuS.original]),selected:sudokuS.selected,clues:sudokuS.original.filter(Boolean).length})''')
  assert d['unique']==1,d
  first=page.evaluate('sudokuS.original.findIndex((n)=>n===0)')
  answer=page.evaluate(f'sudokuS.answer[{first}]')
  page.locator(f'[data-sudo="{first}"]').click();page.locator(f'[data-sudo-num="{answer}"]').click()
  assert page.evaluate(f'sudokuS.board[{first}]')==answer,(width,'input')
  page.locator('#sudokuUndo').click();assert page.evaluate(f'sudokuS.board[{first}]')==0,(width,'undo')
  page.locator('#sudokuRedo').click();assert page.evaluate(f'sudokuS.board[{first}]')==answer,(width,'redo')
  page.locator('#sudokuPencil').click();assert page.evaluate('sudokuS.pencil')
  page.locator('#sudokuAutoNotes').click(); assert page.evaluate('sudokuS.notes.some(n=>n.length>0)')
  page.locator('#sudokuHint').click(); assert page.locator('#sudokuTip').count()==1
  page.locator('[data-shell-action="pause"]').first.click(); assert page.evaluate('gameShell.paused')
  page.locator('[data-shell-action="resume"]').click();assert not page.evaluate('gameShell.paused')
  page.locator('#closeModal').click();page.locator('[data-play="sudoku"]').first.click()
  assert page.evaluate(f'sudokuS.board[{first}]')==answer,(width,'restore')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2'),(width,'horizontal overflow')
  assert not errors,(width,errors)
  if width==1440: page.screenshot(path='/mnt/data/PAUSE_v09_sudoku_desktop.png',full_page=True)
  if width==390: page.screenshot(path='/mnt/data/PAUSE_v09_sudoku_mobile.png',full_page=True)
  print('PASS',width,'unique solution','clues',d['clues'],'entry/undo/redo/notes/hint/pause/restore')
  page.locator('#closeModal').click();ctx.close()
 browser.close()
