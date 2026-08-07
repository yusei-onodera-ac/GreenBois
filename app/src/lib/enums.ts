// GreenVoice TOKYO — アプリ側の列挙値定義
// SQLiteはPrismaネイティブenumを未サポートのため、String型カラム+ここでの
// リテラル型定義で型安全性を担保する(docs/02-data-model.md 準拠)。

export const USER_TYPES = ["citizen", "corporate", "admin"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const PROPOSAL_CATEGORIES = [
  "bench",
  "shade",
  "planting",
  "private_greening",
  "other",
] as const;
export type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number];

export const PROPOSAL_CATEGORY_LABELS: Record<ProposalCategory, string> = {
  bench: "ベンチ設置",
  shade: "日よけ設置",
  planting: "植樹・緑化",
  private_greening: "私有地緑化",
  other: "その他",
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
