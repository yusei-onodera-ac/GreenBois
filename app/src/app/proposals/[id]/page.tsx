import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { signProposal } from "./actions";
import ProposalThumb from "@/components/ProposalThumb";
import {
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  PROPOSAL_CATEGORY_ICON,
  PROPOSAL_STATUS_LABELS,
  LAND_TYPE_LABELS,
  ProposalCategory,
  ProposalStatus,
  LandType,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [proposal, user] = await Promise.all([
    prisma.proposal.findUnique({
      where: { id },
      include: {
        user: true,
        signatures: { include: { user: true }, orderBy: { signedAt: "desc" } },
        jurisdiction: true,
        statusHistory: { include: { changedByUser: true }, orderBy: { changedAt: "asc" } },
        attachments: { take: 1 },
      },
    }),
    getCurrentUser(),
  ]);

  if (!proposal) notFound();

  const alreadySigned = user ? proposal.signatures.some((s) => s.userId === user.id) : false;
  const categoryColor = PROPOSAL_CATEGORY_COLOR[proposal.category as ProposalCategory] ?? "#6b7280";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/map" className="text-sm text-forest-700 hover:text-forest-900 transition-colors">
        ← マップに戻る
      </Link>

      <ProposalThumb
        photoUrl={proposal.attachments[0]?.url}
        category={proposal.category}
        className="mt-4 h-56 w-full rounded-2xl"
      />

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span
          className="rounded-full px-2.5 py-1 font-medium text-white"
          style={{ backgroundColor: categoryColor }}
        >
          {PROPOSAL_CATEGORY_ICON[proposal.category as ProposalCategory] ?? "📍"}{" "}
          {PROPOSAL_CATEGORY_LABELS[proposal.category as ProposalCategory] ?? proposal.category}
        </span>
        <span className="rounded-full bg-forest-100 text-forest-800 px-2.5 py-1 font-medium">
          {PROPOSAL_STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status}
        </span>
        <span className="text-stone-500">
          {LAND_TYPE_LABELS[proposal.landType as LandType] ?? proposal.landType}
        </span>
      </div>

      <h1 className="font-display text-3xl font-semibold text-forest-950 mt-3 leading-snug">
        {proposal.title}
      </h1>
      <p className="text-sm text-stone-500 mt-1.5">
        投稿者: <span className="font-medium text-stone-600">{proposal.user.handle}</span>
      </p>
      <p className="mt-4 text-stone-800 leading-relaxed whitespace-pre-wrap">{proposal.description}</p>

      {proposal.jurisdiction && (
        <p className="mt-3 text-sm text-stone-500">
          所管(自動判定・要確認): {proposal.jurisdiction.authorityName}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-forest-200 bg-forest-50 p-6">
        <span className="font-semibold text-forest-900 text-lg">
          署名 {proposal.signatures.length}筆
        </span>

        {alreadySigned ? (
          <p className="mt-4 text-sm text-forest-800 font-medium">✅ あなたはすでに署名しています</p>
        ) : (
          <form action={signProposal} className="mt-4">
            <input type="hidden" name="proposalId" value={proposal.id} />
            <button
              type="submit"
              className="rounded-full bg-forest-700 text-white font-semibold px-6 py-2.5 hover:bg-forest-800 transition-colors"
            >
              {user ? "この提案に署名する" : "ログインして署名する"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-display font-semibold text-forest-950 mb-3">進捗履歴</h2>
        <ol className="space-y-2.5 text-sm">
          {proposal.statusHistory.map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-stone-700">
              <span className="text-stone-400 tabular-nums">
                {new Date(h.changedAt).toLocaleDateString("ja-JP")}
              </span>
              <span>
                {h.fromStatus
                  ? `${PROPOSAL_STATUS_LABELS[h.fromStatus as ProposalStatus]} → ${PROPOSAL_STATUS_LABELS[h.toStatus as ProposalStatus]}`
                  : `${PROPOSAL_STATUS_LABELS[h.toStatus as ProposalStatus]}(投稿)`}
              </span>
              <span className="text-stone-400">by {h.changedByUser.handle}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
