# PAUSE · Deep Sunset v0.4

**PC와 모바일에서 가볍게 즐기는 개인용 미니게임 허브의 첫 번째 개발 빌드**입니다.

## 실행

- 가장 간단한 방법: `index.html`을 브라우저에서 열기
- 권장 방법: 이 폴더에서 `python -m http.server 8000` 실행 후 `http://localhost:8000` 접속
- Cloudflare Pages 배포용: 루트 `index.html`을 정적 파일로 게시합니다. DB나 서버 함수는 필요하지 않습니다.

## 구현된 기능

- PC/모바일 반응형 게임 라이브러리(12개 후보 목록)
- 검색, 카테고리 필터, 즐겨찾기, 라이트/다크 UI
- PAUSE 공통 Game Shell: 게임 헤더, 상태, 기록, 뒤로 가기, 새 게임, 일시정지/이어하기/결과
- **2048 실제 플레이**: 4x4 보드, 합치기, 점수, 최고 점수, 승리·패배, 한 번 되돌리기, 키보드(WASD/방향키) 및 스와이프, 자동 저장
- **지뢰찾기 실제 플레이**: 9x9 / 지뢰 10개, 첫 번째 칸과 주변 칸 안전, 빈 칸 연쇄 열기, 깃발, 마우스 우클릭/모바일 모드, 타이머, 완료 기록, 자동 저장
- 게임별 공유 브랜드 딥 블루/뮤트 선셋 + 조화로운 고유 강조색
- 개인정보 로그인 없이 작동, 저장은 localStorage(허용되지 않으면 메모리 대체)

## 아직 구현하지 않은 기능

- 나머지 10개 게임의 실제 플레이 (현재 UI 미리보기)
- Firebase Authentication, Firestore 로그인 및 기기 간 동기화
- 3D 게임 엔진(Babylon.js), 사용자 업로드, 클라우드 기반 저장
- 전용 서버 운영 및 실제 호스팅 배포

## 개발 소스 구조

- `src/base_v03.html`: 디자인의 기준이 된 기존 v0.3 원본
- `src/game-shell.css`: 공통 디자인 시스템 + 게임별 보조 색상
- `src/game-runtime.js`: 공통 Game Shell과 첫 두 게임 모듈
- `build.py`: 원본 UI 및 새 모듈을 단일 HTML로 결합
- `tests/browser_smoke.py`: 320·390·768·1440px 렌더링 및 기본 조작 테스트
- `tests/logic_test.py`: 2048 합치기/되돌리기/복원, 지뢰찾기, 검색/즐겨찾기 테스트

`python build.py`로 `index.html`을 재생성할 수 있습니다.

## 신규 게임 추가 규격

1. `games` 배열에 `{id,title,category,minutes,description,emoji,live:true}` 정보를 등록합니다.
2. `gameModules[id]`에 `markup()`과 `mount()`를 구현합니다.
3. `mount()`는 `{pause(), resume(), reset(), dispose()}`를 반환합니다. 게임별 `undo()`나 `move()`는 선택 사항입니다.
4. 진행 상태는 `playStore.read(key, fallback)` / `playStore.write(key, state)`를 사용합니다.
5. 공유 UI는 `shellHtml()`, 공통 버튼은 `data-shell-action`을 사용합니다. 게임별 고유 색상은 `src/game-shell.css`에 지정합니다.
6. 일시정지/재시작/기록/다른 게임 이동, 마우스 및 터치, 320~1440px 뷰포트에서 회귀 테스트합니다.

## 개발 시 주의

현 빌드는 **외부 라이브러리 없는 정적 HTML/CSS/JavaScript 프로토타입**입니다. 기존에 논의한 React + TypeScript/Vite로의 구조적 전환은 아직 진행하지 않았습니다. Firebase도 미연결입니다. 이 저장 구조를 유지한 채, 실제 게임이 늘어나면 소스 분리 및 테스트 자동화를 강화하고 도입해도 됩니다.

기록은 브라우저 데이터 삭제나 개인정보 보호 모드에 따라 소실될 수 있습니다. 클라우드 동기화를 구현하기 전에는 PC·모바일 사이에 기록이 공유되지 않습니다.
