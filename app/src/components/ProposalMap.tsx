"use client";

import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { createRoot } from "react-dom/client";
import {
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  PROPOSAL_STATUS_LABELS,
  ProposalCategory,
  ProposalStatus,
} from "@/lib/enums";
import { OSM_MAP_STYLE } from "@/lib/mapStyle";

export type MapProposal = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  category: string;
  status: string;
};

// 画面上でこのピクセル距離以内にあるピンは1つのクラスタにまとめる。
// GL(WebGL)ネイティブレイヤー方式(GeoJSON source + circle layer)は環境によって
// 描画されない事象が確認されたため、実績のあるDOM Marker方式 + 自前の
// 簡易クラスタリング(画面座標グルーピング)に変更している。
const CLUSTER_PX_RADIUS = 32;

type ClusterGroup = {
  items: MapProposal[];
  lng: number;
  lat: number;
};

function buildPopupNode(p: MapProposal, color: string) {
  const node = document.createElement("div");
  createRoot(node).render(
    <div style={{ minWidth: 180 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color }}>
        {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] ?? p.category}
      </div>
      <div style={{ fontWeight: 600, margin: "2px 0 4px" }}>{p.title}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
        {PROPOSAL_STATUS_LABELS[p.status as ProposalStatus] ?? p.status}
      </div>
      <Link href={`/proposals/${p.id}`} prefetch={false} style={{ color: "#2563eb", fontSize: 13 }}>
        詳細を見る →
      </Link>
    </div>
  );
  return node;
}

export default function ProposalMap({ proposals }: { proposals: MapProposal[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const proposalsRef = useRef(proposals);

  useEffect(() => {
    proposalsRef.current = proposals;
  }, [proposals]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: OSM_MAP_STYLE,
      center: [139.6688, 35.6438], // 世田谷区・太子堂付近(シードデータの中心)
      zoom: 12,
    });
    mapRef.current = map;

    const renderMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const items = proposalsRef.current;
      if (items.length === 0) return;

      // 画面座標が近いピン同士を1グループにまとめる(簡易グリーディ法)
      const groups: ClusterGroup[] = [];
      for (const p of items) {
        const point = map.project([p.lng, p.lat]);
        const target = groups.find((g) => {
          const gp = map.project([g.lng, g.lat]);
          const dx = gp.x - point.x;
          const dy = gp.y - point.y;
          return Math.sqrt(dx * dx + dy * dy) < CLUSTER_PX_RADIUS;
        });
        if (target) {
          target.items.push(p);
        } else {
          groups.push({ items: [p], lng: p.lng, lat: p.lat });
        }
      }

      for (const g of groups) {
        const el = document.createElement("div");
        el.style.cursor = "pointer";

        if (g.items.length === 1) {
          const p = g.items[0];
          const color = PROPOSAL_CATEGORY_COLOR[p.category as ProposalCategory] ?? "#6b7280";
          el.style.width = "20px";
          el.style.height = "20px";
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
          el.style.backgroundColor = color;

          const marker = new Marker({ element: el }).setLngLat([p.lng, p.lat]);
          marker.setPopup(new Popup({ offset: 12 }).setDOMContent(buildPopupNode(p, color)));
          marker.addTo(map);
          markersRef.current.push(marker);
        } else {
          const size = 30 + Math.min(g.items.length, 10) * 2;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
          el.style.backgroundColor = "#1b4332";
          el.style.color = "#ffffff";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.fontSize = "13px";
          el.style.fontWeight = "700";
          el.textContent = String(g.items.length);
          el.addEventListener("click", () => {
            map.easeTo({ center: [g.lng, g.lat], zoom: Math.min(map.getZoom() + 2.5, 18) });
          });

          const marker = new Marker({ element: el }).setLngLat([g.lng, g.lat]);
          marker.addTo(map);
          markersRef.current.push(marker);
        }
      }
    };

    map.on("load", renderMarkers);
    map.on("moveend", renderMarkers);

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 提案データが変わったら再描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    map.fire("moveend");
  }, [proposals]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[280px] sm:h-[320px] rounded-sm overflow-hidden border border-forest-200"
    />
  );
}
