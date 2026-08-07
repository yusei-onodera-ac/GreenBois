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
    data: {
      displayName: "田中 花子",
      handle: "都民-8821", // 公開画面に出す匿名ID(本名は行政のみ閲覧可)
      lineUserId: "line_demo_citizen_a",
      userType: "citizen",
    },
  });
  const citizenB = await prisma.user.create({
    data: {
      displayName: "佐藤 次郎",
      handle: "都民-4417",
      lineUserId: "line_demo_citizen_b",
      userType: "citizen",
    },
  });
  const corporate = await prisma.user.create({
    data: {
      displayName: "株式会社グリーンビルド 環境担当",
      handle: "企業-C90A",
      lineUserId: "line_demo_corp",
      userType: "corporate",
    },
  });
  const admin = await prisma.user.create({
    data: {
      displayName: "東京都 建設局 担当者",
      handle: "行政職員-0001",
      lineUserId: "line_demo_admin",
      userType: "admin",
    },
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
      category: "park_facility",
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
      category: "park_facility",
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

  const p4 = await prisma.proposal.create({
    data: {
      userId: citizenA.id,
      category: "greening",
      title: "世田谷通り沿いに街路樹を増やしてほしい",
      description: "夏場の照り返しが強く、緑陰道路にしてヒートアイランド対策をしてほしい。",
      lat: 35.6402,
      lng: 139.6631,
      landType: "public_ward",
      status: "collecting",
      signatureTarget: 50,
    },
  });
  await prisma.statusHistory.create({
    data: { proposalId: p4.id, toStatus: "collecting", changedByUserId: citizenA.id },
  });

  const p6 = await prisma.proposal.create({
    data: {
      userId: citizenB.id,
      category: "tree_care",
      title: "自宅の大木が傾いていて危険、伐採費用の助成を受けたい",
      description:
        "台風で自宅敷地の大木が傾いてしまい、倒木の危険があります。伐採費用が高額なため助成制度があれば利用したいです。",
      lat: 35.6389,
      lng: 139.6602,
      landType: "private",
      status: "collecting",
      signatureTarget: 30,
    },
  });
  await prisma.statusHistory.create({
    data: { proposalId: p6.id, toStatus: "collecting", changedByUserId: citizenB.id },
  });

  // 「実現しました」ショーケース用の完了済み提案(デモ・実証用の例)
  const p5 = await prisma.proposal.create({
    data: {
      userId: citizenB.id,
      category: "park_facility",
      title: "三宿公園にベンチ3脚を新設",
      description: "近隣住民からの署名をきっかけに、区の緑化予算で公園ベンチが新設されました。",
      lat: 35.6491,
      lng: 139.6748,
      landType: "public_ward",
      status: "completed",
      signatureTarget: 50,
    },
  });
  const p5History: { fromStatus: string | null; toStatus: string; changedByUserId: string; daysAgo: number }[] = [
    { fromStatus: null, toStatus: "collecting", changedByUserId: citizenB.id, daysAgo: 90 },
    { fromStatus: "collecting", toStatus: "screening", changedByUserId: admin.id, daysAgo: 70 },
    { fromStatus: "screening", toStatus: "adopted", changedByUserId: admin.id, daysAgo: 55 },
    { fromStatus: "adopted", toStatus: "in_progress", changedByUserId: admin.id, daysAgo: 30 },
    { fromStatus: "in_progress", toStatus: "completed", changedByUserId: admin.id, daysAgo: 5 },
  ];
  for (const h of p5History) {
    await prisma.statusHistory.create({
      data: {
        proposalId: p5.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedByUserId: h.changedByUserId,
        changedAt: new Date(Date.now() - h.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 署名データ(p2はしきい値に近い数を仮投入)
  const signers = [citizenA, citizenB, corporate];
  for (const signer of signers) {
    await prisma.signature.create({ data: { proposalId: p1.id, userId: signer.id } }).catch(() => {});
  }
  await prisma.signature.create({ data: { proposalId: p2.id, userId: citizenA.id } }).catch(() => {});
  for (const signer of signers) {
    await prisma.signature.create({ data: { proposalId: p5.id, userId: signer.id } }).catch(() => {});
  }

  // 管轄・優先度スコアも投入(src/lib/jurisdiction.ts, src/lib/scoring.ts と同じロジックを
  // シード用に複製。tsxのパスエイリアス解決を避けるため意図的にインライン化している)
  const AUTHORITY_BY_LAND_TYPE: Record<string, string> = {
    public_metro: "東京都 建設局 公園緑地部",
    public_ward: "区市町村 みどり公園課",
    private: "東京都 環境局(私有地緑化助成担当)",
    unknown: "未判定(手動割り当て待ち)",
  };

  for (const p of [p1, p2, p3, p4, p5, p6]) {
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

  console.log("Seed completed:", {
    p1: p1.id,
    p2: p2.id,
    p3: p3.id,
    p4: p4.id,
    p5: p5.id,
    p6: p6.id,
    admin: admin.id,
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
