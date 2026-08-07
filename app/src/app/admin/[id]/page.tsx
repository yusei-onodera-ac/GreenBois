import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { changeStatus } from "./actions";
import {
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_STATUS_LABELS,
  LAND_TYPE_LABELS,
  STATUS_TRANSITIONS,
  ProposalCategory,
  ProposalStatus,
  LandType,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function AdminProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/dev-login");
  if (user.userType !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-stone-600">
        このページは行政職員アカウントのみ閲覧できます。
      </div>
    );
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      user: true,
      signatures: true,
      jurisdiction: true,
      score: true,
      statusHistory: { include: { changedByUser: true }, orderBy: { changedAt: "asc" } },
      greenAgreement: true,
    },
  });
  if (!proposal) notFound();

  const nextStatuses = STATUS_TRANSITIONS[proposal.status as ProposalStatus];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-forest-700 hover:underline">
        ← ダッシュボードに戻る
      </Link>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-forest-100 text-forest-800 px-2 py-0.5 font-medium">
          {PROPOSAL_CATEGORY_LABELS[proposal.category as ProposalCategory] ?? proposal.category}
        </span>
        <span className="rounded-full bg-stone-100 text-stone-700 px-2 py-0.5 font-medium">
          {PROPOSAL_STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status}
        </span>
        <span className="text-stone-500">
          {LAND_TYPE_LABELS[proposal.landType as LandType] ?? proposal.landType}
        </span>
      </div>

      <h1 className="font-display text-2xl font-semibold text-forest-950 mt-2">{proposal.title}</h1>
      <p className="text-sm text-stone-500 mt-1">
        投稿者: <span className="font-medium text-stone-700">{proposal.user.displayName}</span>
        <span className="text-stone-400"> ({proposal.user.handle})</span>
        {" "}／ 位置: {proposal.lat.toFixed(5)}, {proposal.lng.toFixed(5)}
      </p>
      <p className="mt-4 text-stone-800 whitespace-pre-wrap">{proposal.description}</p>

      {proposal.jurisdiction && (
        <p className="mt-2 text-sm text-stone-500">
          所管: {proposal.jurisdiction.authorityName}(判定方法: {proposal.jurisdiction.determinationMethod})
        </p>
      )}

      {proposal.greenAgreement && (
        <p className="mt-1 text-sm text-stone-500">
          緑地協定: 最低{proposal.greenAgreement.minimumYears}年継続
          {proposal.greenAgreement.agreedAt ? "(締結済み)" : "(未締結)"}
        </p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-forest-800">
            {proposal.score?.totalScore.toFixed(1) ?? "-"}
          </div>
          <div className="text-xs text-stone-500">優先度スコア</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-stone-700">
            {proposal.signatures.length} / {proposal.signatureTarget}
          </div>
          <div className="text-xs text-stone-500">署名数</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-stone-700">
            {proposal.score?.openDataScore.toFixed(1) ?? "-"}
          </div>
          <div className="text-xs text-stone-500">オープンデータスコア</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-forest-200 bg-forest-50 p-5">
        <h2 className="font-semibold text-forest-900 mb-3">ステータス変更</h2>
        {nextStatuses.length === 0 ? (
          <p className="text-sm text-stone-500">これ以上のステータス変更はできません(終端状態)。</p>
        ) : (
          <form action={changeStatus} className="flex flex-wrap gap-2">
            <input type="hidden" name="proposalId" value={proposal.id} />
            {nextStatuses.map((s) => (
              <button
                key={s}
                type="submit"
                name="toStatus"
                value={s}
                className="rounded-full bg-forest-700 text-white text-sm font-medium px-4 py-2 hover:bg-forest-800"
              >
                「{PROPOSAL_STATUS_LABELS[s]}」に変更
              </button>
            ))}
          </form>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900 mb-3">進捗履歴</h2>
        <ol className="space-y-2 text-sm">
          {proposal.statusHistory.map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-stone-700">
              <span className="text-stone-400">
                {new Date(h.changedAt).toLocaleString("ja-JP")}
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
