import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { signProposal } from "./actions";
import PhotoGallery from "@/components/PhotoGallery";
import CategoryIcon from "@/components/CategoryIcon";
import StatusBadge from "@/components/StatusBadge";
import StatusStepper from "@/components/StatusStepper";
import DeterminationBadge from "@/components/DeterminationBadge";
import ProposalLocationMap from "@/components/ProposalLocationMap";
import { CheckIcon } from "@/components/icons";
import {
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  LAND_TYPE_LABELS,
  ProposalCategory,
  LandType,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 情報フローは docs/06-admin-data-flow.md 参照。都民向けは本名を一切取得しない
  // (提案者・ステータス変更者ともハンドルのみ)。署名者個人の情報も取得しない。
  const [proposal, user] = await Promise.all([
    prisma.proposal.findUnique({
      where: { id },
      include: {
        user: { select: { handle: true } },
        signatures: { select: { userId: true } },
        jurisdiction: true,
        attachments: true,
      },
    }),
    getCurrentUser(),
  ]);

  if (!proposal) notFound();

  const alreadySigned = user ? proposal.signatures.some((s) => s.userId === user.id) : false;
  const categoryColor = PROPOSAL_CATEGORY_COLOR[proposal.category as ProposalCategory] ?? "#6b7280";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/map" className="text-sm text-forest-700 hover:text-forest-900 transition-colors">
        ← HOMEに戻る
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        {/* --- 本文 --- */}
        <div>
          <PhotoGallery photos={proposal.attachments} category={proposal.category} />

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-medium text-white"
              style={{ backgroundColor: categoryColor }}
            >
              <CategoryIcon category={proposal.category} className="h-3.5 w-3.5" />
              {PROPOSAL_CATEGORY_LABELS[proposal.category as ProposalCategory] ?? proposal.category}
            </span>
            <StatusBadge status={proposal.status} />
            <span className="text-slate-500">
              {LAND_TYPE_LABELS[proposal.landType as LandType] ?? proposal.landType}
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-forest-950 mt-3 leading-snug">
            {proposal.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            投稿者: <span className="font-medium text-slate-600">{proposal.user.handle}</span>
          </p>
          <p className="mt-4 text-slate-800 leading-relaxed whitespace-pre-wrap">{proposal.description}</p>

          {proposal.jurisdiction && (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
              所管: {proposal.jurisdiction.authorityName}
              <DeterminationBadge method={proposal.jurisdiction.determinationMethod} />
            </p>
          )}

          {/* --- 場所(正確な位置をピンで表示。閲覧専用・移動不可) --- */}
          <div className="mt-6 rounded-sm border border-slate-200 bg-white p-4">
            <h2 className="font-display font-semibold text-forest-950 mb-3 text-sm">場所</h2>
            <ProposalLocationMap lat={proposal.lat} lng={proposal.lng} className="h-56" />
          </div>

          {/* --- 進捗 --- */}
          <div className="mt-6 rounded-sm border border-slate-200 bg-white p-6">
            <h2 className="font-display font-semibold text-forest-950 mb-5">進捗状況</h2>
            <StatusStepper status={proposal.status} />
          </div>
        </div>

        {/* --- サイドバー：署名 --- */}
        <div className="lg:sticky lg:top-6 rounded-sm border border-forest-200 bg-forest-50 p-6">
          <span className="font-semibold text-forest-900 text-lg">
            署名 {proposal.signatures.length}筆
          </span>

          {alreadySigned ? (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-forest-800 font-medium">
              <CheckIcon className="h-4 w-4" /> あなたはすでに署名しています
            </p>
          ) : (
            <form action={signProposal} className="mt-4">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <button
                type="submit"
                className="w-full rounded-sm bg-forest-700 text-white font-semibold px-6 py-2.5 hover:bg-forest-800 transition-colors"
              >
                {user ? "この提案に署名する" : "ログインして署名する"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
