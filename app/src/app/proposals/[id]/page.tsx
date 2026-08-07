import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { signProposal } from "./actions";
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
        score: true,
        statusHistory: { include: { changedByUser: true }, orderBy: { changedAt: "asc" } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!proposal) notFound();

  const alreadySigned = user ? proposal.signatures.some((s) => s.userId === user.id) : false;
  const progress = Math.min(
    Math.round((proposal.signatures.length / proposal.signatureTarget) * 100),
    100
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/map" className="text-sm text-emerald-700 hover:underline">
        ← マップに戻る
      </Link>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span
          className="rounded-full px-2 py-0.5 font-medium text-white"
          style={{ backgroundColor: PROPOSAL_CATEGORY_COLOR[proposal.category as ProposalCategory] ?? "#6b7280" }}
        >
          {PROPOSAL_CATEGORY_ICON[proposal.category as ProposalCategory] ?? "📍"}{" "}
          {PROPOSAL_CATEGORY_LABELS[proposal.category as ProposalCategory] ?? proposal.category}
        </span>
        <span className="rounded-full bg-stone-100 text-stone-700 px-2 py-0.5 font-medium">
          {PROPOSAL_STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status}
        </span>
        <span className="text-stone-500">
          {LAND_TYPE_LABELS[proposal.landType as LandType] ?? proposal.landType}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-stone-900 mt-2">{proposal.title}</h1>
      <p className="text-sm text-stone-500 mt-1">投稿者: {proposal.user.displayName}</p>
      <p className="mt-4 text-stone-800 whitespace-pre-wrap">{proposal.description}</p>

      {proposal.jurisdiction && (
        <p className="mt-2 text-sm text-stone-500">
          所管(自動判定・要確認): {proposal.jurisdiction.authorityName}
        </p>
      )}

      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-semibold text-emerald-900">
            署名 {proposal.signatures.length} / {proposal.signatureTarget} 筆
          </span>
          <span className="text-sm text-emerald-700">{progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-emerald-200 overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {alreadySigned ? (
          <p className="mt-4 text-sm text-emerald-800 font-medium">✅ あなたはすでに署名しています</p>
        ) : (
          <form action={signProposal} className="mt-4">
            <input type="hidden" name="proposalId" value={proposal.id} />
            <button
              type="submit"
              className="rounded-full bg-emerald-700 text-white font-semibold px-6 py-2 hover:bg-emerald-800 transition-colors"
            >
              {user ? "この提案に署名する" : "ログインして署名する"}
            </button>
          </form>
        )}
      </div>

      {proposal.score && (
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900 mb-2">優先度スコア(参考値)</h2>
          <p className="text-xs text-stone-500 mb-3">
            署名達成度とオープンデータ由来の簡易指標から算出しています(docs/03-external-integration.mdの実データ連携が完了するまでは仮の指標です)。
          </p>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-2xl font-bold text-emerald-800">
                {proposal.score.totalScore.toFixed(1)}
              </div>
              <div className="text-stone-500">合計スコア</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-stone-700">
                {proposal.score.signatureScore.toFixed(1)}
              </div>
              <div className="text-stone-500">署名スコア(最大70)</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-stone-700">
                {proposal.score.openDataScore.toFixed(1)}
              </div>
              <div className="text-stone-500">オープンデータスコア(最大30)</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900 mb-3">進捗履歴</h2>
        <ol className="space-y-2 text-sm">
          {proposal.statusHistory.map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-stone-700">
              <span className="text-stone-400">
                {new Date(h.changedAt).toLocaleDateString("ja-JP")}
              </span>
              <span>
                {h.fromStatus
                  ? `${PROPOSAL_STATUS_LABELS[h.fromStatus as ProposalStatus]} → ${PROPOSAL_STATUS_LABELS[h.toStatus as ProposalStatus]}`
                  : `${PROPOSAL_STATUS_LABELS[h.toStatus as ProposalStatus]}(投稿)`}
              </span>
              <span className="text-stone-400">by {h.changedByUser.displayName}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
