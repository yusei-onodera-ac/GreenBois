"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/map", label: "HOME" },
  { href: "/proposals", label: "みんなの声" },
  { href: "/mypage", label: "マイページ" },
] as const;

// 都民向けヘッダーのナビゲーション。現在地のリンクは下線を常時表示する
// (行政公式サイトのグローバルナビによくある「現在地表示」)。
export default function CitizenNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
