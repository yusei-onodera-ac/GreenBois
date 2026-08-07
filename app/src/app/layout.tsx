import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GreenVoice TOKYO",
  description: "都民の「声」とオープンデータで創る、ボトムアップ型グリーンインフラプラットフォーム",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-emerald-50 text-stone-900">
        <header className="bg-emerald-900 text-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <Link href="/map" className="font-bold text-lg tracking-tight">
              🌳 GreenVoice TOKYO
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              <Link href="/map" className="hover:underline">
                マップ
              </Link>
              <Link href="/proposals/new" className="hover:underline">
                提案を投稿する
              </Link>
              <Link href="/mypage" className="hover:underline">
                マイページ
              </Link>
              {user?.userType === "admin" && (
                <Link href="/admin" className="hover:underline text-emerald-200 font-semibold">
                  行政ダッシュボード
                </Link>
              )}
              <Link
                href="/dev-login"
                className="rounded-full bg-emerald-700 px-3 py-1 hover:bg-emerald-600"
              >
                {user ? `👤 ${user.displayName}` : "ログイン(開発用)"}
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="text-center text-xs text-stone-500 py-4">
          GreenVoice TOKYO — ローカル開発版(認証はLINEログインのスタブ)
        </footer>
      </body>
    </html>
  );
}
