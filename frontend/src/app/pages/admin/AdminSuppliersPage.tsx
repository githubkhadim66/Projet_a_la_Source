/** Fournisseurs : comptes (création + mot de passe temporaire), activation, propositions. */

import { useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle, Clock, Download, Edit2, Eye, EyeOff, Key, Package, Plus, RefreshCw, Users, X } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiProposal, ApiSupplier } from "@/lib/api";
import { CAT_CATEGORIES, SUPPLIER_COUNTRIES } from "@/lib/constants";
import { fmtDate, productImg } from "@/lib/format";
import type { Nav } from "@/lib/routes";
import { AdminShell, KpiCard } from "./AdminShell";
import { useAdminGuard } from "./adminSession";

export function AdminFournisseurs({ nav }: { nav: Nav }) {
  const onApiError = useAdminGuard(nav);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [selected, setSelected] = useState<ApiSupplier | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ name:"", country:"Sénégal", email:"", contact_name:"", categories:[] as string[] });
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [viewProposal, setViewProposal] = useState<ApiProposal | null>(null);
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.suppliers().then(setSuppliers).catch(onApiError);
    api.admin.proposals(true).then(setProposals).catch(onApiError);
  }, [onApiError]);

  const toggleCat = (c: string) => setForm(f => ({
    ...f, categories: f.categories.includes(c) ? f.categories.filter(x => x !== c) : [...f.categories, c]
  }));

  const createSupplier = async () => {
    if (!form.name.trim() || !form.email.trim()) { setFormError("Nom et e-mail sont requis."); return; }
    setFormError(null);
    try {
      const created = await api.admin.createSupplier(form);
      setSuppliers(prev => [created, ...prev]);
      setShowCreate(false);
      setForm({ name:"", country:"Sénégal", email:"", contact_name:"", categories:[] });
      setSelected(created);
      setTempPwd(created.temp_password);
      setBanner(`Compte créé pour ${created.name} — identifiant : ${created.email}`);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 409) setFormError("Cet e-mail est déjà référencé.");
      else onApiError(err);
    }
  };

  const toggleStatus = async (id: number) => {
    const s = suppliers.find(x => x.id === id);
    if (!s) return;
    try {
      const updated = await api.admin.updateSupplier(id, { is_active: !s.is_active });
      setSuppliers(prev => prev.map(x => x.id === id ? updated : x));
      setSelected(sel => sel?.id === id ? updated : sel);
    } catch (err) {
      onApiError(err);
    }
  };

  const resetPassword = async (s: ApiSupplier) => {
    try {
      const res = await api.admin.resetSupplierPassword(s.id);
      setTempPwd(res.temp_password);
      setBanner(`Mot de passe réinitialisé pour ${s.name} — identifiant : ${s.email}`);
    } catch (err) {
      onApiError(err);
    }
  };

  const decideProposal = async (p: ApiProposal, decision: "Approuvé" | "Refusé") => {
    try {
      await api.admin.decideProposal(p.id, decision);
      setProposals(prev => prev.filter(x => x.id !== p.id));
      if (decision === "Approuvé") {
        setBanner(`Proposition « ${p.name} » validée — un produit masqué a été créé, complétez sa fiche dans Catalogue & stocks.`);
        api.admin.suppliers().then(setSuppliers).catch(() => {});
      }
    } catch (err) {
      onApiError(err);
    }
  };

  // Modification des informations d'un fournisseur
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", contact_name: "", phone: "", country: "", city: "", categories: [] as string[] });
  useEffect(() => { setEditMode(false); }, [selected?.id]);
  const openEditSupplier = (s: ApiSupplier) => {
    setEditForm({
      name: s.name, contact_name: s.contact_name ?? "", phone: s.phone ?? "",
      country: s.country ?? "Sénégal", city: s.city ?? "", categories: s.categories,
    });
    setEditMode(true);
  };
  const toggleEditCat = (c: string) => setEditForm(f => ({
    ...f, categories: f.categories.includes(c) ? f.categories.filter(x => x !== c) : [...f.categories, c]
  }));
  const saveSupplier = async (id: number) => {
    try {
      const updated = await api.admin.updateSupplier(id, editForm);
      setSuppliers(prev => prev.map(x => x.id === id ? updated : x));
      setSelected(updated);
      setEditMode(false);
    } catch (err) {
      onApiError(err);
    }
  };

  const statusLabel = (s: ApiSupplier) => s.is_active ? "Actif" : "Désactivé";
  const badgeStatus = (active: boolean) =>
    active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
    "bg-gray-100 text-gray-500 border border-gray-200";

  const actifCount = suppliers.filter(s => s.is_active).length;
  const attenteCount = suppliers.length - actifCount;

  return (
    <AdminShell nav={nav} active="fournisseurs">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <h1 className="text-xl font-bold text-[#0a0a0f]">Fournisseurs</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => api.admin.downloadExport("suppliers").catch(onApiError)}
            className="flex items-center gap-2 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-white transition-colors">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
          <button onClick={() => { setShowCreate(true); setSelected(null); }}
            className="flex items-center gap-2 bg-[#0d2265] text-white text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-[#091a52] transition-colors">
            <Plus className="w-4 h-4" /> Créer un compte fournisseur
          </button>
        </div>
      </div>

      {/* Propositions — action requise, affichées en premier */}
      {proposals.length > 0 && (
        <div className="mb-7 border-l-4 border-amber-400 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm font-bold text-amber-900">
              {proposals.length} proposition{proposals.length > 1 ? "s" : ""} en attente de validation
            </p>
            <span className="ml-auto text-[10px] text-amber-700 font-medium">Action requise</span>
          </div>
          <div className="space-y-2">
            {proposals.map(p => (
              <div key={p.id} className="bg-white border border-amber-200 px-4 py-3 flex items-center gap-4 flex-wrap">
                <button onClick={() => setViewProposal(p)} className="w-11 h-11 bg-amber-100 overflow-hidden shrink-0 cursor-pointer" title="Voir la fiche">
                  {p.image ? <img src={productImg(p.image, "w=80&h=80")} alt="" className="w-full h-full object-cover" />
                    : <span className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0a0a0f] text-sm">{p.name}</p>
                  <p className="text-xs text-[#64697d] mt-0.5">
                    Proposé par <span className="font-semibold text-[#0d2265]">{p.supplier_name}</span> · {fmtDate(p.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setViewProposal(p)}
                    className="flex items-center gap-1.5 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-xs font-semibold px-3 py-2 cursor-pointer hover:bg-white transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Détails
                  </button>
                  <button onClick={() => decideProposal(p, "Approuvé")}
                    className="flex items-center gap-1.5 bg-[#0d2265] text-white text-xs font-semibold px-3 py-2 cursor-pointer hover:bg-[#091a52] transition-colors">
                    <Check className="w-3.5 h-3.5" /> Valider
                  </button>
                  <button onClick={() => decideProposal(p, "Refusé")}
                    className="border border-[rgba(13,34,101,0.15)] text-[#64697d] text-xs px-3 py-2 hover:bg-white cursor-pointer transition-colors">
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fiche détaillée d'une proposition (avant décision) */}
      {viewProposal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setViewProposal(null)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
              <div className="bg-[#0d2265] text-white px-5 py-3.5 flex items-center gap-3 sticky top-0">
                <Package className="w-4 h-4 shrink-0" />
                <p className="font-semibold text-sm">Proposition de produit</p>
                <button onClick={() => setViewProposal(null)} className="ml-auto text-white/60 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="sm:w-48 shrink-0">
                    <div className="aspect-[4/3] bg-[#eef1f8] overflow-hidden border border-[rgba(13,34,101,0.1)]">
                      {viewProposal.image
                        ? <img src={productImg(viewProposal.image)} alt="" className="w-full h-full object-cover" />
                        : <span className="w-full h-full flex items-center justify-center text-[#c3c9dd]"><Package className="w-10 h-10" /></span>}
                    </div>
                    {!viewProposal.image && <p className="text-[10px] text-[#64697d] mt-1.5 text-center">Aucune photo fournie</p>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#0a0a0f]">{viewProposal.name}</h3>
                    <p className="text-xs text-[#64697d] mt-0.5">
                      Proposé par <span className="font-semibold text-[#0d2265]">{viewProposal.supplier_name}</span> · {fmtDate(viewProposal.created_at)}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm">
                      {[
                        ["Catégorie", viewProposal.category],
                        ["Origine", viewProposal.origin],
                        ["Conditionnement", viewProposal.packaging],
                        ["MOQ", viewProposal.moq],
                        ["Volumes", viewProposal.volumes],
                        ["Prix au kilo", viewProposal.price_per_kg],
                        ["Prix en vrac", viewProposal.bulk_price],
                        ["Période de récolte", viewProposal.harvest_period],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest">{label}</p>
                          <p className="text-[#0a0a0f]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {viewProposal.description && (
                  <div className="mt-5">
                    <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Description</p>
                    <p className="text-sm text-[#0a0a0f] leading-relaxed whitespace-pre-line">{viewProposal.description}</p>
                  </div>
                )}
                {viewProposal.benefits && (
                  <div className="mt-4 bg-[#fffaf7] border border-[rgba(196,97,58,0.2)] p-3">
                    <p className="text-[10px] font-bold text-[#C4613A] uppercase tracking-widest mb-1">Bienfaits</p>
                    <p className="text-sm text-[#6b5a4e] leading-relaxed whitespace-pre-line">{viewProposal.benefits}</p>
                  </div>
                )}
                {viewProposal.certifications.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1.5">Certifications</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewProposal.certifications.map(c => <span key={c} className="text-[11px] bg-[#eef1f8] text-[#0d2265] px-2 py-0.5">{c}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-[rgba(13,34,101,0.08)] flex items-center gap-3 sticky bottom-0 bg-white">
                <button onClick={() => { decideProposal(viewProposal, "Approuvé"); setViewProposal(null); }}
                  className="flex items-center gap-2 bg-[#0d2265] text-white text-sm font-semibold px-5 py-2.5 cursor-pointer hover:bg-[#091a52] transition-colors">
                  <Check className="w-4 h-4" /> Valider — créer le produit
                </button>
                <button onClick={() => { decideProposal(viewProposal, "Refusé"); setViewProposal(null); }}
                  className="border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-red-50 transition-colors">
                  Refuser
                </button>
                <button onClick={() => setViewProposal(null)} className="ml-auto text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer px-3 py-2.5">Fermer</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <KpiCard label="Total fournisseurs" value={suppliers.length} sub="comptes créés" icon={Users} color="#0d2265" />
        <KpiCard label="Actifs" value={actifCount} sub="accès activé" icon={CheckCircle} color="#059669" />
        <KpiCard label="Désactivés" value={attenteCount} sub="accès suspendu" icon={Clock} color="#d97706" />
        <KpiCard label="Produits référencés" value={suppliers.reduce((a, s) => a + s.products_count, 0)} sub="au total" icon={Package} color="#7c3aed" />
      </div>

      {/* Formulaire de création */}
      {showCreate && (
        <div className="bg-white border border-[rgba(13,34,101,0.15)] p-6 mb-6">
          <h3 className="font-semibold text-[#0a0a0f] mb-5 flex items-center gap-2">
            <Key className="w-4 h-4 text-[#C4613A]" /> Nouveau compte fournisseur
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-[#64697d] uppercase tracking-wide mb-1.5">Nom de la société *</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Coopérative Kaydara"
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0d2265]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64697d] uppercase tracking-wide mb-1.5">Pays</label>
              <select value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))}
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0d2265] appearance-none bg-white">
                {SUPPLIER_COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64697d] uppercase tracking-wide mb-1.5">E-mail de connexion *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="contact@fournisseur.com"
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0d2265]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64697d] uppercase tracking-wide mb-1.5">Nom du contact</label>
              <input value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} placeholder="Amadou Diallo"
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0d2265]" />
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#64697d] uppercase tracking-wide mb-2">Catégories de produits</label>
            <div className="flex flex-wrap gap-2">
              {CAT_CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => toggleCat(c)}
                  className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-colors ${form.categories.includes(c) ? "bg-[#0d2265] text-white border-[#0d2265]" : "border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:border-[#0d2265]"}`}>
                  {form.categories.includes(c) && <span className="mr-1">✓</span>}{c}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#f4f5f9] border border-[rgba(13,34,101,0.1)] p-4 text-sm text-[#64697d] mb-5">
            <span className="font-semibold text-[#0a0a0f]">Note :</span> Un mot de passe temporaire sera généré automatiquement et devra être transmis au fournisseur (il lui est aussi envoyé par e-mail). Il se connecte ensuite avec son e-mail et ce mot de passe.
          </div>
          {formError && <p className="text-xs text-red-600 mb-3">{formError}</p>}
          <div className="flex gap-3">
            <button onClick={createSupplier}
              className="bg-[#C4613A] text-white text-sm font-semibold px-5 py-2.5 cursor-pointer hover:bg-[#A84E2D] transition-colors flex items-center gap-2">
              <Key className="w-4 h-4" /> Créer le compte & générer le mot de passe
            </button>
            <button onClick={() => setShowCreate(false)} className="border border-[rgba(13,34,101,0.2)] text-[#64697d] text-sm px-5 py-2.5 cursor-pointer hover:bg-[#f4f5f9] transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Bandeau d'information (mot de passe temporaire montré une seule fois) */}
      {banner && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-800 mb-1">{banner}</p>
            {tempPwd && (
              <>
                <p className="text-sm text-emerald-700">Mot de passe temporaire : <code className="bg-white px-2 py-0.5 border border-emerald-200 font-mono font-bold">{tempPwd}</code></p>
                <p className="text-xs text-emerald-600 mt-1">Transmettez ce mot de passe de façon sécurisée — il ne sera plus affiché.</p>
              </>
            )}
          </div>
          <button onClick={() => { setBanner(null); setTempPwd(null); }} className="text-emerald-600 hover:text-emerald-800 cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-white border border-[rgba(13,34,101,0.1)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(13,34,101,0.08)] bg-[#f4f5f9]">
                {["Fournisseur","Pays","Catégories","Produits","Dernière connexion","Statut",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#64697d] uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#64697d]">Chargement des fournisseurs…</td></tr>
              )}
              {suppliers.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)}
                  className={`border-b border-[rgba(13,34,101,0.06)] cursor-pointer transition-colors ${selected?.id === s.id ? "bg-[#eef1f8]" : "hover:bg-[#f4f5f9]"}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#0a0a0f]">{s.name}</p>
                    <p className="text-xs text-[#64697d] font-mono">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#64697d]">{s.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.categories.map(c => <span key={c} className="text-[10px] bg-[#eef1f8] text-[#0d2265] px-1.5 py-0.5">{c}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-[#64697d] font-medium">{s.products_count}</td>
                  <td className="px-4 py-3 text-[#64697d] text-xs">{s.last_login_at ? fmtDate(s.last_login_at) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 ${badgeStatus(s.is_active)}`}>{statusLabel(s)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); toggleStatus(s.id); }}
                      className={`text-xs font-medium px-2 py-1 cursor-pointer transition-colors border ${s.is_active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                      {s.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Panneau de détail */}
        {selected && (
          <div className="w-72 shrink-0 bg-white border border-[rgba(13,34,101,0.1)] p-5 self-start sticky top-20">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-bold text-[#0a0a0f]">{selected.name}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 mt-1 inline-block ${badgeStatus(selected.is_active)}`}>{statusLabel(selected)}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#64697d] hover:text-[#0a0a0f] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {editMode ? (
              /* Formulaire de modification des informations */
              <div className="space-y-3 text-sm">
                {([
                  ["name", "Société"], ["contact_name", "Contact"], ["phone", "Téléphone"], ["city", "Ville"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">{label}</label>
                    <input value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0d2265]" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Pays</label>
                  <select value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:border-[#0d2265]">
                    {SUPPLIER_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Catégories</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CAT_CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => toggleEditCat(c)}
                        className={`px-2 py-1 text-[10px] font-semibold border cursor-pointer transition-colors ${editForm.categories.includes(c) ? "bg-[#0d2265] text-white border-[#0d2265]" : "border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:border-[#0d2265]"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button onClick={() => saveSupplier(selected.id)}
                    className="flex-1 bg-[#0d2265] text-white text-xs font-bold py-2.5 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Enregistrer
                  </button>
                  <button onClick={() => setEditMode(false)}
                    className="border border-[rgba(13,34,101,0.15)] text-[#64697d] text-xs px-4 py-2.5 cursor-pointer hover:bg-[#f4f5f9] transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  { label: "Pays", val: selected.country ?? "—" },
                  { label: "E-mail", val: selected.email },
                  { label: "Contact", val: selected.contact_name ?? "—" },
                  { label: "Téléphone", val: selected.phone ?? "—" },
                  { label: "Ville", val: selected.city ?? "—" },
                  { label: "Créé le", val: fmtDate(selected.created_at) },
                  { label: "Dernière connexion", val: selected.last_login_at ? fmtDate(selected.last_login_at) : "—" },
                  { label: "Produits référencés", val: String(selected.products_count) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between gap-3">
                    <span className="text-[#64697d] shrink-0">{row.label}</span>
                    <span className="text-[#0a0a0f] font-medium text-right break-all">{row.val}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-[rgba(13,34,101,0.08)]">
                  <p className="text-[#64697d] mb-2">Catégories</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.categories.map(c => <span key={c} className="text-[10px] bg-[#eef1f8] text-[#0d2265] px-2 py-0.5">{c}</span>)}
                  </div>
                </div>
                <div className="pt-3 border-t border-[rgba(13,34,101,0.08)] space-y-2">
                  <button onClick={() => openEditSupplier(selected)}
                    className="w-full text-sm font-semibold py-2.5 cursor-pointer transition-colors flex items-center justify-center gap-2 border border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:bg-[#f4f5f9]">
                    <Edit2 className="w-4 h-4" /> Modifier les informations
                  </button>
                  <button onClick={() => toggleStatus(selected.id)}
                    className={`w-full text-sm font-semibold py-2.5 cursor-pointer transition-colors flex items-center justify-center gap-2 border ${selected.is_active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                    {selected.is_active ? <><EyeOff className="w-4 h-4" /> Désactiver le compte</> : <><Eye className="w-4 h-4" /> Activer le compte</>}
                  </button>
                  <button onClick={() => resetPassword(selected)}
                    className="w-full text-sm font-semibold py-2.5 cursor-pointer transition-colors flex items-center justify-center gap-2 border border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:bg-[#f4f5f9]">
                    <RefreshCw className="w-4 h-4" /> Réinitialiser le mot de passe
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </AdminShell>
  );
}
