"use client";

import { useState } from "react";
import ProposalThumb from "./ProposalThumb";

// 提案詳細ページの写真ギャラリー(最大5枚、NewProposalForm.tsx参照)。
// メイン画像+サムネイル一覧で、クリックでメイン画像を切り替える。
// 写真が0枚(旧データ等)の場合はProposalThumbのカテゴリプレースホルダーにフォールバックする。
export default function PhotoGallery({
  photos,
  category,
}: {
  photos: { url: string }[];
  category: string;
}) {
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return <ProposalThumb category={category} className="h-64 w-full rounded-sm" />;
  }

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[selected]?.url ?? photos[0].url}
        alt=""
        className="h-64 w-full rounded-sm border border-slate-200 object-cover"
      />
      {photos.length > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setSelected(i)}
              className={`aspect-square overflow-hidden rounded-sm border-2 transition-colors ${
                i === selected ? "border-forest-600" : "border-transparent hover:border-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
