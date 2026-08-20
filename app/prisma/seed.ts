import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

// デモ用シードデータ。対象エリアは世田谷区・渋谷区・目黒区・中野区周辺を中心に、
// 東京都オープンデータで公園データが取得できている他区(荒川区・練馬区・大田区・
// 杉並区・江東区等)の実在公園も一部使用する(架空の座標)。
async function main() {
  await prisma.statusHistory.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.score.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.jurisdiction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.budgetAllocation.deleteMany();
  await prisma.greenAgreement.deleteMany();
  await prisma.adminRole.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.budgetCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.publicSite.deleteMany();

  // --- 都民アカウント(22人) ---
  const citizenSpecs = [
    { displayName: "田中 花子", handle: "都民-8821" },
    { displayName: "佐藤 次郎", handle: "都民-4417" },
    { displayName: "鈴木 一郎", handle: "都民-1023" },
    { displayName: "高橋 美咲", handle: "都民-2091" },
    { displayName: "伊藤 健太", handle: "都民-3345" },
    { displayName: "渡辺 陽子", handle: "都民-4192" },
    { displayName: "山本 拓也", handle: "都民-5502" },
    { displayName: "中村 さくら", handle: "都民-6621" },
    { displayName: "小林 大輔", handle: "都民-7734" },
    { displayName: "加藤 真理", handle: "都民-8845" },
    { displayName: "吉田 隆", handle: "都民-9956" },
    { displayName: "山田 美穂", handle: "都民-1147" },
    { displayName: "佐々木 健", handle: "都民-2258" },
    { displayName: "松本 由美", handle: "都民-3369" },
    { displayName: "井上 誠", handle: "都民-4470" },
    { displayName: "木村 愛子", handle: "都民-5581" },
    { displayName: "林 直樹", handle: "都民-6692" },
    { displayName: "斎藤 恵", handle: "都民-7703" },
    { displayName: "清水 亮", handle: "都民-8814" },
    { displayName: "山口 智子", handle: "都民-9925" },
    { displayName: "森田 翔太", handle: "都民-1036" },
    { displayName: "池田 千尋", handle: "都民-2147" },
  ];
  const users: User[] = [];
  for (let i = 0; i < citizenSpecs.length; i++) {
    const c = citizenSpecs[i];
    users.push(
      await prisma.user.create({
        data: {
          displayName: c.displayName,
          handle: c.handle,
          lineUserId: `line_demo_citizen_${i}`,
          userType: "citizen",
        },
      })
    );
  }

  // --- 行政アカウント(5人。区ごとの管轄を分けて、ダッシュボードの絞り込みを検証できるようにする) ---
  // authorityId は未設定のまま作成し、Authorityテーブルが存在する ingest:authorities 実行後に
  // 紐付ける(seedAuthorities.ts参照。db:seed → ingest:authorities の順で実行する想定のため)。
  const adminMetro = await prisma.user.create({
    data: { displayName: "東京都 建設局 担当者", handle: "行政職員-0001", lineUserId: "line_demo_admin_metro", userType: "admin" },
  });
  const adminSetagaya = await prisma.user.create({
    data: { displayName: "世田谷区 みどり政策課 担当者", handle: "行政職員-0002", lineUserId: "line_demo_admin_setagaya", userType: "admin" },
  });
  const adminMeguro = await prisma.user.create({
    data: { displayName: "目黒区 みどり土木政策課 担当者", handle: "行政職員-0003", lineUserId: "line_demo_admin_meguro", userType: "admin" },
  });
  const adminShibuya = await prisma.user.create({
    data: { displayName: "渋谷区 土木部 担当者", handle: "行政職員-0004", lineUserId: "line_demo_admin_shibuya", userType: "admin" },
  });
  const adminNakano = await prisma.user.create({
    data: { displayName: "中野区 公園課 担当者", handle: "行政職員-0005", lineUserId: "line_demo_admin_nakano", userType: "admin" },
  });
  // ステータス変更などの「代表操作者」として使う(全域を見られる担当者を採用)。
  const admin = adminMetro;

  await prisma.adminRole.create({ data: { userId: adminMetro.id, jurisdictionScope: "全域", roleLevel: "approver" } });
  await prisma.adminRole.create({ data: { userId: adminSetagaya.id, jurisdictionScope: "世田谷区 みどり33推進担当部 みどり政策課", roleLevel: "reviewer" } });
  await prisma.adminRole.create({ data: { userId: adminMeguro.id, jurisdictionScope: "目黒区 都市整備部 みどり土木政策課", roleLevel: "reviewer" } });
  await prisma.adminRole.create({ data: { userId: adminShibuya.id, jurisdictionScope: "渋谷区 土木部", roleLevel: "reviewer" } });
  await prisma.adminRole.create({ data: { userId: adminNakano.id, jurisdictionScope: "中野区 都市基盤部 公園課", roleLevel: "reviewer" } });

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
  // ここに書く4区(世田谷・目黒・渋谷・中野)分は、東京都オープンデータに含まれない
  // 図書館・道路や、デモの物語上固定しておきたい公園の手打ちデータ。それ以外の区の
  // 公園は ingest:parks で取り込んだ実データ(3,700件超)をそのまま使う。
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
    userIdx: number;
    category: string;
    title: string;
    description: string;
    lat: number;
    lng: number;
    landType: string;
    status: string;
    signatureTarget: number;
    signerCount: number;
    daysAgo: number; // 投稿からの経過日数(新着順の並び用)
    photoKeywords: string; // プレースホルダー画像のシード文字列(内容と紐づけた命名のみ。取得先はPicsum)
  };

  // Picsum Photos(https://picsum.photos)のシード指定URL。無償・キー不要で、
  // 同じシード文字列なら常に同じ画像が返る。
  // 以前はLoremFlickr(キーワード検索型)を使っていたが、2026年8月時点で
  // 複数キーワード指定はほぼ確実に500を返し、単一キーワードでも約半数が失敗する状態に
  // なっていた(サービス側の不具合とみられる。docs/03-external-integration.md参照)。
  // Picsumはキーワードに基づく画像選択はできない(ランダムな実写真)が、可用性を優先した。
  let photoLock = 0;
  function photoUrl(keywords: string): string {
    photoLock += 1;
    return `https://picsum.photos/seed/${encodeURIComponent(keywords)}-${photoLock}/480/320`;
  }

  const specs: Spec[] = [
    // --- 公園設備(8) ---
    {
      userIdx: 0, category: "park_facility",
      title: "太子堂公園に日よけ付きベンチを設置してほしい",
      description: "夏場、子どもを遊ばせている間に休める日陰がありません。日よけ付きベンチの設置を希望します。",
      lat: 35.6438, lng: 139.6688, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 9, daysAgo: 3, photoKeywords: "park,bench,shade",
    },
    {
      userIdx: 1, category: "park_facility",
      title: "駒沢通り沿いの街路にベンチを増設したい",
      description: "高齢者の休憩スポットが少なく、長い距離を歩けない方が困っています。",
      lat: 35.6321, lng: 139.6654, landType: "public_ward", status: "screening",
      signatureTarget: 50, signerCount: 6, daysAgo: 12, photoKeywords: "street,bench,sidewalk",
    },
    {
      userIdx: 2, category: "park_facility",
      title: "駒場公園にドッグランを作ってほしい",
      description: "リード無しで遊ばせられる場所が近隣になく、飼い主同士のトラブルも起きています。",
      lat: 35.6584, lng: 139.6816, landType: "public_metro", status: "collecting",
      signatureTarget: 50, signerCount: 14, daysAgo: 1, photoKeywords: "dog,park,grass",
    },
    {
      userIdx: 3, category: "park_facility",
      title: "笹塚駅前広場に雨よけ屋根を設置してほしい",
      description: "待ち合わせ場所として使われているが、雨の日に濡れてしまう人が多いです。",
      lat: 35.6763, lng: 139.6683, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 0, daysAgo: 0, photoKeywords: "plaza,station,roof",
    },
    {
      userIdx: 4, category: "park_facility",
      title: "中野中央公園の遊具を最新のものに更新してほしい",
      description: "老朽化した遊具があり、安全面が心配です。",
      lat: 35.7075, lng: 139.6638, landType: "public_ward", status: "rejected",
      signatureTarget: 50, signerCount: 3, daysAgo: 45, photoKeywords: "playground,park",
    },
    {
      userIdx: 5, category: "park_facility",
      title: "羽根木公園のトイレを洋式に改修してほしい",
      description: "和式トイレしかなく、高齢者や小さな子ども連れには使いづらいです。",
      lat: 35.6653, lng: 139.6478, landType: "public_ward", status: "adopted",
      signatureTarget: 50, signerCount: 22, daysAgo: 28, photoKeywords: "toilet,park,renovation",
    },
    {
      userIdx: 6, category: "park_facility",
      title: "リバーハープ公園に健康遊具を増やしてほしい",
      description: "高齢者向けの健康遊具が1台しかなく、順番待ちになることがあります。",
      lat: 35.736294, lng: 139.803864, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 4, daysAgo: 6, photoKeywords: "fitness,equipment,park",
    },
    {
      userIdx: 7, category: "park_facility",
      title: "あさひ公園に防犯灯を増設してほしい",
      description: "夕方以降暗くなるのが早く、公園内の照明が少なくて不安という声が地域から出ています。",
      lat: 35.619164, lng: 139.70816, landType: "public_ward", status: "in_progress",
      signatureTarget: 50, signerCount: 17, daysAgo: 33, photoKeywords: "streetlight,park,evening",
    },

    // --- 植樹・緑化(公有地)(7) ---
    {
      userIdx: 8, category: "greening",
      title: "世田谷通り沿いに街路樹を増やしてほしい",
      description: "夏場の照り返しが強く、緑陰道路にしてヒートアイランド対策をしてほしい。",
      lat: 35.6402, lng: 139.6631, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 2, daysAgo: 2, photoKeywords: "street,trees,avenue",
    },
    {
      userIdx: 9, category: "greening",
      title: "目黒川沿いの遊歩道に植栽を増やしてほしい",
      description: "桜以外の季節にも緑を楽しめるよう、常緑樹や草花の植栽を増やしてほしいです。",
      lat: 35.6414, lng: 139.6983, landType: "public_ward", status: "adopted",
      signatureTarget: 50, signerCount: 19, daysAgo: 20, photoKeywords: "river,promenade,trees",
    },
    {
      userIdx: 10, category: "greening",
      title: "淡島通り沿いの中央分離帯を緑化してほしい",
      description: "殺風景な中央分離帯に低木を植え、地域の景観を良くしたいです。",
      lat: 35.6552, lng: 139.6667, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 5, daysAgo: 6, photoKeywords: "hedge,road,shrub",
    },
    {
      userIdx: 11, category: "greening",
      title: "松陰神社通り商店街に緑のプランターを設置したい",
      description: "商店街全体を緑化し、街歩きが楽しくなる通りにしたいという声が地元で出ています。",
      lat: 35.6469, lng: 139.6716, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 8, daysAgo: 8, photoKeywords: "flower,planter,street",
    },
    {
      userIdx: 12, category: "greening",
      title: "あかね橋公園周辺の桜並木を補植してほしい",
      description: "枯れてしまった桜の木が数本あり、並木として寂しい状態になっています。",
      lat: 35.68288365, lng: 139.609979, landType: "public_ward", status: "screening",
      signatureTarget: 50, signerCount: 11, daysAgo: 15, photoKeywords: "sakura,trees,park",
    },
    {
      userIdx: 13, category: "greening",
      title: "お茶の水公園周辺に緑のカーテンを設置してほしい",
      description: "夏の強い日差しを和らげるため、フェンス沿いに緑のカーテンを設置してほしいです。",
      lat: 35.701164, lng: 139.766243, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 1, daysAgo: 4, photoKeywords: "greencurtain,vine,fence",
    },
    {
      userIdx: 14, category: "greening",
      title: "九段坂公園周辺の緑化を進めてほしい",
      description: "観光客も多いエリアなので、季節の花や緑を増やして景観をより良くしてほしいです。",
      lat: 35.694611, lng: 139.748108, landType: "public_ward", status: "in_progress",
      signatureTarget: 50, signerCount: 24, daysAgo: 30, photoKeywords: "garden,flowers,landscape",
    },

    // --- 私有地緑化(3。過去データとして残す。企業発は扱わない) ---
    {
      userIdx: 0, category: "private_greening",
      title: "近所の空き地オーナーに市民農園化を提案したい",
      description: "長年放置されている空き地があり、地域住民で緑化・活用できないか相談したいです。",
      lat: 35.6361, lng: 139.6559, landType: "private", status: "collecting",
      signatureTarget: 300, signerCount: 1, daysAgo: 5, photoKeywords: "vacant,lot,garden",
    },
    {
      userIdx: 15, category: "private_greening",
      title: "自宅の生垣を緑のまちなみ助成で新設したい",
      description: "ブロック塀を撤去して生垣にしたいのですが、助成制度の対象になるか相談したいです。",
      lat: 35.6408, lng: 139.6572, landType: "private", status: "collecting",
      signatureTarget: 300, signerCount: 2, daysAgo: 9, photoKeywords: "hedge,house,fence",
    },
    {
      userIdx: 16, category: "private_greening",
      title: "相続した空き家跡地を地域菜園にしたい",
      description: "使い道が決まっていない土地を、当面の間だけでも近隣住民の菜園として開放できないか検討したいです。",
      lat: 35.6289, lng: 139.6631, landType: "private", status: "screening",
      signatureTarget: 300, signerCount: 7, daysAgo: 22, photoKeywords: "vacant,house,land",
    },

    // --- 樹木管理(伐採・剪定支援)(6) ---
    {
      userIdx: 17, category: "tree_care",
      title: "自宅の大木が傾いていて危険、伐採費用の助成を受けたい",
      description: "台風で自宅敷地の大木が傾いてしまい、倒木の危険があります。伐採費用が高額なため助成制度があれば利用したいです。",
      lat: 35.6389, lng: 139.6602, landType: "private", status: "collecting",
      signatureTarget: 30, signerCount: 0, daysAgo: 1, photoKeywords: "fallen,tree,storm",
    },
    {
      userIdx: 18, category: "tree_care",
      title: "隣接する空き家の庭木が越境していて剪定してほしい",
      description: "空き家の庭木が生い茂り、道路や隣地にはみ出して通行の妨げになっています。",
      lat: 35.6297, lng: 139.6612, landType: "private", status: "collecting",
      signatureTarget: 30, signerCount: 3, daysAgo: 3, photoKeywords: "overgrown,tree,garden",
    },
    {
      userIdx: 19, category: "tree_care",
      title: "公園の枯れ木が放置されていて危険なので伐採してほしい",
      description: "台風以降、枯れて倒れかけている木があり、子どもたちが近づくと危険です。",
      lat: 35.6478, lng: 139.6607, landType: "public_ward", status: "adopted",
      signatureTarget: 30, signerCount: 12, daysAgo: 40, photoKeywords: "dead,tree,forest",
    },
    {
      userIdx: 20, category: "tree_care",
      title: "老木の樹木診断・保全費用を助成してほしい",
      description: "地域のシンボルになっている大木ですが老朽化が進んでおり、専門家による診断費用の助成を希望します。",
      lat: 35.6521, lng: 139.6543, landType: "private", status: "in_progress",
      signatureTarget: 30, signerCount: 18, daysAgo: 35, photoKeywords: "old,tree,giant",
    },
    {
      userIdx: 21, category: "tree_care",
      title: "あおぎり児童遊園周辺の街路樹の根上がりで歩道が危険",
      description: "街路樹の根が歩道の舗装を持ち上げていて、つまずいて転倒しそうになる人を見かけます。",
      lat: 35.722721, lng: 139.826996, landType: "public_ward", status: "screening",
      signatureTarget: 30, signerCount: 9, daysAgo: 17, photoKeywords: "sidewalk,tree,root",
    },
    {
      userIdx: 2, category: "tree_care",
      title: "五色桜の散歩みちの桜の老木を治療してほしい",
      description: "一部の桜の木で樹勢の衰えが見られ、専門家による治療・保全をお願いしたいです。",
      lat: 35.776169, lng: 139.748474, landType: "public_ward", status: "rejected",
      signatureTarget: 30, signerCount: 2, daysAgo: 50, photoKeywords: "sakura,old,tree",
    },

    // --- その他(4) ---
    {
      userIdx: 3, category: "other",
      title: "地域の緑化活動ボランティアを募集する仕組みがほしい",
      description: "植樹イベント等のボランティアを募集する窓口が分散していてわかりにくいです。",
      lat: 35.6455, lng: 139.6725, landType: "unknown", status: "collecting",
      signatureTarget: 50, signerCount: 6, daysAgo: 7, photoKeywords: "volunteer,planting,community",
    },
    {
      userIdx: 4, category: "other",
      title: "緑化に関する相談窓口をオンラインでも受け付けてほしい",
      description: "平日日中しか相談できず、働いている住民には利用しづらいです。",
      lat: 35.6350, lng: 139.6800, landType: "unknown", status: "collecting",
      signatureTarget: 50, signerCount: 0, daysAgo: 2, photoKeywords: "office,plants,consultation",
    },
    {
      userIdx: 5, category: "other",
      title: "あかつき公園周辺の公園利用ルールを分かりやすく周知してほしい",
      description: "犬の散歩・キャッチボール等、可否がわかりにくく利用者同士のトラブルが起きています。",
      lat: 35.666981, lng: 139.774658, landType: "public_ward", status: "collecting",
      signatureTarget: 50, signerCount: 3, daysAgo: 10, photoKeywords: "signage,park,rules",
    },
    {
      userIdx: 6, category: "other",
      title: "いいづか公園に花壇の里親制度を作ってほしい",
      description: "有志で花壇の手入れをしたいのですが、区の制度が無く相談先もわかりません。",
      lat: 35.776882, lng: 139.858795, landType: "public_ward", status: "screening",
      signatureTarget: 50, signerCount: 8, daysAgo: 13, photoKeywords: "flowerbed,volunteer,park",
    },
  ];

  // --- 「実現しました」ショーケース用の完了済み提案(フル履歴つき、2件) ---
  const completedSpecs = [
    {
      userIdx: 1 as const, category: "park_facility",
      title: "三宿公園にベンチ3脚を新設",
      description: "近隣住民からの署名をきっかけに、区の緑化予算で公園ベンチが新設されました。",
      lat: 35.6491, lng: 139.6748, landType: "public_ward", signatureTarget: 50, completedDaysAgo: 5,
      photoKeywords: "park,bench,new",
    },
    {
      userIdx: 7 as const, category: "greening",
      title: "赤堤通りの街路樹植栽が完了",
      description: "住民要望から半年、赤堤通りに新しい街路樹が植えられ、夏の日陰が増えました。",
      lat: 35.6553, lng: 139.6459, landType: "public_ward", signatureTarget: 50, completedDaysAgo: 18,
      photoKeywords: "street,trees,sunny",
    },
  ];

  async function createProposal(s: Spec) {
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
        createdAt: new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000),
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

    // 署名者は投稿者以外から重複無しでランダムに選ぶ(全22人からsignerCount分)。
    const signerPool = users.map((u, i) => i).filter((i) => i !== s.userIdx);
    for (let i = signerPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [signerPool[i], signerPool[j]] = [signerPool[j], signerPool[i]];
    }
    for (const idx of signerPool.slice(0, s.signerCount)) {
      await prisma.signature.create({ data: { proposalId: proposal.id, userId: users[idx].id } }).catch(() => {});
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
    const signerPool = users.map((u, i) => i).filter((i) => i !== cs.userIdx).slice(0, 15);
    for (const idx of signerPool) {
      await prisma.signature.create({ data: { proposalId: proposal.id, userId: users[idx].id } }).catch(() => {});
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
    citizens: citizenSpecs.length,
    admins: 5,
    proposals: createdProposals.length,
    publicSites: publicSiteSpecs.length,
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
