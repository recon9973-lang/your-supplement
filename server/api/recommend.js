// POST /api/recommend  — 설문 입력 → 추천 결과
// 웹·앱 공유 엔진(engine/recommend.js)을 그대로 사용.
const { recommend } = require('../../engine/recommend');
const store = require('../store');

// 프레임워크 무관 핸들러(Express/Vercel/Next API 등에 맞춰 래핑)
async function handleRecommend(req, res) {
  const user = req.body; // { profile, concerns, medications, allergies }
  if (!user || !Array.isArray(user.concerns) || user.concerns.length === 0) {
    return res.status(400).json({ error: 'concerns(고민)를 1개 이상 선택하세요.' });
  }
  const result = recommend(user);

  // 사용자 스냅샷 저장(프로필/채널 정보가 있으면). 카카오 전송·내영양제 등록에서 재사용.
  let userId = user.id || null;
  if (!userId && (user.profile || user.channel)) {
    userId = store.saveUser(user).id;
  } else if (userId) {
    store.saveUser(user);
  }

  // 추천 스냅샷 DB 저장 → id 반환. (best_offer 최저가 결합은 offers.js 연동 시 각 item에 병합)
  const snapshot = store.saveRecommendation({
    user_id: userId,
    items: result.recommended,
    schedule: result.schedule,
    not_recommended: result.not_recommended,
  });

  return res.status(200).json({
    ...result,
    recommendation_id: snapshot.id,
    user_id: userId,
  });
}

module.exports = { handleRecommend };
