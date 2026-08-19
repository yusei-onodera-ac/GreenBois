"use client";

import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getOsmMapStyle } from "@/lib/mapStyle";

// 提案の詳細画面(都民向け・行政向け共通)で使う、閲覧専用の地図。
// LocationPicker.tsxと違い、ピンは固定(ドラッグ不可)・クリックでの移動も無い
// 「正確な場所をそのまま見せるだけ」の表示専用コンポーネント。
export default function ProposalLocationMap({
  lat,
  lng,
  className = "",
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: getOsmMapStyle(),
      center: [lng, lat],
      zoom: 17,
      interactive: true, // 拡大縮小・パンは可能(閲覧のため)。ピン移動やクリック判定は実装しない。
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    new Marker({ color: "#2d6a4f" }).setLngLat([lng, lat]).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-sm overflow-hidden border border-stone-200 ${className}`}
    />
  );
}
