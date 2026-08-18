// F9本格版：東京都オープンデータカタログの区市町村別「都市公園一覧」標準CSVを取り込み、
// PublicSite(区立公園)を実データで拡張する。
//
// データソース: 東京都オープンデータカタログサイト(CKAN)
//   https://catalog.data.metro.tokyo.lg.jp/api/3/action/package_search
// 各区が公開している標準データセット「都市公園一覧」CSV(列: 名称,所在地_連結表記,緯度,経度 等)。
// 緯度経度が空の行は、既存のLocationPicker.tsxと同じGSI住所検索APIでオフライン・ジオコーディングする。
//
// 注意(2026年時点の実地調査結果): 23区のうち約3分の2はこの標準データセットを
// カタログ上で発見できたが、残りは検索しても見つからなかった(未公開または
// 別形式で公開されている可能性がある)。取得できなかった区はログに一覧表示するのみで、
// エラーにはしない(既存の手打ちデータ・区フォールバックで引き続き機能する)。
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

// CKAN検索を複数ページ(start=0,100,...,1000)たどって、23区の
// 「都市公園一覧」CSVリソースURLを収集する(区名がタイトルに出るとは限らないため
// URL中のファイル名(6桁コード+区ローマ字)で自区のものかを判定する)。
async function discoverParkCsvUrls(): Promise<Map<string, string>> {
  const found = new Map<string, string>(); // wardName -> csvUrl

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
        const m = /\/(\d{6})_[a-z0-9]+_toshitoritukouen\.csv$/i.exec(resource.url ?? "");
        if (!m) continue;
        const code5 = m[1].slice(0, 5);
        const ward = TOKYO_WARDS.find((w) => w.code === code5);
        if (ward && !found.has(ward.name)) {
          found.set(ward.name, resource.url!);
        }
      }
    }
    if (found.size >= TOKYO_WARDS.length) break;
  }
  return found;
}

type ParkRow = {
  名称?: string;
  所在地_連結表記?: string;
  緯度?: string;
  経度?: string;
};

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
  // 標準データセットはShift_JISのことがあるため、UTF-8デコードに失敗した記号が
  // 多い場合はShift_JISとして読み直す簡易判定は行わず、まずUTF-8として読む
  // (東京都オープンデータの多くはUTF-8で公開されている)。
  const text = buf.toString("utf-8");
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
    const name = row["名称"]?.trim();
    const address = row["所在地_連結表記"]?.trim();
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
  for (const [wardName, csvUrl] of urls) {
    const ward = TOKYO_WARDS.find((w) => w.name === wardName)!;
    const authorityId = `authority_park_${ward.code}`;
    process.stdout.write(`  取り込み中: ${wardName} … `);
    const { imported, geocoded, skipped } = await importWard(wardName, csvUrl, authorityId);
    console.log(`${imported}件追加(ジオコーディング${geocoded}件、上限到達${skipped}件)`);
    totalImported += imported;
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
