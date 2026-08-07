import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProposalMap from "@/components/ProposalMap";
import AutoScrollCarousel from "@/components/AutoScrollCarousel";
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

function daysAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "今日";
  if (diff < 30) return `${diff}日前`;
  return `${Math.floor(diff / 30)}ヶ月前`;
}

type CardProposal = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  signatureCount: number;
};

function ProposalCard({ p }: { p: CardProposal }) {
  return (
    <Link
      href={`/proposals/${p.id}`}
      className="block w-[calc(25%-0.75rem)] min-w-[220px] shrink-0 rounded-xl border border-stone-200 bg-white p-5 hover:border-forest-400 hover:shadow-sm transition-all snap-start"
    >
      <div className="flex items-center justify-between text-xs mb-2.5">
        <span
          className="rounded-full px-2 py-0.5 font-medium text-white"
          style={{ backgroundColor: PROPOSAL_CATEGORY_COLOR[p.category as ProposalCategory] ?? "#6b7280" }}
        >
          {PROPOSAL_CATEGORY_ICON[p.category as ProposalCategory] ?? "📍"}
        </span>
        <span className="text-stone-500">{PROPOSAL_STATUS_LABELS[p.status as ProposalStatus] ?? p.status}</span>
      </div>
      <h3 className="font-semibold text-stone-900 mb-1.5 line-clamp-2 leading-snug">{p.title}</h3>
      <p className="text-xs text-stone-500 line-clamp-2">{p.description}</p>
      <div className="mt-3 text-xs text-stone-500">署名 {p.signatureCount}筆</div>
    </Link>
  );
}

function CarouselHeader({ title, moreHref }: { title: string; moreHref: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-lg font-semibold text-forest-950">{title}</h2>
      <Link href={moreHref} className="text-sm text-forest-700 hover:text-forest-900 font-medium transition-colors">
        もっと見る →
      </Link>
    </div>
  );
}

