import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { adminLogout } from "../login/actions";
import AdminNav from "@/components/AdminNav";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  if (user.userType !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-slate-300">
        このページは行政職員アカウントのみ閲覧できます。
      </div>
    );
  }

  return (
    <>
      <header className="bg-slate-900">
        {/* ユーティリティバー：都民向け画面と同じ構造(事業名+文脈)を実務トーンで揃える */}
        <div className="border-b border-slate-800 bg-slate-950/60">
          <div className="mx-auto max-w-6xl px-5 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>GreenVoice TOKYO 行政システム — 職員専用</span>
            <Link href="/map" className="hover:text-slate-200 transition-colors">
              都民向けサイトはこちら
            </Link>
          </div>
        </div>
        <div className="border-b border-slate-800">
          <div className="mx-auto max-w-6xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-sky-500 text-slate-950 font-display font-semibold text-sm">
                GV
              </span>
              <span className="text-lg font-semibold tracking-tight text-slate-100">
                GreenVoice TOKYO <span className="text-sky-400">行政システム</span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-5 text-sm">
              <AdminNav />
              <span className="flex items-center gap-2 rounded-sm bg-slate-800 pl-1.5 pr-3 py-1 text-xs text-slate-200 border border-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-sky-500 text-slate-950 text-[10px] font-semibold">
                  {user.displayName.slice(0, 1)}
                </span>
                {user.displayName}({user.adminRole?.jurisdictionScope ?? "全域"}担当)
              </span>
              <form action={adminLogout}>
                <button type="submit" className="text-slate-400 hover:text-red-400 transition-colors">
                  ログアウト
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-stone-50 text-forest-950">{children}</main>
      <footer className="bg-slate-950 text-slate-500 text-xs border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-5 py-4">
          GreenVoice TOKYO 行政システム — ローカル開発版
        </div>
      </footer>
    </>
  );
}
