/** Retours d'interface centralisés et cohérents pour tout le site :
 *  - useConfirm() : boîte de dialogue de confirmation professionnelle (remplace window.confirm).
 *  - useToast()   : notifications « push » élégantes (succès / erreur / info).
 *  Monté une seule fois via <FeedbackProvider> à la racine de l'application.
 */

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}
type ToastTone = "success" | "error" | "info";
interface ToastItem { id: number; message: string; tone: ToastTone }

interface FeedbackApi {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  toast: (message: string, tone?: ToastTone) => void;
}

const FeedbackCtx = createContext<FeedbackApi | null>(null);

export function useConfirm(): FeedbackApi["confirm"] {
  const ctx = useContext(FeedbackCtx);
  if (!ctx) throw new Error("useConfirm doit être utilisé dans <FeedbackProvider>");
  return ctx.confirm;
}
export function useToast(): FeedbackApi["toast"] {
  const ctx = useContext(FeedbackCtx);
  if (!ctx) throw new Error("useToast doit être utilisé dans <FeedbackProvider>");
  return ctx.toast;
}

const TOAST_STYLE: Record<ToastTone, { icon: React.ElementType; ring: string; color: string }> = {
  success: { icon: CheckCircle2, ring: "border-l-[#2E6B4F]", color: "#2E6B4F" },
  error: { icon: AlertTriangle, ring: "border-l-red-500", color: "#dc2626" },
  info: { icon: Info, ring: "border-l-[#0d2265]", color: "#0d2265" },
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (b: boolean) => void }) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const confirm = useCallback(
    (o: ConfirmOptions) => new Promise<boolean>(resolve => setDialog({ ...o, resolve })),
    [],
  );
  const settle = (ok: boolean) => { dialog?.resolve(ok); setDialog(null); };

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  const danger = dialog?.tone === "danger";

  return (
    <FeedbackCtx.Provider value={{ confirm, toast }}>
      {children}

      {/* Boîte de dialogue de confirmation */}
      {dialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/45 als-fade" onClick={() => settle(false)}>
          <div className="bg-white w-full max-w-sm shadow-2xl als-pop" onClick={e => e.stopPropagation()}>
            <div className="p-5 flex items-start gap-3.5">
              <div className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-full ${danger ? "bg-red-50" : "bg-[#eef1f8]"}`}>
                <AlertTriangle className={`w-5 h-5 ${danger ? "text-red-600" : "text-[#0d2265]"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#0a0a0f] text-sm">{dialog.title}</p>
                {dialog.message && <p className="text-sm text-[#4a4f63] mt-1 leading-relaxed whitespace-pre-line">{dialog.message}</p>}
              </div>
              <button onClick={() => settle(false)} className="text-[#64697d] hover:text-[#0a0a0f] cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-3.5 bg-[#faf9f6] border-t border-[rgba(13,34,101,0.08)] flex items-center justify-end gap-2">
              <button onClick={() => settle(false)} className="text-sm text-[#64697d] hover:text-[#0a0a0f] px-4 py-2 cursor-pointer">
                {dialog.cancelLabel ?? "Annuler"}
              </button>
              <button onClick={() => settle(true)}
                className={`text-sm font-semibold text-white px-4 py-2 cursor-pointer transition-colors ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#0d2265] hover:bg-[#091a52]"}`}>
                {dialog.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications « push » */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 w-full max-w-md px-4 pointer-events-none">
        {toasts.map(t => {
          const s = TOAST_STYLE[t.tone];
          const Icon = s.icon;
          return (
            <div key={t.id} className={`als-pop pointer-events-auto w-full bg-white border border-[rgba(13,34,101,0.1)] border-l-4 ${s.ring} shadow-[0_12px_36px_-12px_rgba(13,34,101,0.4)] px-4 py-3 flex items-center gap-3`}>
              <Icon className="w-5 h-5 shrink-0" style={{ color: s.color }} />
              <p className="text-sm text-[#0a0a0f] leading-snug">{t.message}</p>
            </div>
          );
        })}
      </div>

      {/* Animations locales (indépendantes de la config Tailwind) */}
      <style>{`
        @keyframes alsFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes alsPop { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }
        .als-fade { animation: alsFade .15s ease-out }
        .als-pop { animation: alsPop .18s ease-out }
      `}</style>
    </FeedbackCtx.Provider>
  );
}
