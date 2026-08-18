import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CategoryIcon from "@/components/CategoryIcon";
import StatusBadge from "@/components/StatusBadge";
import DeterminationBadge from "@/components/DeterminationBadge";
import { PROPOSAL_CATEGORY_LABELS, ProposalCategory } from "@/lib/enums";

export const dynamic = "force-dynamic";

// 認証・権限チェックは親の admin/(protected)/layout.tsx で行っているため、
// ここに到達する時点で user は行政職員アカウントであることが保証されている。
export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layoutの認証ガードにより実際には到達しない(型の絞り込み用)

  // 情報フローは docs/08-admin-data-flow.md 参照。署名者個人の情報はここでも取得しない。
  const proposals = await prisma.proposal.findMany({
    include: { signatures: { select: { id: true } }, score: true, jurisdiction: true },
    orderBy: [{ score: { totalScore: "desc" } }],
  });

  // スコア列の横棒表示用(このページ内の最大値を100%として相対表示する)
  const maxScore = Math.max(1, ...proposals.map((p) => p.score?.totalScore ?? 0));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-forest-950 mb-1">行政ダッシュボード</h1>
      <p className="text-sm text-stone-600 mb-6">
        優先度スコアが高い順に表示しています。{user.adminRole?.jurisdictionScope ?? "全域"}担当:{" "}
        {user.displayName}
      </p>

      <div className="overflow-x-auto rounded-sm border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">スコア</th>
              <th className="text-left px-4 py-3">提案</th>
              <th className="text-left px-4 py-3">カテゴリ</th>
              <th className="text-left px-4 py-3">署名</th>
              <th className="text-left px-4 py-3">所管</th>
              <th className="text-left px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => {
              const score = p.score?.totalScore ?? 0;
              return (
                <tr key={p.id} className="border-t border-stone-100 hover:bg-forest-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 w-32">
                      <span className="font-semibold text-forest-800 tabular-nums w-9 shrink-0">
                        {p.score ? score.toFixed(1) : "-"}
                      </span>
                      <span className="h-1.5 flex-1 rounded-sm bg-stone-100 overflow-hidden">
                        <span
                          className="block h-full rounded-sm bg-forest-600"
                          style={{ width: `${Math.min(100, (score / maxScore) * 100)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/${p.id}`} prefetch={false} className="text-forest-700 hover:underline font-medium">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CategoryIcon category={p.category} className="h-4 w-4 shrink-0" />
                      {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {p.signatures.length} / {p.signatureTarget}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{p.jurisdiction?.authorityName ?? "未判定"}</span>
                      {p.jurisdiction && <DeterminationBadge method={p.jurisdiction.determinationMethod} />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              );
            })}
            {proposals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-stone-500">
                  提案がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
