"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { CrudToolbar } from "@/components/ui/CrudToolbar";
import { Input } from "@/components/ui/Input";
import { SelectBase } from "@/components/ui/select-base";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/lib/toast";

type SubstoreRow = {
  user: { id: string; fullName: string; email: string };
  totalQuantity: number;
  batches: Array<{ id: string; quantity: number; medicine: { name: string } }>;
};

type BatchOption = { id: string; batchNo: string; medicine: { name: string } };
type UserOption = { id: string; fullName: string };

export function MobileSubstoreManager({
  initialRows,
  users,
  batches,
}: {
  initialRows: SubstoreRow[];
  users: UserOption[];
  batches: BatchOption[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [values, setValues] = useState({
    userId: users[0]?.id ?? "",
    batchId: batches[0]?.id ?? "",
    quantity: "1",
  });

  async function refresh() {
    const res = await fetch("/api/inventory/mobile-substores", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to refresh");
    setRows((await res.json()) as SubstoreRow[]);
  }

  return (
    <div className="flex flex-col gap-4">
      <CrudToolbar title="Mobile Substores" description="Assign stock to mobile users and track totals." />
      <form
        className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/inventory/mobile-substores/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: values.userId,
              batchId: values.batchId,
              quantity: Number(values.quantity),
            }),
          });
          if (!res.ok) {
            toast.error((await res.text().catch(() => "")) || "Assignment failed");
            return;
          }
          await refresh();
          toast.success("Assigned to mobile substore");
        }}
      >
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">User</span>
          <SelectBase value={values.userId} onChange={(e) => setValues((v) => ({ ...v, userId: e.target.value }))}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </SelectBase>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Source Batch</span>
          <SelectBase value={values.batchId} onChange={(e) => setValues((v) => ({ ...v, batchId: e.target.value }))}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.medicine.name} - {b.batchNo}</option>)}
          </SelectBase>
        </label>
        <Input label="Quantity" name="quantity" type="number" value={values.quantity} onChange={(e) => setValues((v) => ({ ...v, quantity: e.target.value }))} required />
        <div className="flex items-end">
          <Button type="submit" variant="create" className="h-11 w-full">Assign</Button>
        </div>
      </form>
      <div className="tbl-shell overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Batch Lines</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.user.id}>
                <TableCell className="font-medium">{row.user.fullName}</TableCell>
                <TableCell>{row.user.email}</TableCell>
                <TableCell>{row.totalQuantity}</TableCell>
                <TableCell>{row.batches.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
