// POST /api/kakao — 추천 결과를 카카오 알림톡으로 전송
// 공유 서버 핸들러(server/api/kakao.js)를 그대로 사용.
// 키(KAKAO_*)·전화번호·동의가 없으면 발송하지 않고 사유를 반환(200) → 프론트가 안내 표시.

export const runtime = 'nodejs';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { sendRecommendation } = require('../../../../../server/api/kakao.js');

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, reason: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { user, recommendation } = payload || {};
  if (!user || !recommendation) {
    return Response.json({ ok: false, reason: 'user·recommendation이 필요합니다.' }, { status: 400 });
  }

  try {
    const result = await sendRecommendation(user, recommendation);
    return Response.json({ ok: true, result });
  } catch (e) {
    // 키 미설정·동의 없음·전화번호 없음 등 → 발송 불가 사유를 그대로 전달(설정 안내용)
    return Response.json({ ok: false, reason: e.message, needs_setup: true });
  }
}
