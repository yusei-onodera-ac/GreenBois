import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

// フォントは指定のシステムフォントスタック(ヒラギノ角ゴ/メイリオ/MS-Pゴシック/Noto Sans)を
// globals.css の --font-sans で直接指定するため、next/font によるWebフォント読み込みは行わない。

export const metadata: Metadata = {
  title: "GreenVoice TOKYO",
  description: "都民の「声」とオープンデータで創る、ボトムアップ型グリーンインフラプラットフォーム",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-forest-950">
        <header className="bg-forest-900 text-forest-50">
          <div className="mx-auto max-w-6xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <Link href="/map" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-400 text-forest-950 font-display font-semibold text-sm">
                GV
              </span>
              <span className="text-lg font-semibold tracking-tight">
                GreenVoice <span className="text-forest-300">TOKYO</span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-5 text-sm">
              <Link href="/map" className="text-forest-100/90 hover:text-white transition-colors">
                マップ
              </Link>
              <Link href="/proposals/new" className="text-forest-100/90 hover:text-white transition-colors">
                提案する
              </Link>
              <Link href="/mypage" className="text-forest-100/90 hover:text-white transition-colors">
                マイページ
              </Link>
              {user?.userType === "admin" && (
                <Link href="/admin" className="text-clay-400 font-medium hover:text-clay-500 transition-colors">
                  行政ダッシュボード
                </Link>
              )}
              <Link
                href="/dev-login"
                className="flex items-center gap-2 rounded-full bg-forest-800 pl-1.5 pr-3 py-1 text-xs hover:bg-forest-700 transition-colors border border-forest-700"
              >
                {user ? (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-400 text-forest-950 text-[10px] font-semibold">
                      {user.displayName.slice(0, 1)}
                    </span>
                    {user.displayName}
                  </>
                ) : (
                  "ログイン(開発用)"
                )}
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-forest-950 text-forest-300/70 text-xs">
          <div className="mx-auto max-w-6xl px-5 py-4">
            GreenVoice TOKYO — ローカル開発版(認証はLINEログインのスタブ)
          </div>
        </footer>
      </body>
    </html>
  );
}
