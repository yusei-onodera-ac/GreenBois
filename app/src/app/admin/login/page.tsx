import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { loginAsAdmin, adminLogout } from "./actions";

export default async function AdminLoginPage() {
  const [admins, currentUser] = await Promise.all([
    prisma.user.findMany({
      where: { userType: "admin" },
      include: { adminRole: true },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-slate-100 mb-2">行政システム ログイン</h1>
      <p className="text-sm text-slate-400 mb-6">
        行政職員アカウントを選択してログインしてください。都民向けのログインとは別画面です。
      </p>

      {currentUser && currentUser.userType === "admin" && (
        <div className="mb-6 rounded-sm bg-slate-800 border border-slate-700 p-4 flex items-center justify-between">
          <span className="text-sm text-slate-200">
            現在ログイン中: <strong>{currentUser.displayName}</strong>
          </span>
          <form action={adminLogout}>
            <button className="text-sm text-red-400 hover:underline" type="submit">
              ログアウト
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2.5">
        {admins.map((u) => (
          <form key={u.id} action={loginAsAdmin}>
            <input type="hidden" name="userId" value={u.id} />
            <button
              type="submit"
              className="w-full flex items-center gap-3 text-left rounded-sm border border-slate-700 bg-slate-800 p-4 hover:border-sky-500 hover:bg-slate-700 transition-colors"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-slate-950 font-display font-semibold text-sm">
                {u.displayName.slice(0, 1)}
              </span>
              <span>
                <span className="block font-semibold text-slate-100">{u.displayName}</span>
                <span className="block text-xs text-slate-400">
                  {u.adminRole?.jurisdictionScope ?? "全域"}担当
                </span>
              </span>
            </button>
          </form>
        ))}
        {admins.length === 0 && (
          <p className="text-sm text-slate-500">行政職員アカウントが登録されていません。</p>
        )}
      </div>
    </div>
  );
}
