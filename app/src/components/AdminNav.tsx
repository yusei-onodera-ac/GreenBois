"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [{ href: "/admin", label: "ダッシュボード" }] as const;

// 管理画面ヘッダーのナビゲーション。都民向け(CitizenNav)と同じ「現在地を下線で示す」
// パターンを踏襲し、配色のみslate/sky系の実務トーンに合わせる。
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
              active ? "text-white border-sky-400 font-semibold" : "text-slate-300 hover:text-white border-transparent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
