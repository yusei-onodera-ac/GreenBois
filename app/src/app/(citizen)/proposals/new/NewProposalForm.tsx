"use client";

import { useRef, useState } from "react";
import { createProposal } from "./actions";
import LocationPicker, { type PublicSite } from "@/components/LocationPicker";
import CategoryIcon from "@/components/CategoryIcon";
import { CameraIcon } from "@/components/icons";
import {
  PROPOSAL_CATEGORIES,
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  ProposalCategory,
} from "@/lib/enums";

const DEFAULT_POS = { lat: 35.6438, lng: 139.6688 };
const MAX_PHOTOS = 5;

// 新規提案は公有地(公園等)に限定するため、私有地緑化は選択肢から外す
// (既存の私有地提案データは行政ダッシュボード等に残したまま、新規作成のみ制限する)。
const CREATABLE_CATEGORIES = PROPOSAL_CATEGORIES.filter((c) => c !== "private_greening");

// 行政の申請フォームによくある「手順が見える」番号付きラベル。
function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-700">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white text-[11px] font-semibold">
        {n}
      </span>
      {children}
    </label>
  );
}

export default function NewProposalForm({ sites }: { sites: PublicSite[] }) {
  const [pos, setPos] = useState(DEFAULT_POS);
  const [category, setCategory] = useState<ProposalCategory>("park_facility");
  const [landType, setLandType] = useState<string | null>(null);
  const [ward, setWard] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // React側で管理しているphotosを、実際に送信されるnative <input type="file">の
  // FileListへ同期する(サーバーアクションはformDataをそのまま読むため、
  // 「追加」「削除」してもinput.filesが常に最新の状態と一致している必要がある)。
  function syncPhotos(files: File[]) {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    const next = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos(next);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  }

  function handleFilesSelected(fileList: FileList | null) {
    const newFiles = Array.from(fileList ?? []);
    if (newFiles.length === 0) return;
    // 「写真を選ぶ」を複数回押しても追加できるよう、既存分と合算して最大5枚に切り詰める
    // (ネイティブのfile inputは選び直すと選択がリセットされる仕様のため)。
    const combined = [...photos.map((p) => p.file), ...newFiles].slice(0, MAX_PHOTOS);
    syncPhotos(combined);
  }

  function removePhoto(index: number) {
    syncPhotos(photos.map((p) => p.file).filter((_, i) => i !== index));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-forest-950 mb-2">
        まちの「みどり」について、思うことは？
      </h1>
      <p className="text-sm text-slate-600 mb-1">
        思いついたことをそのまま書いてみてください。1分で投稿できます。
      </p>
      <p className="text-xs text-slate-500 mb-8">
        すぐに実現するとは限りませんが、声が集まるほど検討される可能性は高くなります。
      </p>

      <form action={createProposal} className="space-y-6">
        <div>
          <StepLabel n={1}>どんなジャンル?</StepLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CREATABLE_CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 rounded-sm border-2 px-2 py-3 text-xs font-medium transition-colors ${
                    active ? "text-white" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                  style={active ? { backgroundColor: PROPOSAL_CATEGORY_COLOR[c], borderColor: PROPOSAL_CATEGORY_COLOR[c] } : undefined}
                >
                  <CategoryIcon category={c} className="h-5 w-5" />
                  {PROPOSAL_CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="category" value={category} />
          <p className="text-xs text-slate-400 mt-2">
            「緑を増やす」提案(植樹・緑化)だけでなく、「樹木管理(伐採・剪定支援)」のような、緑を適切に保つための支援要望も受け付けています。
          </p>
        </div>

        <div>
          <StepLabel n={2}>ひとことで言うと</StepLabel>
          <input
            name="title"
            required
            maxLength={80}
            placeholder="例：〇〇公園に日よけ付きベンチがほしい"
            className="w-full rounded-sm border border-slate-300 px-4 py-3 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-100"
          />
        </div>

        <div>
          <StepLabel n={3}>もう少し詳しく</StepLabel>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="なんでそう思ったか、どんなふうになったら嬉しいか、思いつくままにどうぞ"
            className="w-full rounded-sm border border-slate-300 px-4 py-3 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-100"
          />
        </div>

        <div>
          <StepLabel n={4}>
            写真{" "}
            <span className="font-normal text-slate-400">
              (必須。1〜{MAX_PHOTOS}枚まで。あとから追加はできません)
            </span>
          </StepLabel>
          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((p, i) => (
              <div key={p.url} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover rounded-sm border border-slate-200" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 rounded-sm bg-forest-900/80 text-white text-[10px] px-1.5 py-0.5">
                    サムネイル
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 rounded-sm bg-black/60 text-white text-xs h-5 w-5 flex items-center justify-center"
                  aria-label="削除"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed border-slate-300 text-slate-400 text-xs hover:border-forest-400 hover:text-forest-500 transition-colors"
              >
                <CameraIcon className="h-5 w-5" />
                {photos.length === 0 ? "写真を選ぶ" : "追加する"}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {photos.length}/{MAX_PHOTOS}枚選択中。1枚目がカード等のサムネイルに使われます。
          </p>
        </div>

        <div>
          <StepLabel n={5}>
            場所 <span className="font-normal text-slate-400">(区市を選ぶと施設名の候補が出ます)</span>
          </StepLabel>
          <LocationPicker
            value={pos}
            onChange={setPos}
            sites={sites}
            onLandTypeResolved={setLandType}
            onWardResolved={setWard}
          />
          <input type="hidden" name="lat" value={pos.lat} />
          <input type="hidden" name="lng" value={pos.lng} />
          <input type="hidden" name="landType" value={landType ?? ""} />
          {/* F9本格版:管轄自動判定(施設/道路の近傍一致→区フォールバック)に使う。
              GSI逆ジオコーディングで自動取得されるため通常は入力不要。 */}
          <input type="hidden" name="ward" value={ward ?? ""} />
          <p className="text-xs text-slate-400 mt-1">
            現在、新規のご提案は公園・図書館・道路など、都・区市町村が管理する公有地を対象としています。
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!landType || photos.length === 0}
            className="w-full rounded-sm bg-forest-700 text-white font-semibold py-3.5 hover:bg-forest-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            この声を届ける
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">
            {landType && photos.length > 0
              ? "投稿後の内容修正はできません(削除は行政ダッシュボード経由)。"
              : photos.length === 0
                ? "上の「写真」を選ぶと投稿できるようになります。"
                : "上の「場所」で区市・施設名または検索から場所を選ぶと投稿できるようになります。"}
          </p>
        </div>
      </form>
    </div>
  );
}
