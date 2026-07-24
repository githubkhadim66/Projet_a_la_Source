/** Coquille du back-office : barre latérale, top bar, cloche de notifications, carte KPI. */

import { useState } from "react";
import { AlertCircle, ArrowRight, Calendar, Home, Inbox, LogOut, Package, Users } from "lucide-react";
import type { Nav, Screen } from "@/lib/routes";
import { adminLogout, useAdminNotifications } from "./adminSession";

export type AdminSection = "dashboard" | "leads" | "catalogue" | "fournisseurs" | "rdv";

export const ADMIN_NAV: { id: AdminSection; label: string; screen: Screen; icon: React.ElementType; desc: string }[] = [
  { id: "dashboard",    label: "Tableau de bord",  screen: "admin-dashboard",    icon: Home,     desc: "Vue globale" },
  { id: "leads",        label: "Leads & demandes", screen: "admin-leads",        icon: Inbox,    desc: "Demandes clients" },
  { id: "catalogue",    label: "Catalogue",        screen: "admin-catalogue",    icon: Package,  desc: "Produits, stocks & PDF" },
  { id: "fournisseurs", label: "Fournisseurs",     screen: "admin-fournisseurs", icon: Users,    desc: "Comptes & propositions" },
  { id: "rdv",          label: "Rendez-vous",      screen: "admin-rdv",          icon: Calendar, desc: "Échanges avec l'experte" },
];

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

export function AdminShell({ nav, active, children }: { nav: Nav; active: AdminSection; children: React.ReactNode }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { newLeads, proposals, stockAlerts, allRead, markAllRead } = useAdminNotifications();
  const adminEmail = localStorage.getItem("als-admin-email") ?? "admin";
  const rawTotal = newLeads.length + proposals.length + stockAlerts.length;
  // La pastille ne s'affiche que s'il reste des notifications non lues
  const totalNotifs = allRead ? 0 : rawTotal;

  return (
    <div className="min-h-screen bg-[#f0f2f7] font-['Inter',sans-serif] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#080f2e] flex flex-col sticky top-0 h-screen z-40">
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <button onClick={() => nav("landing")} className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-7 h-7 bg-[#C4613A] flex items-center justify-center text-white font-black text-xs shrink-0">A</div>
            <span className="text-white font-bold text-sm tracking-tight group-hover:text-white/80 transition-colors">À la Source</span>
          </button>
          <p className="text-white/25 text-[10px] font-medium tracking-widest uppercase mt-2 ml-[38px]">Admin</p>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const badge = item.id === "leads" ? newLeads.length
                        : item.id === "fournisseurs" ? proposals.length
                        : item.id === "catalogue" ? stockAlerts.filter(s => s.status === "Rupture").length
                        : 0;
            return (
              <button key={item.id} onClick={() => nav(item.screen as Screen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-all rounded ${
                  isActive ? "bg-white/[0.12] text-white" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-[13px] font-medium leading-none">{item.label}</span>
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
              <span className="text-white text-[10px] font-bold">OB</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-medium truncate">Administrateur</p>
              <p className="text-white/25 text-[10px] truncate">{adminEmail}</p>
            </div>
            <button onClick={() => adminLogout(nav)} title="Se déconnecter" className="text-white/25 hover:text-white cursor-pointer transition-colors shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-[rgba(13,34,101,0.07)] flex items-center px-8 sticky top-0 z-30 gap-4">
          <p className="text-sm font-semibold text-[#0a0a0f]">{ADMIN_NAV.find(n => n.id === active)?.label}</p>
          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)}
                className="relative w-9 h-9 flex items-center justify-center border border-[rgba(13,34,101,0.12)] hover:border-[#0d2265]/30 bg-white cursor-pointer transition-colors">
                <AlertCircle className="w-4 h-4 text-[#64697d]" />
                {totalNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C4613A] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">{totalNotifs}</span>
                )}
              </button>
              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white border border-[rgba(13,34,101,0.12)] shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-[rgba(13,34,101,0.07)] flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0a0a0f]">Notifications</p>
                    <span className="text-[10px] bg-[#C4613A] text-white font-bold px-1.5 py-0.5">{totalNotifs}</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {totalNotifs === 0 && (
                      <p className="px-4 py-6 text-xs text-[#64697d] text-center">
                        {allRead && rawTotal > 0 ? "Toutes les notifications sont lues." : "Aucune notification."}
                      </p>
                    )}
                    {!allRead && newLeads.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-[#64697d] uppercase tracking-widest">Nouveaux leads</p>
                        {newLeads.slice(0,3).map((l, i) => (
                          <button key={i} onClick={() => { setNotifOpen(false); nav("admin-leads"); }}
                            className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-[#f4f5f9] cursor-pointer text-left transition-colors">
                            <div className="w-6 h-6 bg-[#eef1f8] flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[#0d2265] font-bold text-[9px]">{l.company.slice(0,2).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0a0a0f] truncate">{l.company}</p>
                              <p className="text-[10px] text-[#64697d]">{l.country} · {l.date}</p>
                            </div>
                            <span className="shrink-0 text-[9px] bg-[#0d2265] text-white px-1.5 py-0.5 font-bold mt-0.5">Nouveau</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!allRead && proposals.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-[#64697d] uppercase tracking-widest">Propositions fournisseurs</p>
                        {proposals.map((p, i) => (
                          <button key={i} onClick={() => { setNotifOpen(false); nav("admin-fournisseurs"); }}
                            className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-[#f4f5f9] cursor-pointer text-left transition-colors">
                            <div className="w-6 h-6 bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                              <Package className="w-3 h-3 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0a0a0f] truncate">{p.name}</p>
                              <p className="text-[10px] text-[#64697d]">par {p.supplier_name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {!allRead && stockAlerts.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-[#64697d] uppercase tracking-widest">Alertes stock</p>
                        {stockAlerts.slice(0,3).map((s, i) => (
                          <button key={i} onClick={() => { setNotifOpen(false); nav("admin-catalogue"); }}
                            className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-[#f4f5f9] cursor-pointer text-left transition-colors">
                            <div className={`w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 ${s.status === "Rupture" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
                              <AlertCircle className={`w-3 h-3 ${s.status === "Rupture" ? "text-red-500" : "text-amber-500"}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0a0a0f] truncate">{s.name}</p>
                              <p className="text-[10px] text-[#64697d]">{s.status === "Rupture" ? "Rupture de stock" : "Données non actualisées"}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {rawTotal > 0 && !allRead && (
                    <div className="px-4 py-2.5 border-t border-[rgba(13,34,101,0.07)]">
                      <button onClick={markAllRead} className="text-[10px] text-[#64697d] hover:text-[#0d2265] cursor-pointer transition-colors">Marquer tout comme lu</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => nav("landing")}
              className="text-xs text-[#64697d] hover:text-[#0d2265] cursor-pointer transition-colors flex items-center gap-1.5 border border-[rgba(13,34,101,0.15)] px-3 py-1.5 hover:border-[#0d2265]">
              <ArrowRight className="w-3 h-3 rotate-180" /> Retour au site
            </button>
          </div>
        </div>
        <div className="flex-1 px-8 py-7">
          {children}
        </div>
      </div>
    </div>
  );
}
