"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CreatePermissionForm } from "@/components/forms/CreatePermissionForm";

export function CreatePermissionModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsOpen(true)}
        className="h-10 px-4 text-xs sm:text-sm"
      >
        Create permission
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-lg flex-1">
            <Card
              title="Create permission"
              description="Add a new permission key to the system."
            >
              <div className="mb-4 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
              <CreatePermissionForm />
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}

