# PAUSE v2.2 구축·검증 결과

기록일: **2026-11-15 (한국 시간)**

**부분 완료:** GitHub 전체 소스, 기존 Pages 프로젝트의 실제 운영 배포, 비로그인 12종 게임과 로컬 저장은 완료했다. 실제 Google 로그인·Neon 저장/복원과 GitHub 자동 배포 활성화는 아래 외부 설정이 남아 있다.

## 소스·배포 식별

| 항목 | 확인한 값 |
| --- | --- |
| 저장소 | https://github.com/heoyunho03/pause-game |
| 기본 브랜치 | main |
| 병합한 작업 | PR #1 / feat/pause-cloud-integration |
| 검증·배포한 코드 커밋 | 2f438d766ff369b1865c57bec31a05ea1c49e2d9 |
| 기존 Pages 프로젝트 | pause-game / 2bf89dae-d653-4411-975a-0f708d281a03 |
| 운영 URL | https://pause-game.pages.dev/ |
| 정상 운영 deployment ID | 7c6d0a7f-417f-49bf-9377-2204e1a4b11c |
| 배포 고유 URL | https://7c6d0a7f.pause-game.pages.dev/ |
| 미리보기 deployment ID | 4c54703a-68b3-435e-ae23-b507fbc49fae |
| 배포 Worker SHA-256 | 388048f7093197cb41e167f6d5dc448f5f36ab19072c2261080ab4bf0241702d |
| 운영 HTML SHA-256 | 6505243432c943d31e5176604bf56575ded6b5b72f83338b6cfdd6caa2df6dbb |

이 결과 문서의 후속 커밋은 문서만 변경하며 위 코드·빌드·배포를 바꾸지 않는다.

원본 ZIP SHA-256: `04f03fc58fd32850bcf1307a3a2d9241fdb6f46dda721cc03afd70e25144fc14`.

초기 확인에서 GitHub는 빈 저장소였고 Pages에는 배포가 없었다. 프로젝트를 삭제·교체하지 않았다. 현재 정상 운영 deployment를 이후 변경의 롤백 기준으로 사용할 수 있다.

원본 source/src/ 자산 34개 중 개별 게임 로직·CSS는 그대로 유지했다. 기본 페이지에는 계정 패널 연결을, 공통 셸에는 백업 전 진행 상태 저장 후 종료 이벤트와 안내 문구를 추가했다. 스카이 롤과 무한 달리기는 독립 모듈·독립 물리/파쿠르 구조를 유지한다. 기존 로컬 저장 키와 문자열 값은 변경하지 않았다.

## 실제 테스트 결과

| 검사 | 결과 | 실행 근거·범위 |
| --- | --- | --- |
| 전체 소스 업로드·PR 병합 | 통과 | main에 게임 원본, 공개 번들, API, SQL, CI, 테스트, 문서 존재 |
| JavaScript 구문·빌드 | 통과 | 34개 구문 검사 단위, 12종 목록, 실제 bundle 생성 |
| 비밀정보 검사 | 통과 | 패턴 검사·변경 검토에서 실제 DB 접속 문자열·토큰·비밀키 미발견 |
| production 의존성 audit | 통과 | npm audit 취약점 0건 |
| 인증·저장·복구 | **19개 통과** | RSA 서명, aud/iss/exp/azp, 검증된 sub, 잘못된 토큰·출처, 입력·크기 제한 |
| PostgreSQL 저장 의미 | 통과 | 로컬 PGlite에서 사용자 분리, 저장·조회, 동시 8건 중 1건만 갱신, 중복 요청, 마이그레이션 재실행 |
| 원본 게임 회귀검사 | **22개 통과** | 12종 게임 규칙·조작·저장·재시작·난이도·독립 3D 동작 검사 |
| 웹 인수 검사 | **1개 suite 통과** | 1440×900 / 390×844 / 320×740, 각 12종 진입·pause/resume·재시작 취소·로컬 기록 유지 |
| 백업 UI | 통과 | 명시적 mock Google·클라우드 응답으로 확인 취소, 백업, 충돌 차단, 복원·복구 확인 |
| 실제 Pages 배포 | 통과 | production deployment의 deploy 단계 success |
| 실제 운영 브라우저 | 통과 | 12개 목록·2048 방향키·pause/resume·재접속 후 동일한 16칸 보드 복원 확인 |
| GitHub Actions 자동 배포 | **차단** | verify 성공, deploy의 Secrets 검사에서 중단. 아래 두 Secret이 로그에서 모두 비어 있음 |
| 실제 Neon 연결·저장·조회 | **미실행** | Neon 앱 미연결, PAUSE DB 생성·001/002 SQL 적용 미실행 |
| 실제 Google 계정 로그인·다른 기기 복원 | **미실행** | OAuth client 미설정·콘솔 접속 불가, Pages 관련 환경변수 없음 |
| Android/iOS 실기기 | 미실행 | 모바일 결과는 Chromium 에뮬레이션 |

