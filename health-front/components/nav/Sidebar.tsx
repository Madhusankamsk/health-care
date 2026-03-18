"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { canAccessAdmin, canAccessSuperAdmin } from "@/lib/adminAccess";
import { useMe } from "@/lib/useMe";

type NavItem = {
  href: string;
  label: string;
  requiresAdmin?: boolean;
  requiresSuperAdmin?: boolean;
  children?: { href: string; label: string }[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  {
    href: "/dashboard/admin",
    label: "Admin",
    requiresAdmin: true,
    children: [{ href: "/dashboard/admin/staff", label: "Staff" }],
  },
  {
    href: "/dashboard/super-admin",
    label: "Super Admin",
    requiresSuperAdmin: true,
    children: [
      { href: "/dashboard/super-admin/company-setup", label: "Company Setup" },
      { href: "/dashboard/super-admin/roles", label: "Roles" },
      { href: "/dashboard/super-admin/permissions", label: "Permissions" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export type SidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const meState = useMe();

  const isDesktop = variant === "desktop";
  const canSeeAdmin =
    meState.status === "authenticated"
      ? canAccessAdmin(meState.me.user.role, meState.me.permissions)
      : false;
  const canSeeSuperAdmin =
    meState.status === "authenticated"
      ? canAccessSuperAdmin(meState.me.user.role, meState.me.permissions)
      : false;

  const visibleItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.requiresAdmin) return canSeeAdmin;
      if (item.requiresSuperAdmin) return canSeeSuperAdmin;
      return true;
    });
  }, [canSeeAdmin, canSeeSuperAdmin]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand the group matching the current route.
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of visibleItems) {
      if (item.children?.length) {
        next[item.href] = pathname.startsWith(item.href);
      }
    }
    setOpenGroups((prev) => ({ ...next, ...prev }));
  }, [pathname, visibleItems]);

  function toggleGroup(href: string) {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <aside
      className={[
        isDesktop
          ? "hidden w-64 shrink-0 border-r border-zinc-200 bg-white/60 backdrop-blur dark:border-zinc-800 dark:bg-black/30 md:block"
          : "w-full",
      ].join(" ")}
    >
      <div className={["flex h-full flex-col gap-6", isDesktop ? "p-4" : ""].join(" ")}>
        <div className="px-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Navigation
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const active = isActive(pathname, item.href);
            const isOpen = Boolean(openGroups[item.href]);

            if (!hasChildren) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-xl px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
                  ].join(" ")}
                  onClick={() => onNavigate?.()}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.href} className="flex flex-col gap-1">
                <button
                  type="button"
                  className={[
                    "flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
                  ].join(" ")}
                  onClick={() => toggleGroup(item.href)}
                >
                  <span>{item.label}</span>
                  <span className={["text-xs", isOpen ? "rotate-90" : ""].join(" ")}>
                    ▶
                  </span>
                </button>

                {isOpen ? (
                  <div className="ml-2 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={[
                            "rounded-xl px-3 py-2 text-sm transition-colors",
                            childActive
                              ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50"
                              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
                          ].join(" ")}
                          onClick={() => onNavigate?.()}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {isDesktop ? (
          <div className="mt-auto px-2 pb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Signed-in area
          </div>
        ) : null}
      </div>
    </aside>
  );
}

