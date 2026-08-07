import type { StyleSpecification } from "maplibre-gl";

// ローカル開発では外部タイルサーバーへの通信がブロックされる/不安定な環境があるため、
// 外部リクエスト不要の最小構成スタイル(背景色+グリッド線のみ)を使用する。
// 本番・実証実験フェーズでは国土地理院タイル等の実データソースへの差し替えを検討する
// (docs/03-external-integration.md, docs/04-architecture.md 参照)。
export const OFFLINE_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#dcefe3" },
    },
  ],
};
