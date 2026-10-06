/** Leads & demandes : 4 files, filtres, changement de statut, création de compte depuis une candidature. */

import { useEffect, useState } from "react";
import { Activity, CheckCircle, Download, Inbox, Key, LayoutGrid, List, Mail, Search, Trash2, TrendingUp, X } from "lucide-react";
import * as api from "@/lib/api";
import { alertPill, leadAlert, STATUSES_FOR, TAB_FOR_QUEUE, statusBadge, toUiLead } from "@/lib/leads";
import type { Lead, LeadStatus, LeadTab } from "@/lib/leads";
import type { Nav } from "@/lib/routes";
import { SelectInput } from "@/app/components/common/fields";
import { AdminShell, KpiCard } from "./AdminShell";
import { LeadKanban } from "./leads/LeadKanban";
import { LeadReplyModal } from "./leads/LeadReplyModal";
import { useConfirm, useToast } from "@/app/components/common/feedback";
import { useAdminGuard } from "./adminSession";
import { replyTemplate, useAdminText } from "@/lib/adminText";
import { useOptionLabel } from "@/lib/formsText";

const EMPTY_LEADS: Record<LeadTab, Lead[]> = { catalogue: [], devis: [], sourcing: [], candidatures: [] };

// Boutons « faire avancer » proposés selon le type de demande (1 clic).
const QUICK_ACTIONS: Record<LeadTab, LeadStatus[]> = {
  catalogue: [],
  devis: ["Devis envoyé", "Gagné", "Perdu"],
  sourcing: ["En cours", "Traité"],
  candidatures: [],
};

/** Objet + message pré-remplis pour la réponse à un lead (éditables ensuite).
 *  Rédigés dans la langue DU CLIENT, quelle que soit la langue de l'interface admin. */
function replyDefaults(lead: Lead, tab: LeadTab): { subject: string; body: string } {
  const first = lead.contact.split(/[\s·—-]+/).filter(Boolean)[0] || lead.contact;
  const product = typeof lead.product === "string" && lead.product ? lead.product : undefined;
  return replyTemplate(lead.language, tab, first, product);
}

