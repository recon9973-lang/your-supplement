// POST /api/recommend — 설문 입력 → 추천 결과
// 웹·앱·서버가 공유하는 엔진(engine/recommend.js)을 그대로 사용한다.
// (best_offer 최저가는 별도 /api/offers 로 각 성분에 병합 — 프론트에서 enrich)

export const runtime = 'nodejs';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// 모노레포 공유 엔진 (CommonJS). 데이터(data/*.json)는 엔진이 자체 로드.
const { recommend } = require('../../../../../engine/recommend.js');

export async function POST(request) {
  let user;
  try {
    user = await request.json();
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  if (!user || !Array.isArray(user.concerns) || user.concerns.length === 0) {
    return Response.json({ error: 'concerns(고민)를 1개 이상 선택하세요.' }, { status: 400 });
  }

  try {
    const result = recommend(user);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: '추천 생성 중 오류가 발생했습니다.', detail: e.message }, { status: 500 });
  }
}
