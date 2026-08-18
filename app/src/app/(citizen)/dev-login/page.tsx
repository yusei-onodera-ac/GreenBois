import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { loginAsUser, logout } from "./actions";

const USER_TYPE_LABELS: Record<string, string> = {
  citizen: "都民",
};

export default async function DevLoginPage() {
  // このサービスは都民のみが利用できる(企業アカウントは設けない、行政職員は /admin/login からログイン)。
  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({ where: { userType: "citizen" }, orderBy: { createdAt: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-forest-950 mb-2">ログイン(開発用スタブ)</h1>
      <p className="text-sm text-slate-600 mb-6">
        本番はLINEログインを想定していますが、ローカル開発中はデモユーザーを選んでログインできます。
        (docs/03-external-integration.md参照)
      </p>

      {currentUser && (
        <div className="mb-6 rounded-sm bg-forest-50 border border-forest-200 p-4 flex items-center justify-between">
          <span className="text-sm">
            現在ログイン中: <strong>{currentUser.displayName}</strong>
          </span>
          <form action={logout}>
            <button className="text-sm text-red-600 hover:underline" type="submit">
              ログアウト
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2.5">
        {users.map((u) => (
          <form key={u.id} action={loginAsUser}>
            <input type="hidden" name="userId" value={u.id} />
            <button
              type="submit"
              className="w-full flex items-center gap-3 text-left rounded-sm border border-slate-200 bg-white p-4 hover:border-forest-400 hover:bg-forest-50 transition-colors"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-800 font-display font-semibold text-sm">
                {u.displayName.slice(0, 1)}
              </span>
              <span>
                <span className="block font-semibold">{u.displayName}</span>
                <span className="block text-xs text-slate-500">
                  {USER_TYPE_LABELS[u.userType] ?? u.userType}
                </span>
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
