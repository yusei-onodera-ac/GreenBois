"use client";

import { useRef } from "react";

// 「実現しました」ショーケース用の自動スクロール・ループカルーセル。
// コンテンツを複製して並べ、CSSアニメーションで無限ループに見せる(ホバーで一時停止)。
export default function AutoScrollCarousel({
  children,
  speedSeconds = 28,
}: {
  children: React.ReactNode[];
  speedSeconds?: number;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (children.length === 0) return null;

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
      <div
        ref={trackRef}
        className="flex w-max gap-3 animate-[gv-marquee_var(--gv-speed)_linear_infinite] hover:[animation-play-state:paused]"
        style={{ ["--gv-speed" as string]: `${speedSeconds}s` }}
      >
        {[...children, ...children].map((child, i) => (
          <div key={i} className="shrink-0">
            {child}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes gv-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
