"use client";

import { SubnavTabs } from "@/components/ui/SubnavTabs";

const TABS = [
  { href: "/dashboard/dispatching/upcoming-jobs", label: "Upcoming jobs" },
  { href: "/dashboard/dispatching/ongoing-jobs", label: "Ongoing jobs" },
] as const;

export function DispatchingSubnav() {
  return <SubnavTabs tabs={TABS} ariaLabel="Dispatching sections" />;
}
