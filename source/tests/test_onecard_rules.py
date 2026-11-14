import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page();page.set_content(html);page.locator('#gamesGrid [data-play="onecard"]').first.click()
 result=page.evaluate('''() => {
   const res={};
   let s=ocMake(); // force predetermined suit+turn for special cards, preserving 54 cards not relevant to pure transition test
   s.turn=0;s.activeSuit=0;s.hands[0].push(9); // 9 is J of spades
   ocPlay(s,0,9);res.skip=s.turn===2;
   s=ocMake();s.turn=0;s.activeSuit=0;s.hands[0].push(11); // K spades
   ocPlay(s,0,11);res.extra=s.turn===0;
   s=ocMake();s.turn=0;s.activeSuit=0;s.hands[0].push(5); // 7 spades
   ocPlay(s,0,5,2);res.wild=s.activeSuit===2;
   s=ocMake();s.turn=0;s.debt=2;s.attack=2;s.hands[0]=[1,0,12,52,53];
   res.attack=s.hands[0].filter(c=>ocLegal(s,0,c)).sort((a,b)=>a-b).join(',')==='0,12,52,53';
   s=ocMake();s.turn=0;s.activeSuit=0;s.hands[0]=[2,3];s.deck=Array.from({length:20},(_,i)=>26+i); // not a full deck needed
   ocPlay(s,0,2,undefined,false);res.penalty=s.hands[0].length===3;
   s=ocMake();s.deck=[];s.discard=[3,5,9];s.hands=[[2],[1],[]];
   const before=s.discard.at(-1);ocRefill(s);res.refill=s.discard.length===1&&s.discard[0]===before&&s.deck.length===2;
   return res;
 }''')
 print(result);assert all(result.values()),result
 # Accessibility basic + different game modules.
 page.locator('#closeModal').click()
 for game in ['2048','mines','block','sudoku','arrow','hexa','bubble','knife','poker','rolling','runner']:
  page.locator(f'#gamesGrid [data-play="{game}"]').first.click(timeout=6000)
  assert page.evaluate('gameShell.id')==game
  assert page.evaluate('gameShell.controller!==null')
  page.locator('#closeModal').click()
 print('PASS onecard special rules and 11 existing games smoke')
 b.close()
