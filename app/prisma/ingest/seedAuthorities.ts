// F9本格版：管轄先(Authority)ロースターの投入。
// `npm run db:seed` の後に実行する想定(publicSite等を初期化するseed.tsとは独立)。
//
// 出典についての方針(捏造しないためのルール):
// - 東京都全域(建設局・環境局)の部署名は東京都建設局公式サイトで確認済み。
// - 世田谷区・目黒区・中野区は各区公式サイトで実在する部署名を確認して採用。
// - 渋谷区は「土木部」までは確認できたが、公園を直接担当する課名までは
//   今回のリサーチでは特定できなかったため「土木部」に留める(過度に具体的な
//   課名を推測で断定しない)。
// - それ以外19区は個別確認していないため、部署名の末尾に「(要確認)」を付け、
//   sourceNoteに明記する(推測の部署名を確定情報として提示しない)。
// - contactEmail はどの部署についても実在するメールアドレスを確認できなかったため
//   全て null のまま(問い合わせは各区公式サイトのWebフォーム経由が実情)。
import { PrismaClient } from "@prisma/client";
import { TOKYO_WARDS } from "../../src/lib/tokyoWards";

const prisma = new PrismaClient();

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

  console.log("Authorities seeded:", {
    metroPark: metroPark.name,
    metroRoad: metroRoad.name,
    privateWindow: privateWindow.name,
    unassigned: unassigned.name,
    wards: wardCount,
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
