import type { Metadata } from "next";
import "./globals.css";

// フォントは指定のシステムフォントスタック(ヒラギノ角ゴ/メイリオ/MS-Pゴシック/Noto Sans)を
// globals.css の --font-sans で直接指定するため、next/font によるWebフォント読み込みは行わない。

export const metadata: Metadata = {
  title: "GreenVoice TOKYO",
  description: "都民の「声」とオープンデータで創る、ボトムアップ型グリーンインフラプラットフォーム",
};

// ヘッダー/フッターは都民向け(src/app/(citizen)/layout.tsx)と
// 行政向け(src/app/admin/layout.tsx)でそれぞれ専用のものを持つため、
// ルートレイアウトは <html>/<body> の骨組みのみを提供する。
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-forest-950">{children}</body>
    </html>
  );
}
