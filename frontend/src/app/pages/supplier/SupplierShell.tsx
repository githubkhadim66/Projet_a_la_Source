/** Coquille de l'espace fournisseur : barre latérale, top bar, carte KPI.
 *  Reprend les codes du back-office pour une interface cohérente et accueillante.
 */

import { useEffect, useState } from "react";
import { ArrowRight, Home, LogOut, Menu, Package, PlusCircle, Settings, UserRound, X } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiSupplier } from "@/lib/api";
import type { Nav, Screen } from "@/lib/routes";
import { type Lang, useLang, useSetLang } from "@/lib/i18n";
import { useSupplierText } from "@/lib/supplierText";

export type SupplierSection = "dashboard" | "products" | "propose" | "dossier" | "settings";

const SUPPLIER_NAV: { id: SupplierSection; screen: Screen; icon: React.ElementType }[] = [
  { id: "dashboard", screen: "supplier-dashboard",   icon: Home },
  { id: "products",  screen: "supplier-products",    icon: Package },
  { id: "propose",   screen: "supplier-propose",     icon: PlusCircle },
  { id: "dossier",   screen: "supplier-coordonnees", icon: UserRound },
  { id: "settings",  screen: "supplier-password",    icon: Settings },
];

/** Initiales d'une société (jusqu'à deux mots). */
const initialsOf = (name?: string | null): string => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export function KpiCard({ label, value, sub, icon: Icon, color = "#0d2265", onClick }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`bg-white border border-[rgba(13,34,101,0.08)] p-5 flex items-start gap-4 ${onClick ? "cursor-pointer hover:border-[#0d2265]/30 transition-colors" : ""}`}>
      <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded" style={{ backgroundColor: color + "18" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[#0a0a0f] leading-none mb-1">{value}</p>
        <p className="text-xs font-semibold text-[#0a0a0f]">{label}</p>
        {sub && <p className="text-[11px] text-[#64697d] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function SupplierShell({ nav, active, staleCount = 0, children }: {
  nav: Nav; active: SupplierSection; staleCount?: number; children: React.ReactNode;
}) {
  const t = useSupplierText().shell;
  const lang = useLang();
  const setLang = useSetLang();
  const [me, setMe] = useState<ApiSupplier | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!api.getSupplierToken()) { nav("login"); return; }
    api.supplier.me().then(profile => {
      setMe(profile);
      // Langue de l'espace ↔ langue du compte (celle de ses e-mails). En cas d'écart
      // (juste après la connexion) : l'anglais n'étant jamais la valeur par défaut, il
      // traduit un choix explicite — soit du visiteur (on l'enregistre), soit du compte
      // (on l'applique).
      if (profile.language !== lang) {
        if (lang === "en") api.supplier.updateProfile({ language: "en" }).then(setMe).catch(() => {});
        else setLang(profile.language);
      }
    }).catch(err => {
      if (err instanceof api.ApiError && err.status === 401) { api.setSupplierToken(null); nav("login"); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  // Changement de langue dans l'espace : appliqué tout de suite et enregistré sur le compte.
  const switchLang = (l: Lang) => {
    setLang(l);
    api.supplier.updateProfile({ language: l }).then(setMe).catch(() => {});
  };

  const logout = () => { api.setSupplierToken(null); nav("login"); };
  // Navigation depuis la barre latérale : ferme le tiroir mobile au passage.
  const go = (s: Screen) => { setMenuOpen(false); nav(s); };

  return (
    <div className="min-h-screen bg-[#f0f2f7] font-['Inter',sans-serif] flex">
      {/* Fond sombre du tiroir (mobile/tablette) */}
      {menuOpen && <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />}

      {/* Sidebar · statique en desktop, tiroir superposé sous lg */}
      <aside className={`w-64 shrink-0 bg-[#080f2e] flex-col h-screen ${menuOpen ? "flex fixed inset-y-0 left-0 z-50" : "hidden"} lg:flex lg:sticky lg:top-0 lg:z-40`}>
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <div className="flex items-start justify-between">
            <button onClick={() => go("landing")} className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-7 h-7 bg-[#C4613A] flex items-center justify-center text-white font-black text-xs shrink-0">A</div>
              <span className="text-white font-bold text-sm tracking-tight group-hover:text-white/80 transition-colors">Funti</span>
            </button>
            <button onClick={() => setMenuOpen(false)} className="lg:hidden text-white/50 hover:text-white cursor-pointer" title={t.close}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/25 text-[10px] font-medium tracking-widest uppercase mt-2 ml-[38px]">{t.role}</p>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {SUPPLIER_NAV.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const badge = item.id === "products" ? staleCount : 0;
            return (
              <button key={item.id} onClick={() => go(item.screen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-all rounded ${
                  isActive ? "bg-white/[0.12] text-white" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-[13px] font-medium leading-none">{t.nav[item.id]}</span>
                {badge > 0 && !isActive && (
                  <span className="bg-[#C4613A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">{badge}</span>
                )}
                {isActive && <div className="w-[3px] h-4 bg-[#C4613A] rounded-full shrink-0" />}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#0d2265] border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{initialsOf(me?.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-medium truncate">{me?.name ?? t.fallbackName}</p>
              <p className="text-white/25 text-[10px] truncate">{me?.email ?? ""}</p>
            </div>
            <button onClick={logout} title={t.logout} className="text-white/25 hover:text-white cursor-pointer transition-colors shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-14 bg-white border-b border-[rgba(13,34,101,0.07)] flex items-center px-4 lg:px-8 sticky top-0 z-30 gap-3">
          <button onClick={() => setMenuOpen(true)} className="lg:hidden text-[#0d2265] cursor-pointer -ml-1 p-1" title={t.menu}>
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-sm font-semibold text-[#0a0a0f] truncate">{t.nav[active]}</p>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-0.5 text-xs" aria-label="Langue / Language">
              {(["fr", "en"] as const).map((l, i) => (
                <span key={l} className="flex items-center gap-0.5">
                  {i > 0 && <span className="text-[#c3c9dd]">│</span>}
                  <button type="button" onClick={() => switchLang(l)}
                    className={`cursor-pointer px-1 transition-colors ${lang === l ? "text-[#0d2265] font-bold" : "text-[#64697d] hover:text-[#0d2265]"}`}>
                    {l.toUpperCase()}
                  </button>
                </span>
              ))}
            </div>
            <button onClick={() => nav("landing")}
              className="text-xs text-[#64697d] hover:text-[#0d2265] cursor-pointer transition-colors flex items-center gap-1.5 border border-[rgba(13,34,101,0.15)] px-3 py-1.5 hover:border-[#0d2265]">
              <ArrowRight className="w-3 h-3 rotate-180" /> <span className="hidden sm:inline">{t.backToSite}</span><span className="sm:hidden">{t.site}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-5 lg:py-7">
          {children}
        </div>
      </div>
    </div>
  );
}
