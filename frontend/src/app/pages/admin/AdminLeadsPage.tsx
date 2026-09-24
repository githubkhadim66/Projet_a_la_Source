/** Leads & demandes : 4 files, filtres, changement de statut, création de compte depuis une candidature. */

import { useEffect, useState } from "react";
import { Activity, CheckCircle, Download, Inbox, Key, LayoutGrid, List, Mail, Search, Trash2, TrendingUp, X } from "lucide-react";
import * as api from "@/lib/api";
import { alertPill, leadAlert, STATUSES_FOR, TAB_FOR_QUEUE, TAB_LABELS, statusBadge, toUiLead } from "@/lib/leads";
import type { Lead, LeadStatus, LeadTab } from "@/lib/leads";
import type { Nav } from "@/lib/routes";
import { SelectInput } from "@/app/components/common/fields";
import { AdminShell, KpiCard } from "./AdminShell";
import { LeadKanban } from "./leads/LeadKanban";
import { LeadReplyModal } from "./leads/LeadReplyModal";
import { useConfirm, useToast } from "@/app/components/common/feedback";
import { useAdminGuard } from "./adminSession";

const EMPTY_LEADS: Record<LeadTab, Lead[]> = { catalogue: [], devis: [], sourcing: [], candidatures: [] };

// Boutons « faire avancer » proposés selon le type de demande (1 clic).
const QUICK_ACTIONS: Record<LeadTab, LeadStatus[]> = {
  catalogue: [],
  devis: ["Devis envoyé", "Gagné", "Perdu"],
  sourcing: ["En cours", "Traité"],
  candidatures: [],
};

const REPLY_LABEL: Record<LeadTab, string> = {
  catalogue: "Répondre par e-mail",
  devis: "Répondre / envoyer le devis",
  sourcing: "Répondre au sourcing",
  candidatures: "Répondre au candidat",
};

/** Objet + message pré-remplis pour la réponse à un lead (éditables ensuite). */
function replyDefaults(lead: Lead, tab: LeadTab): { subject: string; body: string } {
  const first = lead.contact.split(/[\s·—-]+/).filter(Boolean)[0] || lead.contact;
  const prod = typeof lead.product === "string" && lead.product ? ` concernant ${lead.product}` : "";
  const subject = tab === "devis" ? "Votre demande de cotation · Funti"
    : tab === "sourcing" ? "Votre demande de sourcing · Funti"
    : tab === "candidatures" ? "Votre candidature fournisseur · Funti"
    : "Votre demande · Funti";
  const intro = tab === "devis" ? `Merci pour votre demande de cotation${prod}.`
    : tab === "sourcing" ? `Merci pour votre demande de sourcing${prod}.`
    : tab === "candidatures" ? "Merci pour votre candidature."
    : "Merci pour votre demande.";
  const middle = tab === "devis" ? "[Détaillez ici votre proposition · produits, prix, logistique, incoterm.]"
    : "[Détaillez ici votre réponse.]";
  const body = `Bonjour ${first},\n\n${intro}\n\n${middle}\n\nBien cordialement,\nL'équipe Funti`;
  return { subject, body };
}

