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
    <nav
      className="page-section -mx-1 flex min-w-0 flex-nowrap gap-2 overflow-x-auto overflow-y-hidden p-2 [-webkit-overflow-scrolling:touch]"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
