// 엔드투엔드 데모/검증: 설문 → 추천 저장 → 내영양제 등록 → 알람 스케줄 → 틱 발송
//
// 외부 DB·네트워크 없이 server/store(JSON 파일)만으로 전체 흐름이 실제로 영속되는지 확인한다.
// 알람 채널은 'push'(기본 no-op 발송기)로 두어 카카오/네트워크 호출을 하지 않는다.
//
// 실행:  node server/demo-e2e.js

const os = require('os');
const path = require('path');
const fs = require('fs');

// 데모 전용 임시 데이터 디렉터리(저장소 오염 방지) — store 로드 전에 지정해야 함.
process.env.SUPP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'supp-e2e-'));

const store = require('./store');
const { handleRecommend } = require('./api/recommend');
const { tickIntakeAlarms, setPushSender } = require('./api/schedule');

// 미니 res 목(mock): status().json() 패턴 지원
function mockRes() {
  return {
    _status: 200,
    _json: null,
    status(code) { this._status = code; return this; },
    json(payload) { this._json = payload; return this; },
  };
}

function assert(cond, msg) {
  if (!cond) { console.error('  ✗ 실패:', msg); process.exitCode = 1; }
  else console.log('  ✓', msg);
}

(async () => {
  store._reset();
  console.log('================ 🧬 E2E 검증 (당신의 영양제) ================\n');

  // 1) 설문 → 추천 → 스냅샷 저장
  console.log('[1] 설문 제출 → 추천 생성·저장');
  const req = { body: {
    profile: { age: 34, sex: 'F' },
    channel: { kakao_id: 'k_demo', consent_push: true },
    concerns: ['fatigue', 'eye', 'bone_joint'],
    medications: ['warfarin'],
    allergies: [],
  } };
  const res = mockRes();
  await handleRecommend(req, res);
  assert(res._status === 200, `추천 응답 200 (실제 ${res._status})`);
  assert(res._json.recommendation_id, `recommendation_id 발급됨: ${res._json.recommendation_id}`);
  assert(res._json.user_id, `user_id 발급됨: ${res._json.user_id}`);
  assert(Array.isArray(res._json.recommended) && res._json.recommended.length > 0,
    `추천 성분 ${res._json.recommended?.length}개`);

  // 2) 스냅샷이 실제로 영속됐는지 재조회
  console.log('\n[2] 저장소 재조회로 영속성 확인');
  const saved = store.getRecommendation(res._json.recommendation_id);
  assert(saved && saved.items.length === res._json.recommended.length,
    '추천 스냅샷이 저장소에서 재조회됨');
  const savedUser = store.getUser(res._json.user_id);
  assert(savedUser && savedUser.channel?.kakao_id === 'k_demo', '사용자 스냅샷 재조회됨');

  // 3) 내 영양제 등록 + 알람 스케줄(이미 도래한 시각) 저장
  console.log('\n[3] 내 영양제 등록 + 알람 스케줄 저장');
  const topItem = res._json.recommended[0];
  const my = store.saveMySupplement({
    user_id: res._json.user_id,
    ingredient_id: topItem.ingredient_id,
    name: topItem.name,
    duration_type: topItem.duration_type,
  });
  assert(my.id, `내 영양제 등록됨: ${my.name} (${my.id})`);
  const past = new Date(Date.now() - 60 * 1000).toISOString(); // 1분 전 = 발송 대상
  const sch = store.saveSchedule({
    user_id: res._json.user_id,
    my_supplement_id: my.id,
    channel: 'push',
    times: ['08:00'],
    next_fire_at: past,
    interval_days: 1,
  });
  assert(sch.id && sch.next_fire_at === past, `스케줄 저장됨(발송 예정): ${sch.id}`);

  // 4) 틱 실행 → 발송 + next_fire_at 전진 확인
  console.log('\n[4] 알람 틱 실행');
  let pushed = 0;
  setPushSender(async (user, mySup) => { pushed++; console.log(`    📲 푸시: ${user.id} → ${mySup.name}`); });
  const fired = await tickIntakeAlarms(new Date().toISOString());
  assert(fired === 1, `발송된 스케줄 1건 (실제 ${fired})`);
  assert(pushed === 1, `push 발송기 호출 1회 (실제 ${pushed})`);
  const after = store.updateSchedule(sch.id, {}); // 재조회
  assert(after.next_fire_at > past, `next_fire_at 전진됨: ${after.next_fire_at}`);
  assert(after.last_fired_at, 'last_fired_at 기록됨');

  // 5) 재틱 시 중복 발송 없음(전진했으므로 미도래)
  console.log('\n[5] 재틱 — 중복 발송 없어야 함');
  const fired2 = await tickIntakeAlarms(new Date().toISOString());
  assert(fired2 === 0, `재틱 발송 0건 (실제 ${fired2})`);

  console.log('\n============================================================');
  console.log(process.exitCode ? '❌ 일부 검증 실패' : '✅ 전체 E2E 검증 통과');

  // 임시 데이터 정리
  try { fs.rmSync(process.env.SUPP_DATA_DIR, { recursive: true, force: true }); } catch {}
})();
