"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MaplibreMap, Marker, Popup, NavigationControl, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getOsmMapStyle, getGsiPhotoStyle } from "@/lib/mapStyle";
import { TOKYO_WARDS, MUNI_CD_TO_WARD } from "@/lib/tokyoWards";
import { pickNearestByPriority } from "@/lib/geo";

const DEFAULT_CENTER: [number, number] = [139.6688, 35.6438];

// ピン位置がこの範囲内にsitesの施設・道路を見つけたら、区・施設名欄を自動入力する
// (検索・クリック・ドラッグいずれの操作でも一貫して働く)。
// 以前は200mだったが、誤差の許容度が高すぎて離れた場所でも施設に判定されてしまう
// (かつ道路が密な公園データに埋もれる)問題があったため80mに縮小し、
// 種別優先度つきの判定(pickNearestByPriority、src/lib/geo.ts)に切り替えた。
const SITE_AUTO_MATCH_RADIUS_M = 80;
// 住所検索(GSI・全国対応)の結果は東京都内に限定する(他県の同名住所が混ざるのを防ぐ)。
const TOKYO_PREFIX = "東京都";

// 国土地理院(GSI)の住所検索API。APIキー不要・無償(住所・地名のジオコーディング)
// https://msearch.gsi.go.jp/address-search/AddressSearch?q=...
type GsiSearchResult = {
  geometry: { coordinates: [number, number] };
  properties: { title: string };
};

// 国土地理院(GSI)の逆ジオコーディングAPI。緯度経度→町丁目名(市区町村コード付き)。
// https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=...&lon=...
type GsiReverseResult = {
  results?: { muniCd: string; lv01Nm: string };
};

// 都・区市町村が管理する公共施設・道路(公園・図書館・道路等)。
export type PublicSite = {
  id: string;
  name: string;
  ward: string;
  lat: number;
  lng: number;
  landType: string;
  kind: string;
};

