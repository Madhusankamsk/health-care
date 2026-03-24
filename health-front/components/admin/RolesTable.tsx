"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";

type Role = {
  id: string;
  roleName: string;
  description?: string | null;
  permissions?: { permission: { permissionKey: string } }[];
  users?: { id: string }[];
};

export function RolesTable({ roles }: { roles: Role[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function performDelete(roleId: string) {
    setError(null);
    setBusyId(roleId);
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to delete role");
      }
      toast.success("Role deleted");
      window.location.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong deleting role";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <ConfirmModal
        open={deleteConfirmId !== null}
        title="Delete this role?"
        message="Are you sure you want to delete this role? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="delete"
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (!deleteConfirmId) return;
          const id = deleteConfirmId;
          setDeleteConfirmId(null);
          void performDelete(id);
        }}
      />
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const permissions = role.permissions ?? [];
              const isEmpty = permissions.length === 0;
              return (
                <tr
                  key={role.id}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 font-medium">
                    <div className="flex items-center justify-between gap-2">
                      <span>{role.roleName}</span>
                      {isEmpty && (role.users?.length ?? 0) === 0 ? (
                        <Button
                          type="button"
                          variant="delete"
                          className="h-7 px-2 text-[11px]"
                          disabled={busyId === role.id}
                          onClick={() => setDeleteConfirmId(role.id)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {role.description ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {permissions.map((rp) => (
                          <span
                            key={rp.permission.permissionKey}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          >
                            {rp.permission.permissionKey}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600">
                        No permissions
                      </span>
                    )}
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

