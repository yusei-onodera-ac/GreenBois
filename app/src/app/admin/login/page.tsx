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
      <h1 className="font-display text-2xl font-semibold text-forest-950 mb-2">行政システム ログイン</h1>
      <p className="text-sm text-slate-600 mb-6">
        行政職員アカウントを選択してログインしてください。都民向けのログインとは別画面です。
      </p>

      {currentUser && currentUser.userType === "admin" && (
        <div className="mb-6 rounded-sm bg-forest-50 border border-forest-200 p-4 flex items-center justify-between">
          <span className="text-sm">
            現在ログイン中: <strong>{currentUser.displayName}</strong>
          </span>
          <form action={adminLogout}>
            <button className="text-sm text-red-600 hover:underline" type="submit">
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
              className="w-full flex items-center gap-3 text-left rounded-sm border border-slate-200 bg-white p-4 hover:border-forest-400 hover:bg-forest-50 transition-colors"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-800 font-display font-semibold text-sm">
                {u.displayName.slice(0, 1)}
              </span>
              <span>
                <span className="block font-semibold text-forest-950">{u.displayName}</span>
                <span className="block text-xs text-slate-500">
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
