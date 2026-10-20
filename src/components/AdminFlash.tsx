export function AdminFlash({ ok, error }: { ok?: string; error?: string }) {
  if (ok) return <p role="status" className="mb-6 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100">{ok}</p>;
  if (error) return <p role="alert" className="mb-6 rounded-md border border-blood-500/50 bg-blood-900/40 px-4 py-2.5 text-sm text-blood-200">{error}</p>;
  return null;
}
export type FlashParams = Promise<{ ok?: string; error?: string }>;
