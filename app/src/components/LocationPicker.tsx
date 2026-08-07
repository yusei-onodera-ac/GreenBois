"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MaplibreMap, Marker, NavigationControl, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GSI_MAP_STYLE } from "@/lib/mapStyle";
import { TOKYO_WARDS } from "@/lib/tokyoWards";

const DEFAULT_CENTER: [number, number] = [139.6688, 35.6438];

// 国土地理院(GSI)の住所検索API。APIキー不要・無償(住所・地名のジオコーディング)
// https://msearch.gsi.go.jp/address-search/AddressSearch?q=...
type GsiSearchResult = {
  geometry: { coordinates: [number, number] };
  properties: { title: string };
};

export default function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number };
  onChange: (pos: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GsiSearchResult[]>([]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: GSI_MAP_STYLE,
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
    });

    map.on("click", (e: MapMouseEvent) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveTo(lat: number, lng: number, zoom = 15) {
    markerRef.current?.setLngLat([lng, lat]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom });
    onChangeRef.current({ lat, lng });
  }

  function handleWardSelect(name: string) {
    const ward = TOKYO_WARDS.find((w) => w.name === name);
    if (ward) moveTo(ward.lat, ward.lng, 13);
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("検索リクエストに失敗しました");
      const data: GsiSearchResult[] = await res.json();
      if (data.length === 0) {
        setSearchError("該当する住所が見つかりませんでした。キーワードを変えてお試しください。");
      } else if (data.length === 1) {
        const [lng, lat] = data[0].geometry.coordinates;
        moveTo(lat, lng);
      } else {
        setSearchResults(data.slice(0, 5));
      }
    } catch {
      setSearchError("住所検索に失敗しました。地図を直接クリックして指定することもできます。");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <select
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white sm:w-40"
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
            placeholder="住所やキーワードで検索(例: 世田谷区太子堂1丁目)"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="rounded-lg bg-forest-700 text-white text-sm font-medium px-4 py-2 hover:bg-forest-800 disabled:opacity-50"
          >
            {searching ? "検索中…" : "検索"}
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-2 rounded-lg border border-stone-200 bg-white divide-y">
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

      <div ref={containerRef} className="w-full h-[300px] rounded-lg overflow-hidden border border-stone-300" />
      <p className="text-xs text-stone-500 mt-1">
        区の選択・住所検索、または地図をクリック/ピンをドラッグして場所を指定してください。
      </p>
    </div>
  );
}
