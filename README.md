# PAUSE v2.2
PC·모바일에서 즐기는 12종 미니게임. **비로그인 기본, Google 계정 백업 선택.**

- 저장소: https://github.com/heoyunho03/pause-game
- 기존 Pages 프로젝트: `pause-game` / https://pause-game.pages.dev
- 원본: `PAUSE_v2_2_GitHub_Neon_Ready.zip`
- 딥 블루 `#335D9E` × 선셋 오렌지 `#D58D61` 디자인과 게임 규칙 보존.

**현재 운영 상태:** 기존 Pages URL에서 게스트 플레이 배포 완료. 인증·저장 테스트 19개와 브라우저 suite 23개 통과. 실제 Google·Neon 연동은 설정 대기 중이며, GitHub 자동 배포는 Actions Secrets 두 개가 비어 있어 중단된다. [실제 검증 결과](docs/VALIDATION.md)에 완료·차단 항목을 구분했다.

## 게임
2048, 지뢰찾기, 9×9 블록 퍼즐, 스도쿠, 트럭 탈출, 버블 슈터, 나이프 타이밍, 원카드, 포커, 헥사 큐즈, 스카이 롤, 무한 달리기.
스카이 롤의 관성·균형 물리와 무한 달리기의 차선·점프·슬라이드 파쿠르는 독립 모듈이다.

## 구성
| 경로 | 역할 |
| --- | --- |
| `source/src/` | 기존 게임 원본·공통 UI |
| `source/build.py`, `source/index.html` | 기존 게임 빌드와 보존된 번들 |
| `source/tests/` | 기존 게임 회귀검사 |
| `site/public/` | 게임 번들·선택형 백업 UI·공유 저장 규격 |
| `site/functions/api/` | 설정·Google JWT 검증·게임 저장 API |
| `site/lib/` | 입력 검증·원자적 저장 |
| `site/server/worker.js` | 기존 API를 묶는 Pages Functions 어댑터 |
| `site/dist/` | 자동 생성 배포 산출물. Git에서 제외 |
| `sql/` | 데이터 보존형 초기화·추가 마이그레이션 |
| `.github/workflows/deploy-pages.yml` | 테스트 → 기존 Pages 프로젝트 배포 |
| `docs/` | 배포·연동·검증 상태 |

## 개발·검증
Node.js 22 이상, Python 3.12 이상.
```sh
cd site
npm ci
npm run build
npm run check
npm test
npm run dev
```
브라우저 검사:
```sh
python -m pip install -r requirements-test.txt
python -m playwright install --with-deps chromium
# Playwright 설치 Chromium을 쓰려면 PAUSE_CHROMIUM_PATH 지정.
python scripts/run-browser-tests.py
```
원본 테스트의 Chromium 경로를 환경변수로 선택한다. 느린 GPU에서는 고정 대기 대신 실제 진행을 기다리고, 복원 시 실제 경과 시간을 비교한다. 모바일 검색은 검색 상자를 먼저 연다. 게임 규칙은 변경하지 않는다.
GitHub Actions는 브라우저 설치와 경로 설정을 자동 수행하고 로그·화면을 artifact로 보관한다.

## 선택형 계정 백업
- 게임은 서버·Google·Neon 연결 없이 로컬 기록으로 작동한다.
- Google 로그인 스크립트는 사용자가 계정 패널을 열었을 때만 로드한다. 자동 로그인 팝업 없음.
- 서버가 Google 공개키로 RS256 서명, 발급자, 대상 앱, 만료, 계정 ID를 검증한다.
- DB에는 검증된 `sub`로만 접근한다. 브라우저가 보낸 사용자 ID는 받지 않는다.
- 토큰은 메모리에만 보관한다. 페이지 새로고침·연결 해제 시 다시 계정을 선택한다.
- 백업은 기존 클라우드 기록을 확인하고 사용자 확인 후 갱신한다. 최신 버전과 다르면 409로 차단한다.
- 같은 요청 재전송은 같은 버전을 반환한다.
- 복원은 전체 검증·사용자 확인·기기 복구본 저장 후 실행한다. 실패하면 변경한 키를 되돌린다.
- 기기에만 있는 기록과 다른 앱의 키는 클라우드 복원으로 삭제하지 않는다. '이전 기기 기록 복구'는 복원 전 PAUSE 기록을 정확하게 복구한다.
- 로그인 없이 기기 백업 JSON 다운로드·파일 복원이 가능하다.
- 기존 `pause:v04:*`, `pause:2048*`, `pause:favs`, `pause:theme`, `pause:v20:recent` 키와 문자열 값을 그대로 백업한다.

## 배포·외부 연결
[배포 절차](docs/DEPLOYMENT.md)와 [실제 검증 기록](docs/VALIDATION.md)을 참조한다.
Neon 계정 연결, Google OAuth 웹 클라이언트와 Cloudflare Actions Secrets가 모두 설정되어야 클라우드 저장과 자동 운영 배포가 가능하다.
설정 전에는 `/api/config`가 `cloudEnabled:false`를 반환한다.

**공개 저장소 주의:** 실제 `DATABASE_URL`, API 토큰, ID token, OAuth 비밀키는 소스·브라우저·로그에 넣지 않는다.
이 구현은 Google Identity Services의 ID token 방식이므로 Google OAuth client secret은 사용하지 않는다.
