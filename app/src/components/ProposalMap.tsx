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
import {
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  PROPOSAL_CATEGORY_ICON,
  PROPOSAL_STATUS_LABELS,
  ProposalCategory,
  ProposalStatus,
} from "@/lib/enums";
import { GSI_MAP_STYLE } from "@/lib/mapStyle";

export type MapProposal = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  category: string;
  status: string;
};

// ステータスは進捗の目安として、ピン右下の小さいドットで示す(主役はジャンル=カテゴリ)
const STATUS_DOT_COLOR: Record<string, string> = {
  draft: "#9ca3af",
  collecting: "#3b82f6",
  screening: "#d97706",
  adopted: "#16a34a",
  in_progress: "#16a34a",
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
      style: GSI_MAP_STYLE,
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
        const category = (p.category as ProposalCategory) in PROPOSAL_CATEGORY_COLOR
          ? (p.category as ProposalCategory)
          : "other";

        const el = document.createElement("div");
        el.style.position = "relative";
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.cursor = "pointer";

        const pin = document.createElement("div");
        pin.style.width = "30px";
        pin.style.height = "30px";
        pin.style.borderRadius = "50% 50% 50% 0";
        pin.style.transform = "rotate(-45deg)";
        pin.style.border = "2px solid white";
        pin.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
        pin.style.backgroundColor = PROPOSAL_CATEGORY_COLOR[category];
        el.appendChild(pin);

        const glyph = document.createElement("div");
        glyph.textContent = PROPOSAL_CATEGORY_ICON[category];
        glyph.style.position = "absolute";
        glyph.style.top = "3px";
        glyph.style.left = "0";
        glyph.style.width = "30px";
        glyph.style.height = "30px";
        glyph.style.display = "flex";
        glyph.style.alignItems = "center";
        glyph.style.justifyContent = "center";
        glyph.style.fontSize = "14px";
        el.appendChild(glyph);

        const statusDot = document.createElement("div");
        statusDot.style.position = "absolute";
        statusDot.style.bottom = "-2px";
        statusDot.style.right = "-2px";
        statusDot.style.width = "10px";
        statusDot.style.height = "10px";
        statusDot.style.borderRadius = "50%";
        statusDot.style.border = "1.5px solid white";
        statusDot.style.backgroundColor = STATUS_DOT_COLOR[p.status] ?? "#374151";
        el.appendChild(statusDot);

        const popupNode = document.createElement("div");
        const root = createRoot(popupNode);
        root.render(
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 11, color: PROPOSAL_CATEGORY_COLOR[category], fontWeight: 700 }}>
              {PROPOSAL_CATEGORY_ICON[category]} {PROPOSAL_CATEGORY_LABELS[category]}
            </div>
            <div style={{ fontWeight: 600, margin: "2px 0 4px" }}>{p.title}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
              {PROPOSAL_STATUS_LABELS[p.status as ProposalStatus] ?? p.status}
            </div>
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
