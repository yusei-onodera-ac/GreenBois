import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLOR, ProposalStatus } from "@/lib/enums";

// 提案の「申請ステータス」を表すセマンティックカラーのバッジ。
// カテゴリバッジ(カテゴリ色軸)とは別に、進捗の意味が色だけでも伝わるようにする
// (draft=グレー/collecting=青/screening=琥珀/adopted=青緑/in_progress=紫/completed=緑/rejected=赤)。
export default function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const key = status as ProposalStatus;
  const label = PROPOSAL_STATUS_LABELS[key] ?? status;
  const color = PROPOSAL_STATUS_COLOR[key] ?? PROPOSAL_STATUS_COLOR.draft;

  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${className}`}
      style={{ color: color.fg, backgroundColor: color.bg }}
    >
      {label}
    </span>
  );
}
