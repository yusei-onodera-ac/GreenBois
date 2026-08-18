import { prisma } from "@/lib/prisma";
import { pickNearestByPriority } from "@/lib/geo";
import { LandType } from "@/lib/enums";

// F9本格版：管轄自動判定。
//
// 優先順位:
//   1. 施設・道路(PublicSite)の近傍一致 — site_match / road_match
//      (PublicSiteはapp/prisma/ingest/fetchParks.tsで東京都オープンデータから取り込んだ
//       実データ(15区・約3,300件の公園)と、既存の手打ちデータ(図書館・道路等)を含む)
//   2. 区がわかれば区の担当部署にフォールバック — ward_fallback
//      (区名はLocationPicker.tsxのGSI逆ジオコーディングから来る)
//   3. 従来のlandType固定表(最終フォールバック。GIS/施設データが無い場合でも
//      必ず何かを返す) — manual_review
//
// 各区・都全域の担当部署(Authority)はapp/prisma/ingest/seedAuthorities.tsで投入する。
// 未投入環境(Authorityテーブルが空)でも3.の固定表で必ず動作する(後方互換)。

// LocationPicker.tsxのSITE_AUTO_MATCH_RADIUS_Mと同じ値・同じ判定方式に揃える
// (以前は単純な全件最短距離・250mだったため、密な公園データに道路判定が
// 埋もれてしまう問題があった。pickNearestByPriorityで種別優先度も考慮する)。
const SITE_MATCH_RADIUS_M = 80;

// 従来のlandType固定表(GIS/施設データが一切無い場合の最終フォールバック。
// 既存コードをそのまま温存。TODO表記は歴史的経緯として残す)。
const AUTHORITY_BY_LAND_TYPE: Record<LandType, string> = {
  public_metro: "東京都 建設局 公園緑地部",
  public_ward: "区市町村 みどり公園課",
  private: "東京都 環境局(私有地緑化相談窓口)",
  unknown: "未判定(手動割り当て待ち)",
};

export type JurisdictionResult = {
  authorityId: string | null;
  authorityName: string;
  determinationMethod: "site_match" | "road_match" | "ward_fallback" | "manual_review";
};

// 区名+カテゴリ(park|road)からAuthorityを探す。都立(landType=public_metro)の場合は
// 区に依らず都全域の担当(建設局)を返す。見つからなければnull。
async function resolveAuthority(params: {
  ward: string | null;
  category: "park" | "road";
  landType?: LandType;
}): Promise<{ id: string; name: string } | null> {
  const { ward, category, landType } = params;

  if (landType === "public_metro") {
    return prisma.authority.findFirst({
      where: { category, ward: null },
      select: { id: true, name: true },
    });
  }

  if (ward) {
    return prisma.authority.findFirst({
      where: { ward, category },
      select: { id: true, name: true },
    });
  }

  return null;
}

export async function determineJurisdiction(params: {
  lat: number;
  lng: number;
  landType: LandType;
  ward?: string | null;
}): Promise<JurisdictionResult> {
  const { lat, lng, landType, ward } = params;

  // 1. 施設・道路の近傍一致(全件距離計算。SQLiteに空間インデックスが無いため。
  //    件数規模的にリクエスト毎の全件走査で十分高速 — src/lib/geo.ts参照)
  const sites = await prisma.publicSite.findMany();
  const nearest = pickNearestByPriority({ lat, lng }, sites, SITE_MATCH_RADIUS_M);

  if (nearest) {
    const category: "park" | "road" = nearest.kind === "road" ? "road" : "park";
    const method = nearest.kind === "road" ? "road_match" : "site_match";

    const authority = nearest.authorityId
      ? await prisma.authority.findUnique({ where: { id: nearest.authorityId }, select: { id: true, name: true } })
      : await resolveAuthority({ ward: nearest.ward, category, landType: nearest.landType as LandType });

    if (authority) {
      return { authorityId: authority.id, authorityName: authority.name, determinationMethod: method };
    }
  }

  // 2. 区フォールバック(施設一致が無くても、区がわかれば区の担当部署を返す。
  //    道路か公園かは判別できないため、デフォルトで「公園」担当を返す)
  if (ward) {
    const authority = await resolveAuthority({ ward, category: "park", landType });
    if (authority) {
      return { authorityId: authority.id, authorityName: authority.name, determinationMethod: "ward_fallback" };
    }
  }

  // 3. 都全域(landType=public_metro)は区が不明でも建設局にフォールバックできる
  if (landType === "public_metro") {
    const authority = await resolveAuthority({ ward: null, category: "park", landType });
    if (authority) {
      return { authorityId: authority.id, authorityName: authority.name, determinationMethod: "ward_fallback" };
    }
  }

  // 4. 最終フォールバック(従来ロジック。Authority未投入環境でも必ず動作する)
  return {
    authorityId: null,
    authorityName: AUTHORITY_BY_LAND_TYPE[landType],
    determinationMethod: "manual_review",
  };
}
