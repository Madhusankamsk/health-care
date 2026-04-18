"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { TablePaginationBar } from "@/components/ui/TablePaginationBar";

type OpdQueueRow = {
  id: string;
  tokenNo: number;
  visitDate: string;
  status: string;
  patient: { id: string; fullName: string; shortName?: string | null };
  statusLookup: { lookupKey: string; lookupValue: string } | null;
  pickedBy?: { id: string; fullName: string } | null;
  booking?: { id: string; isOpd: boolean } | null;
};

export function OpdDoctorConsole(props: {
  rows: OpdQueueRow[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [pickingId, setPickingId] = useState<string | null>(null);

  async function pick(queueId: string) {
    setPickingId(queueId);
    try {
      const res = await fetch(`/api/opd/${encodeURIComponent(queueId)}/pick`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message || "Unable to pick patient");
      toast.success("Patient picked. Open the patient profile to continue diagnostics.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to pick");
    } finally {
      setPickingId(null);
    }
  }

  const { rows, total, page, pageSize } = props;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
              <th className="px-3 py-2 font-medium">Token</th>
              <th className="px-3 py-2 font-medium">Patient</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[var(--text-secondary)]">
                  No patients in this view (waiting pool and your in-consultation cases).
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const waiting = row.statusLookup?.lookupKey === "WAITING";
                const inConsult = row.statusLookup?.lookupKey === "IN_CONSULTATION";
                return (
                  <tr key={row.id} className="border-b border-[var(--border)]/80">
                    <td className="px-3 py-2 font-mono tabular-nums">#{row.tokenNo}</td>
                    <td className="px-3 py-2">{row.patient.fullName}</td>
                    <td className="px-3 py-2">{row.statusLookup?.lookupValue ?? row.status}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {waiting ? (
                          <Button
                            type="button"
                            variant="primary"
                            className="h-8 px-3 text-xs"
                            disabled={pickingId !== null}
                            onClick={() => void pick(row.id)}
                          >
                            {pickingId === row.id ? "…" : "Pick"}
                          </Button>
                        ) : null}
                        {inConsult && row.booking?.id ? (
                          <Link
                            href={`/dashboard/clients/patient/${row.patient.id}`}
                            className="text-sm font-medium text-[var(--brand-primary)] underline-offset-2 hover:underline"
                          >
                            Open patient
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        hrefForPage={(p) => `/dashboard/opd/doctor?page=${p}`}
      />
    </div>
  );
}
