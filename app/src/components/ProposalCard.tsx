import Link from "next/link";
import ProposalThumb from "./ProposalThumb";
import CategoryIcon from "./CategoryIcon";
import StatusBadge from "./StatusBadge";
import { PROPOSAL_CATEGORY_LABELS, PROPOSAL_CATEGORY_COLOR, ProposalCategory } from "@/lib/enums";

export type CardProposal = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  signatureCount: number;
  photoUrl?: string | null;
};

// マップ(カルーセル)・一覧(グリッド)・マイページ(リスト)で共有する提案カード。
// variantで幅/内側余白のみ変え、バッジ・タイポグラフィは統一する。
export default function ProposalCard({
  p,
  variant = "grid",
}: {
  p: CardProposal;
  variant?: "grid" | "carousel";
}) {
  const isCarousel = variant === "carousel";
  return (
    <Link
      href={`/proposals/${p.id}`}
      prefetch={false}
      className={`block overflow-hidden rounded-sm border border-slate-200 bg-white hover:border-forest-400 transition-colors ${
        isCarousel ? "w-[calc(25%-0.75rem)] min-w-[220px] shrink-0 snap-start" : ""
      }`}
    >
      <ProposalThumb photoUrl={p.photoUrl} category={p.category} className={isCarousel ? "h-32 w-full" : "h-36 w-full"} />
      <div className={isCarousel ? "p-5" : "p-4"}>
        <div className="flex items-center justify-between gap-1.5 text-xs mb-2.5">
          <span
            className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-medium text-white"
            style={{ backgroundColor: PROPOSAL_CATEGORY_COLOR[p.category as ProposalCategory] ?? "#6b7280" }}
          >
            <CategoryIcon category={p.category} className="h-3 w-3" />
            {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
          </span>
          <StatusBadge status={p.status} />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1.5 line-clamp-2 leading-snug">{p.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
        <div className="mt-3 text-xs text-slate-500">署名 {p.signatureCount}筆</div>
      </div>
    </Link>
  );
}
