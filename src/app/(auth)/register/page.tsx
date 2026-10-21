import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = pageMetadata({ title: "Create account", description: "Create a free RuleX MC website account to link your Minecraft name, track your stats and report players.", path: "/register" });
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/portal");
  return (
    <AuthShell title="Join RuleX MC" subtitle="Create an account to link your Minecraft name, track stats and submit reports.">
      <RegisterForm />
    </AuthShell>
  );
}