export function AdminLeads({ nav }: { nav: Nav }) {
  const { leads: t, alerts, common } = useAdminText();
  const tr = useOptionLabel();
  const onApiError = useAdminGuard(nav);
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<LeadTab>("devis");
  const [leads, setLeads] = useState<Record<LeadTab, Lead[]>>(EMPTY_LEADS);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "Tous">("Tous");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.leads()
      .then(all => {
        const grouped: Record<LeadTab, Lead[]> = { catalogue: [], devis: [], sourcing: [], candidatures: [] };
        for (const l of all) grouped[TAB_FOR_QUEUE[l.queue]].push(toUiLead(l));
        setLeads(grouped);
      })
      .catch(onApiError)
      .finally(() => setLoading(false));
  }, [onApiError]);

  const allLeads = Object.values(leads).flat();
  const newCount = (t: LeadTab) => leads[t].filter(l => l.status === "Nouveau").length;

  const changeStatus = async (id: number, status: LeadStatus) => {
    try {
      const now = new Date().toISOString();
      await api.admin.updateLeadStatus(id, status);
      setLeads(prev => ({ ...prev, [tab]: prev[tab].map(l => l.id === id ? { ...l, status, updatedAt: now } : l) }));
      setSelected(s => s?.id === id ? { ...s, status, updatedAt: now } : s);
    } catch (err) {
      onApiError(err);
    }
  };

  // Ouvrir une fiche · automatisme : un lead « Nouveau » passe « En cours » dès sa 1ʳᵉ ouverture.
  const openLead = (lead: Lead) => {
    if (selected?.id === lead.id) { setSelected(null); return; }
    setSelected(lead);
    if (lead.status === "Nouveau") changeStatus(lead.id, "En cours");
  };

  // Après envoi d'un e-mail : notification + un devis passe automatiquement « Devis envoyé ».
  const onReplySent = (info: string) => {
    setComposing(false);
    toast(info);
    if (selected && tab === "devis" && !["Gagné", "Perdu"].includes(selected.status)) {
      changeStatus(selected.id, "Devis envoyé");
    }
  };

  // Candidature validée → création du compte fournisseur avec mot de passe généré
  const [accountPwd, setAccountPwd] = useState<string | null>(null);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);
  useEffect(() => { setAccountMsg(null); setAccountPwd(null); }, [selected?.id]);
  const createAccountFromLead = async (lead: Lead) => {
    setAccountMsg(null);
    setAccountPwd(null);
    try {
      const created = await api.admin.createSupplier({
        name: lead.company,
        contact_name: lead.contact,
        email: lead.email,
        phone: lead.phone ?? undefined,
        country: lead.country,
        city: typeof lead.payload?.city === "string" ? lead.payload.city : undefined,
        categories: Array.isArray(lead.payload?.product_types) ? lead.payload.product_types as string[] : [],
        // Candidature en anglais → espace et e-mail d'accès en anglais.
        language: lead.language,
      });
      setAccountPwd(created.temp_password);
      setAccountMsg(t.accountCreated(created.email));
      changeStatus(lead.id, "Référencé");
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 409) {
        setAccountMsg(t.accountExists);
      } else {
        onApiError(err);
      }
    }
  };

  const searched = leads[tab].filter(l => {
    const q = search.toLowerCase();
    return !q || l.company.toLowerCase().includes(q) || l.contact.toLowerCase().includes(q) || l.country.toLowerCase().includes(q);
  });
  const curr = searched.filter(l => filterStatus === "Tous" || l.status === filterStatus);

  const LEAD_STATUS_FILTERS: (LeadStatus | "Tous")[] = ["Tous", "Nouveau", "En cours", "Devis envoyé", "Traité", "Gagné", "Perdu"];

  // Suppression définitive d'un lead sur demande (RGPD · SEC-03)
  const removeLead = async (lead: Lead) => {
    const ok = await confirm({
      title: t.confirmDeleteTitle(lead.company),
      message: t.confirmDeleteMessage,
      confirmLabel: common.delete, tone: "danger",
    });
    if (!ok) return;
    try {
      await api.admin.deleteLead(lead.id);
      setLeads(prev => ({ ...prev, [tab]: prev[tab].filter(l => l.id !== lead.id) }));
      setSelected(null);
      toast(t.deleted);
    } catch (err) {
      onApiError(err);
    }
  };

  return (
    <AdminShell nav={nav} active="leads">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <h1 className="text-xl font-bold text-[#0a0a0f]">{t.title}</h1>
        <button onClick={() => api.admin.downloadExport("leads").catch(onApiError)}
          className="flex items-center gap-2 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-white transition-colors">
          <Download className="w-4 h-4" /> {common.exportCsv}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <KpiCard label={t.total} value={allLeads.length} sub={t.totalSub} icon={Inbox} color="#0d2265" />
        <KpiCard label={t.newOnes} value={allLeads.filter(l => l.status === "Nouveau").length} sub={t.newSub} icon={TrendingUp} color="#C4613A" />
        <KpiCard label={t.inProgress} value={allLeads.filter(l => l.status === "En cours").length} sub={t.inProgressSub} icon={Activity} color="#059669" />
        <KpiCard label={t.processed} value={allLeads.filter(l => ["Traité","Gagné","Devis envoyé"].includes(l.status)).length} sub={t.processedSub} icon={CheckCircle} color="#7c3aed" />
      </div>

      <div className="flex gap-5">
        {/* Left: list */}
        <div className="flex-1 min-w-0">
          {/* Type tabs */}
          <div className="flex gap-0 border-b border-[rgba(13,34,101,0.1)] mb-4 overflow-x-auto">
            {(Object.keys(t.tabs) as LeadTab[]).map(id => (
              <button key={id} onClick={() => { setTab(id); setSelected(null); setSearch(""); setFilterStatus("Tous"); }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer transition-colors ${tab === id ? "border-[#0d2265] text-[#0d2265]" : "border-transparent text-[#64697d] hover:text-[#0d2265]"}`}>
                {t.tabs[id]}
                {newCount(id) > 0 && <span className="ml-2 bg-[#C4613A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{newCount(id)}</span>}
              </button>
            ))}
          </div>

          {/* Search + view toggle */}
          <div className="flex flex-wrap gap-2 mb-3 items-center">
            <div className="relative flex-1 min-w-44">
              <Search className="w-3.5 h-3.5 text-[#64697d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
                className="w-full pl-8 pr-3 py-2 text-sm border border-[rgba(13,34,101,0.15)] bg-white focus:outline-none focus:border-[#0d2265]" />
            </div>
            <div className="flex border border-[rgba(13,34,101,0.15)] bg-white">
              <button onClick={() => setView("list")} title={t.list}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${view === "list" ? "bg-[#0d2265] text-white" : "text-[#64697d] hover:text-[#0d2265]"}`}>
                <List className="w-3.5 h-3.5" /> {t.list}
              </button>
              <button onClick={() => setView("kanban")} title={t.pipeline}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${view === "kanban" ? "bg-[#0d2265] text-white" : "text-[#64697d] hover:text-[#0d2265]"}`}>
                <LayoutGrid className="w-3.5 h-3.5" /> {t.pipeline}
              </button>
            </div>
          </div>

          {/* Status filter (liste uniquement · en pipeline les colonnes SONT les statuts) */}
          {view === "list" && (
            <div className="flex gap-1 flex-wrap mb-3">
              {LEAD_STATUS_FILTERS.map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors border ${filterStatus === s ? "bg-[#0d2265] text-white border-[#0d2265]" : "bg-white text-[#64697d] border-[rgba(13,34,101,0.15)] hover:border-[#0d2265]"}`}>
                  {s === "Tous" ? t.all : tr(s)}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="bg-white border border-[rgba(13,34,101,0.08)] p-10 text-center text-sm text-[#64697d]">{t.loading}</div>
          )}

          {/* Vue pipeline (Kanban) */}
          {!loading && view === "kanban" && (
            <LeadKanban leads={searched} statuses={STATUSES_FOR[tab]} selectedId={selected?.id}
              onSelect={openLead} onMove={changeStatus} />
          )}

          {/* Vue liste */}
          {!loading && view === "list" && (
            <div className="space-y-1.5">
              {curr.length === 0 && (
                <div className="bg-white border border-[rgba(13,34,101,0.08)] p-10 text-center text-sm text-[#64697d]">{t.empty}</div>
              )}
              {curr.map(lead => {
                const a = leadAlert(lead);
                return (
                <button key={lead.id} onClick={() => openLead(lead)}
                  className={`w-full text-left flex items-start gap-4 px-4 py-4 border cursor-pointer transition-all ${
                    selected?.id === lead.id
                      ? "bg-[#eef1f8] border-[#0d2265]/30"
                      : lead.status === "Nouveau"
                      ? "bg-white border-l-[3px] border-l-[#C4613A] border-t-[rgba(13,34,101,0.08)] border-r-[rgba(13,34,101,0.08)] border-b-[rgba(13,34,101,0.08)] hover:bg-[#f8f9ff]"
                      : "bg-white border-[rgba(13,34,101,0.08)] hover:border-[#0d2265]/20"
                  }`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-[#eef1f8] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#0d2265] font-bold text-xs">{lead.company.slice(0,2).toUpperCase()}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-[#0a0a0f] text-sm">{lead.company}</span>
                      <span className="text-[#64697d] text-xs">·</span>
                      <span className="text-[#64697d] text-xs">{lead.country}</span>
                    </div>
                    <p className="text-xs text-[#64697d]">{lead.contact}
                      {lead.product && <span className="text-[#64697d]"> · {lead.product.length > 60 ? lead.product.slice(0,60)+"…" : lead.product}</span>}
                    </p>
                  </div>
                  {/* Right */}
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] text-[#64697d]">{lead.date}</p>
                    <div className="flex items-center gap-1 justify-end">
                      {a && <span className={`text-[9px] font-bold px-1.5 py-0.5 leading-none ${alertPill(a.kind)}`}>{alerts[a.kind]}</span>}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 inline-block ${statusBadge[lead.status]}`}>{tr(lead.status)}</span>
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-white border border-[rgba(13,34,101,0.1)] self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="px-5 py-4 border-b border-[rgba(13,34,101,0.06)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#eef1f8] flex items-center justify-center shrink-0">
                  <span className="text-[#0d2265] font-bold text-sm">{selected.company.slice(0,2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0a0a0f] text-sm leading-tight">{selected.company}</p>
                  <p className="text-[11px] text-[#64697d] mt-0.5">{selected.country} · {selected.date}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#64697d] hover:text-[#0a0a0f] cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-3">
                <span className={`text-[11px] font-semibold px-2.5 py-1 ${statusBadge[selected.status]}`}>{tr(selected.status)}</span>
                {(() => { const a = leadAlert(selected); return a ? <span className={`text-[10px] font-bold px-2 py-1 ${alertPill(a.kind)}`}>{alerts[a.kind]}</span> : null; })()}
              </div>
              <button onClick={() => setComposing(true)}
                className="w-full mt-3 bg-[#0d2265] text-white text-sm font-semibold py-2.5 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> {t.reply[tab]}
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              {[
                { label: t.contact, val: selected.contact },
                { label: t.email, val: selected.email },
                { label: t.country, val: tr(selected.country) },
                { label: t.fields.language, val: t.languageNames[selected.language] },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest mb-0.5">{r.label}</p>
                  <p className="text-sm text-[#0a0a0f] break-words">{r.val}</p>
                </div>
              ))}
              {selected.product && (
                <div className="bg-[#f4f5f9] p-3 text-xs text-[#0a0a0f] leading-relaxed">
                  <p className="text-[#64697d] font-semibold mb-1 uppercase text-[9px] tracking-widest">{t.request}</p>
                  {selected.product}
                </div>
              )}
              {(() => {
                const p = (selected.payload ?? {}) as Record<string, unknown>;
                // Valeurs de listes fixes (enregistrées en français) affichées dans la langue de l'interface.
                const fmt = (v: unknown) => Array.isArray(v) ? v.map(x => tr(String(x))).join(", ") : tr(String(v));
                const has = (v: unknown) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
                const rows: [string, string][] = [];
                const add = (label: string, v: unknown) => { if (has(v)) rows.push([label, fmt(v)]); };
                const f = t.fields;
                add(f.product_types, p.product_types);
                add(tab === "candidatures" ? f.products_offered : f.products_requested, p.products);
                add(f.sector, p.sector);
                add(f.origin, p.origin);
                add(f.volume, p.volume);
                add(f.forecast, p.forecast);
                add(f.packaging, p.packaging);
                add(f.incoterm, p.incoterm);
                add(f.quality_level, p.quality_level);
                add(f.budget, p.budget);
                add(f.certifications, p.certifications);
                add(f.delivery_delay, p.delivery_delay);
                if ("transport_needed" in p) add(f.transport_needed, p.transport_needed ? common.yes : common.no);
                add(f.delivery_continent, p.delivery_continent);
                add(f.delivery_place, p.delivery_place);
                add(f.delivery_contact, p.delivery_contact);
                add(f.other_need, p.other_need);
                if (rows.length === 0) return null;
                return (
                  <div className="pt-3 border-t border-[rgba(13,34,101,0.07)] space-y-2.5">
                    <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest">{t.requestDetails}</p>
                    {rows.map(([label, val]) => (
                      <div key={label}>
                        <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest mb-0.5">{label}</p>
                        <p className="text-sm text-[#0a0a0f] break-words">{val}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {QUICK_ACTIONS[tab].length > 0 && (
                <div className="pt-3 border-t border-[rgba(13,34,101,0.07)]">
                  <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest mb-2">{t.advance}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS[tab].map(s => (
                      <button key={s} onClick={() => changeStatus(selected.id, s)} disabled={selected.status === s}
                        className={`text-xs font-semibold px-3 py-1.5 transition-colors border ${selected.status === s ? "bg-[#0d2265] text-white border-[#0d2265] cursor-default" : "bg-white text-[#0d2265] border-[rgba(13,34,101,0.2)] hover:bg-[#eef1f8] cursor-pointer"}`}>
                        {tr(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest mb-2">{t.changeStatus}</p>
                <SelectInput value={selected.status} onChange={e => changeStatus(selected.id, e.target.value as LeadStatus)}>
                  {STATUSES_FOR[tab].map(s => <option key={s} value={s}>{tr(s)}</option>)}
                </SelectInput>
              </div>
              {tab === "candidatures" && (
                <div className="pt-2 border-t border-[rgba(13,34,101,0.07)] space-y-2">
                  <button onClick={() => createAccountFromLead(selected)}
                    className="w-full text-sm font-semibold py-2.5 cursor-pointer transition-colors flex items-center justify-center gap-2 bg-[#C4613A] text-white hover:bg-[#A84E2D]">
                    <Key className="w-4 h-4" /> {t.createAccount}
                  </button>
                  {accountMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-xs font-semibold text-emerald-800">{accountMsg}</p>
                      {accountPwd && (
                        <>
                          <p className="text-xs text-emerald-700 mt-1">{common.tempPassword}{" "}
                            <code className="bg-white px-1.5 py-0.5 border border-emerald-200 font-mono font-bold">{accountPwd}</code>
                          </p>
                          <p className="text-[10px] text-emerald-600 mt-1">{t.accountNote}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="pt-2 border-t border-[rgba(13,34,101,0.07)]">
                <button onClick={() => removeLead(selected)}
                  className="w-full text-xs font-medium py-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> {t.deleteLead}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {composing && selected && (() => {
        const d = replyDefaults(selected, tab);
        return (
          <LeadReplyModal lead={selected} defaultSubject={d.subject} defaultBody={d.body}
            onClose={() => setComposing(false)} onSent={onReplySent} />
        );
      })()}
    </AdminShell>
  );
}
