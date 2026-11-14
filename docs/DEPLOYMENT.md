# PAUSE 운영·배포
대상은 항상 기존 `heoyunho03/pause-game` main → Cloudflare Pages `pause-game` → https://pause-game.pages.dev 이다.
프로젝트 삭제·교체·URL 변경은 하지 않는다.

## GitHub Actions
워크플로는 feature 브랜치·PR·main에서 빌드, JS 구문, 비밀정보 패턴, JWT, 로컬 PostgreSQL, 원본 게임·브라우저 검사를 실행한다.
main에서 검증이 성공하면 **그때 생성한 동일한 배포 artifact**를 Wrangler로 배포한다.
Actions Secrets:
- `CLOUDFLARE_ACCOUNT_ID`: 대상 Cloudflare 계정 ID.
- `CLOUDFLARE_API_TOKEN`: 해당 계정에만 `Account / Cloudflare Pages / Edit` 권한을 부여한 최소권한 토큰.
Secrets가 없으면 배포 job은 명확한 오류로 중단한다. 테스트 job의 성공과 배포 성공을 구분한다.

`site/wrangler.jsonc`는 기존 프로젝트명과 compatibility date를 고정한다.
`npm run build`는 게임 번들과 기존 API를 Pages advanced-mode `_worker.js`로 묶는다.
일반 Actions 배포는 정적 파일을 Pages CDN에서 제공하고 `/api/*`만 Functions를 호출한다.

연결 도구를 통한 첫 배포에 정적 asset 업로드 권한이 없으면, **동일한 빌드의** 내장 정적 파일 응답을 사용하는 `_worker.js`를 기존 프로젝트에 업로드할 수 있다.
이 경우 첫 배포만 `_routes.json`을 `/*`로 설정한다. 코드·디자인·게임·API는 동일하다.
Actions Secrets 설정 후 표준 배포를 실행하면 정적 파일은 CDN 경로로 전환된다.

## Neon (다른 DB로 대체하지 않음)
1. Neon 앱 연결·PAUSE 전용 프로젝트/DB 확인. 계정이 연결되지 않으면 생성·접속을 수행하지 않는다.
2. 새 DB에 `sql/001_pausesaves.sql`, 이어서 `sql/002_safe_sync.sql` 적용.
3. 기존 데이터가 있으면 먼저 백업. 002는 컬럼·제약을 추가하며 기록을 초기화하지 않는다.
4. Cloudflare Pages `pause-game` Production에 TLS 활성화 Neon 연결 문자열을 **Secret `DATABASE_URL`**로 설정.
5. preview에는 운영 DB 비밀값을 복사하지 않는다.
6. 실제 Google 계정 두 개로 저장·조회 분리를 확인하고 다른 브라우저의 복원을 확인한다.

한 계정당 최신 스냅샷 한 개를 저장한다. 요청 버전 검사와 UUID 요청 ID가 동시에 기록된다.
최대 100키, 값 하나 UTF-8 128KiB, 스냅샷 480KiB, 요청 본문 512KiB.
DB 연결은 서버의 `@neondatabase/serverless`만 사용한다. DB의 공개 Data API는 사용하지 않는다.
애플리케이션 API가 검증한 Google sub를 모든 SELECT/UPDATE 조건에 사용한다.
토큰 없는 요청은 401, 교차 출처 요청은 403, 저장 충돌은 409, 과대 요청은 413, 외부 장애는 503이다.

## Google OAuth
Google Cloud Console → Google Auth Platform에서 PAUSE 웹 클라이언트를 생성/확인한다.
- 유형: 웹 애플리케이션
- Authorized JavaScript origins: `https://pause-game.pages.dev`
- 로컬 검사가 필요할 때만 `http://localhost:8788` 등 정확한 출처를 별도 등록.
- 이 방식은 GIS 팝업·JS 콜백이므로 redirect URI나 OAuth client secret을 요구하지 않는다.
- 외부 사용자 동의 화면·테스트 사용자/게시 상태는 실제 계정의 설정에 맞춰 확인한다.
- 공개 client ID를 Pages Production `GOOGLE_CLIENT_ID`로 설정한다.
실제 계정 로그인과 권한 승인은 사용자가 직접 완료한다.

## 운영 확인·복구
배포 전에 대상 프로젝트, 검증된 commit SHA, 빌드 해시, 이전 정상 deployment ID를 기록한다.
기존 프로젝트는 초기 확인 시 배포가 없어 첫 배포 이전 정상 버전은 없다.
원본 ZIP SHA-256: `04f03fc58fd32850bcf1307a3a2d9241fdb6f46dda721cc03afd70e25144fc14`.

운영 확인:
```sh
curl --fail https://pause-game.pages.dev/api/config
curl -i https://pause-game.pages.dev/api/save
# 인증 없는 save 요청은 401이어야 한다.
```
브라우저에서 모든 게임, 모바일 화면, 기기 기록 유지, Google 연결·백업·다른 브라우저 복원을 확인한다.
운영 DB 테스트에 실제 기존 기록을 덮어쓰지 않는다. 별도 테스트 Google 계정을 사용한다.
실패 시 Cloudflare deployment의 단계별 오류 로그와 Actions 로그를 확인한다.

정상 배포 이후의 롤백은 Cloudflare Pages Deployments에서 해당 정상 deployment로 rollback한다.
DB 마이그레이션이나 사용자 데이터는 코드 롤백으로 복구되지 않는다. 002 컬럼을 삭제하지 않는다.
