import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { loginAsUser, logout } from "./actions";

const USER_TYPE_LABELS: Record<string, string> = {
  citizen: "都民",
  corporate: "企業",
  admin: "行政職員",
};

export default async function DevLoginPage() {
  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-forest-950 mb-2">ログイン(開発用スタブ)</h1>
      <p className="text-sm text-stone-600 mb-6">
        本番はLINEログインを想定していますが、ローカル開発中はデモユーザーを選んでログインできます。
        (docs/03-external-integration.md参照)
      </p>

      {currentUser && (
        <div className="mb-6 rounded-lg bg-white border border-forest-200 p-4 flex items-center justify-between">
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

      <div className="space-y-3">
        {users.map((u) => (
          <form key={u.id} action={loginAsUser}>
            <input type="hidden" name="userId" value={u.id} />
            <button
              type="submit"
              className="w-full text-left rounded-lg border border-stone-200 bg-white p-4 hover:border-forest-500 hover:bg-forest-50 transition-colors"
            >
              <div className="font-semibold">{u.displayName}</div>
              <div className="text-xs text-stone-500">
                {USER_TYPE_LABELS[u.userType] ?? u.userType}
              </div>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
