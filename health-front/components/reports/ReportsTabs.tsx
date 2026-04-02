"use client";

import { SubnavTabs } from "@/components/ui/SubnavTabs";

const TABS = [
  { href: "/dashboard/reports/overview", label: "Overview" },
  { href: "/dashboard/reports/financial", label: "Financial" },
  { href: "/dashboard/reports/operations", label: "Operations" },
  { href: "/dashboard/reports/clinical", label: "Clinical" },
  { href: "/dashboard/reports/activity", label: "Activity" },
] as const;

export function ReportsTabs() {
  return <SubnavTabs tabs={TABS} ariaLabel="Reports sections" />;
}
