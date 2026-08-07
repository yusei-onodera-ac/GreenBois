import { LandType } from "@/lib/enums";

// F9: 管轄自動判定(簡易版)
//
// 本来は投稿位置と東京都「緑のオープンデータ」都市計画GIS(Shapefile/JGD2011)を
// 空間結合して都立/区立/私有地を自動判定する想定(docs/03-external-integration.md)。
// ローカル開発フェーズではGISデータ未接続のため、投稿者が申告した landType を
// そのまま採用し、所管部署名のみ固定マッピングで補完する(manual_review 扱い)。
// TODO: GIS連携実装時に determineMethod を "gis_auto" に切り替える。

const AUTHORITY_BY_LAND_TYPE: Record<LandType, string> = {
  public_metro: "東京都 建設局 公園緑地部",
  public_ward: "区市町村 みどり公園課",
  private: "東京都 環境局(私有地緑化助成担当)",
  unknown: "未判定(手動割り当て待ち)",
};

export function determineJurisdiction(landType: LandType) {
  return {
    authorityName: AUTHORITY_BY_LAND_TYPE[landType],
    determinationMethod: "manual_review" as const,
  };
}
