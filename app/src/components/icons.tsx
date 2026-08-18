// 絵文字の代わりに使うモノラインSVGアイコン集。
// 全アイコン共通スタイル: viewBox 0 0 24 24 / stroke=currentColor / fill=none / strokeWidth 1.75。
// 色はカテゴリの PROPOSAL_CATEGORY_COLOR やテキスト色をそのまま currentColor で引き継げるようにする。

import type { CSSProperties } from "react";

export type IconProps = { className?: string; style?: CSSProperties };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// カテゴリ: 公園設備(ベンチ・日よけ等)
export function BenchIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M3 12h18M3 12v7M21 12v7M5 9h14a1 1 0 0 1 1 1v2H4v-2a1 1 0 0 1 1-1ZM7 19v-3M17 19v-3" />
    </svg>
  );
}

// カテゴリ: 植樹・緑化(公有地)
export function TreeIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M12 3 6 11h3l-4 6h5v4M12 3l6 8h-3l4 6h-5" />
      <path d="M12 15v6" />
    </svg>
  );
}

// カテゴリ: 私有地緑化(履歴表示用)
export function BuildingIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="5" y="3" width="10" height="18" rx="1" />
      <path d="M9 7h2M9 11h2M9 15h2M15 10h4v11h-4" />
    </svg>
  );
}

// カテゴリ: 樹木管理(伐採・剪定支援)
export function ScissorsIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.5 7.5 20 18M8.5 16.5 20 6" />
    </svg>
  );
}

// カテゴリ: その他
export function MapPinIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

// 写真アップロード
export function CameraIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

// 署名済みメッセージ
export function CheckIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  );
}

// 統計: 投稿数
export function MailboxIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M4 20V10a5 5 0 0 1 10 0v10" />
      <path d="M4 20h16v-6a2 2 0 0 0-2-2h-5" />
      <path d="M7 10h2" />
    </svg>
  );
}

// 統計: 署名数
export function SignatureIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M4 18c2-4 3-6 4.5-6s1 3 2.5 3 3-5 4.5-5 1.5 4 3 4 1.5-2 2-2" />
      <path d="M4 21h16" />
    </svg>
  );
}

// 統計: 実現数
export function TrophyIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
      <path d="M12 14v3M9 21h6M10 17h4v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2Z" />
    </svg>
  );
}

// 統計: 参加者数
export function UsersIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M15.5 14.2c2.6.3 4.5 2.6 4.5 5.3" />
    </svg>
  );
}

// StatusStepper: 完了済みステップ
export function StepCheckIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

// StatusStepper: 却下(終端状態)
export function StepRejectedIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

// 一覧の「もっと見る」等のシェブロン
export function ChevronRightIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
