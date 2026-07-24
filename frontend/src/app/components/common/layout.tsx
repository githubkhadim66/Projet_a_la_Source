/** Gabarits d'écran : coquille avec bandeau marine, carte de formulaire, confirmation. */

import type { Nav, Screen } from "@/lib/routes";

export function ScreenShell({ children, nav, title, back = "landing" }: { children: React.ReactNode; nav: Nav; title?: string; back?: Screen }) {
  return (
    <div className="min-h-screen bg-[#f4f5f9] font-['Inter',sans-serif]">
      <div className="bg-[#0d2265] px-6 py-4 flex items-center gap-4">
        <button onClick={() => nav(back)} className="text-white/60 hover:text-white text-sm flex items-center gap-1.5 cursor-pointer transition-colors">
          ← Retour
        </button>
        {title && <span className="text-white/60 text-sm">·</span>}
        {title && <span className="text-white text-sm font-medium">{title}</span>}
        <button onClick={() => nav("landing")} className="ml-auto font-bold text-lg tracking-tight text-white cursor-pointer">
          À la Source
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-12">{children}</div>
    </div>
  );
}

export function FormCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="bg-white border border-[rgba(13,34,101,0.1)] p-8 md:p-10">
      <h2 className="text-xl font-bold text-[#0a0a0f] mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-[#64697d] mb-6 leading-relaxed">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
    </div>
  );
}

export function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-[#64697d] mb-2">
        <span className="font-medium">Étape {step} / {total}</span>
        <span>{Math.round((step / total) * 100)} %</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`flex-1 h-1 transition-colors ${i < step ? "bg-[#0d2265]" : "bg-[rgba(13,34,101,0.12)]"}`} />
        ))}
      </div>
    </div>
  );
}

export function Confirm({ icon, title, subtitle, children, nav, back = "landing" as Screen, backLabel = "Retour à l'accueil" }: {
  icon: React.ReactNode; title: string; subtitle: string; children?: React.ReactNode; nav: Nav; back?: Screen; backLabel?: string;
}) {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-[rgba(13,34,101,0.07)] flex items-center justify-center mx-auto mb-6">{icon}</div>
      <h2 className="text-2xl font-bold text-[#0a0a0f] mb-3">{title}</h2>
      <p className="text-[#64697d] text-sm leading-relaxed mb-8 max-w-md mx-auto">{subtitle}</p>
      {children}
      <button onClick={() => nav(back)} className="mt-6 text-sm text-[#0d2265] underline cursor-pointer block mx-auto">
        {backLabel}
      </button>
    </div>
  );
}