export function AdminLeads({ nav }: { nav: Nav }) {
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
      });
      setAccountPwd(created.temp_password);
      setAccountMsg(`Compte créé · identifiant : ${created.email}`);
      changeStatus(lead.id, "Référencé");
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 409) {
        setAccountMsg("Un compte fournisseur existe déjà avec cet e-mail.");
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
      title: `Supprimer définitivement le lead « ${lead.company} » ?`,
      message: "Cette action est irréversible (RGPD).",
      confirmLabel: "Supprimer", tone: "danger",
    });
    if (!ok) return;
    try {
      await api.admin.deleteLead(lead.id);
      setLeads(prev => ({ ...prev, [tab]: prev[tab].filter(l => l.id !== lead.id) }));
      setSelected(null);
      toast("Lead supprimé.");
    } catch (err) {
      onApiError(err);
    }
  };

  return (
    <AdminShell nav={nav} active="leads">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <h1 className="text-xl font-bold text-[#0a0a0f]">Leads & demandes</h1>
        <button onClick={() => api.admin.downloadExport("leads").catch(onApiError)}
          className="flex items-center gap-2 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-white transition-colors">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <KpiCard label="Total leads" value={allLeads.length} sub="toutes catégories" icon={Inbox} color="#0d2265" />
        <KpiCard label="Nouveaux" value={allLeads.filter(l => l.status === "Nouveau").length} sub="en attente de traitement" icon={TrendingUp} color="#C4613A" />
        <KpiCard label="En cours" value={allLeads.filter(l => l.status === "En cours").length} sub="traitement en cours" icon={Activity} color="#059669" />
        <KpiCard label="Traités" value={allLeads.filter(l => ["Traité","Gagné","Devis envoyé"].includes(l.status)).length} sub="cette période" icon={CheckCircle} color="#7c3aed" />
      </div>

      <div className="flex gap-5">
        {/* Left: list */}
        <div className="flex-1 min-w-0">
          {/* Type tabs */}
          <div className="flex gap-0 border-b border-[rgba(13,34,101,0.1)] mb-4 overflow-x-auto">
            {(Object.keys(TAB_LABELS) as LeadTab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); setSelected(null); setSearch(""); setFilterStatus("Tous"); }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer transition-colors ${tab === t ? "border-[#0d2265] text-[#0d2265]" : "border-transparent text-[#64697d] hover:text-[#0d2265]"}`}>
                {TAB_LABELS[t]}
                {newCount(t) > 0 && <span className="ml-2 bg-[#C4613A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{newCount(t)}</span>}
              </button>
            ))}
          </div>

          {/* Search + view toggle */}
          <div className="flex flex-wrap gap-2 mb-3 items-center">
            <div className="relative flex-1 min-w-44">
              <Search className="w-3.5 h-3.5 text-[#64697d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Société, contact, pays…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-[rgba(13,34,101,0.15)] bg-white focus:outline-none focus:border-[#0d2265]" />
            </div>
            <div className="flex border border-[rgba(13,34,101,0.15)] bg-white">
              <button onClick={() => setView("list")} title="Liste"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${view === "list" ? "bg-[#0d2265] text-white" : "text-[#64697d] hover:text-[#0d2265]"}`}>
                <List className="w-3.5 h-3.5" /> Liste
              </button>
              <button onClick={() => setView("kanban")} title="Pipeline"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${view === "kanban" ? "bg-[#0d2265] text-white" : "text-[#64697d] hover:text-[#0d2265]"}`}>
                <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
              </button>
            </div>
          </div>

          {/* Status filter (liste uniquement · en pipeline les colonnes SONT les statuts) */}
          {view === "list" && (
            <div className="flex gap-1 flex-wrap mb-3">
              {LEAD_STATUS_FILTERS.map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors border ${filterStatus === s ? "bg-[#0d2265] text-white border-[#0d2265]" : "bg-white text-[#64697d] border-[rgba(13,34,101,0.15)] hover:border-[#0d2265]"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="bg-white border border-[rgba(13,34,101,0.08)] p-10 text-center text-sm text-[#64697d]">Chargement des leads…</div>
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
                <div className="bg-white border border-[rgba(13,34,101,0.08)] p-10 text-center text-sm text-[#64697d]">Aucun lead pour ce filtre.</div>
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
                      {a && <span className={`text-[9px] font-bold px-1.5 py-0.5 leading-none ${alertPill(a.kind)}`}>{a.label}</span>}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 inline-block ${statusBadge[lead.status]}`}>{lead.status}</span>
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
                <span className={`text-[11px] font-semibold px-2.5 py-1 ${statusBadge[selected.status]}`}>{selected.status}</span>
                {(() => { const a = leadAlert(selected); return a ? <span className={`text-[10px] font-bold px-2 py-1 ${alertPill(a.kind)}`}>{a.label}</span> : null; })()}
              </div>
              <button onClick={() => setComposing(true)}
                className="w-full mt-3 bg-[#0d2265] text-white text-sm font-semibold py-2.5 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> {REPLY_LABEL[tab]}
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              {[
                { label: "Contact", val: selected.contact },
                { label: "E-mail", val: selected.email },
                { label: "Pays", val: selected.country },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest mb-0.5">{r.label}</p>
                  <p className="text-sm text-[#0a0a0f] break-words">{r.val}</p>
                </div>
              ))}
              {selected.product && (
                <div className="bg-[#f4f5f9] p-3 text-xs text-[#0a0a0f] leading-relaxed">
                  <p className="text-[#64697d] font-semibold mb-1 uppercase text-[9px] tracking-widest">Demande</p>
                  {selected.product}
                </div>
              )}
              {(() => {
                const p = (selected.payload ?? {}) as Record<string, unknown>;
                const fmt = (v: unknown) => Array.isArray(v) ? v.join(", ") : String(v);
                const has = (v: unknown) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
                const rows: [string, string][] = [];
                const add = (label: string, v: unknown) => { if (has(v)) rows.push([label, fmt(v)]); };
                add("Catégories", p.product_types);
                add(tab === "candidatures" ? "Produits proposés" : "Produits demandés", p.products);
                add("Domaine d'activité", p.sector);
                add("Provenance souhaitée", p.origin);
                add("Volume / quantité", p.volume);
                add("Besoin prévisionnel", p.forecast);
                add("Conditionnement", p.packaging);
                add("Incoterm", p.incoterm);
                add("Niveau de qualité", p.quality_level);
                add("Budget", p.budget);
                add("Certifications", p.certifications);
                add("Délai souhaité", p.delivery_delay);
                if ("transport_needed" in p) add("Transport organisé par nous", p.transport_needed ? "Oui" : "Non");
                add("Destination", p.delivery_continent);
                add("Lieu de livraison", p.delivery_place);
                add("Contact sur place", p.delivery_contact);
                add("Autre besoin", p.other_need);
                if (rows.length === 0) return null;
                return (
                  <div className="pt-3 border-t border-[rgba(13,34,101,0.07)] space-y-2.5">
                    <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest">Détails de la demande</p>
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
                  <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest mb-2">Faire avancer</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS[tab].map(s => (
                      <button key={s} onClick={() => changeStatus(selected.id, s)} disabled={selected.status === s}
                        className={`text-xs font-semibold px-3 py-1.5 transition-colors border ${selected.status === s ? "bg-[#0d2265] text-white border-[#0d2265] cursor-default" : "bg-white text-[#0d2265] border-[rgba(13,34,101,0.2)] hover:bg-[#eef1f8] cursor-pointer"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold text-[#64697d] uppercase tracking-widest mb-2">Changer le statut</p>
                <SelectInput value={selected.status} onChange={e => changeStatus(selected.id, e.target.value as LeadStatus)}>
                  {STATUSES_FOR[tab].map(s => <option key={s}>{s}</option>)}
                </SelectInput>
              </div>
              {tab === "candidatures" && (
                <div className="pt-2 border-t border-[rgba(13,34,101,0.07)] space-y-2">
                  <button onClick={() => createAccountFromLead(selected)}
                    className="w-full text-sm font-semibold py-2.5 cursor-pointer transition-colors flex items-center justify-center gap-2 bg-[#C4613A] text-white hover:bg-[#A84E2D]">
                    <Key className="w-4 h-4" /> Créer le compte fournisseur
                  </button>
                  {accountMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-xs font-semibold text-emerald-800">{accountMsg}</p>
                      {accountPwd && (
                        <>
                          <p className="text-xs text-emerald-700 mt-1">Mot de passe temporaire :{" "}
                            <code className="bg-white px-1.5 py-0.5 border border-emerald-200 font-mono font-bold">{accountPwd}</code>
                          </p>
                          <p className="text-[10px] text-emerald-600 mt-1">Transmettez-le de façon sécurisée · il ne sera plus affiché. Le fournisseur pourra le changer à sa première connexion.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="pt-2 border-t border-[rgba(13,34,101,0.07)]">
                <button onClick={() => removeLead(selected)}
                  className="w-full text-xs font-medium py-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer ce lead (RGPD)
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
