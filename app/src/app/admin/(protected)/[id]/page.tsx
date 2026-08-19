import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { changeStatus } from "./actions";
import PhotoGallery from "@/components/PhotoGallery";
import StatusBadge from "@/components/StatusBadge";
import StatusStepper from "@/components/StatusStepper";
import DeterminationBadge from "@/components/DeterminationBadge";
import ProposalLocationMap from "@/components/ProposalLocationMap";
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

// 認証・権限チェックは親の admin/(protected)/layout.tsx で行っているため、
// ここに到達する時点で user は行政職員アカウントであることが保証されている。
export default async function AdminProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 情報フローは docs/06-admin-data-flow.md 参照。行政向けは本名まで見せる一方、
  // 署名者個人の情報は(都民・行政どちらにも)一切渡さないよう select で絞り込む。
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      user: { select: { displayName: true, handle: true } },
      signatures: { select: { id: true } },
      jurisdiction: true,
      score: true,
      statusHistory: {
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          changedAt: true,
          changedByUser: { select: { displayName: true } },
        },
        orderBy: { changedAt: "asc" },
      },
      greenAgreement: true,
      attachments: true,
      notificationLogs: {
        include: { authority: { select: { name: true, category: true, ward: true, contactEmail: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!proposal) notFound();

  // 管轄の絞り込み: 全域担当(authorityId無し)以外は、自分の管轄外の提案を閲覧できない
  // (行政ダッシュボード一覧側の絞り込みと同じルール。直接URLでのアクセスも防ぐ)。
  const user = await getCurrentUser();
  const scopedAuthorityId = user?.adminRole?.authorityId ?? null;
  if (scopedAuthorityId && proposal.jurisdiction?.authorityId !== scopedAuthorityId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-stone-600">
        この提案はあなたの管轄外です(担当: {user?.adminRole?.jurisdictionScope})。
        <div className="mt-3">
          <Link href="/admin" className="text-forest-700 hover:underline">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  const nextStatuses = STATUS_TRANSITIONS[proposal.status as ProposalStatus];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-forest-700 hover:underline">
        ← ダッシュボードに戻る
      </Link>

      <div className="mt-4">
        <PhotoGallery photos={proposal.attachments} category={proposal.category} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="rounded-sm bg-forest-100 text-forest-800 px-2 py-0.5 font-medium">
          {PROPOSAL_CATEGORY_LABELS[proposal.category as ProposalCategory] ?? proposal.category}
        </span>
        <StatusBadge status={proposal.status} />
        <span className="text-stone-500">
          {LAND_TYPE_LABELS[proposal.landType as LandType] ?? proposal.landType}
        </span>
      </div>

      <h1 className="font-display text-2xl font-semibold text-forest-950 mt-2">{proposal.title}</h1>
      <p className="text-sm text-stone-500 mt-1">
        投稿者: <span className="font-medium text-stone-700">{proposal.user.displayName}</span>
        <span className="text-stone-400"> ({proposal.user.handle})</span>
      </p>
      <p className="mt-4 text-stone-800 whitespace-pre-wrap">{proposal.description}</p>

      {proposal.jurisdiction && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
          所管: {proposal.jurisdiction.authorityName}
          <DeterminationBadge method={proposal.jurisdiction.determinationMethod} />
        </p>
      )}

      {proposal.greenAgreement && (
        <p className="mt-1 text-sm text-stone-500">
          緑地協定: 最低{proposal.greenAgreement.minimumYears}年継続
          {proposal.greenAgreement.agreedAt ? "(締結済み)" : "(未締結)"}
        </p>
      )}

      {/* --- 場所(正確な位置をピンで表示。閲覧専用・移動不可) --- */}
      <div className="mt-4 rounded-sm border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">
          場所({proposal.lat.toFixed(5)}, {proposal.lng.toFixed(5)})
        </h2>
        <ProposalLocationMap lat={proposal.lat} lng={proposal.lng} className="h-56" />
      </div>

      {/* スコア3種は1つの枠にまとめ、内部を区切り線で分ける(以前は個別3枚のカードで
          同じ重みに見えていたが、これは1セットの数値であって3つの独立した判断材料ではない)。 */}
      <div className="mt-6 grid grid-cols-3 divide-x divide-stone-200 rounded-sm border border-stone-200 bg-white">
        <div className="p-4 text-center">
          <div className="text-2xl font-bold text-forest-800">
            {proposal.score?.totalScore.toFixed(1) ?? "-"}
          </div>
          <div className="text-xs text-stone-500">優先度スコア</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-bold text-stone-700">
            {proposal.signatures.length} / {proposal.signatureTarget}
          </div>
          <div className="text-xs text-stone-500">署名数</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-bold text-stone-700">
            {proposal.score?.openDataScore.toFixed(1) ?? "-"}
          </div>
          <div className="text-xs text-stone-500">オープンデータスコア</div>
        </div>
      </div>

      {/* 「今どこまで進んでいるか」と「次に何ができるか」は1つの流れなので、
          進捗状況とステータス変更を1枚のカードにまとめ、最も目立つ緑カードにする
          (このページで行政職員が実際に手を動かす、唯一のアクションのため)。 */}
      <div className="mt-6 rounded-sm border border-forest-200 bg-forest-50 p-5">
        <h2 className="font-semibold text-forest-900 mb-4">進捗状況</h2>
        <StatusStepper status={proposal.status} />

        <div className="mt-5 pt-5 border-t border-forest-200">
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
                  className="rounded-sm bg-forest-700 text-white text-sm font-medium px-4 py-2 hover:bg-forest-800"
                >
                  「{PROPOSAL_STATUS_LABELS[s]}」に変更
                </button>
              ))}
            </form>
          )}
        </div>
      </div>

      {/* 通知ログ・進捗履歴はどちらも読み取り専用の補助情報なので、白カードではなく
          軽量なstone背景の1枠にまとめ、主要アクション(上の緑カード)より控えめに見せる。 */}
      <div className="mt-6 rounded-sm border border-stone-200 bg-stone-50 p-5">
        {/* 「将来、管轄先へ自動でメール送信したい」の土台。実送信(SMTP等)は未実装のため、
            誰宛に何を送る予定かのログを表示するのみ(送信ボタンは置かない)。 */}
        <h2 className="text-sm font-semibold text-stone-700 mb-1">送信予定(通知ログ)</h2>
        <p className="text-xs text-stone-400 mb-3">
          実際のメール送信は未実装です。ここには「本来なら誰に通知するか」の記録のみ表示しています。
        </p>
        {proposal.notificationLogs.length === 0 ? (
          <p className="text-sm text-stone-500">送信予定はありません(管轄が未確定のため)。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {proposal.notificationLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-2 text-stone-700">
                <span className="rounded-sm bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  {log.status === "planned" ? "送信予定" : log.status}
                </span>
                <span>{log.authority?.name ?? "(宛先未確定)"}</span>
                {log.authority?.contactEmail && (
                  <span className="text-stone-400 text-xs">({log.authority.contactEmail})</span>
                )}
                <span className="text-stone-400 text-xs ml-auto">
                  {new Date(log.createdAt).toLocaleString("ja-JP")}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="text-sm font-semibold text-stone-700 mb-3 mt-5 pt-5 border-t border-stone-200">
          進捗履歴
        </h2>
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
