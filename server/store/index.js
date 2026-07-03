// 당신의 영양제 — 경량 영속 저장소 (무의존, JSON 파일 기반)
//
// 목적: 외부 DB 없이도 user / recommendation / my_supplement / intake_schedule 를
// 실제로 저장·조회할 수 있게 하는 최소 영속 계층. 프로덕션에서 Postgres 등으로
// 교체할 때 이 모듈의 인터페이스(saveUser, getUser, saveRecommendation, ...)만
// 동일하게 유지하면 상위 코드(recommend.js, schedule.js)는 바뀌지 않는다.
//
// schema.md 의 동적 데이터 모델(user, recommendation, my_supplement, intake_schedule)을 따른다.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.SUPP_DATA_DIR || path.join(__dirname, '..', '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY = { users: {}, recommendations: {}, my_supplements: {}, intake_schedules: {} };

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read() {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch {
    return JSON.parse(JSON.stringify(EMPTY));
  }
}

function write(db) {
  ensureDir();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE); // 원자적 교체
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowISO() {
  return new Date().toISOString();
}

// ── user ──────────────────────────────────────────────
function saveUser(user = {}) {
  const db = read();
  const uid = user.id || id('u');
  db.users[uid] = { ...user, id: uid, updated_at: nowISO() };
  write(db);
  return db.users[uid];
}
function getUser(uid) {
  return read().users[uid] || null;
}

// ── recommendation (스냅샷) ───────────────────────────
function saveRecommendation(rec = {}) {
  const db = read();
  const rid = rec.id || id('rec');
  db.recommendations[rid] = { ...rec, id: rid, created_at: rec.created_at || nowISO() };
  write(db);
  return db.recommendations[rid];
}
function getRecommendation(rid) {
  return read().recommendations[rid] || null;
}

// ── my_supplement (내 영양제) ─────────────────────────
function saveMySupplement(my = {}) {
  const db = read();
  const mid = my.id || id('my');
  db.my_supplements[mid] = { ...my, id: mid, started_at: my.started_at || nowISO() };
  write(db);
  return db.my_supplements[mid];
}
function getMySupplement(mid) {
  return read().my_supplements[mid] || null;
}

// ── intake_schedule (섭취 알람) ───────────────────────
function saveSchedule(sch = {}) {
  const db = read();
  const sid = sch.id || id('sch');
  db.intake_schedules[sid] = {
    channel: 'kakao',
    active: true,
    interval_days: 1,
    times: [],
    ...sch,
    id: sid,
  };
  write(db);
  return db.intake_schedules[sid];
}
function listSchedules() {
  return Object.values(read().intake_schedules);
}
// next_fire_at <= now 이고 active 인 스케줄
function queryDueSchedules(now = nowISO()) {
  return listSchedules().filter((s) => s.active && s.next_fire_at && s.next_fire_at <= now);
}
function updateSchedule(sid, patch) {
  const db = read();
  if (!db.intake_schedules[sid]) return null;
  db.intake_schedules[sid] = { ...db.intake_schedules[sid], ...patch };
  write(db);
  return db.intake_schedules[sid];
}
// 발송 후 다음 발화 시각으로 전진 (interval_days 만큼)
function advanceNextFire(sch) {
  const base = sch.next_fire_at ? new Date(sch.next_fire_at) : new Date();
  const next = new Date(base.getTime() + (sch.interval_days || 1) * 24 * 60 * 60 * 1000);
  return updateSchedule(sch.id, { next_fire_at: next.toISOString(), last_fired_at: nowISO() });
}

// ── 테스트/초기화용 ───────────────────────────────────
function _reset() {
  write(JSON.parse(JSON.stringify(EMPTY)));
}

module.exports = {
  DATA_DIR,
  DB_FILE,
  saveUser,
  getUser,
  saveRecommendation,
  getRecommendation,
  saveMySupplement,
  getMySupplement,
  saveSchedule,
  listSchedules,
  queryDueSchedules,
  updateSchedule,
  advanceNextFire,
  _reset,
};
