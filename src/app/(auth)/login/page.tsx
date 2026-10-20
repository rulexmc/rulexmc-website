import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  if (await getCurrentUser()) redirect(target);
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your RuleXMC player portal.">
      <LoginForm next={target} />
    </AuthShell>
  );
}
