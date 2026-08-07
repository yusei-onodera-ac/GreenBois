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

const SORT_OPTIONS = [
  { value: "new", label: "新着順" },
  { value: "signatures", label: "署名が多い順" },
] as const;

function daysAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "今日";
  if (diff < 30) return `${diff}日前`;
  return `${Math.floor(diff / 30)}ヶ月前`;
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const activeSort = sort === "signatures" ? "signatures" : "new";

  const [proposals, realized] = await Promise.all([
    prisma.proposal.findMany({
      orderBy:
        activeSort === "signatures"
          ? [{ signatures: { _count: "desc" } }]
          : [{ createdAt: "desc" }],
      include: { signatures: true },
    }),
    prisma.proposal.findMany({
      where: { status: "completed" },
      include: { statusHistory: { orderBy: { changedAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div>
      {/* --- 実現しました ショーケース --- */}
      <section className="bg-forest-900">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <p className="text-clay-400 text-xs font-semibold tracking-wide">REALIZED</p>
          <h2 className="font-display text-2xl font-semibold text-white mt-1">
            このアプリから、実際に実現しました
          </h2>
          {realized.length === 0 ? (
            <p className="text-forest-200 text-sm mt-3 max-w-xl">
              まだ実現した提案はありません。あなたの一声が、その最初の1件になるかもしれません。
            </p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {realized.map((p) => (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="rounded-xl bg-forest-800/60 border border-forest-700 p-4 hover:bg-forest-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-clay-400 text-xs font-semibold">
                    <span>🎉</span> 実現しました
                  </div>
                  <h3 className="text-white font-medium mt-1.5 leading-snug">{p.title}</h3>
                  <p className="text-forest-300 text-xs mt-2">
                    {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
                    {p.statusHistory[0] && ` ・ ${daysAgo(p.statusHistory[0].changedAt)}に実現`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-950">提案マップ</h1>
            <p className="text-sm text-stone-600 mt-1">
              公園設備や植樹・緑化の提案から、私有地の樹木管理・伐採支援の要望まで、まちの「みどり」に関する声を集めています。ピンをクリックすると詳細を確認できます。
            </p>
          </div>
          <Link
            href="/proposals/new"
            className="rounded-full bg-clay-500 text-white text-sm font-semibold px-5 py-2.5 hover:bg-clay-600 transition-colors whitespace-nowrap"
          >
            + 提案してみる
          </Link>
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

        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest-950">
            提案一覧 <span className="text-sm font-sans font-normal text-stone-400">({proposals.length}件)</span>
          </h2>
          <div className="flex gap-1 rounded-full bg-stone-100 p-1 text-xs">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={opt.value === "new" ? "/map" : `/map?sort=${opt.value}`}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                  activeSort === opt.value
                    ? "bg-forest-800 text-white"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          {proposals.length === 0 && (
            <p className="text-stone-500 text-sm">まだ提案が投稿されていません。</p>
          )}
        </div>
      </div>
    </div>
  );
}
