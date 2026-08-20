// F9本格版：東京都オープンデータカタログの区市町村別「都市公園一覧」標準CSVを取り込み、
// PublicSite(区立公園)を実データで拡張する。
//
// データソース: 東京都オープンデータカタログサイト(CKAN)
//   https://catalog.data.metro.tokyo.lg.jp/api/3/action/package_search
// 各区が公開している標準データセット「都市公園一覧」CSV(列: 名称,所在地_連結表記,緯度,経度 等)。
// 緯度経度が空の行は、既存のLocationPicker.tsxと同じGSI住所検索APIでオフライン・ジオコーディングする。
//
// 注意(2026年時点の実地調査結果): 標準データセット(ファイル名パターン一致)は
// 23区中16区で発見できる。個別調査で確認できた目黒区・中野区は表記ゆれの強い
// 別ソース(EXTRA_WARD_CSV_URLS参照)として追加済み。残り6区(港・豊島・北・板橋・
// 江戸川、および渋谷区は既存手打ちデータで一部カバー)は東京都オープンデータ
// カタログ上に機械可読な公園一覧データセットを確認できなかった(docs/05-roadmap.md参照)。
// 取得できなかった区はログに一覧表示するのみで、エラーにはしない
// (既存の手打ちデータ・区フォールバックで引き続き機能する)。
//
// 実行: npm --prefix app run ingest:parks
// 環境変数 MAX_GEOCODE_PER_WARD で区ごとのジオコーディング件数上限を調整できる
// (未指定時は40。件数が多い区では全件ジオコーディングに時間がかかるため)。
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { TOKYO_WARDS } from "../../src/lib/tokyoWards";

const prisma = new PrismaClient();

const CATALOG_SEARCH_URL = "https://catalog.data.metro.tokyo.lg.jp/api/3/action/package_search";
const GSI_ADDRESS_SEARCH_URL = "https://msearch.gsi.go.jp/address-search/AddressSearch";
const MAX_GEOCODE_PER_WARD = Number(process.env.MAX_GEOCODE_PER_WARD ?? 40);
const GEOCODE_DELAY_MS = 150;

type CkanResource = { url?: string; format?: string };
type CkanResult = { resources?: CkanResource[] };
type CkanSearchResponse = { result?: { count?: number; results?: CkanResult[] } };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 自動探索(URLパターン一致)では見つからないが、カタログを個別に調査して実在を
// 確認できたCSV(docs/05-roadmap.md参照)。異なる公開プラットフォーム・列名・
// エンコーディングで提供されているため、標準パターンの対象外として個別に追加する。
// - 目黒区: data.bodik.jp上で「都立公園」「区立公園」が別データセットとして公開(Shift_JIS)
// - 中野区: 区独自のwagmap.jp上で「公園配置図」として公開(列名が「公園名」)
// いずれも捏造ではなく、実際にダウンロード・内容確認済みのURL。
const EXTRA_WARD_CSV_URLS: Record<string, string[]> = {
  目黒区: [
    "https://data.bodik.jp/dataset/bd204a35-87c9-4aaf-ab29-d05db4b3357c/resource/cc42b337-2afa-4dea-84f9-a8557deba751/download/131105_metropolitan_park_20210401.csv",
    "https://data.bodik.jp/dataset/9f7d70e4-d41f-4199-a180-eb2e3de6e728/resource/28badfb6-f33f-4b12-8ecc-ada279950cee/download/13_35_28badfb6-f33f-4b12-8ecc-ada279950cee.csv",
  ],
  中野区: ["https://www2.wagmap.jp/nakanodatamap/nakanodatamap/opendatafile/map_21/CSV/opendata_57000040.csv"],
};

// CKAN検索を複数ページ(start=0,100,...,1000)たどって、23区の
// 「都市公園一覧」CSVリソースURLを収集する(区名がタイトルに出るとは限らないため
// URL中のファイル名(6桁コード+区ローマ字)で自区のものかを判定する)。
// ファイル名の「都立」のローマ字表記は区によって"toritu"(訓令式)と"toritsu"
// (ヘボン式)の揺れがあるため両方を許容する(荒川区が後者だった)。
async function discoverParkCsvUrls(): Promise<Map<string, string[]>> {
  const found = new Map<string, string[]>(); // wardName -> csvUrls

  for (let start = 0; start <= 1000; start += 100) {
    const url = `${CATALOG_SEARCH_URL}?q=${encodeURIComponent("都市公園")}&rows=100&start=${start}`;
    let json: CkanSearchResponse;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      json = (await res.json()) as CkanSearchResponse;
    } catch {
      continue;
    }
    const results = json.result?.results ?? [];
    for (const r of results) {
      for (const resource of r.resources ?? []) {
        const m = /\/(\d{6})_[a-z0-9]+_toshitori(?:tu|tsu)kouen\.csv$/i.exec(resource.url ?? "");
        if (!m) continue;
        const code5 = m[1].slice(0, 5);
        const ward = TOKYO_WARDS.find((w) => w.code === code5);
        if (ward && !found.has(ward.name)) {
          found.set(ward.name, [resource.url!]);
        }
      }
    }
    if (found.size >= TOKYO_WARDS.length) break;
  }

  // 個別確認済みの追加ソースをマージする(自動探索で既に見つかっている区は上書きしない)。
  for (const [wardName, urls] of Object.entries(EXTRA_WARD_CSV_URLS)) {
    if (!found.has(wardName)) found.set(wardName, urls);
  }

  return found;
}

