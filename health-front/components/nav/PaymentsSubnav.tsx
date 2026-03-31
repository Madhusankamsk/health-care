"use client";

import { SubnavTabs } from "@/components/ui/SubnavTabs";

const TABS = [
  { href: "/dashboard/payments/record", label: "Record payment" },
  { href: "/dashboard/payments/accounts", label: "Accounts" },
] as const;

export function PaymentsSubnav() {
  return <SubnavTabs tabs={TABS} ariaLabel="Payments sections" />;
}
