"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [{ href: "/admin", label: "ダッシュボード" }] as const;

// 管理画面ヘッダーのナビゲーション。都民向け(CitizenNav)と同じ「現在地を下線で示す」
// パターン・配色(forest/stone)を踏襲する(以前はslate/sky系の別配色だったが、
// ヘッダー全体をforest/stoneに統一したのに合わせてこちらも揃えた)。
export default function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b pb-0.5 transition-colors ${
              active
                ? "text-forest-800 border-forest-600 font-semibold"
                : "text-slate-600 hover:text-forest-700 border-transparent hover:border-forest-300"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
