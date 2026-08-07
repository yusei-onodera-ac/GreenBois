import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// デモ用シードデータ。対象エリアは世田谷区周辺(docs/03-external-integration.md の
// 「対象自治体を限定」方針に沿った架空の座標)。
async function main() {
  await prisma.statusHistory.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.score.deleteMany();
  await prisma.jurisdiction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.budgetAllocation.deleteMany();
  await prisma.greenAgreement.deleteMany();
  await prisma.adminRole.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.budgetCycle.deleteMany();
  await prisma.user.deleteMany();

  const citizenA = await prisma.user.create({
    data: { displayName: "田中 花子", lineUserId: "line_demo_citizen_a", userType: "citizen" },
  });
  const citizenB = await prisma.user.create({
    data: { displayName: "佐藤 次郎", lineUserId: "line_demo_citizen_b", userType: "citizen" },
  });
  const corporate = await prisma.user.create({
    data: { displayName: "株式会社グリーンビルド 環境担当", lineUserId: "line_demo_corp", userType: "corporate" },
  });
  const admin = await prisma.user.create({
    data: { displayName: "東京都 建設局 担当者", lineUserId: "line_demo_admin", userType: "admin" },
  });

  await prisma.adminRole.create({
    data: { userId: admin.id, jurisdictionScope: "世田谷区", roleLevel: "reviewer" },
  });

  await prisma.budgetCycle.create({
    data: {
      name: "2026年度 第2四半期 参加型緑化予算枠",
      totalAmount: 30_000_000,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-09-30"),
    },
  });

  const p1 = await prisma.proposal.create({
    data: {
      userId: citizenA.id,
      category: "shade",
      title: "太子堂公園に日よけ付きベンチを設置してほしい",
      description:
        "夏場、子どもを遊ばせている間に休める日陰がありません。日よけ付きベンチの設置を希望します。",
      lat: 35.6438,
      lng: 139.6688,
      landType: "public_ward",
      status: "collecting",
      signatureTarget: 50,
    },
  });
  await prisma.statusHistory.create({
    data: { proposalId: p1.id, toStatus: "collecting", changedByUserId: citizenA.id },
  });

  const p2 = await prisma.proposal.create({
    data: {
      userId: citizenB.id,
      category: "bench",
      title: "駒沢通り沿いの街路にベンチを増設したい",
      description: "高齢者の休憩スポットが少なく、長い距離を歩けない方が困っています。",
      lat: 35.6321,
      lng: 139.6654,
      landType: "public_ward",
      status: "screening",
      signatureTarget: 50,
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      { proposalId: p2.id, toStatus: "collecting", changedByUserId: citizenB.id },
      { proposalId: p2.id, fromStatus: "collecting", toStatus: "screening", changedByUserId: admin.id },
    ],
  });

  const p3 = await prisma.proposal.create({
    data: {
      userId: corporate.id,
      category: "private_greening",
      title: "自社ビル屋上・敷地緑化によるCSR活動",
      description:
        "三軒茶屋の自社ビル屋上および敷地の一部を緑化し、地域の緑化貢献としたい。緑地協定の締結にも協力可能。",
      lat: 35.6435,
      lng: 139.6698,
      landType: "private",
      status: "collecting",
      signatureTarget: 300,
    },
  });
  await prisma.statusHistory.create({
    data: { proposalId: p3.id, toStatus: "collecting", changedByUserId: corporate.id },
  });
  await prisma.greenAgreement.create({
    data: { proposalId: p3.id, minimumYears: 5 },
  });

  // 署名データ(p2はしきい値に近い数を仮投入)
  const signers = [citizenA, citizenB, corporate];
  for (const signer of signers) {
    await prisma.signature.create({ data: { proposalId: p1.id, userId: signer.id } }).catch(() => {});
  }
  await prisma.signature.create({ data: { proposalId: p2.id, userId: citizenA.id } }).catch(() => {});

  // 管轄・優先度スコアも投入(src/lib/jurisdiction.ts, src/lib/scoring.ts と同じロジックを
  // シード用に複製。tsxのパスエイリアス解決を避けるため意図的にインライン化している)
  const AUTHORITY_BY_LAND_TYPE: Record<string, string> = {
    public_metro: "東京都 建設局 公園緑地部",
    public_ward: "区市町村 みどり公園課",
    private: "東京都 環境局(私有地緑化助成担当)",
    unknown: "未判定(手動割り当て待ち)",
  };

  for (const p of [p1, p2, p3]) {
    await prisma.jurisdiction.create({
      data: {
        proposalId: p.id,
        authorityName: AUTHORITY_BY_LAND_TYPE[p.landType],
        determinationMethod: "manual_review",
      },
    });

    const signatureCount = await prisma.signature.count({ where: { proposalId: p.id } });
    const signatureRatio = Math.min(signatureCount / p.signatureTarget, 1);
    const signatureScore = signatureRatio * 70;
    let openDataScore = 10;
    if (p.landType === "public_ward" || p.landType === "public_metro") openDataScore += 10;
    if (p.category === "private_greening") openDataScore += 15;
    openDataScore = Math.min(openDataScore, 30);

    await prisma.score.create({
      data: {
        proposalId: p.id,
        signatureScore,
        openDataScore,
        totalScore: signatureScore + openDataScore,
      },
    });
  }

  console.log("Seed completed:", { p1: p1.id, p2: p2.id, p3: p3.id, admin: admin.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
