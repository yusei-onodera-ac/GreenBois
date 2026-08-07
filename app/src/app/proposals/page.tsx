import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  PROPOSAL_CATEGORY_ICON,
  PROPOSAL_STATUS_LABELS,
  ProposalCategory,
  ProposalStatus,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { value: "new", label: "新着順" },
  { value: "signatures", label: "署名が多い順" },
] as const;

const SORT_TITLES: Record<string, string> = {
  new: "新着の提案",
  signatures: "署名が多い提案",
};

export default async function ProposalListPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const activeSort = sort === "signatures" ? "signatures" : "new";

  const proposals = await prisma.proposal.findMany({
    orderBy:
      activeSort === "signatures" ? [{ signatures: { _count: "desc" } }] : [{ createdAt: "desc" }],
    include: { signatures: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link href="/map" className="text-sm text-forest-700 hover:text-forest-900 transition-colors">
        ← マップに戻る
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-forest-950">
          {SORT_TITLES[activeSort]}{" "}
          <span className="text-sm font-normal text-stone-400">({proposals.length}件)</span>
        </h1>
        <div className="flex gap-1 rounded-full bg-stone-100 p-1 text-xs">
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={opt.value === "new" ? "/proposals" : `/proposals?sort=${opt.value}`}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                activeSort === opt.value ? "bg-forest-800 text-white" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {proposals.map((p) => (
          <Link
            key={p.id}
            href={`/proposals/${p.id}`}
            className="rounded-xl border border-stone-200 bg-white p-4 hover:border-forest-400 hover:shadow-sm transition-all"
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
            <h3 className="font-semibold text-stone-900 mb-1">{p.title}</h3>
            <p className="text-sm text-stone-600 line-clamp-2">{p.description}</p>
            <div className="mt-3 text-xs text-stone-500">
              署名 {p.signatures.length} / {p.signatureTarget} 筆
            </div>
          </Link>
        ))}
        {proposals.length === 0 && <p className="text-stone-500 text-sm">まだ提案が投稿されていません。</p>}
      </div>
    </div>
  );
}
