import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/validation";

export const metadata: Metadata = pageMetadata({ title: "Log in", description: "Log in to your RuleX MC player portal to link your Minecraft account, track your stats and submit reports.", path: "/login" });
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  if (await getCurrentUser()) redirect(target);
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your RuleX MC player portal.">
      <LoginForm next={target} />
    </AuthShell>
  );
}
