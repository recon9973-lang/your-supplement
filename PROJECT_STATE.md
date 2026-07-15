# PROJECT_STATE — your-supplement

> 🤖 자동 생성 파일. 직접 수정 금지 — `node scripts/gen-project-state.mjs`(또는 CI)가 push마다 갱신.
> **새 세션은 이 파일부터 읽어 재탐색 토큰을 아낀다.**

- **저장소**: your-supplement  ·  **현재 브랜치**: claude/project-audit-progress-z4bn01  ·  **기본 브랜치**: claude/project-audit-progress-z4bn01
- **이어갈 작업(RESUME)**: 없음

## 최근 커밋 (8)
- 2026-07-04 feat(web): 카카오 전송 버튼을 백엔드에 실제 연동(정직한 UX)
- 2026-07-03 feat(mobile): 결과 화면을 실 추천 API에 연결 + import 정리
- 2026-07-03 feat(web): 결과 화면을 실 추천 API(/api/recommend)에 연결
- 2026-07-03 feat: 영속 저장소 계층 + 추천 스냅샷·알람 스케줄러 배선
- 2026-06-29 초기 커밋: 당신의 영양제

## 워크플로 (1)
- `project-state.yml` · 수동

## Vercel crons
- (없음)

## API 엔드포인트 (7)
- `apps/web/app/api/kakao/route.js`
- `apps/web/app/api/offers/route.js`
- `apps/web/app/api/recommend/route.js`
- `server/api/kakao.js`
- `server/api/offers.js`
- `server/api/recommend.js`
- `server/api/schedule.js`

## package 스크립트
(없음)  ·  deps 0개

## 환경변수 표면 (이름만, 값 아님 · 8)
`EXPO_PUBLIC_API_BASE` · `KAKAO_API_KEY` · `KAKAO_SENDER_KEY` · `KAKAO_TEMPLATE_RECOMMENDATION` · `KAKAO_TEMPLATE_REMINDER` · `NAVER_CLIENT_ID` · `NAVER_CLIENT_SECRET` · `SUPP_DATA_DIR`

---
*생성: 커밋 b549b41 기준. 값·비밀은 포함하지 않음.*
