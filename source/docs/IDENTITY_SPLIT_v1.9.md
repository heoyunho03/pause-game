# PAUSE v1.9 — 3D 게임 정체성 분리 (2026-11-02)

## 변경 범위
기존 v1.8의 12게임 중 SKY ROLL과 ENDLESS RUN의 플레이·UI·경관 차별화. 나머지 10종 보존.

### SKY ROLL — PRECISION FLOATING RIBBON
- 고정된 레인 전환이 아닌 연속적인 x 이동. 목표 위치 이동에 가속·감속·관성 적용.
- 시드별로 부드럽게 변화하는 공중 트랙 중심선과 낙하 판정.
- 정밀 중심 주행 보너스, 근접 통과 보너스, 기존 회피/조각 수집.
- 균형과 위치 조절 위주의 UI, 차가운 딥블루/추상 공중 구조물.
- 저장 키 `pause:v04:sky-roll-balance-v2` (정확한 로컬 접두어는 playStore 구현 참고). 이전 v1.8 저장 파일 덮어쓰기 방지.

### ENDLESS RUN — SUNSET PARKOUR
- 순간적인 3차선 선택, 점프, 슬라이드. 관성형 자유 x 이동 없음.
- 위험 구간에서 정확하게 점프·슬라이드하면 콤보·스타일 점수 획득.
- 420m마다 도시 구역 라벨 변경, 노을·도시 건물·창문 조명.
- 저장 키 `runner-parkour-v2`. 이전 runner 기록과 별도 저장.

## 검증
- tests/test_identity_split.py: 커브 변화, 가속·관성, 트랙 추락, 파쿠르 회피/콤보, 12카드/모바일 UI
- tests/test_sky_logic.py: 50개 시드 17,500 구간 및 메모리 구간 한정
- tests/test_runner_logic.py: 80개 시드 40,000 구간 및 장애물/점프/슬라이드
- tests/test_sky_premium.py: 1440/390/320/768 화면·조작·저장·일시정지 확인
- tests/test_v12_smoke.py: 12개 게임 기본 열기·닫기
- 모든 src/*.js node --check 통과

## 미검증/후속
- WebGL GPU 렌더링: sandbox 브라우저에 따라 Canvas 투영 폴백으로 검사. 실제 GPU 성능/실기기 터치는 미검증.
- 현재는 두 게임의 기초 플레이 정체성 분리. 스카이 롤의 더 다양한 물리 지형/무한 달리기의 분기 지형·추격 연출은 후속 개선 사항.
- 라이브 배포, Firebase, GitHub 운영 변경 없음.
