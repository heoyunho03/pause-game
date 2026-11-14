import os
from pathlib import Path
from playwright.sync_api import sync_playwright
url='http://127.0.0.1:8765/index.html'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PAUSE_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height,label in [(1440,900,'desktop'),(768,1024,'tablet'),(390,844,'mobile'),(320,760,'mobile320')]:
        ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
        page=ctx.new_page(); errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(Path('/mnt/data/PAUSE_v04_dev/index.html').read_text(),wait_until='domcontentloaded')
        page.wait_for_timeout(200)
        print(label,'title:',page.title(),'cards:',page.locator('.game-card').count(),'scrolloverflow',page.evaluate('document.documentElement.scrollWidth>innerWidth'),'errs',errors)
        assert page.locator('.game-card').count()==12,(label,'cards')
        if label in ['desktop','mobile']:
            page.screenshot(path=f'/mnt/data/PAUSE_v04_{label}.png',full_page=True)
        page.locator('[data-play="2048"]').first.click()
        assert page.locator('.pause-shell').is_visible(),(label,'shell')
        assert page.locator('.game-cell').count()==16,(label,'board')
        before=page.locator('#shellStats').inner_text()
        page.keyboard.press('ArrowLeft');page.keyboard.press('ArrowUp');page.keyboard.press('ArrowRight')
        after=page.locator('#shellStats').inner_text()
        print('  2048 before:',before[:60].replace('\n','/'),'after:',after[:60].replace('\n','/'))
        page.locator('[data-shell-action="pause"]').click()
        assert page.get_by_text('잠시 쉬어가요.').is_visible(),(label,'pause')
        page.get_by_role('button',name='▶ 이어하기').click()
        assert not page.get_by_text('잠시 쉬어가요.').is_visible(),(label,'resume')
        page.locator('[data-shell-action="home"]').first.click()
        assert not page.locator('#modalBackdrop').evaluate('(el)=>el.classList.contains("open")'),(label,'close')
        page.locator('[data-play="mines"]').first.click()
        assert page.locator('.mine-cell').count()==81,(label,'mines tiles')
        page.locator('.mine-cell').first.click()
        assert page.locator('.mine-cell.revealed').count()>=1,(label,'mines reveal')
        page.locator('#flagMode').click()
        hidden=page.locator('.mine-cell:not(.revealed)').first
        hidden.click()
        assert page.locator('.mine-cell.flagged').count()==1,(label,'flag')
        page.locator('[data-shell-action="home"]').first.click()
        if label in ['desktop','mobile']:
            page.screenshot(path=f'/mnt/data/PAUSE_v04_{label}_mines.png',full_page=True)
        print('  tested mines, errors:',errors)
        ctx.close()
    browser.close()
