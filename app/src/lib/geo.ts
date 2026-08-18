// 管轄自動判定(F9本格版)で使う地理計算ユーティリティ。
// SQLiteには空間インデックスが無いため、近傍探索は素朴な全件距離計算で行う
// (Tokyo規模のPublicSite/RoadSegment件数なら十分高速。将来PostGIS移行時は
// ST_DWithin等に置き換える想定。docs/04-architecture.md参照)。

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// 2点間の距離(メートル)。PublicSiteとの近傍一致に使う。
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type LatLng = { lat: number; lng: number };

// 点pから線分(a→b)までの最短距離(メートル・近似)。
// 緯度経度をそのまま平面近似(equirectangular)して計算する
// (東京都程度の範囲・道路セグメントとの近接判定用途では十分な精度)。
function pointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  // 緯度で経度方向のスケールを補正した簡易平面座標(メートル換算)
  const latRef = toRad(p.lat);
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos(latRef);

  const toXY = (pt: LatLng) => ({
    x: (pt.lng - a.lng) * mPerDegLng,
    y: (pt.lat - a.lat) * mPerDegLat,
  });

  const P = toXY(p);
  const A = { x: 0, y: 0 };
  const B = toXY(b);

  const abx = B.x - A.x;
  const aby = B.y - A.y;
  const lenSq = abx * abx + aby * aby;

  if (lenSq === 0) return haversineMeters(p, a);

  let t = ((P.x - A.x) * abx + (P.y - A.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = A.x + t * abx;
  const projY = A.y + t * aby;

  return Math.hypot(P.x - projX, P.y - projY);
}

// 点pから折れ線(複数の頂点からなるライン)までの最短距離(メートル)。
// RoadSegment.geometry([[lng,lat], ...])との近接判定に使う。
export function pointToPolylineMeters(p: LatLng, line: [number, number][]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return haversineMeters(p, { lng: line[0][0], lat: line[0][1] });

  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const a = { lng: line[i][0], lat: line[i][1] };
    const b = { lng: line[i + 1][0], lat: line[i + 1][1] };
    const d = pointToSegmentMeters(p, a, b);
    if (d < min) min = d;
  }
  return min;
}

// PublicSiteの近傍探索(公園・図書館・道路の混在した1点集合から最寄りを選ぶ)で
// 種別ごとの優先度を考慮した「最寄りだが単純な直線距離だけでは選ばない」判定に使う。
//
// 背景: 公園データ(app/prisma/ingest/fetchParks.ts)は東京都オープンデータの実取り込みで
// 都内3,000件超と非常に密なのに対し、道路は代表点1つのみの手打ちデータ(4件)しか無い。
// 単純な「全件中の最短距離」で選ぶと、道路の代表点付近をクリックしても、たまたまより
// 近い公園の1点に判定が奪われてしまう(密度の低い種別が高い種別に埋もれる問題)。
// これを避けるため、範囲内候補は種別優先度(road > library > park/other)で選び、
// 同じ優先度内でのみ直線距離で競わせる。
const KIND_PRIORITY: Record<string, number> = { road: 0, library: 1, park: 2, other: 2 };

export function pickNearestByPriority<T extends { lat: number; lng: number; kind: string }>(
  point: LatLng,
  candidates: T[],
  radiusMeters: number
): T | null {
  let best: T | null = null;
  let bestPriority = Infinity;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = haversineMeters(point, { lat: c.lat, lng: c.lng });
    if (d > radiusMeters) continue;
    const priority = KIND_PRIORITY[c.kind] ?? 2;
    if (priority < bestPriority || (priority === bestPriority && d < bestDist)) {
      best = c;
      bestPriority = priority;
      bestDist = d;
    }
  }
  return best;
}
