import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProposalCard from "@/components/ProposalCard";
import CategoryIcon from "@/components/CategoryIcon";
import { ChevronRightIcon } from "@/components/icons";
import {
  PROPOSAL_CATEGORIES,
  CREATABLE_CATEGORIES,
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  ProposalCategory,
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
  searchParams: Promise<{ sort?: string; status?: string; category?: string }>;
}) {
  const { sort, status, category } = await searchParams;
  const activeSort = sort === "signatures" ? "signatures" : "new";
  const showCompletedOnly = status === "completed";
  const activeCategory = PROPOSAL_CATEGORIES.includes(category as ProposalCategory)
    ? (category as ProposalCategory)
    : null;

  // マップ画面の各カルーセルと同じ範囲(完了・却下は除く)にそろえる。
  // ただし「実現しました」からの遷移(status=completed)では完了済みのみに絞る。
  const proposals = await prisma.proposal.findMany({
    where: {
      ...(showCompletedOnly ? { status: "completed" } : { status: { notIn: ["completed", "rejected"] } }),
      ...(activeCategory ? { category: activeCategory } : {}),
    },
    orderBy:
      activeSort === "signatures" ? [{ signatures: { _count: "desc" } }] : [{ createdAt: "desc" }],
    include: { signatures: { select: { id: true } }, attachments: { take: 1 } },
  });

  // 現在の絞り込み(status)は維持したまま、sort/categoryだけ変えたリンクを作る
  function buildHref({ nextSort, nextCategory }: { nextSort?: string; nextCategory?: string | null }) {
    const params = new URLSearchParams();
    const sortValue = nextSort ?? activeSort;
    const categoryValue = nextCategory === undefined ? activeCategory : nextCategory;
    if (sortValue !== "new") params.set("sort", sortValue);
    if (categoryValue) params.set("category", categoryValue);
    if (showCompletedOnly) params.set("status", "completed");
    const qs = params.toString();
    return qs ? `/proposals?${qs}` : "/proposals";
  }

  return (
    <div>
      {/* --- ページ見出し帯：マップ/詳細ページと同じトーンで揃える --- */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <Link
            href="/map"
            className="inline-flex items-center gap-1 text-sm text-forest-700 hover:text-forest-900 transition-colors"
          >
            ← HOMEに戻る
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-950 mt-3">
            {showCompletedOnly ? "実現した提案" : SORT_TITLES[activeSort]}
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            {proposals.length}件の提案を表示しています。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          {/* カテゴリ絞り込み */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref({ nextCategory: null })}
              className={`inline-flex items-center rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                !activeCategory
                  ? "bg-forest-800 border-forest-800 text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              すべて
            </Link>
            {CREATABLE_CATEGORIES.map((c) => {
              const active = activeCategory === c;
              return (
                <Link
                  key={c}
                  href={buildHref({ nextCategory: active ? null : c })}
                  className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={
                    active
                      ? { backgroundColor: PROPOSAL_CATEGORY_COLOR[c], borderColor: PROPOSAL_CATEGORY_COLOR[c], color: "#fff" }
                      : { borderColor: "var(--color-forest-100)", color: PROPOSAL_CATEGORY_COLOR[c] }
                  }
                >
                  <CategoryIcon category={c} className="h-3.5 w-3.5" />
                  {PROPOSAL_CATEGORY_LABELS[c]}
                </Link>
              );
            })}
          </div>

          {/* 並び替え */}
          <div className="flex gap-1 rounded-sm bg-slate-100 p-1 text-xs">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={buildHref({ nextSort: opt.value })}
                className={`rounded px-3 py-1.5 font-medium transition-colors ${
                  activeSort === opt.value ? "bg-forest-800 text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p) => (
            <ProposalCard
              key={p.id}
              p={{ ...p, signatureCount: p.signatures.length, photoUrl: p.attachments[0]?.url }}
            />
          ))}
          {proposals.length === 0 && (
            <p className="text-slate-500 text-sm col-span-full">
              条件に一致する提案がありません。
              <Link href={buildHref({ nextCategory: null })} className="text-forest-700 font-medium ml-1 inline-flex items-center">
                絞り込みを解除する
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
