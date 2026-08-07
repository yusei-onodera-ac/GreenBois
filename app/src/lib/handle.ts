import { UserType } from "@/lib/enums";

// 個人情報保護のため、公開画面(提案詳細など)には本名(User.displayName)ではなく
// このハンドル(匿名ID)を表示する。本名を見られるのは行政ダッシュボードのみ
// (docs/01-requirements.md の非機能要件「データ保護」に対応)。
const LABEL: Record<UserType, string> = {
  citizen: "都民",
  corporate: "企業",
  admin: "行政職員",
};

export function generateHandle(userType: UserType): string {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${LABEL[userType]}-${code}`;
}
