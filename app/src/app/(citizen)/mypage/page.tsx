import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CategoryIcon from "@/components/CategoryIcon";
import StatusBadge from "@/components/StatusBadge";
import { PROPOSAL_CATEGORY_LABELS, ProposalCategory } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-slate-600 mb-4">マイページを見るにはログインが必要です。</p>
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
    <div>
      {/* --- プロフィール帯 --- */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white font-display text-xl font-bold">
            {user.displayName.slice(0, 1)}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-950">{user.displayName} さん</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              他の利用者にはあなたの名前ではなく公開ID「
              <span className="font-medium text-forest-700">{user.handle}</span>」が表示されます。
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-forest-50/60">
          <div className="mx-auto max-w-3xl px-4 py-4 flex gap-8 text-sm">
            <div>
              <span className="font-display text-xl font-bold text-forest-950">{myProposals.length}</span>
              <span className="text-slate-500 ml-1.5">件の投稿</span>
            </div>
            <div>
              <span className="font-display text-xl font-bold text-forest-950">{mySignatures.length}</span>
              <span className="text-slate-500 ml-1.5">件の署名</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-10">
        <section>
          <h2 className="font-display font-semibold text-forest-950 mb-3">自分が投稿した提案</h2>
          {myProposals.length === 0 ? (
            <p className="text-sm text-slate-500">まだ投稿がありません。</p>
          ) : (
            <div className="space-y-2">
              {myProposals.map((p) => (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  prefetch={false}
                  className="block rounded-sm border border-slate-200 bg-white p-4 hover:border-forest-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.title}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-forest-700 mt-1">
                    <CategoryIcon category={p.category} className="h-3 w-3" />
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
            <p className="text-sm text-slate-500">まだ署名した提案がありません。</p>
          ) : (
            <div className="space-y-2">
              {mySignatures.map((s) => (
                <Link
                  key={s.id}
                  href={`/proposals/${s.proposal.id}`}
                  prefetch={false}
                  className="block rounded-sm border border-slate-200 bg-white p-4 hover:border-forest-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.proposal.title}</span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {new Date(s.signedAt).toLocaleDateString("ja-JP")}に署名
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
