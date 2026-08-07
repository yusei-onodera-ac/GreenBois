"use client";

import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, NavigationControl, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { OFFLINE_MAP_STYLE } from "@/lib/mapStyle";

const DEFAULT_CENTER: [number, number] = [139.6688, 35.6438];

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

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: OFFLINE_MAP_STYLE,
      center: [value.lng || DEFAULT_CENTER[0], value.lat || DEFAULT_CENTER[1]],
      zoom: 14,
    });
    map.addControl(new NavigationControl(), "top-right");

    const marker = new Marker({ draggable: true, color: "#059669" })
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

  return (
    <div>
      <div ref={containerRef} className="w-full h-[300px] rounded-lg overflow-hidden border border-stone-300" />
      <p className="text-xs text-stone-500 mt-1">
        地図をクリックするか、ピンをドラッグして提案したい場所を指定してください。
      </p>
    </div>
  );
}
