"use client";

import { useState } from "react";
import { createProposal } from "./actions";
import LocationPicker from "@/components/LocationPicker";
import { PROPOSAL_CATEGORIES, PROPOSAL_CATEGORY_LABELS, LAND_TYPES, LAND_TYPE_LABELS } from "@/lib/enums";

const DEFAULT_POS = { lat: 35.6438, lng: 139.6688 };

export default function NewProposalPage() {
  const [pos, setPos] = useState(DEFAULT_POS);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-emerald-900 mb-2">提案を投稿する</h1>
      <p className="text-sm text-stone-600 mb-6">
        公園設備の要望や私有地緑化の提案を投稿できます。投稿後、近隣住民からの署名を集めることができます。
      </p>

      <form action={createProposal} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">カテゴリ</label>
          <select
            name="category"
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 bg-white"
            defaultValue="bench"
          >
            {PROPOSAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PROPOSAL_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">タイトル</label>
          <input
            name="title"
            required
            maxLength={80}
            placeholder="例：〇〇公園に日よけ付きベンチを設置してほしい"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="なぜ必要か、どんな効果が期待できるかを書いてください"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">土地区分(自己申告・後で管轄側が確認します)</label>
          <select
            name="landType"
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 bg-white"
            defaultValue="unknown"
          >
            {LAND_TYPES.map((t) => (
              <option key={t} value={t}>
                {LAND_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">場所</label>
          <LocationPicker value={pos} onChange={setPos} />
          <input type="hidden" name="lat" value={pos.lat} />
          <input type="hidden" name="lng" value={pos.lng} />
          <p className="text-xs text-stone-500 mt-1">
            緯度 {pos.lat.toFixed(5)} / 経度 {pos.lng.toFixed(5)}
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-emerald-700 text-white font-semibold py-3 hover:bg-emerald-800 transition-colors"
        >
          投稿する
        </button>
      </form>
    </div>
  );
}
