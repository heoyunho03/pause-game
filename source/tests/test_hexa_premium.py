import os
from pathlib import Path
from playwright.sync_api import sync_playwright
H=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 for w,h in [(1440,900),(768,1024),(390,844),(320,700)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=w<=390)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(H)
  page.locator('#gamesGrid [data-play="hexa"]').first.click()
  assert page.locator('#hsGame').is_visible()
  assert page.locator('[data-hs-cell]').count()==37
  assert page.locator('[data-hs-tray]').count()==3
  assert page.evaluate('hsValid(hsState)')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2')
  page.locator('[data-hs-tray="1"]').click()
  assert page.evaluate('hsChosen===1')
  page.locator('[data-hs-cell="0"]').click()
  assert page.evaluate('hsState.moves===1')
  assert page.evaluate('hsState.board[0] !== null')
  assert page.evaluate('hsValid(hsState)')
  page.locator('#hsUndo').click()
  assert page.evaluate('hsState.moves===0 && hsState.board[0]===null')
  page.locator('#hsHint').click()
  assert page.evaluate('hsHint>=0')
  page.once('dialog',lambda dlg:dlg.accept())
  page.locator('[data-hs-mode="easy"]').click()
  assert page.evaluate('hsState.mode==="easy"')
  assert page.locator('[data-hs-cell]').count()==19
  page.locator('[data-hs-cell="0"]').click()
  page.locator('[data-shell-action="pause"]').first.click()
  assert page.evaluate('gameShell.paused')
  page.locator('[data-shell-action="resume"]').click()
  assert not page.evaluate('gameShell.paused')
  page.locator('#closeModal').click()
  page.locator('#gamesGrid [data-play="hexa"]').first.click()
  assert page.evaluate('hsState.mode==="easy" && hsState.moves===1')
  if w in (1440,390):page.screenshot(path=f'/mnt/data/PAUSE_v15_Hexa_{w}.png')
  assert not errors,errors
  print('PASS',w,'hexa launch/select/place/undo/hint/mode/pause/save',flush=True)
  ctx.close()
 page=browser.new_page();page.set_content(H)
 page.locator('#gamesGrid [data-play="hexa"]').first.click()
 checks=page.evaluate('''() => {
 const tests={};
 const cells=hsCoords[2];tests.cellCount=cells.length===19&&hsCoords[3].length===37;
 tests.neighborSymmetry=cells.every((p,i)=>hsNeighbors(2,i).every(j=>hsNeighbors(2,j).includes(i)));
 tests.neighborSix=hsNeighbors(2,cells.findIndex(([q,r])=>q===0&&r===0)).length===6;
 const cfg=HS_MODES.easy;
 let s=hsNew('easy');
 // Place two neighboring same-color top runs, test merge and clear.
 s.board=Array(19).fill(null);s.tray=[[0,0,0,0],[0,0,0,0],[1,1]];
 let center=cells.findIndex(([q,r])=>q===0&&r===0), n=hsNeighbors(2,center)[0];
 hsPlace(s,0,center);let res=hsPlace(s,1,n);
 tests.clear8=res.removed===8&&s.cleared===8&&s.board.filter(Boolean).length===0;
 tests.ledger=s.score===16+80;
 tests.history=s.history.length===2;
 // Full board should trigger game over and never mutate on an invalid place.
 s=hsNew('easy');s.board=s.board.map((_,i)=>{const [q,r]=cells[i];return [((q-r)%3+3)%3]});s.board[0]=null;const [q0,r0]=cells[0],c0=((q0-r0)%3+3)%3;s.tray=[[c0,c0],[1,2],[1,2]];
 const done=hsPlace(s,0,0);tests.fullBoard=!!done&&s.done;
 const before=s.moves;tests.noIllegal=hsPlace(s,1,0)===null&&s.moves===before;
 let sample=hsNew('hard');
 for(let i=0;i<200;i++){
  if(sample.done){sample=hsNew('hard');continue;}
  const t=sample.tray.findIndex(Boolean),j=sample.board.findIndex(x=>x===null);
  if(t<0||j<0)break;
  hsPlace(sample,t,j);
  if(!hsValid(sample))throw Error('invalid state '+i);
 }
 tests.randomStateValid=hsValid(sample);
 return tests;
 }''')
 print('LOGIC',checks,flush=True)
 assert all(checks.values()), checks
 browser.close()
