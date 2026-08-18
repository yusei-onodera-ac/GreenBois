import type { StyleSpecification } from "maplibre-gl";

// 地図タイルのスタイル定義。3種類を用意している。
//
// - getOsmMapStyle(既定): OpenStreetMapの標準タイル。GSI標準地図より公園・施設名の
//   ラベル密度が高く、地図として見やすい(「施設名が載っていない」「見づらい」という
//   フィードバックを受けての変更)。無償・APIキー不要だが、OSMの利用ポリシー
//   (https://operations.osmfoundation.org/policies/tiles/)上、大規模な商用トラフィックには
//   自前タイルサーバー等への切り替えが必要。本番化時の検討事項として残す
//   (docs/04-architecture.md参照)。
// - getGsiPhotoStyle: 国土地理院の航空写真(全国最新写真・シームレス)。ラベルは無いが
//   実際の地面の様子(緑の分布・建物形状等)が見える。LocationPicker.tsxで
//   OSMスタイルとの切り替えトグルとして使う。
// - getGsiMapStyle: 国土地理院 標準地図(旧デフォルト)。参考として残す。
//
// 関数(ファクトリ)にしているのは、MapLibreの Map コンストラクタに渡した
// style オブジェクトが内部で書き換えられるため(sources が空になる等)。
// 定数オブジェクトを複数の地図インスタンス(LocationPicker・ProposalMapなど)で
// 使い回すと、後から作られたインスタンスのスタイルが破損する不具合があったため、
// 呼び出しごとに新しいオブジェクトを返すようにしている。
const GLYPHS = "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf";

export function getOsmMapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        minzoom: 2,
        maxzoom: 19,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
      },
    },
    layers: [{ id: "osm-layer", type: "raster", source: "osm" }],
  };
}

export function getGsiPhotoStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {
      "gsi-photo": {
        type: "raster",
        tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
        tileSize: 256,
        minzoom: 2,
        maxzoom: 18,
        attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院(航空写真)</a>',
      },
    },
    layers: [{ id: "gsi-photo-layer", type: "raster", source: "gsi-photo" }],
  };
}

// 国土地理院(GSI)提供の標準地図タイル。APIキー不要・無償で利用可能
// (https://maps.gsi.go.jp/development/ichiran.html)。ラベル密度が低いためOSMスタイルに
// 置き換え済みだが、参考として定義を残す。
export function getGsiMapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
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
    layers: [{ id: "gsi-layer", type: "raster", source: "gsi" }],
  };
}