export default function LocationPicker({
  value,
  onChange,
  sites = [],
  onLandTypeResolved,
  onWardResolved,
}: {
  value: { lat: number; lng: number };
  onChange: (pos: { lat: number; lng: number }) => void;
  // 指定すると「区から選ぶ」の下に、その区に属する施設名の予測変換入力を表示する
  // (新規提案の対象を都・区市町村が管理する公有地に限定するためのフロー。
  // src/app/(citizen)/proposals/new)。
  sites?: PublicSite[];
  onLandTypeResolved?: (landType: string) => void;
  // ピンの位置が決まるたびにGSI逆ジオコーディングで取得する区名を呼び出し元へ渡す
  // (F9本格版の管轄自動判定で「どの区か」を使うため。src/lib/jurisdiction.ts参照)。
  onWardResolved?: (ward: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const addressRequestIdRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onWardResolvedRef = useRef(onWardResolved);
  const onLandTypeResolvedRef = useRef(onLandTypeResolved);
  const sitesRef = useRef(sites);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GsiSearchResult[]>([]);
  const [siteSearchResults, setSiteSearchResults] = useState<PublicSite[]>([]);

  const [selectedWard, setSelectedWard] = useState("");
  const [siteQuery, setSiteQuery] = useState("");
  // ピンが今どの施設・道路を指しているか(見つからなければnull)。
  // マップ下に「現在ピンが指している施設」として常に見える形で表示する。
  const [matchedSite, setMatchedSite] = useState<PublicSite | null>(null);
  const [matchAttempted, setMatchAttempted] = useState(false);
  // 既定は地名・施設名ラベルが見やすいOSM地図。GSIの航空写真(衛星写真相当)にも切り替えられる。
  const [mapMode, setMapMode] = useState<"map" | "photo">("map");
  const wardSites = useMemo(
    () => sites.filter((s) => s.ward === selectedWard),
    [sites, selectedWard]
  );
  const wardsWithSites = useMemo(
    () => TOKYO_WARDS.filter((w) => sites.some((s) => s.ward === w.name)),
    [sites]
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onWardResolvedRef.current = onWardResolved;
  }, [onWardResolved]);

  useEffect(() => {
    onLandTypeResolvedRef.current = onLandTypeResolved;
  }, [onLandTypeResolved]);

  useEffect(() => {
    sitesRef.current = sites;
  }, [sites]);

  // ピン位置から最寄りのsites(公園・図書館・道路)を探す(範囲外・候補無しはnull)。
  // クリック/ドラッグ/検索いずれの操作後もこれを呼び、区・施設名欄を自動入力する。
  function findNearbySite(lat: number, lng: number): PublicSite | null {
    return pickNearestByPriority({ lat, lng }, sitesRef.current, SITE_AUTO_MATCH_RADIUS_M);
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  }

  const KIND_LABEL: Record<string, string> = { park: "公園", library: "図書館", road: "道路", other: "施設" };

  // ピン(施設名欄)の上に出す吹き出しHTMLを組み立てる。
  // 近くに既知の施設・道路(nearby)があれば、その名前を一番目立つ1行目に必ず出す
  // (「ピンを指したら施設名が自動でセットされる」ことが見た目でもわかるようにする)。
  function buildPopupHtml(nearby: PublicSite | null, addressLine: string | null) {
    const nameLine = nearby
      ? `<div style="font-size:13px;font-weight:700;color:#1b4332;">📍 ${escapeHtml(nearby.name)}<span style="font-weight:400;color:#6b7280;">(${KIND_LABEL[nearby.kind] ?? "施設"})</span></div>`
      : "";
    const addrLine = addressLine
      ? `<div style="font-size:11px;color:#78716c;margin-top:${nearby ? "2px" : "0"};">${escapeHtml(addressLine)}</div>`
      : "";
    if (!nameLine && !addrLine) {
      return '<div style="font-size:12px;padding:2px 4px;color:#a8a29e;">この場所には対象の施設が見つかりませんでした</div>';
    }
    return `<div style="padding:3px 6px;">${nameLine}${addrLine}</div>`;
  }

  // ピンの位置が決まるたびに、近くに既知の施設・道路(sites)があればその名前を
  // 区・施設名欄とピン上の吹き出しに自動セットする(無ければクリアする)。
  // あわせてGSI逆ジオコーディングAPIで住所(区+町丁目)も取得し、吹き出しに補足表示する。
  async function updateAddressLabel(lat: number, lng: number) {
    const nearby = findNearbySite(lat, lng);
    setMatchedSite(nearby);
    setMatchAttempted(true);
    if (nearby) {
      setSelectedWard(nearby.ward);
      setSiteQuery(nearby.name);
      onLandTypeResolvedRef.current?.(nearby.landType);
    } else {
      setSiteQuery("");
      onLandTypeResolvedRef.current?.("");
    }

    if (!mapRef.current) return;
    if (!popupRef.current) {
      popupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 20, anchor: "bottom" });
    }
    const popup = popupRef.current;
    // 施設名がわかっていれば、住所取得を待たずに即座に表示する(体感速度優先)。
    popup.setLngLat([lng, lat]).setHTML(
      nearby ? buildPopupHtml(nearby, "住所を取得中…") : '<div style="font-size:12px;padding:2px 4px;color:#57534e;">住所を取得中…</div>'
    );
    if (!popup.isOpen()) popup.addTo(mapRef.current);

    const requestId = ++addressRequestIdRef.current;
    try {
      const res = await fetch(
        `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${lat}&lon=${lng}`
      );
      if (!res.ok) throw new Error("reverse geocode failed");
      const data: GsiReverseResult = await res.json();
      if (requestId !== addressRequestIdRef.current) return; // 新しいリクエストが走っていれば結果を捨てる
      if (data.results) {
        const ward = MUNI_CD_TO_WARD[data.results.muniCd] ?? "";
        popup.setHTML(buildPopupHtml(nearby, `${ward}${data.results.lv01Nm}`));
        onWardResolvedRef.current?.(ward || null);
      } else {
        popup.setHTML(buildPopupHtml(nearby, nearby ? null : "住所を取得できませんでした"));
        onWardResolvedRef.current?.(null);
      }
    } catch {
      if (requestId !== addressRequestIdRef.current) return;
      popup.setHTML(buildPopupHtml(nearby, nearby ? null : "住所を取得できませんでした"));
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: getOsmMapStyle(),
      center: [value.lng || DEFAULT_CENTER[0], value.lat || DEFAULT_CENTER[1]],
      zoom: 14,
    });
    map.addControl(new NavigationControl(), "top-right");

    const marker = new Marker({ draggable: true, color: "#2d6a4f" })
      .setLngLat([value.lng || DEFAULT_CENTER[0], value.lat || DEFAULT_CENTER[1]])
      .addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onChangeRef.current({ lat: pos.lat, lng: pos.lng });
      updateAddressLabel(pos.lat, pos.lng);
    });

    map.on("click", (e: MapMouseEvent) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      updateAddressLabel(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMapMode() {
    const next = mapMode === "map" ? "photo" : "map";
    setMapMode(next);
    // setStyleはレイヤー/ソースだけを差し替える(Marker/PopupはDOM要素として
    // 地図とは別に重ねているため、スタイル切り替えの影響を受けず消えない)。
    mapRef.current?.setStyle(next === "map" ? getOsmMapStyle() : getGsiPhotoStyle());
  }

  function moveTo(lat: number, lng: number, zoom = 15) {
    markerRef.current?.setLngLat([lng, lat]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom });
    onChangeRef.current({ lat, lng });
    updateAddressLabel(lat, lng);
  }

  // 施設(sites)を1件選択する共通処理。ワード選択・施設名入力・検索のどこから来ても
  // 区・施設名欄とピン位置・土地種別を一致させる。
  function selectSite(site: PublicSite) {
    setSelectedWard(site.ward);
    setSiteQuery(site.name);
    moveTo(site.lat, site.lng);
    onLandTypeResolvedRef.current?.(site.landType);
  }

  function handleWardSelect(name: string) {
    setSelectedWard(name);
    setSiteQuery("");
    const ward = TOKYO_WARDS.find((w) => w.name === name);
    if (ward) moveTo(ward.lat, ward.lng, 13);
  }

  function handleSiteQueryChange(name: string) {
    setSiteQuery(name);
    const site = wardSites.find((s) => s.name === name);
    if (site) selectSite(site);
  }

  // 検索は「自前の施設データ(sites)名での一致」を優先する
  // (公園・図書館・道路の名称は国土地理院の住所検索に載っていないことが多く、
  // またsitesは元々東京都のオープンデータなので都内に限定されているため確実)。
  // 一致が無ければGSIの住所検索(全国対応)にフォールバックするが、結果は
  // 「東京都」で始まる住所のみに絞り、他県の同名地名が混ざらないようにする。
  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSiteSearchResults([]);

    const siteMatches = sitesRef.current.filter((s) => s.name.includes(q));
    if (siteMatches.length === 1) {
      selectSite(siteMatches[0]);
      setSearching(false);
      return;
    }
    if (siteMatches.length > 1) {
      setSiteSearchResults(siteMatches.slice(0, 8));
      setSearching(false);
      return;
    }

    try {
      const res = await fetch(
        `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error("検索リクエストに失敗しました");
      const data: GsiSearchResult[] = await res.json();
      const tokyoOnly = data.filter((r) => r.properties.title.startsWith(TOKYO_PREFIX));
      if (tokyoOnly.length === 0) {
        setSearchError("東京都内で該当する施設・住所が見つかりませんでした。キーワードを変えてお試しください。");
      } else if (tokyoOnly.length === 1) {
        const [lng, lat] = tokyoOnly[0].geometry.coordinates;
        moveTo(lat, lng);
      } else {
        setSearchResults(tokyoOnly.slice(0, 5));
      }
    } catch {
      setSearchError("住所検索に失敗しました。地図を直接クリックして指定することもできます。");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      {sites.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <select
            className="rounded-sm border border-slate-300 px-3 py-2 text-sm bg-white sm:w-40"
            value={selectedWard}
            onChange={(e) => handleWardSelect(e.target.value)}
          >
            <option value="">区市から選ぶ</option>
            {wardsWithSites.map((w) => (
              <option key={w.name} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            list="site-suggestions"
            value={siteQuery}
            disabled={!selectedWard}
            onChange={(e) => handleSiteQueryChange(e.target.value)}
            placeholder={selectedWard ? "施設・道路名を入力(候補から選択)" : "先に区市を選んでください"}
            className="flex-1 rounded-sm border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
          />
          <datalist id="site-suggestions">
            {wardSites.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        {sites.length === 0 && (
          <select
            className="rounded-sm border border-slate-300 px-3 py-2 text-sm bg-white sm:w-40"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleWardSelect(e.target.value);
            }}
          >
            <option value="">区から選ぶ</option>
            {TOKYO_WARDS.map((w) => (
              <option key={w.name} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="公園・施設名や住所で検索(例: 代々木公園 / 世田谷区太子堂1丁目)"
            className="flex-1 rounded-sm border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="rounded-sm bg-forest-700 text-white text-sm font-medium px-4 py-2 hover:bg-forest-800 disabled:opacity-50"
          >
            {searching ? "検索中…" : "検索"}
          </button>
        </div>
      </div>

      {siteSearchResults.length > 0 && (
        <div className="mb-2 rounded-sm border border-slate-200 bg-white divide-y">
          {siteSearchResults.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                selectSite(s);
                setSiteSearchResults([]);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-forest-50"
            >
              {s.name} <span className="text-slate-400">({s.ward})</span>
            </button>
          ))}
        </div>
      )}
      {searchResults.length > 0 && (
        <div className="mb-2 rounded-sm border border-slate-200 bg-white divide-y">
          {searchResults.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const [lng, lat] = r.geometry.coordinates;
                moveTo(lat, lng);
                setSearchResults([]);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-forest-50"
            >
              {r.properties.title}
            </button>
          ))}
        </div>
      )}
      {searchError && <p className="text-xs text-clay-600 mb-2">{searchError}</p>}

      <div className="relative">
        <div ref={containerRef} className="w-full h-[300px] rounded-sm overflow-hidden border border-slate-300" />
        <button
          type="button"
          onClick={toggleMapMode}
          className="absolute bottom-2 left-2 z-10 rounded-sm bg-white/95 border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white"
        >
          {mapMode === "map" ? "📷 航空写真に切替" : "🗺️ 地図に戻す"}
        </button>
      </div>

      {/* ピンが今どの施設・道路を指しているか(見つからなければその旨)を、地図の直下に
          常に表示する。「ピンを指したら施設名が自動でセットされる」ことを見た目でも
          わかるようにするための表示(吹き出しだけだと見落とされやすいため)。 */}
      {sites.length > 0 && matchAttempted && (
        <div
          className={`mt-2 rounded-sm border px-3 py-2 text-sm ${
            matchedSite
              ? "border-forest-200 bg-forest-50 text-forest-900"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {matchedSite ? (
            <>
              このピンの施設: <span className="font-semibold">{matchedSite.name}</span>
              <span className="text-forest-600"> ({matchedSite.ward})</span>
            </>
          ) : (
            "このピンの位置に対象の施設・道路が見つかりませんでした。近くの公園・図書館・道路のあたりを指してください。"
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-1">
        {sites.length > 0
          ? "区市と施設・道路を選ぶと場所が決まります。ピンをドラッグ、地図をクリック、または上の検索でも自動的に施設名がセットされます。"
          : "区の選択・住所検索、または地図をクリック/ピンをドラッグして場所を指定してください。"}
      </p>
    </div>
  );
}
