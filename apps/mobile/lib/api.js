// 모바일 앱 → 백엔드(Next 서버) API 클라이언트
//
// 앱은 웹처럼 상대경로(/api/...)를 쓸 수 없으므로 절대 베이스 URL이 필요하다.
// Expo 공개 환경변수 EXPO_PUBLIC_API_BASE 로 주입(예: https://api.your-supplement.com).
// 미설정 시 로컬 개발 기본값 사용.

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000';

// 설문 입력 → 추천 결과. 실패 시 예외를 던지므로 호출부에서 폴백 처리.
export async function fetchRecommendation(user) {
  const res = await fetch(`${API_BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`recommend request failed: ${res.status}`);
  return res.json();
}
