// GreenVoice TOKYO — アプリ側の列挙値定義
// SQLiteはPrismaネイティブenumを未サポートのため、String型カラム+ここでの
// リテラル型定義で型安全性を担保する(docs/02-data-model.md 準拠)。

export const USER_TYPES = ["citizen", "corporate", "admin"] as const;
export type UserType = (typeof USER_TYPES)[number];

// 「種類が細かすぎる/重複している」というフィードバックを受け、原案(docs/00-concept.md)の
// 2大提案類型(公園設備要望 / 私有地緑化)を軸に整理した上で、
// 「緑を増やす」提案だけでなく「緑を適切に管理する」(私有地の危険木伐採・剪定支援等)も
// 対象に含めるため tree_care を追加(docs/00-concept.md 2.「扱う範囲」参照)。
// (旧: bench/shade/planting/private_greening/other → 新: park_facility/greening/private_greening/tree_care/other)。
export const PROPOSAL_CATEGORIES = [
  "park_facility",
  "greening",
  "private_greening",
  "tree_care",
  "other",
] as const;
export type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number];

export const PROPOSAL_CATEGORY_LABELS: Record<ProposalCategory, string> = {
  park_facility: "公園設備(ベンチ・日よけ等)",
  greening: "植樹・緑化(公有地)",
  private_greening: "私有地緑化",
  tree_care: "樹木管理(伐採・剪定支援)",
  other: "その他",
};

// 地図ピンの色・アイコン(ジャンルごとに視覚的に区別するため)
export const PROPOSAL_CATEGORY_COLOR: Record<ProposalCategory, string> = {
  park_facility: "#2563eb", // 青
  greening: "#059669", // 緑
  private_greening: "#c026d3", // 紫(企業・私有地を区別)
  tree_care: "#b45309", // 茶(伐採・管理=木そのものを扱うイメージ)
  other: "#6b7280", // グレー
};

export const PROPOSAL_CATEGORY_ICON: Record<ProposalCategory, string> = {
  park_facility: "🪑",
  greening: "🌳",
  private_greening: "🏢",
  tree_care: "✂️",
  other: "📍",
};

export const LAND_TYPES = ["public_metro", "public_ward", "private", "unknown"] as const;
export type LandType = (typeof LAND_TYPES)[number];

export const LAND_TYPE_LABELS: Record<LandType, string> = {
  public_metro: "都立",
  public_ward: "区立",
  private: "私有地",
  unknown: "未判定",
};

export const PROPOSAL_STATUSES = [
  "draft",
  "collecting",
  "screening",
  "adopted",
  "in_progress",
  "completed",
  "rejected",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "下書き",
  collecting: "署名募集中",
  screening: "審査中",
  adopted: "採択済み",
  in_progress: "施工中",
  completed: "完了",
  rejected: "却下",
};

// ステータス遷移の許可リスト(F7: 行政ダッシュボードでの変更操作に使用)
export const STATUS_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ["collecting"],
  collecting: ["screening", "rejected"],
  screening: ["adopted", "rejected"],
  adopted: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
  rejected: [],
};

export const ATTACHMENT_TYPES = ["photo_before", "photo_after"] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export const ROLE_LEVELS = ["reviewer", "approver"] as const;
export type RoleLevel = (typeof ROLE_LEVELS)[number];
