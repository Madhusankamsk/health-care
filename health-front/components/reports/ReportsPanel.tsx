"use client";

import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";

type Kind = "overview" | "financial" | "operations" | "clinical" | "activity";

type Props = {
  kind: Kind;
};

type ReportState = {
  loading: boolean;
  error: string | null;
  data: unknown;
};

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (v) => v.toUpperCase())
    .trim();
}

function renderPairs(obj: Record<string, unknown>) {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No data available.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{toLabel(key)}</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{String(value ?? 0)}</p>
        </div>
      ))}
    </div>
  );
}

function titleFor(kind: Kind): string {
  switch (kind) {
    case "overview":
      return "Reports overview";
    case "financial":
      return "Financial insights";
    case "operations":
      return "Operations workload";
    case "clinical":
      return "Clinical metrics";
    default:
      return "Recent activity";
  }
}

function descriptionFor(kind: Kind): string {
  switch (kind) {
    case "overview":
      return "Cross-module KPI snapshot for admins.";
    case "financial":
      return "Billing totals and payment collection breakdown.";
    case "operations":
      return "Queues and active workload across operations.";
    case "clinical":
      return "Visit, report, and lab progress statistics.";
    default:
      return "Latest report-relevant operational events.";
  }
}

export function ReportsPanel({ kind }: Props) {
  const [state, setState] = useState<ReportState>({ loading: true, error: null, data: null });

  useEffect(() => {
    let active = true;
    fetch(`/api/reports/${kind}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Failed to load report data");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setState({ loading: false, error: null, data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load report data",
          data: null,
        });
      });
    return () => {
      active = false;
    };
  }, [kind]);

  const body = useMemo(() => {
    if (state.loading) return <p className="text-sm text-[var(--text-secondary)]">Loading report data...</p>;
    if (state.error) return <p className="text-sm text-[var(--danger)]">{state.error}</p>;
    if (!state.data || typeof state.data !== "object") {
      return <p className="text-sm text-[var(--text-muted)]">No data available.</p>;
    }

    if (kind === "activity") {
      const events = Array.isArray((state.data as { events?: unknown[] }).events)
        ? ((state.data as { events: Array<Record<string, unknown>> }).events ?? [])
        : [];
      if (events.length === 0) return <p className="text-sm text-[var(--text-muted)]">No recent activity.</p>;
      return (
        <ul className="space-y-3">
          {events.map((event, index) => (
            <li key={String(event.id ?? index)} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">{String(event.title ?? "Event")}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {new Date(String(event.at ?? "")).toLocaleString()} · {String(event.type ?? "activity")}
              </p>
              {event.detail ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{String(event.detail)}</p> : null}
            </li>
          ))}
        </ul>
      );
    }

    const raw = state.data as Record<string, unknown>;
    const firstObject = Object.values(raw).find((value) => value && typeof value === "object" && !Array.isArray(value));
    const target = (firstObject as Record<string, unknown> | undefined) ?? raw;
    return renderPairs(target);
  }, [kind, state.data, state.error, state.loading]);

  return <Card title={titleFor(kind)} description={descriptionFor(kind)}>{body}</Card>;
}
