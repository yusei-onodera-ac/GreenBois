"use client";

import { useState } from "react";
import { PROPOSAL_CATEGORY_COLOR, ProposalCategory } from "@/lib/enums";
import CategoryIcon from "./CategoryIcon";

// 提案の写真表示エリア。アップロード済み/シード投入済みの写真があればそれを表示し、
// 画像が無い・読み込みに失敗した場合はカテゴリ色+アイコンのプレースホルダー
// バナーにフォールバックする(意匠的なバナーであり実写真ではないと一目でわかる)。
export default function ProposalThumb({
  photoUrl,
  category,
  className = "",
}: {
  photoUrl?: string | null;
  category: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const color = PROPOSAL_CATEGORY_COLOR[category as ProposalCategory] ?? "#6b7280";

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={`object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${color}33, ${color}14)`, color }}
    >
      <CategoryIcon category={category} className="h-10 w-10 opacity-80" />
    </div>
  );
}
