"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/lib/toast";

export function MemberDetachButton({
  subscriptionAccountId,
  patientId,
  patientName,
  disabled,
}: {
  subscriptionAccountId: string;
  patientId: string;
  patientName?: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const onConfirm = async () => {
    setIsConfirming(true);
    try {
      const res = await fetch(
        `/api/subscription-accounts/${subscriptionAccountId}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId }),
        },
      );

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Unable to detach member");
      }

      toast.success("Member detached");
      router.refresh();
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to detach member";
      toast.error(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="delete"
        className="h-8 px-3 text-xs"
        onClick={() => setOpen(true)}
        disabled={disabled || isConfirming}
      >
        Detach
      </Button>
      <ConfirmModal
        open={open}
        title="Detach member"
        message={`Are you sure you want to detach ${patientName ?? "this member"} from this subscription account?`}
        confirmLabel="Detach"
        confirmVariant="delete"
        isConfirming={isConfirming}
        onCancel={() => setOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  );
}

