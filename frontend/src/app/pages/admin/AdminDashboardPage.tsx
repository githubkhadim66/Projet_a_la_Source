/** Tableau de bord admin : KPIs et derniers leads reçus. */

import { useEffect, useState } from "react";
import { Activity, AlertCircle, Archive, ArrowRight, Inbox, Package, Star, TrendingUp, Users } from "lucide-react";
import * as api from "@/lib/api";
import { toUiLead } from "@/lib/leads";
import type { Lead } from "@/lib/leads";
import type { Nav, Screen } from "@/lib/routes";
import { ADMIN_NAV, AdminShell, KpiCard } from "./AdminShell";
import { useAdminGuard } from "./adminSession";
import { useAdminText } from "@/lib/adminText";
import { useOptionLabel } from "@/lib/formsText";

export function AdminDashboard({ nav }: { nav: Nav }) {
  const { dashboard: t, shell } = useAdminText();
  const tr = useOptionLabel();
  const onApiError = useAdminGuard(nav);
  const [stats, setStats] = useState<api.ApiDashboard | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.dashboard().then(setStats).catch(onApiError);
    api.admin.leads({ limit: 5 }).then(ls => setRecentLeads(ls.map(toUiLead))).catch(onApiError);
  }, [onApiError]);

  const totalLeads = stats?.leads_total ?? 0;
  const newLeads = stats?.leads_new ?? 0;
  const inProgressLeads = stats?.leads_in_progress ?? 0;
  const prodVisible = stats?.products_visible ?? 0;
  const prodFeatured = stats?.products_featured ?? 0;
  const suppActifs = stats?.suppliers_active ?? 0;
  const suppEnAttente = (stats?.suppliers_total ?? 0) - (stats?.suppliers_active ?? 0);
  const stockRupture = stats?.stock_ruptures ?? 0;
  const stockAlerte = stats?.stock_stale ?? 0;
  const proposalsPending = stats?.proposals_pending ?? 0;

  return (
    <AdminShell nav={nav} active="dashboard">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0a0a0f]">{t.hello}</h1>
        <p className="text-sm text-[#64697d] mt-0.5">{t.intro}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard label={t.totalLeads} value={totalLeads} sub={t.totalLeadsSub(newLeads, inProgressLeads)} icon={Inbox} color="#0d2265" onClick={() => nav("admin-leads")} />
        <KpiCard label={t.newLeads} value={newLeads} sub={t.awaiting} icon={TrendingUp} color="#C4613A" onClick={() => nav("admin-leads")} />
        <KpiCard label={t.visibleProducts} value={prodVisible} sub={t.featuredSub(prodFeatured)} icon={Package} color="#059669" onClick={() => nav("admin-catalogue")} />
        <KpiCard label={t.activeSuppliers} value={suppActifs} sub={suppEnAttente > 0 ? t.disabledSub(suppEnAttente) : t.allActive} icon={Users} color="#7c3aed" onClick={() => nav("admin-fournisseurs")} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard label={t.stockAlerts} value={stockAlerte} sub={t.staleSub} icon={AlertCircle} color="#d97706" onClick={() => nav("admin-catalogue")} />
        <KpiCard label={t.ruptures} value={stockRupture} sub={t.rupturesSub} icon={Archive} color="#ef4444" onClick={() => nav("admin-catalogue")} />
        <KpiCard label={t.featured} value={`${prodFeatured}/6`} sub={t.featuredSlots} icon={Star} color="#C4613A" onClick={() => nav("admin-catalogue")} />
        <KpiCard label={t.proposals} value={proposalsPending} sub={t.proposalsSub} icon={Activity} color="#0d2265" onClick={() => nav("admin-fournisseurs")} />
      </div>

      {/* Two-column layout: recent leads + quick nav */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent leads */}
        <div className="lg:col-span-2 bg-white border border-[rgba(13,34,101,0.08)]">
          <div className="px-5 py-4 border-b border-[rgba(13,34,101,0.06)] flex items-center justify-between">
            <p className="font-semibold text-sm text-[#0a0a0f]">{t.recentLeads}</p>
            <button onClick={() => nav("admin-leads")} className="text-xs text-[#0d2265] font-medium hover:underline cursor-pointer">{t.seeAll}</button>
          </div>
          <div>
            {recentLeads.map((lead, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(13,34,101,0.04)] last:border-b-0">
                <div className="w-8 h-8 bg-[#eef1f8] flex items-center justify-center shrink-0">
                  <span className="text-[#0d2265] font-bold text-[11px]">{lead.company.slice(0,2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0a0a0f] truncate">{lead.company}</p>
                  <p className="text-[11px] text-[#64697d]">{lead.contact} · {lead.country}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#64697d]">{lead.date}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 mt-0.5 inline-block ${
                    lead.status === "Nouveau" ? "bg-[#0d2265] text-white" :
                    lead.status === "En cours" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>{tr(lead.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick nav shortcuts */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#64697d] uppercase tracking-widest mb-3">{t.quickAccess}</p>
          {ADMIN_NAV.filter(n => n.id !== "dashboard").map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => nav(item.screen as Screen)}
                className="w-full flex items-center gap-3 bg-white border border-[rgba(13,34,101,0.08)] px-4 py-3.5 cursor-pointer hover:border-[#0d2265]/30 hover:bg-[#f8f9ff] transition-all text-left">
                <div className="w-8 h-8 bg-[#eef1f8] flex items-center justify-center shrink-0 rounded">
                  <Icon className="w-4 h-4 text-[#0d2265]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0a0a0f]">{shell.nav[item.id][0]}</p>
                  <p className="text-[11px] text-[#64697d]">{shell.nav[item.id][1]}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#64697d] ml-auto" />
              </button>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
