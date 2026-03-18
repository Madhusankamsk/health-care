import { Card } from "@/components/Card";

export default function AdminStaffPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Manage staff accounts (placeholder).
        </p>
      </header>

      <Card
        title="Coming next"
        description="We can wire this to Users/Roles once staff flows are defined."
      >
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          Typical actions:
          <ul className="mt-2 list-disc pl-5">
            <li>Create user</li>
            <li>Assign role</li>
            <li>Activate/deactivate</li>
            <li>Reset password</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

