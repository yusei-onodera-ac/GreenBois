"use client";

import { useEffect, useRef } from "react";
import {
  Map as MaplibreMap,
  Popup,
  GeoJSONSource,
  type MapGeoJSONFeature,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  PROPOSAL_CATEGORY_LABELS,
  PROPOSAL_CATEGORY_COLOR,
  PROPOSAL_CATEGORIES,
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

const SOURCE_ID = "proposals";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function toGeoJSON(proposals: MapProposal[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: proposals.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, title: p.title, category: p.category, status: p.status },
    })),
  };
}

// カテゴリ→色の match 式(不明なカテゴリはグレー)
const categoryColorExpression: unknown[] = ["match", ["get", "category"]];
PROPOSAL_CATEGORIES.forEach((c) => {
  categoryColorExpression.push(c, PROPOSAL_CATEGORY_COLOR[c]);
});
categoryColorExpression.push("#6b7280");

export default function ProposalMap({ proposals }: { proposals: MapProposal[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);

  // 初期化(スタイル・レイヤーは一度だけ作る)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MaplibreMap({
      container: containerRef.current,
      style: GSI_MAP_STYLE,
      center: [139.6688, 35.6438], // 世田谷区・太子堂付近(シードデータの中心)
      zoom: 12,
    });
    mapRef.current = map;

    map.on("error", (e) => {
      console.error("[ProposalMap] maplibre error:", e.error ?? e);
    });

    map.on("load", () => {
      try {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: toGeoJSON(proposals),
          cluster: true,
          clusterMaxZoom: 15,
          clusterRadius: 50,
        });

        // クラスタ(複数件の集合)。件数テキストは外部フォント(glyphs)依存を避けるため
        // 表示せず、円の大きさの段階だけで規模を示す(クリックで個別ピンまで展開)。
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#1b4332",
            "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 26],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // 個別ピン(ジャンル=カテゴリで色分け)
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": categoryColorExpression as never,
            "circle-radius": 9,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
        map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));

        // クラスタをクリック → 展開ズーム
        map.on("click", "clusters", async (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource(SOURCE_ID) as GeoJSONSource;
          if (clusterId == null || !source) return;
          const zoom = await source.getClusterExpansionZoom(clusterId);
          const geometry = features[0].geometry as GeoJSON.Point;
          map.easeTo({ center: geometry.coordinates as [number, number], zoom });
        });

        // 個別ピンをクリック → ポップアップ
        map.on("click", "unclustered-point", (e) => {
          const feature = e.features?.[0] as MapGeoJSONFeature | undefined;
          if (!feature) return;
          const props = feature.properties as { id: string; title: string; category: string; status: string };
          const geometry = feature.geometry as GeoJSON.Point;
          const color = PROPOSAL_CATEGORY_COLOR[props.category as ProposalCategory] ?? "#6b7280";
          const categoryLabel = PROPOSAL_CATEGORY_LABELS[props.category as ProposalCategory] ?? props.category;
          const statusLabel = PROPOSAL_STATUS_LABELS[props.status as ProposalStatus] ?? props.status;

          new Popup({ offset: 12 })
            .setLngLat(geometry.coordinates as [number, number])
            .setHTML(
              `<div style="min-width:180px">
                <div style="font-size:11px;font-weight:700;color:${color}">${escapeHtml(categoryLabel)}</div>
                <div style="font-weight:600;margin:2px 0 4px">${escapeHtml(props.title)}</div>
                <div style="font-size:11px;color:#6b7280;margin-bottom:6px">${escapeHtml(statusLabel)}</div>
                <a href="/proposals/${props.id}" style="color:#2563eb;font-size:13px">詳細を見る →</a>
              </div>`
            )
            .addTo(map);
        });
      } catch (err) {
        console.error("[ProposalMap] failed to set up layers:", err);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 提案データが変わったらソースを更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      source?.setData(toGeoJSON(proposals));
    };
    if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) {
      update();
    } else {
      map.once("load", update);
    }
  }, [proposals]);

  return <div ref={containerRef} className="w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-forest-200" />;
}
