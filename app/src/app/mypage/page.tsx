import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PROPOSAL_CATEGORY_LABELS, PROPOSAL_STATUS_LABELS, ProposalCategory, ProposalStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-stone-600 mb-4">マイページを見るにはログインが必要です。</p>
        <Link href="/dev-login" className="text-forest-700 font-semibold hover:text-forest-900">
          ログインする →
        </Link>
      </div>
    );
  }

  const [myProposals, mySignatures] = await Promise.all([
    prisma.proposal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.signature.findMany({
      where: { userId: user.id },
      include: { proposal: true },
      orderBy: { signedAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-950">マイページ</h1>
        <p className="text-sm text-stone-600 mt-1">{user.displayName} さん</p>
        <p className="text-xs text-stone-400 mt-0.5">
          他の利用者にはあなたの名前ではなく公開ID「<span className="font-medium text-stone-500">{user.handle}</span>」が表示されます。
        </p>
      </div>

      <section>
        <h2 className="font-display font-semibold text-forest-950 mb-3">自分が投稿した提案</h2>
        {myProposals.length === 0 ? (
          <p className="text-sm text-stone-500">まだ投稿がありません。</p>
        ) : (
          <div className="space-y-2">
            {myProposals.map((p) => (
              <Link
                key={p.id}
                href={`/proposals/${p.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-forest-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs text-stone-500">
                    {PROPOSAL_STATUS_LABELS[p.status as ProposalStatus] ?? p.status}
                  </span>
                </div>
                <span className="text-xs text-forest-700">
                  {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-semibold text-forest-950 mb-3">署名した提案</h2>
        {mySignatures.length === 0 ? (
          <p className="text-sm text-stone-500">まだ署名した提案がありません。</p>
        ) : (
          <div className="space-y-2">
            {mySignatures.map((s) => (
              <Link
                key={s.id}
                href={`/proposals/${s.proposal.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-forest-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.proposal.title}</span>
                  <span className="text-xs text-stone-500">
                    {new Date(s.signedAt).toLocaleDateString("ja-JP")}に署名
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
