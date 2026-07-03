// 섭취 알람 스케줄러 + 복용기간 점검 알림
// 알람 채널: 카카오 알림톡 + 앱 푸시(이중). 둘 중 사용자 설정 채널로 발송.

const { sendIntakeReminder } = require('./kakao');
const store = require('../store');

// 앱 푸시 발송기(주입 가능). 기본은 no-op 로거 — 실제 Expo Push 연동 시 setPushSender로 교체.
let pushSender = async (_user, _my, _time) => {
  /* TODO: Expo Push API. 기본 동작은 발송 스킵(개발/서버 환경에서 device token 없음). */
};
function setPushSender(fn) {
  pushSender = fn;
}

// 내 영양제 등록 시: 복용기간 타입에 따라 점검 알림 예약
function planReviewReminder(mySupplement, durationPolicy) {
  const policy = durationPolicy[mySupplement.duration_type];
  if (!policy?.review_after_days) return null; // 🟢지속형은 점검 알림 없음
  // review_due_at = started_at + review_after_days  (🟡90일 / 🔴56일)
  return { type: 'review', after_days: policy.review_after_days, message: policy.reminder };
}

// 매 분 실행되는 틱: next_fire_at 도래한 스케줄 발송. 발송한 개수를 반환.
async function tickIntakeAlarms(nowISO) {
  const due = await queryDueSchedules(nowISO); // intake_schedule where next_fire_at <= now & active
  let fired = 0;
  for (const sch of due) {
    const user = await getUser(sch.user_id);
    const my = await getMySupplement(sch.my_supplement_id);
    try {
      if (sch.channel === 'kakao') await sendIntakeReminder(user, my, currentTime(sch));
      else await sendPush(user, my, currentTime(sch)); // 앱 푸시(Expo)
      fired++;
    } finally {
      await advanceNextFire(sch); // 다음 발화 시각 계산해 next_fire_at 갱신
    }
  }
  return fired;
}

// ── 저장소 연결 (server/store) ──
async function queryDueSchedules(now) { return store.queryDueSchedules(now); }
async function getUser(id) { return store.getUser(id) || {}; }
async function getMySupplement(id) { return store.getMySupplement(id) || {}; }
async function advanceNextFire(sch) { return store.advanceNextFire(sch); }
async function sendPush(user, my, time) { return pushSender(user, my, time); }
function currentTime(sch) { return sch.times?.[0] || ''; }

module.exports = { planReviewReminder, tickIntakeAlarms, setPushSender };
