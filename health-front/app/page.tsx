import { redirect } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { getIsAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="app-shell min-h-screen px-3 py-16 text-[var(--text-primary)] sm:px-4">
      <div className="mx-auto flex w-full max-w-md flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Health Front
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign in to your account
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in using credentials from the backend.
          </p>
        </header>

        <LoginCard />

        <footer className="text-xs text-[var(--text-muted)]">
          By continuing, you agree to the terms of service and privacy policy.
        </footer>
      </div>
    </div>
  );
}
