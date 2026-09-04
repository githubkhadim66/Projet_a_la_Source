/** Assistant de formulaire multi-étapes (CDC FOR-02 : progression visible).
 *
 *  - Itinéraire horizontal : cercles numérotés reliés, coche verte quand franchi.
 *  - Navigation Précédent / Suivant, validation par étape, envoi sur la dernière.
 *  - Fond clair et sobre (aucune image de fond).
 *
 *  Chaque étape fournit son contenu et, en option, une fonction de validation
 *  qui renvoie un message d'erreur (ou null si l'étape est valide).
 */

import { useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Nav } from "@/lib/routes";
import { goBack } from "@/lib/nav";

export interface WizardStep {
  label: string;
  hint?: string;
  content: ReactNode;
  validate?: () => string | null;
}

export function FormWizard({
  nav, title, intro, steps, onSubmit, submitting = false,
  submitLabel = "Envoyer", error, footNote,
}: {
  nav: Nav;
  title: string;
  intro?: string;
  steps: WizardStep[];
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  footNote?: ReactNode;
}) {
  const [current, setCurrent] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const isLast = current === steps.length - 1;

  const goNext = () => {
    const err = steps[current].validate?.() ?? null;
    if (err) { setStepError(err); return; }
    setStepError(null);
    if (isLast) { onSubmit(); return; }
    setCurrent(c => Math.min(c + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPrev = () => { setStepError(null); setCurrent(c => Math.max(c - 1, 0)); };
  // On ne peut revenir que vers une étape déjà franchie (pas sauter en avant sans valider)
  const goTo = (i: number) => { if (i < current) { setStepError(null); setCurrent(i); } };

  return (
    <div className="min-h-screen bg-[#f4f5f9] font-['Inter',sans-serif]">
      {/* ── Barre supérieure ── */}
      <div className="bg-[#0d2265] px-6 py-4 flex items-center gap-4">
        <button onClick={() => goBack(nav, "landing")} className="text-white/60 hover:text-white text-sm flex items-center gap-1.5 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <span className="text-white/50 text-sm">·</span>
        <span className="text-white text-sm font-medium">{title}</span>
        <button onClick={() => nav("landing")} className="ml-auto font-bold text-lg tracking-tight text-white cursor-pointer font-['Playfair_Display',Georgia,serif]">
          À la Source
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {intro && <p className="text-sm text-[#64697d] leading-relaxed mb-6 max-w-2xl">{intro}</p>}

        {/* ── Itinéraire horizontal ── */}
        <div className="overflow-x-auto pb-1 mb-6">
          <ol className="flex items-center min-w-max">
            {steps.map((s, i) => {
              const state = i < current ? "done" : i === current ? "now" : "todo";
              return (
                <li key={i} className="flex items-center">
                  <button type="button" onClick={() => goTo(i)} disabled={i >= current}
                    className={`flex items-center gap-2.5 ${i < current ? "cursor-pointer" : "cursor-default"}`}>
                    <span className={`shrink-0 w-8 h-8 rounded-full grid place-items-center text-sm font-bold transition-colors ${
                      state === "done" ? "bg-[#2E6B4F] text-white"
                      : state === "now" ? "bg-[#C4613A] text-white shadow-[0_0_0_4px_rgba(196,97,58,0.15)]"
                      : "bg-white border-2 border-[rgba(13,34,101,0.15)] text-[#9ca3af]"}`}>
                      {state === "done" ? <Check className="w-4 h-4" /> : i + 1}
                    </span>
                    <span className={`text-sm whitespace-nowrap ${
                      state === "now" ? "font-bold text-[#0d2265]"
                      : state === "done" ? "font-medium text-[#0d2265]"
                      : "font-medium text-[#9ca3af]"}`}>
                      {s.label}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <span className={`h-[2px] w-10 sm:w-14 mx-2 sm:mx-3 rounded transition-colors ${i < current ? "bg-[#2E6B4F]" : "bg-[rgba(13,34,101,0.12)]"}`} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── Carte formulaire ── */}
        <div className="bg-white border border-[rgba(13,34,101,0.1)] rounded-lg overflow-hidden shadow-[0_10px_40px_-24px_rgba(13,34,101,0.35)]">
          <div className="p-6 sm:p-8">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[11px] font-bold text-[#C4613A] tracking-[0.2em] uppercase">Étape {current + 1} / {steps.length}</span>
              <span className="text-[#c9c6bf]">·</span>
              <span className="text-sm font-semibold text-[#0d2265]">{steps[current].label}</span>
            </div>

            {/* key={current} → réanime le contenu à chaque changement d'étape */}
            <div key={current} className="als-expand">
              {steps[current].content}
            </div>

            {(stepError || error) && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-6">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {stepError || error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-[rgba(13,34,101,0.08)] bg-[#faf9f6]">
            <button type="button" onClick={goPrev} disabled={current === 0}
              className={`text-sm font-semibold px-3 py-2.5 inline-flex items-center gap-1.5 transition-colors ${current === 0 ? "text-[#c9c6bf] cursor-not-allowed" : "text-[#0d2265] hover:text-[#C4613A] cursor-pointer"}`}>
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>
            <div className="flex items-center gap-3">
              {footNote && isLast && <span className="hidden sm:block text-[11px] text-[#64697d] max-w-[210px] leading-snug text-right">{footNote}</span>}
              <button type="button" onClick={goNext} disabled={submitting}
                className="als-cta bg-[#C4613A] text-white text-sm font-semibold px-6 py-3 inline-flex items-center gap-2 hover:bg-[#A84E2D] transition-colors cursor-pointer disabled:opacity-60">
                {isLast ? (submitting ? "Envoi…" : submitLabel) : "Suivant"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
