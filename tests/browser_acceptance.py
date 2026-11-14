"""Actual Chromium UI tests. Google/Neon UI cases use explicit local mocks."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"test-results"
OUT.mkdir(exist_ok=True)
URL=os.environ.get("PAUSE_TEST_URL","http://127.0.0.1:8788")
IDS=["2048","mines","block","sudoku","arrow","bubble","knife","onecard","poker","hexa","rolling","runner"]
report=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get("PAUSE_CHROMIUM_PATH","/usr/bin/chromium"),headless=True,args=["--no-sandbox","--disable-dev-shm-usage","--enable-unsafe-swiftshader"])
    for width,height in [(1440,900),(390,844),(320,740)]:
        context=browser.new_context(viewport={"width":width,"height":height},has_touch=width<500)
        page=context.new_page()
        errors=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.add_init_script("""if (!localStorage.getItem('acceptance-seeded')) {
          localStorage.setItem('pause:2048best','8192');
          localStorage.setItem('pause:v04:2048best','8192');
          localStorage.setItem('unrelated-app','preserve');
          localStorage.setItem('acceptance-seeded','1');
        }""")
        page.goto(URL,wait_until="networkidle")
        assert page.locator(".game-card").count()==12
        assert page.locator("#pause-cloud-toggle").is_visible()
        assert page.locator('script[src*="accounts.google.com"]').count()==0
        assert page.evaluate("localStorage.getItem('pause:2048best')")=="8192"
        for game in IDS:
            page.locator('[data-play="'+game+'"]').first.click()
            assert page.evaluate("Boolean(gameShell.controller)")
            assert page.locator(".pause-shell").get_attribute("data-current-game")==game
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"),(width,game)
            page.locator('[data-shell-action="pause"]').first.click()
            assert page.evaluate("gameShell.paused"),game
            page.locator('[data-shell-action="resume"]').click()
            assert not page.evaluate("gameShell.paused"),game
            page.locator('[data-shell-action="restart"]').first.click()
            page.locator('[data-shell-action="cancel-restart"]').click()
            assert not page.evaluate("gameShell.paused")
            if game=="2048":
                page.keyboard.press("ArrowLeft")
                assert page.evaluate("playStore.number('2048best')")>=8192
            if game=="rolling":
                page.locator("#skyPlay").click()
                page.keyboard.down("ArrowRight");page.wait_for_timeout(100);page.keyboard.up("ArrowRight")
                assert page.evaluate("skyActive.state.distance")>0
            if game=="runner":
                page.locator("#runPlay").click()
                page.keyboard.press("ArrowUp")
                assert page.evaluate("runnerActive.state.distance")>=0
            page.locator("#closeModal").click()
        page.locator("#accountButton").click()
        assert page.locator("#pause-cloud-backup").is_hidden()
        assert page.locator("#pause-local-download").is_enabled()
        page.screenshot(path=str(OUT/("guest-"+str(width)+".png")),full_page=True)
        page.locator("#pause-cloud-panel").get_by_text("닫기",exact=True).click()
        page.reload(wait_until="networkidle")
        assert page.evaluate("Number(localStorage.getItem('pause:v04:2048best'))")>=8192
        assert page.evaluate("localStorage.getItem('unrelated-app')")=="preserve"
        assert not errors,(width,errors)
        report.append({"viewport":width,"games":12,"pauseResumeRestartCancel":True,"guestPersistence":True,"errors":errors})
        context.close()
    # Mock only external identity and save HTTP responses; production has no bypass.
    context=browser.new_context(viewport={"width":390,"height":844})
    page=context.new_page()
    remote={"snapshot":{"pause:2048best":"4096"},"revision":1,"updatedAt":"2026-11-15T00:00:00Z"}
    calls=[]
    def api(route):
        req=route.request
        calls.append(req.method)
        assert req.headers.get("authorization")=="Bearer test.identity.token"
        if req.method=="GET": route.fulfill(json=remote)
        else:
            body=req.post_data_json
            assert body["expectedRevision"]==remote["revision"]
            assert len(body["requestId"])==36
            remote.update(snapshot=body["snapshot"],revision=remote["revision"]+1)
            route.fulfill(json={"ok":True,"revision":remote["revision"]})
    page.route("**/api/config",lambda route:route.fulfill(json={"cloudEnabled":True,"googleClientId":"mock.apps.googleusercontent.com"}))
    page.route("**/api/save",api)
    page.route("https://accounts.google.com/gsi/client",lambda route:route.fulfill(content_type="text/javascript",body="window.google={accounts:{id:{initialize(c){window.testGoogle=c;},renderButton(e){e.textContent='Mock Google';},disableAutoSelect(){}}}};"))
    page.goto(URL,wait_until="networkidle")
    page.locator("#pause-cloud-toggle").click()
    page.wait_for_function("Boolean(window.testGoogle)")
    page.evaluate("window.testGoogle.callback({credential:'test.identity.token'})")
    page.wait_for_function("document.querySelector('#pause-cloud-status').textContent.includes('확인 완료')")
    # Overwrite confirmation can be cancelled; no PUT is sent.
    page.once("dialog",lambda dialog:dialog.dismiss())
    page.locator("#pause-cloud-backup").click()
    page.wait_for_function("document.querySelector('#pause-cloud-status').textContent.includes('취소')")
    assert "PUT" not in calls
    page.evaluate("localStorage.setItem('pause:2048best','7777')")
    page.once("dialog",lambda dialog:dialog.accept())
    page.locator("#pause-cloud-backup").click()
    page.wait_for_function("document.querySelector('#pause-cloud-status').textContent.includes('백업 완료')")
    assert remote["snapshot"]["pause:2048best"]=="7777"
    # Conflict responses leave local state intact.
    page.unroute("**/api/save")
    page.route("**/api/save",lambda route:route.fulfill(json=remote) if route.request.method=="GET" else route.fulfill(status=409,json={"error":"conflict"}))
    page.once("dialog",lambda dialog:dialog.accept())
    page.locator("#pause-cloud-backup").click()
    page.wait_for_function("document.querySelector('#pause-cloud-status').textContent.includes('다른 기기')")
    assert page.evaluate("localStorage.getItem('pause:2048best')")=="7777"
    # Restore, recovery copy, then restore the BEFORE image.
    page.evaluate("localStorage.setItem('pause:2048best','8888')")
    page.once("dialog",lambda dialog:dialog.accept())
    page.locator("#pause-cloud-restore").click()
    page.wait_for_function("localStorage.getItem('pause:2048best') === '7777'")
    page.wait_for_load_state("networkidle")
    assert page.evaluate("JSON.parse(localStorage.getItem('pause:cloud:recovery:v22')).snapshot['pause:2048best']")=="8888"
    page.locator("#pause-cloud-toggle").click()
    page.once("dialog",lambda dialog:dialog.accept())
    page.locator("#pause-cloud-undo").click()
    page.wait_for_function("localStorage.getItem('pause:2048best') === '8888'")
    report.append({"mockCloudUI":"PASS","confirmationCancel":True,"backup":True,"conflict":True,"restoreAndRecovery":True})
    context.close();browser.close()
(OUT/"browser-acceptance.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False),flush=True)
