import os
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).resolve().parents[1]/'index.html'
html=src.read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for w,h in ((1440,900),(768,1024),(390,844),(320,700)):
        context=browser.new_context(viewport={'width':w,'height':h},has_touch=w<=390,device_scale_factor=1)
        page=context.new_page(); errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html)
        assert page.locator('#gamesGrid [data-play]').count()>=12
        page.locator('#gamesGrid [data-play="knife"]').first.click()
        assert page.locator('#kpCanvas').is_visible()
        assert page.locator('#kpShoot').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),w
        assert page.evaluate('kpAngularDistance(.02,tau-.02)<.05')
        assert page.evaluate('kpCollision({angle:0,obstacles:[Math.PI/2],knives:[]},Math.PI/2)')
        assert not page.evaluate('kpCollision({angle:0,obstacles:[0],knives:[]},Math.PI/2)')
        assert page.evaluate('kpSpeed({...knifeNewStage(5),level:5,elapsed:4})<0')
        initial=page.evaluate('knifeS.shots')
        # Avoid collision even when timing changes, then verify animation impact and persistence.
        page.evaluate('knifeS.angle=0; knifeS.knives=[];knifeS.obstacles=[];knifeS.shots=0;knifeS.fruit=[];knifePersist()')
        page.locator('#kpShoot').click()
        page.wait_for_function('knifeS.shots===1',timeout=3000)
        assert page.evaluate('knifeS.score')>=10
        assert page.locator('#kpRemaining').inner_text()==str(page.evaluate('knifePreset(knifeS.level).need-1'))
        page.locator('[data-shell-action="pause"]').first.click()
        assert page.evaluate('gameShell.paused')
        angle=page.evaluate('knifeS.angle')
        page.wait_for_timeout(125)
        assert abs(page.evaluate('knifeS.angle')-angle)<1e-8
        page.locator('[data-shell-action="resume"]').click()
        assert not page.evaluate('gameShell.paused')
        page.locator('#closeModal').click()
        page.locator('#gamesGrid [data-play="knife"]').first.click()
        assert page.evaluate('knifeS.shots')==1
        # Stage completion, then next stage (without waiting for random timing).
        page.evaluate('''()=>{knifeS.level=1;knifeS.obstacles=[];knifeS.knives=[];knifeS.fruit=[];knifeS.shots=3;knifeS.angle=0;knifeS.over=false;knifeS.clear=false;knifeFlight={progress:1,duration:.17};knifeResolve()}''')
        assert page.evaluate('knifeS.clear')
        assert page.get_by_text('스테이지 클리어!').is_visible()
        page.locator('#kpNextStage').click()
        assert page.evaluate('knifeS.level')==2
        assert page.evaluate('!gameShell.paused')
        # An existing knife at impact angle must end the current run.
        page.evaluate('''()=>{knifeS.angle=0;knifeS.obstacles=[Math.PI/2];knifeS.knives=[];knifeS.over=false;knifeS.clear=false;knifeFlight={progress:1,duration:.17};knifeResolve()}''')
        assert page.evaluate('knifeS.over')
        assert page.get_by_role('heading',name='칼이 부딪혔어요').is_visible()
        assert not errors,(w,errors)
        print('PASS',w,'launch/impact/pause/save/level/fail/no console page errors',flush=True)
        if w in (1440,390):
            page.locator('#shellScreenMask [data-shell-action="restart"]').click()
            page.locator('#shellScreenMask [data-shell-action="confirm-restart"]').click()
            page.wait_for_timeout(120)
            page.screenshot(path=f'/mnt/data/PAUSE_v12_knife_{w}.png',full_page=False)
        context.close()
    browser.close()