function StatBadge({ icon, value, unit, label }: { icon: string; value: string | number; unit: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest-100 text-3xl">
        {icon}
      </span>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-3xl font-bold text-clay-600">{value}</span>
          <span className="text-sm font-semibold text-stone-500">{unit}</span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default async function MapPage() {
  // 「完了」「却下」は決着済みのため、新着/署名が多い順の一覧には出さない
  // (完了は「実現しました」ショーケースに別途表示する)
  const activeFilter = { status: { notIn: ["completed", "rejected"] } };

  const [proposals, bySignatures, byNew, realized, realizedCount, userCount] = await Promise.all([
    prisma.proposal.findMany({ include: { signatures: true } }),
    prisma.proposal.findMany({
      where: activeFilter,
      orderBy: [{ signatures: { _count: "desc" } }],
      include: { signatures: true },
      take: 8,
    }),
    prisma.proposal.findMany({
      where: activeFilter,
      orderBy: [{ createdAt: "desc" }],
      include: { signatures: true },
      take: 8,
    }),
    prisma.proposal.findMany({
      where: { status: "completed" },
      include: { statusHistory: { orderBy: { changedAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.proposal.count({ where: { status: "completed" } }),
    prisma.user.count({ where: { userType: { not: "admin" } } }),
  ]);

  const totalSignatures = proposals.reduce((sum, p) => sum + p.signatures.length, 0);

  return (
    <div>
      {/* --- ヒーロー --- */}
      <section className="relative overflow-hidden bg-forest-900">
        <span className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-forest-800" />
        <span className="pointer-events-none absolute -right-4 top-20 h-40 w-40 rounded-full bg-forest-700/70" />
        <span className="pointer-events-none absolute -left-20 bottom-[-4rem] h-56 w-56 rounded-full bg-forest-800" />

        <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-10">
          <p className="text-clay-400 text-xs font-semibold tracking-widest">GREENVOICE TOKYO</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-2 leading-tight max-w-xl">
            まちの「みどり」を、
            <br />
            みんなの声でつくる。
          </h1>
          <p className="text-forest-200 text-sm mt-4 max-w-lg leading-relaxed">
            公園設備の要望から植樹・緑化、私有地の樹木管理まで。あなたの声が地図に載り、共感が集まるほど、行政での検討につながります。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/proposals/new"
              className="rounded-full bg-clay-500 text-white text-sm font-semibold px-6 py-3 hover:bg-clay-600 transition-colors"
            >
              + 提案してみる
            </Link>
            <a
              href="#realized"
              className="rounded-full border border-forest-400 text-forest-100 text-sm font-semibold px-6 py-3 hover:bg-forest-800 transition-colors"
            >
              実現した事例を見る
            </a>
          </div>
        </div>
      </section>

      {/* --- 数字で見るGreenVoice --- */}
      <section className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-6xl px-5 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <StatBadge icon="📮" value={proposals.length} unit="件" label="投稿された提案" />
          <StatBadge icon="✍️" value={totalSignatures} unit="筆" label="集まった署名" />
          <StatBadge icon="🎉" value={realizedCount} unit="件" label="実現した提案" />
          <StatBadge icon="🧑‍🤝‍🧑" value={userCount} unit="人" label="参加している都民・企業" />
        </div>
      </section>

      {/* --- 地図 --- */}
      <div className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="font-display text-xl font-semibold text-forest-950 mb-1">地図で見る</h2>
        <p className="text-sm text-stone-600 mb-4">ピンをクリックすると詳細を確認できます。</p>

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
      </div>

      {/* --- 実現しました(自動スクロール・ループ) --- */}
      <section id="realized" className="bg-forest-50 border-y border-forest-100 py-8 scroll-mt-4">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-clay-600 text-xs font-semibold tracking-wide">REALIZED</p>
          <h2 className="font-display text-xl font-semibold text-forest-950 mt-1 mb-4">
            このアプリから、実際に実現しました
          </h2>
          {realized.length === 0 ? (
            <p className="text-stone-500 text-sm max-w-xl">
              まだ実現した提案はありません。あなたの一声が、その最初の1件になるかもしれません。
            </p>
          ) : (
            <AutoScrollCarousel speedSeconds={realized.length * 5}>
              {realized.map((p) => (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="block w-72 rounded-xl bg-white border border-forest-200 border-l-4 border-l-clay-500 p-4 shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex items-center gap-1.5 text-clay-600 text-xs font-semibold">
                    <span>🎉</span> 実現しました
                  </div>
                  <h3 className="text-forest-950 font-medium mt-1.5 leading-snug line-clamp-2">{p.title}</h3>
                  <p className="text-stone-500 text-xs mt-2">
                    {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
                    {p.statusHistory[0] && ` ・ ${daysAgo(p.statusHistory[0].changedAt)}に実現`}
                  </p>
                </Link>
              ))}
            </AutoScrollCarousel>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 space-y-8">
        {/* --- 署名が多い順 --- */}
        <section>
          <CarouselHeader title="署名が多い提案" moreHref="/proposals?sort=signatures" />
          {bySignatures.length === 0 ? (
            <p className="text-stone-500 text-sm">まだ提案がありません。</p>
          ) : (
            <div className="gv-scroll flex gap-4 overflow-x-auto pb-3 snap-x snap-proximity">
              {bySignatures.map((p) => (
                <ProposalCard
                  key={p.id}
                  p={{ ...p, signatureCount: p.signatures.length }}
                />
              ))}
            </div>
          )}
        </section>

        {/* --- 新着順 --- */}
        <section>
          <CarouselHeader title="新着の提案" moreHref="/proposals?sort=new" />
          {byNew.length === 0 ? (
            <p className="text-stone-500 text-sm">まだ提案がありません。</p>
          ) : (
            <div className="gv-scroll flex gap-4 overflow-x-auto pb-3 snap-x snap-proximity">
              {byNew.map((p) => (
                <ProposalCard key={p.id} p={{ ...p, signatureCount: p.signatures.length }} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
