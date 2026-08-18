import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_MAIN_PATH,
  ProposalStatus,
} from "@/lib/enums";
import { StepCheckIcon, StepRejectedIcon } from "./icons";

// 行政の申請手続きによくある「進捗ステップ表示」。draft→collecting→screening→adopted→
// in_progress→completed の主経路を横並びで示し、現在位置までを塗りつぶす。
// rejected(却下)は主経路の外にある終端状態のため、専用の表示に切り替える
// (どの段階で却下されたかは詳細ページの「進捗履歴」リスト側で確認できる)。
export default function StatusStepper({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  if (status === "rejected") {
    return (
      <div
        className={`flex items-center gap-2.5 rounded-sm px-4 py-3 ${className}`}
        style={{ backgroundColor: "var(--color-status-rejected-bg)" }}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: "var(--color-status-rejected)" }}
        >
          <StepRejectedIcon className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--color-status-rejected)" }}>
          この提案は却下されました
        </span>
      </div>
    );
  }

  const currentIndex = Math.max(0, PROPOSAL_STATUS_MAIN_PATH.indexOf(status as ProposalStatus));

  return (
    <ol className={`flex items-start ${className}`}>
      {PROPOSAL_STATUS_MAIN_PATH.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const reached = i <= currentIndex;
        return (
          <li key={step} className="relative flex-1 flex flex-col items-center gap-1.5 text-center">
            {i > 0 && (
              <span
                aria-hidden
                className="absolute top-3.5 right-1/2 -z-10 h-0.5 w-full"
                style={{ backgroundColor: reached ? "var(--color-forest-600)" : "var(--color-forest-100)" }}
              />
            )}
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold"
              style={
                reached
                  ? { backgroundColor: "var(--color-forest-700)", borderColor: "var(--color-forest-700)", color: "#fff" }
                  : { backgroundColor: "#fff", borderColor: "var(--color-forest-200)", color: "var(--color-forest-500)" }
              }
            >
              {done ? <StepCheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={`text-[11px] leading-tight ${
                active ? "font-semibold text-forest-900" : reached ? "text-forest-700" : "text-slate-400"
              }`}
            >
              {PROPOSAL_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
