"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "견적" },
  { href: "/stock", label: "재고" },
  { href: "/samples", label: "샘플" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="topbar">
      <Link href="/" className="brand">로켓견적</Link>
      <nav>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
