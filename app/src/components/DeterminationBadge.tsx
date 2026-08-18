// 管轄自動判定(F9本格版)の判定方法を示す小さなバッジ。
// ステータス(StatusBadge)とは別軸で、「どのくらい信頼できる判定か」を一目で示す
// (行政職員が自動振り分けの妥当性を判断する材料になる)。
const LABEL: Record<string, string> = {
  site_match: "施設一致",
  road_match: "道路一致",
  ward_fallback: "区で判定",
  manual_review: "要確認",
};

// site_match/road_match は近傍の実データに基づく判定なので信頼度が高い(緑系)、
// ward_fallback は区までしか絞れていない(青系)、manual_review は最も粗い
// landType固定表によるフォールバック(グレー系、要確認の意味を込める)。
const TONE: Record<string, { fg: string; bg: string }> = {
  site_match: { fg: "var(--color-forest-700)", bg: "var(--color-forest-100)" },
  road_match: { fg: "var(--color-forest-700)", bg: "var(--color-forest-100)" },
  ward_fallback: { fg: "#1d4ed8", bg: "#eff6ff" },
  manual_review: { fg: "#57534e", bg: "#f5f5f4" },
};

export default function DeterminationBadge({
  method,
  className = "",
}: {
  method: string;
  className?: string;
}) {
  const label = LABEL[method] ?? method;
  const tone = TONE[method] ?? TONE.manual_review;
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{ color: tone.fg, backgroundColor: tone.bg }}
      title={`管轄自動判定: ${label}`}
    >
      {label}
    </span>
  );
}
