import type { StyleSpecification } from "maplibre-gl";

// 国土地理院(GSI)提供の標準地図タイル。APIキー不要・無償で利用可能
// (https://maps.gsi.go.jp/development/ichiran.html)。
// docs/03-external-integration.md / docs/04-architecture.md で本番想定の地図タイルとして
// 挙げているものと同一で、実際に地名・道路が表示される実データソース。
export const GSI_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    gsi: {
      type: "raster",
      tiles: ["https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"],
      tileSize: 256,
      minzoom: 2,
      maxzoom: 18,
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>',
    },
  },
  layers: [
    {
      id: "gsi-layer",
      type: "raster",
      source: "gsi",
    },
  ],
};
