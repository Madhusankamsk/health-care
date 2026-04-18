"use client";

import { SubnavTabs } from "@/components/ui/SubnavTabs";

type OpdSubnavProps = {
  canManageDoctors: boolean;
  canPick: boolean;
};

export function OpdSubnav({ canManageDoctors, canPick }: OpdSubnavProps) {
  const tabs = [
    ...(canPick ? [{ href: "/dashboard/opd/doctor", label: "Doctor" } as const] : []),
    { href: "/dashboard/opd/queue", label: "Queue" },
    ...(canManageDoctors ? [{ href: "/dashboard/opd/manager", label: "Manager" } as const] : []),
  ];
  return <SubnavTabs tabs={tabs} ariaLabel="OPD sections" />;
}
