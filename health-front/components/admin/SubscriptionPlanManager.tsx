"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type SubscriptionPlan = {
  id: string;
  planName: string;
  planTypeId: string;
  price: number | string;
  maxMembers: number;
  durationDays: number;
  isActive: boolean;
  planTypeLookup?: { id: string; lookupKey: string; lookupValue: string } | null;
};

type PlanTypeOption = { id: string; lookupKey: string; lookupValue: string };

type SubscriptionPlanManagerProps = {
  initialPlans: SubscriptionPlan[];
  planTypes: PlanTypeOption[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

type Mode = "none" | "create" | "edit" | "preview";

export function SubscriptionPlanManager({
  initialPlans,
  planTypes,
  canCreate,
  canEdit,
  canDelete,
}: SubscriptionPlanManagerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [mode, setMode] = useState<Mode>("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return plans.find((p) => p.id === selectedId) ?? null;
  }, [plans, selectedId]);

  async function refresh() {
    const res = await fetch("/api/subscription-plans", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to refresh subscription plans");
    const next = (await res.json()) as SubscriptionPlan[];
    setPlans(next);
  }

  async function handleDelete(id: string) {
    setError(null);
    if (!window.confirm("Delete this subscription plan?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/subscription-plans/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Delete failed");
      }
      await refresh();
      if (selectedId === id) {
        setSelectedId(null);
        setMode("none");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Manage subscription plans (create, edit, delete, preview).
        </div>
        <div className="flex items-center gap-2">
          {canCreate ? (
            <Button
              variant="primary"
              onClick={() => {
                setMode("create");
                setSelectedId(null);
                setError(null);
              }}
            >
              Create plan
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={async () => {
              setError(null);
              try {
                await refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {mode === "create" ? (
        <SubscriptionPlanForm
          title="Create subscription plan"
          submitLabel="Create"
          planTypes={planTypes}
          onCancel={() => setMode("none")}
          onSubmit={async (values) => {
            const res = await fetch("/api/subscription-plans", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            if (!res.ok) {
              const msg = await res.text().catch(() => "");
              throw new Error(msg || "Create failed");
            }
            await refresh();
            setMode("none");
          }}
        />
      ) : null}

      {mode === "edit" && selected ? (
        <SubscriptionPlanForm
          title="Edit subscription plan"
          submitLabel="Save changes"
          planTypes={planTypes}
          initial={{
            planName: selected.planName,
            planTypeId: selected.planTypeId,
            price: String(selected.price),
            maxMembers: String(selected.maxMembers),
            durationDays: String(selected.durationDays),
            isActive: selected.isActive,
          }}
          onCancel={() => setMode("none")}
          onSubmit={async (values) => {
            const res = await fetch(`/api/subscription-plans/${selected.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            if (!res.ok) {
              const msg = await res.text().catch(() => "");
              throw new Error(msg || "Update failed");
            }
            await refresh();
            setMode("none");
          }}
        />
      ) : null}

      {mode === "preview" && selected ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Preview subscription plan</div>
            <Button variant="secondary" onClick={() => setMode("none")}>
              Close
            </Button>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Plan Name</dt>
              <dd className="font-medium">{selected.planName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Plan Type</dt>
              <dd className="font-medium">{selected.planTypeLookup?.lookupValue ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Price</dt>
              <dd className="font-medium">{String(selected.price)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Duration (days)</dt>
              <dd className="font-medium">{selected.durationDays}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Max Members</dt>
              <dd className="font-medium">{selected.maxMembers}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Status</dt>
              <dd className="font-medium">{selected.isActive ? "Active" : "Inactive"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="tbl-shell overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const isBusy = busyId === plan.id;
              return (
                <tr key={plan.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3 font-medium">{plan.planName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {plan.planTypeLookup?.lookupValue ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{String(plan.price)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{plan.durationDays}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{plan.maxMembers}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {plan.isActive ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 px-3"
                        disabled={isBusy}
                        onClick={() => {
                          setSelectedId(plan.id);
                          setMode("preview");
                        }}
                      >
                        Preview
                      </Button>
                      {canEdit ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 px-3"
                          disabled={isBusy}
                          onClick={() => {
                            setSelectedId(plan.id);
                            setMode("edit");
                          }}
                        >
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 px-3"
                          disabled={isBusy}
                          onClick={() => handleDelete(plan.id)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type SubscriptionPlanFormValues = {
  planName: string;
  planTypeId: string;
  price: string;
  maxMembers: string;
  durationDays: string;
  isActive: boolean;
};

function SubscriptionPlanForm({
  title,
  submitLabel,
  planTypes,
  onCancel,
  onSubmit,
  initial,
}: {
  title: string;
  submitLabel: string;
  planTypes: PlanTypeOption[];
  onCancel: () => void;
  onSubmit: (values: SubscriptionPlanFormValues) => Promise<void>;
  initial?: Partial<SubscriptionPlanFormValues>;
}) {
  const [values, setValues] = useState<SubscriptionPlanFormValues>({
    planName: initial?.planName ?? "",
    planTypeId: initial?.planTypeId ?? planTypes[0]?.id ?? "",
    price: initial?.price ?? "",
    maxMembers: initial?.maxMembers ?? "1",
    durationDays: initial?.durationDays ?? "",
    isActive: initial?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="text-lg font-semibold">{title}</div>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsSubmitting(true);
          try {
            await onSubmit(values);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <Input
          label="Plan name"
          name="planName"
          value={values.planName}
          onChange={(e) => setValues((v) => ({ ...v, planName: e.target.value }))}
          required
        />
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Plan type</span>
          <select
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-800"
            value={values.planTypeId}
            onChange={(e) => setValues((v) => ({ ...v, planTypeId: e.target.value }))}
            required
          >
            {planTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.lookupValue}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Price"
          name="price"
          inputMode="decimal"
          value={values.price}
          onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
          required
        />
        <Input
          label="Duration days"
          name="durationDays"
          inputMode="numeric"
          value={values.durationDays}
          onChange={(e) => setValues((v) => ({ ...v, durationDays: e.target.value }))}
          required
        />
        <Input
          label="Max members"
          name="maxMembers"
          inputMode="numeric"
          value={values.maxMembers}
          onChange={(e) => setValues((v) => ({ ...v, maxMembers: e.target.value }))}
          required
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
          />
          Active
        </label>

        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

