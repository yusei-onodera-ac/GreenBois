import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import CitizenNav from "@/components/CitizenNav";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <header className="bg-forest-900 text-forest-50">
        {/* ユーティリティバー：行政の公式サービスサイトによくある「事業名+文脈」の帯 */}
        <div className="border-b border-forest-800 bg-forest-950/60">
          <div className="mx-auto max-w-6xl px-5 py-1.5 flex items-center justify-between text-[11px] text-forest-300">
            <span>東京都オープンデータ活用事業「GreenVoice TOKYO」</span>
            <Link href="/admin" className="hover:text-forest-100 transition-colors">
              行政職員の方はこちら
            </Link>
          </div>
        </div>
        <div className="border-b border-forest-700">
          <div className="mx-auto max-w-6xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <Link href="/map" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-forest-400 text-forest-950 font-display font-semibold text-sm">
                GV
              </span>
              <span className="text-lg font-semibold tracking-tight">
                GreenVoice <span className="text-forest-300">TOKYO</span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-6 text-sm">
              <CitizenNav />
              <Link
                href="/proposals/new"
                className="rounded-sm bg-forest-400 text-forest-950 px-4 py-1.5 font-semibold hover:bg-forest-300 transition-colors"
              >
                + 提案する
              </Link>
              <Link
                href="/dev-login"
                className="flex items-center gap-2 rounded-sm bg-forest-800 pl-1.5 pr-3 py-1 text-xs hover:bg-forest-700 transition-colors border border-forest-700"
              >
                {user ? (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-forest-400 text-forest-950 text-[10px] font-semibold">
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
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-forest-950 text-forest-300/80 text-xs">
        <div className="mx-auto max-w-6xl px-5 py-10 grid gap-8 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-display font-semibold text-forest-100 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-forest-400 text-forest-950 text-[10px] font-semibold">
                GV
              </span>
              GreenVoice TOKYO
            </p>
            <p className="mt-3 leading-relaxed text-forest-300/70">
              都民の声とオープンデータで進める、みどりのまちづくりプラットフォーム。
              東京都オープンデータ・ハッカソン提案事業。
            </p>
          </div>
          <div>
            <p className="font-semibold text-forest-200 mb-2.5">サービス</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/map" className="hover:text-forest-100 transition-colors">マップ</Link>
              </li>
              <li>
                <Link href="/proposals" className="hover:text-forest-100 transition-colors">提案一覧</Link>
              </li>
              <li>
                <Link href="/proposals/new" className="hover:text-forest-100 transition-colors">提案する</Link>
              </li>
              <li>
                <Link href="/mypage" className="hover:text-forest-100 transition-colors">マイページ</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-forest-200 mb-2.5">このサイトについて</p>
            <p className="leading-relaxed text-forest-300/70">
              ローカル開発版です。認証はLINEログインを想定したスタブ認証を使用しています。
              個人が特定される情報(氏名等)は都民向け画面には表示されません。
            </p>
          </div>
        </div>
        <div className="border-t border-forest-800">
          <div className="mx-auto max-w-6xl px-5 py-3 text-forest-400/70">
            © GreenVoice TOKYO — ローカル開発版・非公式デモ
          </div>
        </div>
      </footer>
    </>
  );
}
