import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// デモ用シードデータ。対象エリアは世田谷区・渋谷区・目黒区・中野区周辺
// (docs/03-external-integration.md の「対象自治体を限定」方針に沿った架空の座標)。
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
  await prisma.publicSite.deleteMany();

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
  const admin = await prisma.user.create({
    data: {
      displayName: "東京都 建設局 担当者",
      handle: "行政職員-0001",
      lineUserId: "line_demo_admin",
      userType: "admin",
    },
  });
  const users = [citizenA, citizenB];

  await prisma.adminRole.create({
    data: { userId: admin.id, jurisdictionScope: "世田谷区ほか", roleLevel: "reviewer" },
  });

  await prisma.budgetCycle.create({
    data: {
      name: "2026年度 第2四半期 参加型緑化予算枠",
      totalAmount: 30_000_000,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-09-30"),
    },
  });

  // 公共施設・道路マスタ(新規提案の「区市 → 施設名」予測選択用、src/components/LocationPicker.tsx)。
  // 公園に限らず、都・区市町村が管理する図書館・道路等も対象にする。
  // 既存の提案シードが使っている公園名・座標(太子堂公園・駒場公園・中野中央公園・三宿公園)は
  // そのまま流用し、物語の一貫性を保つ。
  const publicSiteSpecs = [
    // --- 世田谷区 ---
    { name: "太子堂公園", ward: "世田谷区", lat: 35.6438, lng: 139.6688, landType: "public_ward", kind: "park" },
    { name: "三宿公園", ward: "世田谷区", lat: 35.6491, lng: 139.6748, landType: "public_ward", kind: "park" },
    { name: "羽根木公園", ward: "世田谷区", lat: 35.6653, lng: 139.6478, landType: "public_ward", kind: "park" },
    { name: "桜丘公園", ward: "世田谷区", lat: 35.6355, lng: 139.6535, landType: "public_ward", kind: "park" },
    { name: "世田谷区立中央図書館", ward: "世田谷区", lat: 35.6461, lng: 139.6534, landType: "public_ward", kind: "library" },
    { name: "世田谷通り", ward: "世田谷区", lat: 35.6402, lng: 139.6631, landType: "public_metro", kind: "road" },
    // --- 目黒区 ---
    { name: "駒場公園", ward: "目黒区", lat: 35.6584, lng: 139.6816, landType: "public_metro", kind: "park" },
    { name: "目黒天空庭園", ward: "目黒区", lat: 35.6217, lng: 139.7108, landType: "public_metro", kind: "park" },
    { name: "中目黒公園", ward: "目黒区", lat: 35.6469, lng: 139.6989, landType: "public_ward", kind: "park" },
    { name: "目黒区立八雲中央図書館", ward: "目黒区", lat: 35.6221, lng: 139.6871, landType: "public_ward", kind: "library" },
    { name: "目黒通り", ward: "目黒区", lat: 35.6338, lng: 139.6934, landType: "public_metro", kind: "road" },
    // --- 渋谷区 ---
    { name: "代々木公園", ward: "渋谷区", lat: 35.6717, lng: 139.6949, landType: "public_metro", kind: "park" },
    { name: "恵比寿東公園", ward: "渋谷区", lat: 35.6466, lng: 139.7136, landType: "public_ward", kind: "park" },
    { name: "松濤公園", ward: "渋谷区", lat: 35.6584, lng: 139.6899, landType: "public_ward", kind: "park" },
    { name: "渋谷区立中央図書館", ward: "渋谷区", lat: 35.6626, lng: 139.6893, landType: "public_ward", kind: "library" },
    { name: "明治通り", ward: "渋谷区", lat: 35.6598, lng: 139.7027, landType: "public_metro", kind: "road" },
    // --- 中野区 ---
    { name: "中野中央公園", ward: "中野区", lat: 35.7075, lng: 139.6638, landType: "public_ward", kind: "park" },
    { name: "哲学堂公園", ward: "中野区", lat: 35.7215, lng: 139.6540, landType: "public_ward", kind: "park" },
    { name: "平和の森公園", ward: "中野区", lat: 35.7186, lng: 139.6656, landType: "public_ward", kind: "park" },
    { name: "中野区立中央図書館", ward: "中野区", lat: 35.7075, lng: 139.6725, landType: "public_ward", kind: "library" },
    { name: "早稲田通り", ward: "中野区", lat: 35.7093, lng: 139.6597, landType: "public_metro", kind: "road" },
  ];
  await prisma.publicSite.createMany({ data: publicSiteSpecs });

  type Spec = {
    userIdx: 0 | 1;
    category: string;
    title: string;
    description: string;
    lat: number;
    lng: number;
    landType: string;
    status: string;
    signatureTarget: number;
    signerCount: 0 | 1 | 2 | 3;
    daysAgo: number; // 投稿からの経過日数(新着順の並び用)
    photoKeywords: string; // LoremFlickr(無償のフリー素材風プレースホルダー画像サービス)検索キーワード
  };

  // LoremFlickr: キーワードに基づくフリー画像プレースホルダーサービス。
  // lock番号を固定することで、同じ提案には毎回同じ画像が表示されるようにする。
  let photoLock = 0;
  function photoUrl(keywords: string): string {
    photoLock += 1;
    return `https://loremflickr.com/480/320/${encodeURIComponent(keywords)}?lock=${photoLock}`;
  }

  const specs: Spec[] = [
    // --- 公園設備 ---
    {
      userIdx: 0, category: "park_facility",
      title: "太子堂公園に日よけ付きベンチを設置してほしい",
      description: "夏場、子どもを遊ばせている間に休める日陰がありません。日よけ付きベンチの設置を希望します。",
      lat: 35.6438, lng: 139.6688, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 2, daysAgo: 3, photoKeywords: "park,bench,shade",
    },
    {
      userIdx: 1, category: "park_facility",
      title: "駒沢通り沿いの街路にベンチを増設したい",
      description: "高齢者の休憩スポットが少なく、長い距離を歩けない方が困っています。",
      lat: 35.6321, lng: 139.6654, landType: "public_ward", status: "screening",
      signatureTarget: 50, signerCount: 1, daysAgo: 12, photoKeywords: "street,bench,sidewalk",
    },
    {
      userIdx: 0, category: "park_facility",
      title: "駒場公園にドッグランを作ってほしい",
      description: "リード無しで遊ばせられる場所が近隣になく、飼い主同士のトラブルも起きています。",
      lat: 35.6584, lng: 139.6816, landType: "public_metro", status: "collecting",
      signatureTarget: 50, signerCount: 2, daysAgo: 1, photoKeywords: "dog,park,grass",
    },
    {
      userIdx: 1, category: "park_facility",
      title: "笹塚駅前広場に雨よけ屋根を設置してほしい",
      description: "待ち合わせ場所として使われているが、雨の日に濡れてしまう人が多いです。",
      lat: 35.6763, lng: 139.6683, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 0, daysAgo: 0, photoKeywords: "plaza,station,roof",
    },
    {
      userIdx: 0, category: "park_facility",
      title: "中野中央公園の遊具を最新のものに更新してほしい",
      description: "老朽化した遊具があり、安全面が心配です。",
      lat: 35.7075, lng: 139.6638, landType: "public_ward", status: "rejected",
      signatureTarget: 50, signerCount: 1, daysAgo: 45, photoKeywords: "playground,park",
    },

    // --- 植樹・緑化(公有地) ---
    {
      userIdx: 0, category: "greening",
      title: "世田谷通り沿いに街路樹を増やしてほしい",
      description: "夏場の照り返しが強く、緑陰道路にしてヒートアイランド対策をしてほしい。",
      lat: 35.6402, lng: 139.6631, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 0, daysAgo: 2, photoKeywords: "street,trees,avenue",
    },
    {
      userIdx: 1, category: "greening",
      title: "目黒川沿いの遊歩道に植栽を増やしてほしい",
      description: "桜以外の季節にも緑を楽しめるよう、常緑樹や草花の植栽を増やしてほしいです。",
      lat: 35.6414, lng: 139.6983, landType: "public_metro", status: "adopted",
      signatureTarget: 50, signerCount: 2, daysAgo: 20, photoKeywords: "river,promenade,trees",
    },
    {
      userIdx: 0, category: "greening",
      title: "淡島通り沿いの中央分離帯を緑化してほしい",
      description: "殺風景な中央分離帯に低木を植え、地域の景観を良くしたいです。",
      lat: 35.6552, lng: 139.6667, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 1, daysAgo: 6, photoKeywords: "hedge,road,shrub",
    },
    {
      userIdx: 1, category: "greening",
      title: "松陰神社通り商店街に緑のプランターを設置したい",
      description: "商店街全体を緑化し、街歩きが楽しくなる通りにしたいという声が地元で出ています。",
      lat: 35.6469, lng: 139.6716, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 2, daysAgo: 8, photoKeywords: "flower,planter,street",
    },

    // --- 私有地緑化 ---
    // 私有地・企業敷地への行政補助金交付は法的に不可能なため、企業発の私有地緑化提案は扱わない
    // (docs/00-concept.md参照)。個人(市民)発の私有地に関する相談のみ過去データとして残す。
    {
      userIdx: 0, category: "private_greening",
      title: "近所の空き地オーナーに市民農園化を提案したい",
      description: "長年放置されている空き地があり、地域住民で緑化・活用できないか相談したいです。",
      lat: 35.6361, lng: 139.6559, landType: "private", status: "collecting",
      signatureTarget: 300, signerCount: 1, daysAgo: 5, photoKeywords: "vacant,lot,garden",
    },

    // --- 樹木管理(伐採・剪定支援) ---
    {
      userIdx: 1, category: "tree_care",
      title: "自宅の大木が傾いていて危険、伐採費用の助成を受けたい",
      description: "台風で自宅敷地の大木が傾いてしまい、倒木の危険があります。伐採費用が高額なため助成制度があれば利用したいです。",
      lat: 35.6389, lng: 139.6602, landType: "private", status: "collecting",
      signatureTarget: 30, signerCount: 0, daysAgo: 1, photoKeywords: "fallen,tree,storm",
    },
    {
      userIdx: 0, category: "tree_care",
      title: "隣接する空き家の庭木が越境していて剪定してほしい",
      description: "空き家の庭木が生い茂り、道路や隣地にはみ出して通行の妨げになっています。",
      lat: 35.6297, lng: 139.6612, landType: "private", status: "collecting",
      signatureTarget: 30, signerCount: 2, daysAgo: 3, photoKeywords: "overgrown,tree,garden",
    },
    {
      userIdx: 1, category: "tree_care",
      title: "公園の枯れ木が放置されていて危険なので伐採してほしい",
      description: "台風以降、枯れて倒れかけている木があり、子どもたちが近づくと危険です。",
      lat: 35.6478, lng: 139.6607, landType: "public_ward", status: "adopted",
      signatureTarget: 30, signerCount: 2, daysAgo: 40, photoKeywords: "dead,tree,forest",
    },
    {
      userIdx: 0, category: "tree_care",
      title: "老木の樹木診断・保全費用を助成してほしい",
      description: "地域のシンボルになっている大木ですが老朽化が進んでおり、専門家による診断費用の助成を希望します。",
      lat: 35.6521, lng: 139.6543, landType: "private", status: "in_progress",
      signatureTarget: 30, signerCount: 2, daysAgo: 35, photoKeywords: "old,tree,giant",
    },

    // --- その他 ---
    {
      userIdx: 1, category: "other",
      title: "地域の緑化活動ボランティアを募集する仕組みがほしい",
      description: "植樹イベント等のボランティアを募集する窓口が分散していてわかりにくいです。",
      lat: 35.6455, lng: 139.6725, landType: "unknown", status: "collecting",
      signatureTarget: 50, signerCount: 1, daysAgo: 7, photoKeywords: "volunteer,planting,community",
    },
    {
      userIdx: 0, category: "other",
      title: "緑化に関する相談窓口をオンラインでも受け付けてほしい",
      description: "平日日中しか相談できず、働いている住民には利用しづらいです。",
      lat: 35.6350, lng: 139.6800, landType: "unknown", status: "collecting",
      signatureTarget: 50, signerCount: 0, daysAgo: 2, photoKeywords: "office,plants,consultation",
    },
  ];

  // --- 「実現しました」ショーケース用の完了済み提案(フル履歴つき) ---
  const completedSpecs = [
    {
      userIdx: 1 as const, category: "park_facility",
      title: "三宿公園にベンチ3脚を新設",
      description: "近隣住民からの署名をきっかけに、区の緑化予算で公園ベンチが新設されました。",
      lat: 35.6491, lng: 139.6748, landType: "public_ward", signatureTarget: 50, completedDaysAgo: 5,
      photoKeywords: "park,bench,new",
    },
    {
      userIdx: 0 as const, category: "greening",
      title: "赤堤通りの街路樹植栽が完了",
      description: "住民要望から半年、赤堤通りに新しい街路樹が植えられ、夏の日陰が増えました。",
      lat: 35.6553, lng: 139.6459, landType: "public_ward", signatureTarget: 50, completedDaysAgo: 18,
      photoKeywords: "street,trees,sunny",
    },
  ];

  async function createProposal(s: Spec, daysAgoOverride?: number) {
    const proposal = await prisma.proposal.create({
      data: {
        userId: users[s.userIdx].id,
        category: s.category,
        title: s.title,
        description: s.description,
        lat: s.lat,
        lng: s.lng,
        landType: s.landType,
        status: s.status,
        signatureTarget: s.signatureTarget,
        createdAt: new Date(Date.now() - (daysAgoOverride ?? s.daysAgo) * 24 * 60 * 60 * 1000),
      },
    });

    // ステータスに応じた簡易な進捗履歴
    const chain = ["collecting", "screening", "adopted", "in_progress", "completed"];
    const targetIdx = Math.max(chain.indexOf(s.status), 0);
    const changer = s.status === "collecting" ? users[s.userIdx].id : admin.id;
    if (s.status === "rejected") {
      await prisma.statusHistory.createMany({
        data: [
          { proposalId: proposal.id, toStatus: "collecting", changedByUserId: users[s.userIdx].id },
          { proposalId: proposal.id, fromStatus: "collecting", toStatus: "rejected", changedByUserId: admin.id },
        ],
      });
    } else {
      for (let i = 0; i <= targetIdx; i++) {
        await prisma.statusHistory.create({
          data: {
            proposalId: proposal.id,
            fromStatus: i === 0 ? null : chain[i - 1],
            toStatus: chain[i],
            changedByUserId: i === 0 ? users[s.userIdx].id : changer,
          },
        });
      }
    }

    for (let i = 0; i < s.signerCount; i++) {
      await prisma.signature.create({ data: { proposalId: proposal.id, userId: users[i].id } }).catch(() => {});
    }

    if ((s as Spec & { hasGreenAgreement?: boolean }).hasGreenAgreement) {
      await prisma.greenAgreement.create({ data: { proposalId: proposal.id, minimumYears: 5 } });
    }

    await prisma.attachment.create({
      data: { proposalId: proposal.id, type: "photo_before", url: photoUrl(s.photoKeywords) },
    });

    return proposal;
  }

  const createdProposals = [];
  for (const s of specs) {
    createdProposals.push(await createProposal(s));
  }

  for (const cs of completedSpecs) {
    const proposal = await prisma.proposal.create({
      data: {
        userId: users[cs.userIdx].id,
        category: cs.category,
        title: cs.title,
        description: cs.description,
        lat: cs.lat,
        lng: cs.lng,
        landType: cs.landType,
        status: "completed",
        signatureTarget: cs.signatureTarget,
      },
    });
    const history: { fromStatus: string | null; toStatus: string; daysAgo: number }[] = [
      { fromStatus: null, toStatus: "collecting", daysAgo: cs.completedDaysAgo + 85 },
      { fromStatus: "collecting", toStatus: "screening", daysAgo: cs.completedDaysAgo + 65 },
      { fromStatus: "screening", toStatus: "adopted", daysAgo: cs.completedDaysAgo + 50 },
      { fromStatus: "adopted", toStatus: "in_progress", daysAgo: cs.completedDaysAgo + 25 },
      { fromStatus: "in_progress", toStatus: "completed", daysAgo: cs.completedDaysAgo },
    ];
    for (const h of history) {
      await prisma.statusHistory.create({
        data: {
          proposalId: proposal.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          changedByUserId: h.fromStatus === null ? users[cs.userIdx].id : admin.id,
          changedAt: new Date(Date.now() - h.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }
    for (const u of users) {
      await prisma.signature.create({ data: { proposalId: proposal.id, userId: u.id } }).catch(() => {});
    }
    await prisma.attachment.create({
      data: { proposalId: proposal.id, type: "photo_after", url: photoUrl(cs.photoKeywords) },
    });
    createdProposals.push(proposal);
  }

  // 管轄・優先度スコアも投入(src/lib/jurisdiction.ts, src/lib/scoring.ts と同じロジックを
  // シード用に複製。tsxのパスエイリアス解決を避けるため意図的にインライン化している)
  const AUTHORITY_BY_LAND_TYPE: Record<string, string> = {
    public_metro: "東京都 建設局 公園緑地部",
    public_ward: "区市町村 みどり公園課",
    private: "東京都 環境局(私有地緑化相談窓口)",
    unknown: "未判定(手動割り当て待ち)",
  };

  for (const p of createdProposals) {
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
    proposals: createdProposals.length,
    publicSites: publicSiteSpecs.length,
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
