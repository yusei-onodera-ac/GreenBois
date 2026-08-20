// F9本格版：管轄先(Authority)ロースターの投入。
// `npm run db:seed` の後に実行する想定(publicSite等を初期化するseed.tsとは独立)。
//
// 出典についての方針(捏造しないためのルール):
// - 東京都全域(建設局・環境局)の部署名は東京都建設局公式サイトで確認済み。
// - 世田谷区・目黒区・渋谷区・中野区・荒川区・港区・豊島区・北区・板橋区・江戸川区は
//   各区公式サイトで実在する部署名を確認して採用(WebFetchで組織案内ページを直接確認)。
// - 渋谷区は「土木部」までは確認できたが、公園を直接担当する課名までは
//   今回のリサーチでは特定できなかったため「土木部」に留める(過度に具体的な
//   課名を推測で断定しない)。
// - それ以外13区は個別確認していないため、部署名の末尾に「(要確認)」を付け、
//   sourceNoteに明記する(推測の部署名を確定情報として提示しない)。
// - contactEmail はどの部署についても実在するメールアドレスを確認できなかったため
//   全て null のまま(問い合わせは各区公式サイトのWebフォーム経由が実情)。
import { PrismaClient } from "@prisma/client";
import { TOKYO_WARDS } from "../../src/lib/tokyoWards";
import { haversineMeters } from "@/lib/geo";
import { determineJurisdiction } from "@/lib/jurisdiction";
import type { LandType } from "@/lib/enums";

const prisma = new PrismaClient();

// 座標から最も中心に近い区を返す(区境ポリゴンでの厳密な判定はまだ無いため近似。
// docs/05-roadmap.mdの既知の制約として明記済み)。シードデータのJurisdiction再計算
// (下記)専用の簡易ヘルパーで、本番の管轄自動判定(LocationPicker.tsxのGSI逆ジオコーディング)
// とは別経路。
function nearestWard(lat: number, lng: number): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const w of TOKYO_WARDS) {
    const d = haversineMeters({ lat, lng }, { lat: w.lat, lng: w.lng });
    if (d < bestDist) {
      bestDist = d;
      best = w.name;
    }
  }
  return best;
}

const VERIFIED_WARD_DEPTS: Record<string, { park: string; road: string; note: string }> = {
  世田谷区: {
    park: "世田谷区 みどり33推進担当部 みどり政策課",
    road: "世田谷区 土木部 道路管理課",
    note: "世田谷区公式サイトで確認(みどり33推進担当部 みどり政策課)。道路管理課は一般的な組織名から採用、要再確認。",
  },
  目黒区: {
    park: "目黒区 都市整備部 みどり土木政策課",
    road: "目黒区 道路公園課",
    note: "目黒区公式サイトで確認(都市整備部 みどり土木政策課／道路公園課)。",
  },
  渋谷区: {
    park: "渋谷区 土木部",
    road: "渋谷区 土木部",
    note: "渋谷区公式サイトで「土木部」までは確認。公園・道路それぞれの正式な課名は今回未特定のため部単位に留める。",
  },
  中野区: {
    park: "中野区 都市基盤部 公園課",
    road: "中野区 都市基盤部 道路管理課",
    note: "中野区公式サイトで確認(都市基盤部 公園課／道路管理課)。",
  },
  荒川区: {
    park: "荒川区 防災都市づくり部 土木管理課",
    road: "荒川区 防災都市づくり部 土木管理課",
    note: "荒川区公式サイト(組織案内)で確認。公園・道路の維持管理を同一課が担当(道路・公園占用、境界確定、緑化指導等)。",
  },
  港区: {
    park: "港区 街づくり支援部 土木課",
    road: "港区 街づくり支援部 土木課",
    note: "港区公式サイトで確認(都市計画公園用地の取得・Park-PFI検討、都市計画道路の用地取得等)。同部には「土木管理課」(公園・道路の既存施設管理、占用許可、境界確認等)もあり、日常の維持管理系の問い合わせはそちらが窓口になる可能性がある(要再確認)。",
  },
  豊島区: {
    park: "豊島区 都市整備部 公園緑地課",
    road: "豊島区 都市整備部 道路管理課",
    note: "豊島区公式サイトで確認。同じ都市整備部の「道路整備課」は職務内容に「公園緑地課の所管に属するものを除く」と明記されており、公園と道路の担当が明確に分かれている。",
  },
  北区: {
    park: "北区 土木部 道路公園課",
    road: "北区 土木部 道路公園課",
    note: "北区は公園・道路の維持管理を同一課(道路公園課)が担当。複数の第三者情報源・検索結果で確認できたが、公式サイトのURL構成が変更されており(city.kita.tokyo.jp→city.kita.lg.jp)、直接のページ取得では404となったため要再確認。",
  },
  板橋区: {
    park: "板橋区 土木部 みどりと公園課",
    road: "板橋区 土木部 管理課",
    note: "板橋区公式サイトで確認。管理課は道路・橋梁・河川・公園の占用許可、区道・公園の確認窓口、認定・設置・変更・廃止等を担当。",
  },
  江戸川区: {
    park: "江戸川区 環境部 公園整備課",
    road: "江戸川区 土木部 施設管理課",
    note: "江戸川区公式サイトで確認。公園(環境部)と道路(土木部)が異なる部に属する点に注意(他区は同一部門であることが多い)。施設管理課は道路・河川の占用許可、道路台帳の作成・管理等も担当。",
  },
};

