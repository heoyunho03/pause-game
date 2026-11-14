import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':900});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(html);page.locator('[data-play="sudoku"]').first.click()
 for mode in ['easy','normal','hard','expert']:
  page.locator('#sudokuDifficulty').select_option(mode)
  data=page.evaluate('''()=>({difficulty:sudokuS.mode,unique:sudokuSolutionCount([...sudokuS.original]),clues:sudokuS.original.filter(Boolean).length})''')
  assert data['difficulty']==mode and data['unique']==1,data
  assert 26<=data['clues']<=47,data
  print('PASS difficulty',data)
 page.locator('#sudokuAutoCheck').click()
 assert page.evaluate('sudokuS.showMistakes')
 first=page.evaluate('sudokuS.original.findIndex(n=>n===0)')
 ans=page.evaluate(f'sudokuS.answer[{first}]');wrong=ans%9+1
 page.locator(f'[data-sudo="{first}"]').click();page.locator(f'[data-sudo-num="{wrong}"]').click()
 assert page.evaluate('sudokuS.mistakes')>=1
 page.locator('#sudokuUndo').click(); assert page.evaluate(f'sudokuS.board[{first}]')==0
 page.locator('#sudokuPencil').click();page.locator('#sudokuPad [data-sudo-num="2"]').click()
 assert page.evaluate('sudokuS.notes.some(a=>a.length>0)')
 page.locator('#sudokuAutoNotes').click();assert page.evaluate('sudokuS.notes.some(a=>a.length>0)')
 page.locator('#sudokuHint').click(); assert page.evaluate('sudokuS.hints')==1
 page.locator('#closeModal').click()
 for id in ['2048','mines','block','hexa','bubble','arrow','knife','poker','onecard','runner','rolling']:
  page.locator(f'[data-play="{id}"]').first.click()
  assert page.evaluate('gameShell.id')==id,id
  assert page.locator('#modalBackdrop').evaluate('(e)=>e.classList.contains("open")')
  page.locator('#closeModal').click()
  assert page.evaluate('gameShell.id') is None
  print('PASS other game',id)
 assert not errs,errs
 page.close();browser.close()