**Main 실행:** https://github.com/heoyunho03/pause-game/actions/runs/43622279208

- verify job `132530391103`: 성공. 인증·저장 19개, 브라우저 suite 23개, 실패 0.
- deploy job `132531810759`: 실패. 실제 오류: `Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in this repository's Actions Secrets. No deployment was attempted.`
- PR 최종 검증도 성공: https://github.com/heoyunho03/pause-game/actions/runs/43621714779
- Actions에서 테스트 로그·PC/모바일 화면 artifact를 14일 보관한다.
- 이번 운영 배포는 연결된 Cloudflare API로 직접 수행했다. GitHub 자동 배포가 성공했다고 간주하지 않는다.
- 운영 HTML의 실제 응답 해시가 검증된 빌드 해시와 일치한다.

초기 회귀검사에서 고정 대기 시간과 모바일 검색창 조작 가정이 실패했다. 실제 진행을 기다리고 복원 전후의 실제 시간을 비교하도록 보정했다. 신규 인수검사의 숨겨진 모바일 버튼 선택과 첫 프레임 대기도 수정했다. 게임 규칙을 바꾸지 않고 최종 실행 전체가 통과했다.

로컬 Chromium은 AF_UNIX 소켓 제한으로 실행할 수 없어 실제 브라우저 검사를 GitHub Actions에서 수행했다. 터미널 Python HTTP 클라이언트는 프록시 연결 시간 초과가 있었으며 curl로 아래 운영 응답을 직접 확인했다.

## 실제 운영 API 응답

| 요청 | 상태 | 확인 |
| --- | --- | --- |
| GET / | 200 | 원본 게임 번들·검증된 HTML 해시 일치 |
| GET /cloud-sync.js | 200 | 선택형 백업 모듈 |
| GET /sync-data.js | 200 | 저장 규격·복구 모듈 |
| GET /api/config | 200 | `{"googleClientId":null,"cloudEnabled":false}` |
| GET /api/save (인증 없음) | 401 | Missing or malformed identity token |
| PUT /api/save (잘못된 인증) | 401 | 저장·조회 차단 |
| PUT /api/save (다른 출처) | 403 | Cross-origin request denied |
| POST /api/save | 405 | 허용하지 않는 메서드 차단 |

실제 Google 토큰을 사용한 Neon 쓰기는 수행하지 않았다. 로컬 PostgreSQL 테스트와 mock UI 테스트는 실제 Google·Neon 연동 검증을 대체하지 않는다.

## 남은 설정과 후속 검증

1. **Neon 앱 연결:** PAUSE 전용 프로젝트/DB 확인 후 `sql/001_pausesaves.sql`과 `sql/002_safe_sync.sql` 적용. 현재 운영 DB는 생성·수정하지 않았다.
2. **Google OAuth 웹 클라이언트:** 허용 JavaScript 출처에 `https://pause-game.pages.dev` 등록. Google 콘솔은 이 작업 브라우저에서 Site Unavailable 상태여서 설정을 확인·변경하지 못했다.
3. **Cloudflare Pages Production:** Neon 연결 문자열을 **Secret `DATABASE_URL`**, 공개 웹 클라이언트 ID를 `GOOGLE_CLIENT_ID`로 설정. 브라우저나 GitHub에는 DB 비밀번호를 넣지 않는다.
4. **GitHub Actions Secrets:** `CLOUDFLARE_ACCOUNT_ID`, 해당 계정 Pages Edit 최소권한의 `CLOUDFLARE_API_TOKEN` 등록. 현재 GitHub 연결 도구에는 Secrets 등록 기능이 없다. 토큰은 GitHub의 Secret 입력란에서만 입력한다.
5. 설정 후 main 워크플로를 실행하고 실제 Google 계정 두 개의 데이터 분리, 브라우저 A 백업 → B 복원, 덮어쓰기 취소·충돌·복구를 확인한다.

상세 설정·복구 절차: [DEPLOYMENT.md](DEPLOYMENT.md).

연동 전에도 12개 게임과 기기 저장, 기기 백업 JSON 다운로드·파일 복원은 사용할 수 있다. 계정 백업은 설정이 확인되기 전까지 숨겨진다.
