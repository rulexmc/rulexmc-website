import { PixelHeart } from "./Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="block-grid relative">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16">
        <div className="panel-glow p-6 sm:p-8 animate-rise">
          <PixelHeart className="mb-5 h-8 w-9" />
          <h1 className="h-display text-2xl text-white">{title}</h1>
          <p className="mt-2 mb-7 text-sm text-bone-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