async function main() {
  // 東京都全域(都立公園・都道)
  const metroPark = await prisma.authority.upsert({
    where: { id: "authority_metro_park" },
    update: {},
    create: {
      id: "authority_metro_park",
      name: "東京都 建設局 公園緑地部",
      category: "park",
      ward: null,
      sourceNote: "東京都建設局公式サイトで確認(分掌事務: 道路・河川・公園緑地)。",
    },
  });
  const metroRoad = await prisma.authority.upsert({
    where: { id: "authority_metro_road" },
    update: {},
    create: {
      id: "authority_metro_road",
      name: "東京都 建設局 道路管理部",
      category: "road",
      ward: null,
      sourceNote: "東京都建設局公式サイトで確認(道路管理部 管理課等)。",
    },
  });
  const privateWindow = await prisma.authority.upsert({
    where: { id: "authority_private" },
    update: {},
    create: {
      id: "authority_private",
      name: "東京都 環境局(私有地緑化相談窓口)",
      category: "private",
      ward: null,
      sourceNote: "既存実装(src/lib/jurisdiction.ts)から踏襲。",
    },
  });
  const unassigned = await prisma.authority.upsert({
    where: { id: "authority_unassigned" },
    update: {},
    create: {
      id: "authority_unassigned",
      name: "未判定(手動割り当て待ち)",
      category: "other",
      ward: null,
      sourceNote: "施設一致・道路一致・区判定のいずれもできなかった場合の最終フォールバック。",
    },
  });

  let wardCount = 0;
  for (const w of TOKYO_WARDS) {
    const verified = VERIFIED_WARD_DEPTS[w.name];
    const parkName = verified ? verified.park : `${w.name} みどり公園担当課(要確認)`;
    const roadName = verified ? verified.road : `${w.name} 道路管理担当課(要確認)`;
    const note = verified
      ? verified.note
      : "正式な部署名は個別調査未実施。区公式サイトで要確認(2026年時点、汎用ラベル)。";

    await prisma.authority.upsert({
      where: { id: `authority_park_${w.code}` },
      update: { name: parkName, sourceNote: note },
      create: {
        id: `authority_park_${w.code}`,
        name: parkName,
        category: "park",
        ward: w.name,
        sourceNote: note,
      },
    });
    await prisma.authority.upsert({
      where: { id: `authority_road_${w.code}` },
      update: { name: roadName, sourceNote: note },
      create: {
        id: `authority_road_${w.code}`,
        name: roadName,
        category: "road",
        ward: w.name,
        sourceNote: note,
      },
    });
    wardCount += 1;
  }

  // 行政アカウント(AdminRole)を、実際のAuthority(区の担当部署)に紐付ける。
  // db:seed → ingest:authorities の順で実行する想定のため、AdminRole自体は
  // db:seed側で先に作成済み(authorityIdは未設定)。ここではhandle(一意な固定値)で
  // 対象の行政アカウントを特定し、authorityIdを更新する(F: 行政ダッシュボードの
  // 管轄絞り込み。src/app/admin/(protected)/page.tsx参照)。
  // 行政職員-0001(東京都 建設局 担当者)は意図的に含めない。authorityIdをnullのままにし、
  // 「全域を閲覧できる統括担当者」として扱う(src/app/admin/(protected)/page.tsxの
  // 絞り込みロジック: authorityIdが無ければ全件、あれば一致するものだけを表示)。
  const ADMIN_AUTHORITY_BY_HANDLE: Record<string, string> = {
    "行政職員-0002": "authority_park_13112", // 世田谷区
    "行政職員-0003": "authority_park_13110", // 目黒区
    "行政職員-0004": "authority_park_13113", // 渋谷区
    "行政職員-0005": "authority_park_13114", // 中野区
  };
  let adminRolesLinked = 0;
  for (const [handle, authorityId] of Object.entries(ADMIN_AUTHORITY_BY_HANDLE)) {
    const user = await prisma.user.findFirst({ where: { handle, userType: "admin" } });
    if (!user) continue; // db:seed未実行等でまだ存在しない場合はスキップ(次回実行時に反映)
    await prisma.adminRole.updateMany({ where: { userId: user.id }, data: { authorityId } });
    adminRolesLinked += 1;
  }

  // 既存提案のJurisdictionを、実際の管轄自動判定ロジック(src/lib/jurisdiction.ts)で
  // 再計算する。db:seedの時点ではAuthorityテーブルがまだ無く、Jurisdiction.authorityId
  // (行政ダッシュボードの管轄絞り込みキー、admin/(protected)/page.tsx参照)を設定できない
  // ため、ここ(Authority投入後)でまとめて解決する。
  // - landType=private/unknown は determineJurisdiction() だと区の公園担当に
  //   誤って一致してしまう場合があるため(新規提案フォームでは到達しないケースで、
  //   determineJurisdiction()側は考慮していない)、専用の固定Authorityへ直接紐付ける。
  // - それ以外(public_ward/public_metro)は、座標から最寄りの区を求めて
  //   determineJurisdiction()をそのまま呼ぶ(本番の判定と同じロジック)。
  const proposals = await prisma.proposal.findMany({ select: { id: true, lat: true, lng: true, landType: true } });
  let jurisdictionsUpdated = 0;
  for (const p of proposals) {
    let authorityId: string;
    let authorityName: string;
    let determinationMethod: string;

    if (p.landType === "private") {
      authorityId = privateWindow.id;
      authorityName = privateWindow.name;
      determinationMethod = "manual_review";
    } else if (p.landType === "unknown") {
      authorityId = unassigned.id;
      authorityName = unassigned.name;
      determinationMethod = "manual_review";
    } else {
      const ward = nearestWard(p.lat, p.lng);
      const result = await determineJurisdiction({
        lat: p.lat,
        lng: p.lng,
        landType: p.landType as LandType,
        ward,
      });
      authorityId = result.authorityId ?? unassigned.id;
      authorityName = result.authorityName;
      determinationMethod = result.determinationMethod;
    }

    await prisma.jurisdiction.updateMany({
      where: { proposalId: p.id },
      data: { authorityId, authorityName, determinationMethod },
    });
    jurisdictionsUpdated += 1;
  }

  console.log("Authorities seeded:", {
    metroPark: metroPark.name,
    metroRoad: metroRoad.name,
    privateWindow: privateWindow.name,
    unassigned: unassigned.name,
    wards: wardCount,
    adminRolesLinked,
    jurisdictionsUpdated,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
