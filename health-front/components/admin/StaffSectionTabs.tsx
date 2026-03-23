"use client";

import { useState } from "react";

import { StaffManager, type StaffProfile } from "@/components/admin/StaffManager";
import {
  SubscriptionPlanManager,
  type SubscriptionPlan,
} from "@/components/admin/SubscriptionPlanManager";
import { Button } from "@/components/ui/Button";

type Role = { id: string; roleName: string; description?: string | null };
type PlanTypeOption = { id: string; lookupKey: string; lookupValue: string };

type Props = {
  profiles: StaffProfile[];
  roles: Role[];
  plans: SubscriptionPlan[];
  planTypes: PlanTypeOption[];
  canPreview: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDeactivate: boolean;
  canDelete: boolean;
};

type TabId = "staff" | "subscription_plans";

export function StaffSectionTabs(props: Props) {
  const [tab, setTab] = useState<TabId>("staff");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant={tab === "staff" ? "primary" : "secondary"}
          onClick={() => setTab("staff")}
        >
          Staff
        </Button>
        <Button
          variant={tab === "subscription_plans" ? "primary" : "secondary"}
          onClick={() => setTab("subscription_plans")}
        >
          Subscription Plans
        </Button>
      </div>

      {tab === "staff" ? (
        <StaffManager
          initialProfiles={props.profiles}
          roles={props.roles}
          canPreview={props.canPreview}
          canCreate={props.canCreate}
          canEdit={props.canEdit}
          canDeactivate={props.canDeactivate}
          canDelete={props.canDelete}
        />
      ) : (
        <SubscriptionPlanManager
          initialPlans={props.plans}
          planTypes={props.planTypes}
          canCreate={props.canCreate}
          canEdit={props.canEdit}
          canDelete={props.canDelete}
        />
      )}
    </div>
  );
}

