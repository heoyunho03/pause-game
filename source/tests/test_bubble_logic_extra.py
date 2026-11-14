import os
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page();page.set_content(html)
 details=page.evaluate('''()=>{
 const B=bubbleCore,tiers=Object.keys(B.tiers),empty=()=>Array(B.ROWS*B.COLS).fill(null);
 // An isolated cluster with no ceiling anchor must fall after its support is removed.
 let m=empty(), A=B.index; m[A(0,0)]=0;m[A(1,0)]=0;m[A(1,1)]=0;m[A(2,1)]=3;m[A(3,1)]=3;
 const cleared=B.removeClusters(m,A(1,1));
 // A miss adds a row at the declared threshold, and produces no phantom point.
 let s=B.fresh('hard');s.board=empty();s.board[A(0,0)]=1;s.current=0;s.next=1;s.misses=B.tiers.hard.misses-1;
 let moved=B.applyShot(s,A(1,1));
 // Every generated tier has a valid state and an accessible color source.
 const fresh=tiers.map(t=>B.fresh(t));
 const adj=Array.from({length:B.ROWS*B.COLS},(_,i)=>B.neighbors(i).every(j=>B.neighbors(j).includes(i))).every(Boolean);
 return {adj,fall:{popped:cleared.popped,dropped:cleared.dropped},advanced:moved.advanced,score:moved.state.score,valid:fresh.every(B.validState),lengths:fresh.map(x=>x.board.filter(v=>v!==null).length),hasIllegal:fresh.some(x=>x.board.some(c=>c!==null&&(c<0||c>=B.colors.length)))}}
 ''')
 assert details['adj']
 assert details['fall']=={'popped':3,'dropped':2},details
 assert details['advanced'] and details['score']==0,details
 assert details['valid'] and not details['hasIllegal'],details
 print('PASS pure bubble logic',details)
 page.close()
 # Genuine touch event firing; no button fallback.
 device=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 page=device.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html);page.locator('[data-play="bubble"]').first.click()
 canv=page.locator('#bubblePremiumCanvas');canv.scroll_into_view_if_needed();r=canv.bounding_box();x=r['x']+r['width']*.58;y=r['y']+r['height']*.53
 page.touchscreen.tap(x,y)
 page.wait_for_function('playStore.read("bubble-premium-v1",{}).shots>=1',timeout=8000)
 assert not errors,errors
 print('PASS mobile touch fires a real projectile and settles')
 device.close();b.close()
