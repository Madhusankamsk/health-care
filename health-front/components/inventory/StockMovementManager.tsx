"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { CrudToolbar } from "@/components/ui/CrudToolbar";
import { Input } from "@/components/ui/Input";
import { SelectBase } from "@/components/ui/select-base";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/lib/toast";

type Movement = {
  id: string;
  createdAt: string;
  quantity: number;
  fromLocationId: string;
  toLocationId: string;
  status: string;
  medicine: { name: string };
  batch: { batchNo: string };
  transferredBy: { fullName: string };
};

type BatchOption = { id: string; batchNo: string; medicine: { name: string } };

export function StockMovementManager({
  initialRows,
  batches,
}: {
  initialRows: Movement[];
  batches: BatchOption[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [values, setValues] = useState({
    batchId: batches[0]?.id ?? "",
    quantity: "1",
    toLocationType: "WAREHOUSE",
    toLocationId: "",
  });

  async function refresh() {
    const res = await fetch("/api/inventory/stock-movements", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to refresh");
    setRows((await res.json()) as Movement[]);
  }

  return (
    <div className="flex flex-col gap-4">
      <CrudToolbar title="Stock Movements" description="Transfer stock and monitor movement history." />
      <form
        className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/inventory/stock-movements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              batchId: values.batchId,
              quantity: Number(values.quantity),
              toLocationType: values.toLocationType,
              toLocationId: values.toLocationId || null,
            }),
          });
          if (!res.ok) {
            toast.error((await res.text().catch(() => "")) || "Transfer failed");
            return;
          }
          await refresh();
          toast.success("Transfer completed");
        }}
      >
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Source Batch</span>
          <SelectBase value={values.batchId} onChange={(e) => setValues((v) => ({ ...v, batchId: e.target.value }))}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.medicine.name} - {b.batchNo}</option>)}
          </SelectBase>
        </label>
        <Input label="Quantity" name="quantity" type="number" value={values.quantity} onChange={(e) => setValues((v) => ({ ...v, quantity: e.target.value }))} required />
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Destination Type</span>
          <SelectBase value={values.toLocationType} onChange={(e) => setValues((v) => ({ ...v, toLocationType: e.target.value }))}>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="NURSE">Nurse</option>
            <option value="VEHICLE">Vehicle</option>
          </SelectBase>
        </label>
        <Input label="Destination Id (optional)" name="toLocationId" value={values.toLocationId} onChange={(e) => setValues((v) => ({ ...v, toLocationId: e.target.value }))} />
        <div className="sm:col-span-4 flex justify-end">
          <Button type="submit" variant="create">Transfer</Button>
        </div>
      </form>
      <div className="tbl-shell overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                <TableCell>{row.medicine?.name ?? "—"}</TableCell>
                <TableCell>{row.batch?.batchNo ?? "—"}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{row.fromLocationId}</TableCell>
                <TableCell>{row.toLocationId}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.transferredBy?.fullName ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
