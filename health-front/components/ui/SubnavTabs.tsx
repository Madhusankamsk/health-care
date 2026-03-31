"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabItem = {
  href: string;
  label: string;
};

type SubnavTabsProps = {
  tabs: readonly TabItem[];
  ariaLabel: string;
};

export function SubnavTabs({ tabs, ariaLabel }: SubnavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="page-section flex flex-wrap gap-2 p-2" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
