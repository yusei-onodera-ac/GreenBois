import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProposalMap from "@/components/ProposalMap";
import {
  PROPOSAL_CATEGORIES,
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  PROPOSAL_CATEGORY_ICON,
  PROPOSAL_STATUS_LABELS,
  ProposalCategory,
  ProposalStatus,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: { signatures: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-900">提案マップ</h1>
        <p className="text-sm text-stone-600 mt-1">
          都民・企業から投稿された緑化・公園設備の提案です。ピンをクリックすると詳細を確認できます。
        </p>
      </div>

      <ProposalMap
        proposals={proposals.map((p) => ({
          id: p.id,
          title: p.title,
          lat: p.lat,
          lng: p.lng,
          category: p.category,
          status: p.status,
        }))}
      />

      <div className="mt-3 flex flex-wrap gap-3">
        {PROPOSAL_CATEGORIES.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5 text-xs text-stone-600">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: PROPOSAL_CATEGORY_COLOR[c] }}
            />
            {PROPOSAL_CATEGORY_ICON[c]} {PROPOSAL_CATEGORY_LABELS[c]}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {proposals.map((p) => (
          <Link
            key={p.id}
            href={`/proposals/${p.id}`}
            className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span
                className="rounded-full px-2 py-0.5 font-medium text-white"
                style={{ backgroundColor: PROPOSAL_CATEGORY_COLOR[p.category as ProposalCategory] ?? "#6b7280" }}
              >
                {PROPOSAL_CATEGORY_ICON[p.category as ProposalCategory] ?? "📍"}{" "}
                {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
              </span>
              <span className="text-stone-500">
                {PROPOSAL_STATUS_LABELS[p.status as ProposalStatus] ?? p.status}
              </span>
            </div>
            <h2 className="font-semibold text-stone-900 mb-1">{p.title}</h2>
            <p className="text-sm text-stone-600 line-clamp-2">{p.description}</p>
            <div className="mt-3 text-xs text-stone-500">
              署名 {p.signatures.length} / {p.signatureTarget} 筆
            </div>
          </Link>
        ))}
        {proposals.length === 0 && (
          <p className="text-stone-500 text-sm">まだ提案が投稿されていません。</p>
        )}
      </div>
    </div>
  );
}
