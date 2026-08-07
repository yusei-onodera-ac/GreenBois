"use client";

import { useEffect, useRef } from "react";
import {
  Map as MaplibreMap,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { createRoot } from "react-dom/client";
import { PROPOSAL_CATEGORY_LABELS, ProposalCategory } from "@/lib/enums";
import { OFFLINE_MAP_STYLE } from "@/lib/mapStyle";

export type MapProposal = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  category: string;
  status: string;
};

const STATUS_COLOR: Record<string, string> = {
  draft: "#9ca3af",
  collecting: "#2563eb",
  screening: "#d97706",
  adopted: "#059669",
  in_progress: "#059669",
  completed: "#065f46",
  rejected: "#dc2626",
};

export default function ProposalMap({ proposals }: { proposals: MapProposal[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: OFFLINE_MAP_STYLE,
      center: [139.6688, 35.6438], // 世田谷区・太子堂付近(シードデータの中心)
      zoom: 13,
    });
    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: Marker[] = [];

    const addMarkers = () => {
      proposals.forEach((p) => {
        const el = document.createElement("div");
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
        el.style.backgroundColor = STATUS_COLOR[p.status] ?? "#374151";
        el.style.cursor = "pointer";

        const popupNode = document.createElement("div");
        const root = createRoot(popupNode);
        root.render(
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>
              {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
            </div>
            <div style={{ fontWeight: 600, margin: "2px 0 6px" }}>{p.title}</div>
            <Link href={`/proposals/${p.id}`} style={{ color: "#2563eb", fontSize: 13 }}>
              詳細を見る →
            </Link>
          </div>
        );

        const marker = new Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(new Popup({ offset: 12 }).setDOMContent(popupNode))
          .addTo(map);
        markers.push(marker);
      });
    };

    if (map.isStyleLoaded()) {
      addMarkers();
    } else {
      map.once("load", addMarkers);
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [proposals]);

  return <div ref={containerRef} className="w-full h-[420px] rounded-xl overflow-hidden border border-emerald-200" />;
}
