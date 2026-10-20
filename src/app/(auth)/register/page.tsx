import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/portal");
  return (
    <AuthShell title="Join RuleXMC" subtitle="Create an account to link your Minecraft name, track stats and submit reports.">
      <RegisterForm />
    </AuthShell>
  );
}
