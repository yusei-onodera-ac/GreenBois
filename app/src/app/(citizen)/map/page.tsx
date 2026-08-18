import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProposalMap from "@/components/ProposalMap";
import AutoScrollCarousel from "@/components/AutoScrollCarousel";
import ProposalThumb from "@/components/ProposalThumb";
import ProposalCard from "@/components/ProposalCard";
import CategoryIcon from "@/components/CategoryIcon";
import { ChevronRightIcon, MailboxIcon, SignatureIcon, TrophyIcon, UsersIcon } from "@/components/icons";
import {
  CREATABLE_CATEGORIES,
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  ProposalCategory,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

function daysAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "今日";
  if (diff < 30) return `${diff}日前`;
  return `${Math.floor(diff / 30)}ヶ月前`;
}

function CarouselHeader({ title, moreHref }: { title: string; moreHref: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-lg font-semibold text-forest-950">{title}</h2>
      <Link
        href={moreHref}
        className="inline-flex items-center gap-0.5 text-sm text-forest-700 hover:text-forest-900 font-medium transition-colors"
      >
        もっと見る
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function StatTile({
  icon,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  unit: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-forest-100 bg-forest-50/60 px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-forest-700 text-forest-50">
        {icon}
      </span>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold text-forest-900">{value}</span>
          <span className="text-xs font-semibold text-slate-500">{unit}</span>
        </div>
        <span className="text-xs text-slate-500">{label}</span>
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
      include: { signatures: true, attachments: { take: 1 } },
      take: 8,
    }),
    prisma.proposal.findMany({
      where: activeFilter,
      orderBy: [{ createdAt: "desc" }],
      include: { signatures: true, attachments: { take: 1 } },
      take: 8,
    }),
    prisma.proposal.findMany({
      where: { status: "completed" },
      include: {
        statusHistory: { orderBy: { changedAt: "desc" }, take: 1 },
        attachments: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.proposal.count({ where: { status: "completed" } }),
    prisma.user.count({ where: { userType: "citizen" } }),
  ]);

  const totalSignatures = proposals.reduce((sum, p) => sum + p.signatures.length, 0);

  return (
    <div>
      {/* --- ヒーロー(My City Reportを参考に白背景+明るい緑のアクセント) --- */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-10">
          <p className="text-forest-600 text-xs font-semibold tracking-widest">GREENVOICE TOKYO</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-950 mt-2 leading-tight max-w-xl">
            まちの「みどり」を、
            <br />
            みんなの声でつくる。
          </h1>
          <p className="text-slate-600 text-sm mt-4 max-w-lg leading-relaxed">
            公園設備の要望から植樹・緑化、私有地の樹木管理まで。あなたの声が地図に載り、共感が集まるほど、行政での検討につながります。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/proposals/new"
              className="rounded-sm bg-forest-600 text-white text-sm font-semibold px-6 py-3 hover:bg-forest-700 transition-colors"
            >
              + 提案してみる
            </Link>
            <a
              href="#realized"
              className="rounded-sm border border-forest-300 text-forest-700 text-sm font-semibold px-6 py-3 hover:bg-forest-50 transition-colors"
            >
              実現した事例を見る
            </a>
          </div>
        </div>
      </section>

      {/* --- 数字で見るGreenVoice --- */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-5 py-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={<MailboxIcon className="h-4.5 w-4.5" />} value={proposals.length} unit="件" label="投稿された提案" />
          <StatTile icon={<SignatureIcon className="h-4.5 w-4.5" />} value={totalSignatures} unit="筆" label="集まった署名" />
          <StatTile icon={<TrophyIcon className="h-4.5 w-4.5" />} value={realizedCount} unit="件" label="実現した提案" />
          <StatTile icon={<UsersIcon className="h-4.5 w-4.5" />} value={userCount} unit="人" label="参加している都民" />
        </div>
      </section>

      {/* --- 実現しました(自動スクロール・ループ) --- */}
      <section id="realized" className="bg-forest-50 border-y border-forest-100 py-8 scroll-mt-4">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-clay-600 text-xs font-semibold tracking-wide">REALIZED</p>
              <h2 className="font-display text-xl font-semibold text-forest-950 mt-1">
                このアプリから、実際に実現しました
              </h2>
            </div>
            <Link
              href="/proposals?status=completed"
              className="inline-flex items-center gap-0.5 text-sm text-forest-700 hover:text-forest-900 font-medium transition-colors shrink-0"
            >
              もっと見る
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          {realized.length === 0 ? (
            <p className="text-slate-500 text-sm max-w-xl">
              まだ実現した提案はありません。あなたの一声が、その最初の1件になるかもしれません。
            </p>
          ) : (
            <AutoScrollCarousel speedSeconds={realized.length * 5}>
              {realized.map((p) => (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  prefetch={false}
                  className="block w-72 overflow-hidden rounded-sm bg-white border border-slate-200 hover:border-forest-400 transition-colors"
                >
                  <ProposalThumb photoUrl={p.attachments[0]?.url} category={p.category} className="h-32 w-full" />
                  <div className="border-l-4 border-l-clay-500 p-4">
                    <div className="flex items-center gap-1.5 text-clay-600 text-xs font-semibold">
                      <TrophyIcon className="h-3.5 w-3.5" /> 実現しました
                    </div>
                    <h3 className="text-forest-950 font-medium mt-1.5 leading-snug line-clamp-2">{p.title}</h3>
                    <p className="text-slate-500 text-xs mt-2">
                      {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
                      {p.statusHistory[0] && ` ・ ${daysAgo(p.statusHistory[0].changedAt)}に実現`}
                    </p>
                  </div>
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
            <p className="text-slate-500 text-sm">まだ提案がありません。</p>
          ) : (
            <div className="gv-scroll flex gap-4 overflow-x-auto pb-3 snap-x snap-proximity">
              {bySignatures.map((p) => (
                <ProposalCard
                  key={p.id}
                  variant="carousel"
                  p={{ ...p, signatureCount: p.signatures.length, photoUrl: p.attachments[0]?.url }}
                />
              ))}
            </div>
          )}
        </section>

        {/* --- 新着順 --- */}
        <section>
          <CarouselHeader title="新着の提案" moreHref="/proposals?sort=new" />
          {byNew.length === 0 ? (
            <p className="text-slate-500 text-sm">まだ提案がありません。</p>
          ) : (
            <div className="gv-scroll flex gap-4 overflow-x-auto pb-3 snap-x snap-proximity">
              {byNew.map((p) => (
                <ProposalCard
                  key={p.id}
                  variant="carousel"
                  p={{ ...p, signatureCount: p.signatures.length, photoUrl: p.attachments[0]?.url }}
                />
              ))}
            </div>
          )}
        </section>

        {/* --- 地図から探す(補助的な閲覧手段。一覧が主) --- */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">地図から探す</h2>
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
          <div className="mt-3 flex flex-wrap gap-2">
            {CREATABLE_CATEGORIES.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium"
                style={{ borderColor: `${PROPOSAL_CATEGORY_COLOR[c]}33`, color: PROPOSAL_CATEGORY_COLOR[c] }}
              >
                <CategoryIcon category={c} className="h-3.5 w-3.5" />
                {PROPOSAL_CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
