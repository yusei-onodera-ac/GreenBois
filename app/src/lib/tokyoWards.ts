// 東京都23区の概略中心座標(区役所付近を目安とした簡易値)+ 全国地方公共団体コード(5桁)。
// 位置指定時に「区から選ぶ」導線で地図を大まかに移動させる用途、および
// GSI逆ジオコーディング結果(市区町村コード)から区名を引く用途、
// オープンデータ取り込み(F9本格版・app/prisma/ingest/)でのCSV照合に使う
// (厳密な行政界データではない。GIS自動判定への置き換えは docs/03-external-integration.md 参照)。
export const TOKYO_WARDS: { name: string; lat: number; lng: number; code: string }[] = [
  { name: "千代田区", lat: 35.694, lng: 139.7536, code: "13101" },
  { name: "中央区", lat: 35.6706, lng: 139.7720, code: "13102" },
  { name: "港区", lat: 35.6581, lng: 139.7514, code: "13103" },
  { name: "新宿区", lat: 35.6938, lng: 139.7036, code: "13104" },
  { name: "文京区", lat: 35.7080, lng: 139.7519, code: "13105" },
  { name: "台東区", lat: 35.7128, lng: 139.7800, code: "13106" },
  { name: "墨田区", lat: 35.7107, lng: 139.8016, code: "13107" },
  { name: "江東区", lat: 35.6729, lng: 139.8175, code: "13108" },
  { name: "品川区", lat: 35.6092, lng: 139.7302, code: "13109" },
  { name: "目黒区", lat: 35.6414, lng: 139.6983, code: "13110" },
  { name: "大田区", lat: 35.5614, lng: 139.7161, code: "13111" },
  { name: "世田谷区", lat: 35.6465, lng: 139.6532, code: "13112" },
  { name: "渋谷区", lat: 35.6642, lng: 139.6982, code: "13113" },
  { name: "中野区", lat: 35.7075, lng: 139.6638, code: "13114" },
  { name: "杉並区", lat: 35.6994, lng: 139.6363, code: "13115" },
  { name: "豊島区", lat: 35.7261, lng: 139.7168, code: "13116" },
  { name: "北区", lat: 35.7526, lng: 139.7337, code: "13117" },
  { name: "荒川区", lat: 35.7362, lng: 139.7833, code: "13118" },
  { name: "板橋区", lat: 35.7513, lng: 139.7093, code: "13119" },
  { name: "練馬区", lat: 35.7357, lng: 139.6516, code: "13120" },
  { name: "足立区", lat: 35.7752, lng: 139.8046, code: "13121" },
  { name: "葛飾区", lat: 35.7434, lng: 139.8474, code: "13122" },
  { name: "江戸川区", lat: 35.7066, lng: 139.8683, code: "13123" },
];

// 全国地方公共団体コード(5桁) → 区名。GSI逆ジオコーディードのmuniCdや
// オープンデータCSVのファイル名先頭6桁(5桁コード+検査数字)の照合に使う。
export const MUNI_CD_TO_WARD: Record<string, string> = Object.fromEntries(
  TOKYO_WARDS.map((w) => [w.code, w.name])
);

// 区名 → 5桁コード(逆引き)
export const WARD_TO_MUNI_CD: Record<string, string> = Object.fromEntries(
  TOKYO_WARDS.map((w) => [w.name, w.code])
);
