"use client";

import { useRef, useState } from "react";
import { createProposal } from "./actions";
import LocationPicker from "@/components/LocationPicker";
import {
  PROPOSAL_CATEGORIES,
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  PROPOSAL_CATEGORY_ICON,
  LAND_TYPES,
  LAND_TYPE_LABELS,
  ProposalCategory,
} from "@/lib/enums";

const DEFAULT_POS = { lat: 35.6438, lng: 139.6688 };

export default function NewProposalPage() {
  const [pos, setPos] = useState(DEFAULT_POS);
  const [category, setCategory] = useState<ProposalCategory>("park_facility");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-forest-950 mb-2">
        まちの「みどり」について、思うことは？
      </h1>
      <p className="text-sm text-stone-600 mb-1">
        思いついたことをそのまま書いてみてください。1分で投稿できます。
      </p>
      <p className="text-xs text-stone-500 mb-8">
        すぐに実現するとは限りませんが、声が集まるほど検討される可能性は高くなります。まずは気軽に届けてみましょう。
      </p>

      <form action={createProposal} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-stone-700">どんなジャンル?</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PROPOSAL_CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-medium transition-colors ${
                    active ? "text-white" : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  }`}
                  style={active ? { backgroundColor: PROPOSAL_CATEGORY_COLOR[c], borderColor: PROPOSAL_CATEGORY_COLOR[c] } : undefined}
                >
                  <span className="text-lg">{PROPOSAL_CATEGORY_ICON[c]}</span>
                  {PROPOSAL_CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="category" value={category} />
          <p className="text-xs text-stone-400 mt-2">
            「緑を増やす」提案(植樹・緑化)だけでなく、「樹木管理(伐採・剪定支援)」のような、緑を適切に保つための支援要望も受け付けています。
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700">ひとことで言うと</label>
          <input
            name="title"
            required
            maxLength={80}
            placeholder="例：〇〇公園に日よけ付きベンチがほしい"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700">もう少し詳しく(気軽でOK)</label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="なんでそう思ったか、どんなふうになったら嬉しいか、思いつくままにどうぞ"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700">
            写真 <span className="font-normal text-stone-400">(あれば。あとから追加はできません)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="w-full h-48 object-cover rounded-xl border border-stone-200" />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-1"
              >
                削除
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 w-full h-32 rounded-xl border-2 border-dashed border-stone-300 text-stone-400 text-sm hover:border-forest-400 hover:text-forest-500 transition-colors"
            >
              <span className="text-2xl">📷</span>
              写真を選ぶ
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700">
            そこは公有地?私有地? <span className="font-normal text-stone-400">(わからなければ「わからない」でOK、あとで確認します)</span>
          </label>
          <select
            name="landType"
            required
            className="w-full rounded-xl border border-stone-300 px-4 py-3 bg-white focus:border-forest-500 focus:outline-none"
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
          <label className="block text-sm font-medium mb-1 text-stone-700">場所</label>
          <LocationPicker value={pos} onChange={setPos} />
          <input type="hidden" name="lat" value={pos.lat} />
          <input type="hidden" name="lng" value={pos.lng} />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-full bg-clay-500 text-white font-semibold py-3.5 hover:bg-clay-600 transition-colors"
          >
            この声を届ける
          </button>
          <p className="text-xs text-stone-400 text-center mt-2">
            投稿後の内容修正はできません(削除は行政ダッシュボード経由)。まずは肩の力を抜いて投稿してみてください。
          </p>
        </div>
      </form>
    </div>
  );
}
