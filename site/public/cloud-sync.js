/* Optional account backup. Games never depend on this module or Google. */
import {MAX_BODY_BYTES, RECOVERY_KEY, applySnapshot, captureSnapshot, readRecovery, validateSnapshot} from './sync-data.js';

const make = (tag, text = '', css = '') => {
  const element = document.createElement(tag);
  element.textContent = text;
  element.style.cssText = css;
  return element;
};
const responsiveStyle = make('style');
responsiveStyle.textContent = '@media(max-width:690px){#pause-cloud-toggle{bottom:calc(82px + env(safe-area-inset-bottom))!important}#pause-cloud-panel{bottom:calc(134px + env(safe-area-inset-bottom))!important;max-height:calc(100dvh - 154px)!important}}';
document.head.append(responsiveStyle);
let token = null, config = null, busy = false, googleLoading = false, session = 0;
const toggle = make('button','☁','position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:10050;width:44px;height:44px;border-radius:50%;border:1px solid #6c82a9;color:#fff;background:linear-gradient(135deg,#335D9E,#D58D61);box-shadow:0 5px 20px #0008;font-size:18px;cursor:pointer;');
toggle.id = 'pause-cloud-toggle'; toggle.type = 'button';
toggle.setAttribute('aria-label','계정 및 기록 백업'); toggle.setAttribute('aria-expanded','false');
toggle.setAttribute('aria-controls','pause-cloud-panel');
const panel = make('section','','position:fixed;right:14px;bottom:calc(66px + env(safe-area-inset-bottom));z-index:10050;width:min(350px,calc(100vw - 28px));box-sizing:border-box;max-height:76dvh;overflow:auto;color:#f7f8fc;background:#131d2d;border:1px solid #657797;padding:16px;border-radius:18px;box-shadow:0 14px 40px #000a;font:13px system-ui;');
panel.id = 'pause-cloud-panel'; panel.hidden = true; panel.setAttribute('aria-label','PAUSE 계정 및 기록');
const top = make('div','','display:flex;justify-content:space-between;align-items:center;gap:10px');
const close = make('button','닫기','border:1px solid #7084a4;border-radius:8px;background:transparent;color:#dae2ef;cursor:pointer;min-height:36px;padding:6px 10px;');
close.type = 'button'; top.append(make('strong','PAUSE · 기록 백업'),close); panel.append(top);
const status = make('p','로그인 없이 12개 게임과 기기 저장을 사용할 수 있어요.','line-height:1.6;color:#d3deee;margin:12px 0;overflow-wrap:anywhere');
status.id = 'pause-cloud-status'; status.setAttribute('role','status'); panel.append(status);
const slot = make('div'); slot.id = 'pause-google-signin'; panel.append(slot);
panel.append(make('p','백업·복원은 직접 선택할 때만 실행돼요. 복원할 때는 이 기기의 복구본을 먼저 보관해요.','line-height:1.5;color:#c4d2e5'));
const actions = make('div','','display:flex;gap:8px;flex-wrap:wrap'); panel.append(actions);
const buttons = [];
const button = (label, id, handler) => {
  const element = make('button',label,'border:1px solid #7084a4;background:#29446a;color:#fff;padding:10px 12px;min-height:42px;border-radius:10px;cursor:pointer;font-size:13px;');
  element.type = 'button'; element.id = id;
  element.addEventListener('click',() => run(handler));
  buttons.push(element); actions.append(element); return element;
};
function storage() {
  try { const value = window.localStorage; value.length; return value; }
  catch { throw new Error('브라우저의 기기 저장소에 접근할 수 없습니다.'); }
}
function flushGame() { document.dispatchEvent(new Event('pause:cloud-snapshot')); }
function updateActions() {
  backup.hidden = restore.hidden = disconnect.hidden = !token;
  let recoveryAvailable = false;
  try { recoveryAvailable = Boolean(storage().getItem(RECOVERY_KEY)); } catch { /* guest games use their original safe storage */ }
  undo.hidden = recoveryDownload.hidden = !recoveryAvailable;
  for (const element of buttons) element.disabled = busy;
  close.disabled = busy; toggle.disabled = busy;
}
async function run(handler) {
  if (busy) return;
  busy = true; panel.setAttribute('aria-busy','true'); updateActions();
  try { await handler(); }
  catch (error) { status.textContent = error.message || '작업을 완료하지 못했습니다. 기기 기록은 계속 사용할 수 있어요.'; }
  finally { busy = false; panel.setAttribute('aria-busy','false'); updateActions(); }
}
function download(data, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const anchor = make('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
async function request(method, body, attempt = 0) {
  if (!token) throw new Error('Google 계정을 먼저 연결해 주세요.');
  let response;
  try {
    response = await fetch('/api/save',{
      method, credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(15000),
      headers:{Authorization:'Bearer ' + token, ...(body ? {'Content-Type':'application/json'} : {})},
      ...(body ? {body:JSON.stringify(body)} : {})
    });
  } catch {
    // A retried PUT keeps its requestId and expectedRevision, so it cannot double-save.
    if (method === 'PUT' && attempt === 0) return request(method,body,1);
    throw new Error('서버에 연결하지 못했습니다. 기기 기록을 유지했습니다. 다시 시도해 주세요.');
  }
  if (response.status === 401) { token = null; session++; throw new Error('로그인이 만료되었습니다. 다시 연결해 주세요.'); }
  if (response.status === 409) throw new Error('다른 기기에서 클라우드 기록이 바뀌었습니다. 최신 기록을 다시 확인해 주세요.');
  if (!response.ok) throw new Error(response.status === 413 ? '클라우드 저장 크기 제한을 초과했습니다.' : '서버 저장소를 사용할 수 없습니다 (' + response.status + ').');
  const data = await response.json();
  if (method === 'GET') {
    validateSnapshot(data.snapshot);
    if (!Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error('클라우드 저장 버전이 올바르지 않습니다.');
  }
  return data;
}
const backup = button('클라우드 백업','pause-cloud-backup',async () => {
  status.textContent = '기존 클라우드 기록을 확인하고 있어요.';
  const remote = await request('GET');
  if (Object.keys(remote.snapshot).length && !confirm('이 계정의 클라우드 기록 (' + (remote.updatedAt || '시간 정보 없음') + ')을 현재 기기 기록으로 교체할까요? 진행 중인 게임은 저장 후 목록으로 돌아갑니다.')) {
    status.textContent = '백업을 취소했습니다.'; return;
  }
  flushGame();
  const snapshot = captureSnapshot(storage());
  if (!Object.keys(snapshot).length && Object.keys(remote.snapshot).length) throw new Error('빈 기기 기록으로 클라우드 기록을 덮어쓰지 않았습니다.');
  status.textContent = '클라우드에 백업하고 있어요.';
  const result = await request('PUT',{snapshot,expectedRevision:remote.revision,requestId:crypto.randomUUID()});
  status.textContent = '백업 완료 · 저장 버전 ' + result.revision;
});
const restore = button('클라우드 복원','pause-cloud-restore',async () => {
  status.textContent = '클라우드 기록을 확인하고 있어요.';
  const remote = await request('GET');
  if (!Object.keys(remote.snapshot).length) { status.textContent = '복원할 클라우드 기록이 없습니다.'; return; }
  if (!confirm('클라우드의 ' + Object.keys(remote.snapshot).length + '개 기록을 이 기기에 복원할까요? 같은 항목은 교체하고 기기에만 있는 기록은 유지합니다. 현재 게임은 저장 후 종료되며 기존 기록은 복구본으로 보관합니다.')) {
    status.textContent = '복원을 취소했습니다.'; return;
  }
  flushGame();
  applySnapshot(storage(),remote.snapshot);
  location.reload();
});
button('기기 백업 다운로드','pause-local-download',async () => {
  flushGame();
  download({format:'pause-backup-v1',createdAt:new Date().toISOString(),snapshot:captureSnapshot(storage())},'PAUSE-local-backup.json');
  status.textContent = '현재 기기 기록을 파일로 저장했습니다.';
});
const fileInput = make('input'); fileInput.type = 'file'; fileInput.accept = '.json,application/json'; fileInput.hidden = true; panel.append(fileInput);
button('백업 파일 복원','pause-local-import',async () => fileInput.click());
fileInput.addEventListener('change',() => run(async () => {
  const file = fileInput.files?.[0]; fileInput.value = ''; if (!file) return;
  if (file.size > MAX_BODY_BYTES) throw new Error('백업 파일이 너무 큽니다.');
  const data = JSON.parse(await file.text());
  if (data?.format !== 'pause-backup-v1') throw new Error('PAUSE 백업 파일을 선택해 주세요.');
  validateSnapshot(data.snapshot);
  if (!confirm('백업 파일의 기록을 복원할까요? 현재 기록은 복구본으로 보관합니다.')) return;
  flushGame(); applySnapshot(storage(),data.snapshot); location.reload();
}));
const undo = button('이전 기기 기록 복구','pause-cloud-undo',async () => {
  const checkpoint = readRecovery(storage());
  if (!checkpoint) throw new Error('복구본이 없습니다.');
  if (!confirm('복원 직전의 기기 기록으로 되돌릴까요? 현재 기록도 복구본으로 보관합니다.')) return;
  flushGame(); applySnapshot(storage(),checkpoint.snapshot,{replace:true}); location.reload();
});
const recoveryDownload = button('복구본 다운로드','pause-recovery-download',async () => {
  const checkpoint = readRecovery(storage());
  if (!checkpoint) throw new Error('복구본이 없습니다.');
  download(checkpoint,'PAUSE-recovery-backup.json'); status.textContent = '복원 전 기록을 파일로 저장했습니다.';
});
const disconnect = button('계정 연결 해제','pause-cloud-disconnect',async () => {
  token = null; session++;
  window.google?.accounts?.id?.disableAutoSelect();
  status.textContent = '계정 연결을 해제했습니다. 기기 기록은 그대로 유지됩니다.';
});
async function loadGoogle() {
  if (googleLoading || !config?.cloudEnabled || !config.googleClientId) return;
  googleLoading = true;
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
  script.onload = () => {
    if (!window.google?.accounts?.id) { status.textContent = 'Google 로그인 도구를 불러오지 못했습니다.'; googleLoading = false; return; }
    window.google.accounts.id.initialize({
      client_id:config.googleClientId, auto_select:false, button_auto_select:false,
      callback:response => {
        if (!response.credential || busy) return;
        token = response.credential;
        const currentSession = ++session;
        run(async () => {
          try {
            await request('GET');
            if (currentSession !== session) return;
            status.textContent = 'Google 계정 확인 완료. 백업 또는 복원을 선택해 주세요.';
          } catch (error) { token = null; throw error; }
        });
      }
    });
    window.google.accounts.id.renderButton(slot,{theme:'outline',size:'large',text:'signin_with',width:Math.min(270,panel.clientWidth-34),shape:'pill'});
  };
  script.onerror = () => { googleLoading = false; status.textContent = 'Google에 접속하지 못했습니다. 기기 기록은 계속 사용할 수 있어요.'; };
  document.head.append(script);
}
function open() { panel.hidden = false; toggle.setAttribute('aria-expanded','true'); updateActions(); close.focus(); loadGoogle(); }
function hide() { if (busy) return; panel.hidden = true; toggle.setAttribute('aria-expanded','false'); toggle.focus(); }
toggle.addEventListener('click',() => panel.hidden ? open() : hide());
close.addEventListener('click',hide);
panel.addEventListener('keydown',event => { if (event.key === 'Escape') { event.stopPropagation(); hide(); } });
window.pauseOpenCloudSync = open;
document.body.append(toggle,panel);
updateActions();
fetch('/api/config',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)})
  .then(response => response.ok ? response.json() : null)
  .then(value => {
    config = value;
    if (!config?.cloudEnabled || !config?.googleClientId) status.textContent = '기기 저장 모드 · 모든 게임을 이용할 수 있어요. 계정 백업은 서버 연결 후 사용할 수 있습니다.';
    else { status.textContent = 'Google 연결은 선택입니다. 계정 연결 후 백업과 복원을 사용할 수 있어요.'; if (!panel.hidden) loadGoogle(); }
  }).catch(() => { status.textContent = '오프라인 기기 저장 모드 · 서버 연결 없이도 게임과 기록을 이용할 수 있어요.'; });
