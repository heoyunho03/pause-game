import os
from playwright.sync_api import sync_playwright
from pathlib import Path
html=Path(__file__).resolve().parents[1].joinpath('index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':850})
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content(html)
 def check(js,name):
  result=page.evaluate(js)
  print(name,':',result)
  assert result,name
 check('pokerEval([12,11,10,9,8]).cat===8 && pokerEval([0,13,26,39,4]).cat===7','poker hand ranks')
 check('(()=>{for(let j=0;j<8;j++){let s=makeArrow();arrowS=s;let count=0;while(arrowS.cells.some(v=>v!==null)){let i=arrowS.cells.findIndex((v,i)=>v!==null&&arrowRemovable(i));if(i<0)return false;arrowS.cells[i]=null;count++;if(count>36)return false} }return true})()','arrow 8 boards solvable')
 check('(()=>{for(let i=0;i<3;i++){let s=makeSudoku();if(sudokuSolutionCount([...s.board])!==1)return false;if(s.board.filter(x=>x===0).length<25)return false}return true})()','sudoku generator unique solution')
 for gid in ['2048','mines','block','sudoku','arrow','hexa','bubble','poker','onecard','knife','rolling','runner']:
  page.evaluate('(id)=>openModal(id)',gid)
  check('gameShell.controller!==null && gameShell.id==='+repr(gid),gid+' mounted')
  if gid=='bubble':
   check('(()=>{let before=bubbleS.board.filter(v=>v!==null).length;let pre=bubbleS.shots;bubbleShoot(0);return bubbleS.shots===pre+1&&bubbleS.board.length===80})()', 'bubble shot increments')
  if gid=='block':
   check('(()=>{const before=bpState.score;return bpPlace(bpSelection,0,0) && bpState.score>before && bpState.board.length===81})()', '9x9 block first placement')
  if gid=='sudoku':
   check('sudokuS.board.length===81 && sudokuS.original.length===81', 'sudoku board')
  if gid=='poker':
   check('(()=>{pokerRound();return pokerS.phase==="result" && pokerS.wins+pokerS.losses+pokerS.draws===1})()', 'poker round')
  if gid=='knife':
   check('(()=>{knifeHit();return knifeS.placed.length===1&&knifeS.score===10})()', 'knife throw')
  if gid=='rolling':
   check('(()=>{let a=arcadeS.lane;arcCommand("right");return arcadeS.lane===a+1})()', 'rolling lane movement')
  if gid=='runner':
   check('(()=>{arcCommand("up");return arcadeS.jump>0})()', 'runner jump')
  page.locator('[data-shell-action="pause"]').first.click()
  assert page.evaluate('gameShell.paused'), gid+' pause'
  page.locator('[data-shell-action="resume"]').first.click()
  assert not page.evaluate('gameShell.paused'), gid+' resume'
  page.locator('[data-shell-action="restart"]').first.click()
  assert '새 게임을 시작할까요?' in page.locator('#shellScreenMask').inner_text(),gid+' restart confirm'
  page.locator('[data-shell-action="cancel-restart"]').click()
  assert not page.evaluate('gameShell.paused'),gid+' cancel'
  page.locator('#closeModal').click()
  assert not page.evaluate('gameShell.id'),gid+' cleanup'
 print('all tests passed, JS errors:',errors)
 assert not errors
 browser.close()
