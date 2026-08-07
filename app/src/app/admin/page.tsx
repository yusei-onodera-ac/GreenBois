import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PROPOSAL_CATEGORY_LABELS, PROPOSAL_STATUS_LABELS, ProposalCategory, ProposalStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dev-login");
  if (user.userType !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-stone-600">
        このページは行政職員アカウントのみ閲覧できます。
      </div>
    );
  }

  const proposals = await prisma.proposal.findMany({
    include: { signatures: true, score: true, jurisdiction: true },
    orderBy: [{ score: { totalScore: "desc" } }],
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-emerald-900 mb-1">行政ダッシュボード</h1>
      <p className="text-sm text-stone-600 mb-6">
        優先度スコアが高い順に表示しています。{user.adminRole?.jurisdictionScope ?? "全域"}担当:{" "}
        {user.displayName}
      </p>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
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
            {proposals.map((p) => (
              <tr key={p.id} className="border-t border-stone-100 hover:bg-emerald-50">
                <td className="px-4 py-3 font-semibold text-emerald-800">
                  {p.score?.totalScore.toFixed(1) ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/${p.id}`} className="text-emerald-700 hover:underline font-medium">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {p.signatures.length} / {p.signatureTarget}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {p.jurisdiction?.authorityName ?? "未判定"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                    {PROPOSAL_STATUS_LABELS[p.status as ProposalStatus] ?? p.status}
                  </span>
                </td>
              </tr>
            ))}
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