// 列名は区・提供元によって表記ゆれがある(名称/公園名、所在地_連結表記/所在地/公園所在地)。
// 緯度・経度はこれまで確認した全ソースで共通して「緯度」「経度」の列名だった。
type ParkRow = {
  名称?: string;
  公園名?: string;
  所在地_連結表記?: string;
  所在地?: string;
  公園所在地?: string;
  緯度?: string;
  経度?: string;
};

// 標準データセットの多くはUTF-8だが、Shift_JISで公開している提供元もある
// (例: 目黒区のdata.bodik.jp)。UTF-8として不正なバイト列を含む場合(置換文字が
// 出る場合)はShift_JISとして読み直す簡易判定を行う。
function decodeCsvBuffer(buf: Buffer): string {
  const utf8 = buf.toString("utf-8");
  const text = utf8.includes("�") ? new TextDecoder("shift-jis").decode(buf) : utf8;
  // 先頭のBOM(UTF-8 BOM等)が残っているとcsv-parseが1列目の引用符を誤認するため除去する
  // (中野区のCSVで発生。TextDecoderはBOMを自動除去しないデフォルト挙動のため明示的に処理)。
  const BOM = "﻿";
  return text.startsWith(BOM) ? text.slice(BOM.length) : text;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`${GSI_ADDRESS_SEARCH_URL}?q=${encodeURIComponent(address)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { geometry: { coordinates: [number, number] } }[];
    if (!data.length) return null;
    const [lng, lat] = data[0].geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function importWard(wardName: string, csvUrl: string, authorityId: string) {
  const res = await fetch(csvUrl);
  if (!res.ok) {
    console.log(`  [skip] ${wardName}: CSV取得失敗 (${res.status})`);
    return { imported: 0, geocoded: 0, skipped: 0 };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const text = decodeCsvBuffer(buf);
  let rows: ParkRow[];
  try {
    rows = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true }) as ParkRow[];
  } catch (e) {
    console.log(`  [skip] ${wardName}: CSV解析失敗 (${(e as Error).message})`);
    return { imported: 0, geocoded: 0, skipped: 0 };
  }

  let imported = 0;
  let geocoded = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = (row["名称"] ?? row["公園名"])?.trim();
    const address = (row["所在地_連結表記"] ?? row["所在地"] ?? row["公園所在地"])?.trim();
    if (!name) continue;

    const existing = await prisma.publicSite.findFirst({ where: { name, ward: wardName, kind: "park" } });
    if (existing) continue; // 再実行時の重複防止

    let lat = row["緯度"] ? Number(row["緯度"]) : NaN;
    let lng = row["経度"] ? Number(row["経度"]) : NaN;

    if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && address) {
      if (geocoded >= MAX_GEOCODE_PER_WARD) {
        skipped += 1;
        continue; // 上限到達。次回実行時に再度候補となる(このワードでは未作成のため)
      }
      const geo = await geocodeAddress(address);
      geocoded += 1;
      await sleep(GEOCODE_DELAY_MS);
      if (!geo) continue;
      lat = geo.lat;
      lng = geo.lng;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    await prisma.publicSite.create({
      data: {
        name,
        ward: wardName,
        lat,
        lng,
        landType: "public_ward",
        kind: "park",
        sourceUrl: csvUrl,
        authorityId,
      },
    });
    imported += 1;
  }

  return { imported, geocoded, skipped };
}

async function main() {
  console.log("東京都オープンデータカタログから「都市公園一覧」CSVを検索中…");
  const urls = await discoverParkCsvUrls();
  console.log(`発見: ${urls.size}/${TOKYO_WARDS.length}区`);

  const missing = TOKYO_WARDS.filter((w) => !urls.has(w.name)).map((w) => w.name);
  if (missing.length) {
    console.log("未発見(カタログ上で標準CSVを確認できなかった区):", missing.join("、"));
  }

  let totalImported = 0;
  for (const [wardName, csvUrls] of urls) {
    const ward = TOKYO_WARDS.find((w) => w.name === wardName)!;
    const authorityId = `authority_park_${ward.code}`;
    for (const csvUrl of csvUrls) {
      process.stdout.write(`  取り込み中: ${wardName} (${csvUrl.split("/").pop()}) … `);
      const { imported, geocoded, skipped } = await importWard(wardName, csvUrl, authorityId);
      console.log(`${imported}件追加(ジオコーディング${geocoded}件、上限到達${skipped}件)`);
      totalImported += imported;
    }
  }

  console.log("完了。追加した公園件数:", totalImported);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
