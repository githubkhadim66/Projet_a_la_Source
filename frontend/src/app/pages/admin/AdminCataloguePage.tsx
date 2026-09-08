/** Catalogue & stocks : vitrine (visible/vedette), création, édition, suppression, alertes stock. */

import { useEffect, useState } from "react";
import { AlertCircle, Archive, Bell, Check, Download, Edit2, Package, Plus, RotateCcw, Search, Star, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiAdminProduct, ApiSupplier } from "@/lib/api";
import { CAT_CATEGORIES } from "@/lib/constants";
import { fmtDate, productImg } from "@/lib/format";
import type { StockStatus } from "@/lib/leads";
import type { Nav } from "@/lib/routes";
import { AdminShell, KpiCard } from "./AdminShell";
import { useAdminGuard } from "./adminSession";
import { CatalogueComposition } from "./catalogue/CatalogueComposition";
import { CatalogueRequests } from "./catalogue/CatalogueRequests";
import { ProductForm, emptyProduct, productToForm } from "./catalogue/ProductForm";
import type { ProductFormValues } from "./catalogue/ProductForm";

export function AdminCatalogue({ nav }: { nav: Nav }) {
  const onApiError = useAdminGuard(nav);
  const [products, setProducts] = useState<ApiAdminProduct[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [catTab, setCatTab] = useState<"produits"|"stocks"|"pdf"|"demandes"|"archives">("produits");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [filterOrigin, setFilterOrigin] = useState("Tous");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProduct());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [archived, setArchived] = useState<ApiAdminProduct[]>([]);

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.products().then(setProducts).catch(onApiError);
    api.admin.products(true).then(setArchived).catch(onApiError);
    api.admin.suppliers().then(setSuppliers).catch(onApiError);
  }, [onApiError]);

  const toggle = async (id: number, field: "featured") => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    try {
      const updated = await api.admin.updateProduct(id, { [field]: !p[field] });
      setProducts(prev => prev.map(x => x.id === id ? updated : x));
    } catch (err) {
      onApiError(err); // 409 = max 6 en vedette : on ignore silencieusement comme la maquette
    }
  };

  // Corbeille réversible : archiver retire du site/catalogue sans perdre le produit
  const archiveProduct = async (p: ApiAdminProduct) => {
    if (!window.confirm(`Mettre « ${p.name} » à la corbeille ?\n\nIl quitte le site et le catalogue, mais reste restaurable depuis l'onglet « Corbeille ».`)) return;
    try {
      const updated = await api.admin.archiveProduct(p.id);
      setProducts(prev => prev.filter(x => x.id !== p.id));
      setArchived(prev => [...prev, updated]);
    } catch (err) { onApiError(err); }
  };

  const restoreProduct = async (p: ApiAdminProduct) => {
    try {
      const updated = await api.admin.restoreProduct(p.id);
      setArchived(prev => prev.filter(x => x.id !== p.id));
      setProducts(prev => [...prev, updated]);
    } catch (err) { onApiError(err); }
  };

  const purgeProduct = async (p: ApiAdminProduct) => {
    if (!window.confirm(`Supprimer DÉFINITIVEMENT « ${p.name} » ?\n\nCette action est irréversible.`)) return;
    try {
      await api.admin.deleteProduct(p.id);
      setArchived(prev => prev.filter(x => x.id !== p.id));
    } catch (err) { onApiError(err); }
  };

  const openCreate = () => {
    setForm(emptyProduct(suppliers[0]?.id));
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (p: ApiAdminProduct) => {
    setForm(productToForm(p));
    setEditingId(p.id);
    setFormError(null);
    setShowForm(false);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setFormError(null); };

  /** Champs communs à la création et à la modification. */
  const formPayload = () => ({
    name: form.name, origin: form.origin, category: form.category, packaging: form.packaging, moq: form.moq,
    image: form.image, description: form.description, benefits: form.benefits,
    stock_kg: Number(form.stock) || 0, status: form.status, delay: form.delay,
    price_per_kg: form.price_per_kg, bulk_price: form.bulk_price, harvest_period: form.harvest_period,
  });

  const submitForm = async () => {
    if (!form.name.trim()) { setFormError("Le nom du produit est requis."); return; }
    if (editingId === null && !form.supplier_id) { setFormError("Sélectionnez un fournisseur."); return; }
    setFormError(null);
    try {
      if (editingId !== null) {
        const updated = await api.admin.updateProduct(editingId, formPayload());
        setProducts(prev => prev.map(x => x.id === editingId ? updated : x));
      } else {
        const created = await api.admin.createProduct({
          ...formPayload(),
          supplier_id: Number(form.supplier_id),
          ref: form.ref || `ALS-NEW-${String(products.length + 1).padStart(3, "0")}`,
        });
        setProducts(prev => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 409) setFormError("Cette référence est déjà utilisée.");
      else onApiError(err);
    }
  };

  const featuredCount = products.filter(p => p.featured).length;
  const ruptures = products.filter(p => p.status === "Rupture").length;
  const staleCount = products.filter(p => p.stale).length;

  // Pays présents dans le catalogue (valorisation du local · filtre interne)
  const origins = Array.from(new Set(products.map(p => p.origin).filter(Boolean) as string[])).sort();

  const filteredProds = products.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q) || p.supplier_name.toLowerCase().includes(q))
      && (filterCat === "Toutes" || p.category === filterCat)
      && (filterOrigin === "Tous" || p.origin === filterOrigin);
  });

  const filteredStocks = products.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.ref.toLowerCase().includes(q) || s.supplier_name.toLowerCase().includes(q);
  });

  const stockDot = (st: StockStatus) =>
    st === "En stock" ? "bg-emerald-500" : st === "Sur commande" ? "bg-amber-400" : "bg-red-500";

  // Relance d'actualisation des stocks (FRS-05) · une relance par fournisseur
  const [remindMsg, setRemindMsg] = useState<string | null>(null);
  const remindSupplier = async (supplierId: number) => {
    try {
      const res = await api.admin.remindSupplierStock(supplierId);
      setRemindMsg(res.message);
      setTimeout(() => setRemindMsg(null), 5000);
    } catch (err) {
      onApiError(err);
    }
  };

  return (
    <AdminShell nav={nav} active="catalogue">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <h1 className="text-xl font-bold text-[#0a0a0f]">Catalogue</h1>
        <div className="flex items-center gap-2">
          {(catTab === "produits" || catTab === "stocks") && (
            <button onClick={() => api.admin.downloadExport("products").catch(onApiError)}
              className="flex items-center gap-2 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-white transition-colors">
              <Download className="w-4 h-4" /> Exporter CSV
            </button>
          )}
          {catTab === "produits" && (
            <button onClick={showForm ? closeForm : openCreate}
              className="flex items-center gap-2 bg-[#0d2265] text-white text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-[#091a52] transition-colors">
              <Plus className="w-4 h-4" /> Ajouter un produit
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Produits" value={products.length} sub={`${featuredCount} en vedette`} icon={Package} color="#0d2265" />
        <KpiCard label="En vedette" value={`${featuredCount}/6`} sub="slots page d'accueil" icon={Star} color="#C4613A" />
        <KpiCard label="Stocks suivis" value={products.length} sub={`${ruptures > 0 ? ruptures+" rupture(s)" : "aucune rupture"}`} icon={Archive} color={ruptures > 0 ? "#ef4444" : "#059669"} />
        <KpiCard label="Alertes" value={staleCount} sub="données non actualisées" icon={AlertCircle} color={staleCount > 0 ? "#d97706" : "#059669"} />
      </div>

      {/* Section tabs */}
      <div className="flex gap-0 border-b border-[rgba(13,34,101,0.1)] mb-5 overflow-x-auto">
        {([
          ["produits", "Produits & vitrine"],
          ["stocks", "Stocks & alertes"],
          ["pdf", "Catalogue PDF"],
          ["demandes", "Demandes de catalogue"],
          ["archives", "Corbeille"],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => { setCatTab(id); setSearch(""); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap ${catTab === id ? "border-[#0d2265] text-[#0d2265]" : "border-transparent text-[#64697d] hover:text-[#0d2265]"}`}>
            {label}
            {id === "stocks" && ruptures > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{ruptures}</span>}
            {id === "archives" && archived.length > 0 && <span className="bg-[#64697d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{archived.length}</span>}
          </button>
        ))}
      </div>

      {/* ── ONGLETS CATALOGUE PDF ── */}
      {catTab === "pdf" && <CatalogueComposition onApiError={onApiError} />}
      {catTab === "demandes" && <CatalogueRequests onApiError={onApiError} />}

      {/* ── ONGLET CORBEILLE ── */}
      {catTab === "archives" && (
        <div>
          <p className="text-sm text-[#64697d] mb-4">
            Les produits archivés ne sont plus sur le site ni dans le catalogue, mais restent conservés.
            <strong className="text-[#0a0a0f]"> Restaurez-les</strong> à tout moment, ou supprimez-les définitivement.
          </p>
          {archived.length === 0 && (
            <div className="bg-white border border-[rgba(13,34,101,0.08)] p-10 text-center text-sm text-[#64697d]">La corbeille est vide.</div>
          )}
          <div className="space-y-1.5">
            {archived.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-white border border-[rgba(13,34,101,0.08)] px-4 py-3">
                <div className="w-10 h-10 bg-[#eef1f8] overflow-hidden shrink-0 grayscale opacity-70">
                  <img src={productImg(p.image, "w=80&h=80")} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-[#0a0a0f]">{p.name}</span>
                  <p className="text-xs text-[#64697d] mt-0.5">{p.origin}{p.packaging ? ` · ${p.packaging}` : ""}{p.moq ? ` · MOQ ${p.moq}` : ""} · {p.supplier_name} · <span className="font-mono">{p.ref}</span></p>
                </div>
                <button onClick={() => restoreProduct(p)}
                  className="shrink-0 flex items-center gap-1.5 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-emerald-50 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                </button>
                <button onClick={() => purgeProduct(p)}
                  className="shrink-0 flex items-center gap-1.5 border border-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {(catTab === "produits" || catTab === "stocks") && (
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-[#64697d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={catTab === "produits" ? "Nom, réf, fournisseur…" : "Produit, référence…"}
            className="w-full pl-8 pr-3 py-2 text-sm border border-[rgba(13,34,101,0.15)] bg-white focus:outline-none focus:border-[#0d2265]" />
        </div>
        {catTab === "produits" && (
          <div className="flex gap-1 flex-wrap">
            {["Toutes", ...CAT_CATEGORIES].map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-2.5 py-2 text-xs font-medium cursor-pointer border transition-colors ${filterCat === c ? "bg-[#0d2265] text-white border-[#0d2265]" : "bg-white text-[#64697d] border-[rgba(13,34,101,0.15)] hover:border-[#0d2265]"}`}>
                {c}
              </button>
            ))}
          </div>
        )}
        {catTab === "produits" && origins.length > 0 && (
          <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}
            title="Filtrer par pays d'origine"
            className="px-2.5 py-2 text-xs font-medium border bg-white text-[#0d2265] border-[rgba(13,34,101,0.15)] focus:outline-none focus:border-[#0d2265] cursor-pointer appearance-none">
            <option value="Tous">Tous les pays</option>
            {origins.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
      </div>
      )}

      {/* ── TAB: PRODUITS ── */}
      {catTab === "produits" && (
        <>
          {showForm && (
            <div className="mb-5">
              <ProductForm values={form} setValues={setForm} suppliers={suppliers} isEdit={false}
                error={formError} onSubmit={submitForm} onCancel={closeForm} />
            </div>
          )}
          <div className="space-y-1.5">
            {filteredProds.map(p => (
              <div key={p.id} className="bg-white border border-[rgba(13,34,101,0.08)] hover:border-[#0d2265]/20 transition-all">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 bg-[#eef1f8] overflow-hidden shrink-0">
                    <img src={productImg(p.image, "w=80&h=80")} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[#0a0a0f]">{p.name}</span>
                      {p.category && <span className="text-[10px] text-[#64697d] bg-[#f0f2f7] px-1.5 py-0.5">{p.category}</span>}
                      {p.featured && <span className="text-[10px] text-[#C4613A] font-semibold">★ Vedette</span>}
                    </div>
                    <p className="text-xs text-[#64697d] mt-0.5">{p.origin}{p.packaging ? ` · ${p.packaging}` : ""}{p.moq ? ` · MOQ ${p.moq}` : ""} · {p.supplier_name} · <span className="font-mono">{p.ref}</span></p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => editingId === p.id ? setEditingId(null) : openEdit(p)} title="Modifier la fiche"
                      className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors rounded hover:bg-[#f0f2f7] ${editingId === p.id ? "text-[#C4613A]" : "text-[#64697d]/40 hover:text-[#0d2265]"}`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggle(p.id, "featured")}
                      title={p.featured ? "Retirer de la vedette (accueil)" : featuredCount >= 6 ? "Maximum 6 en vedette" : "Mettre en vedette sur l'accueil"}
                      className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors rounded hover:bg-[#f0f2f7] ${p.featured ? "text-[#C4613A]" : featuredCount >= 6 && !p.featured ? "text-[#64697d]/15 cursor-not-allowed" : "text-[#64697d]/30 hover:text-[#C4613A]"}`}>
                      <Star className="w-4 h-4" fill={p.featured ? "#C4613A" : "none"} />
                    </button>
                    <button onClick={() => archiveProduct(p)} title="Mettre à la corbeille (réversible)"
                      className="w-8 h-8 flex items-center justify-center text-[#64697d]/20 hover:text-red-500 cursor-pointer transition-colors rounded hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Formulaire de modification */}
                {editingId === p.id && (
                  <div className="border-t border-[rgba(13,34,101,0.08)] bg-[#f4f5f9] p-4">
                    <ProductForm values={form} setValues={setForm} suppliers={suppliers} isEdit
                      error={formError} onSubmit={submitForm} onCancel={closeForm} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAB: STOCKS ── */}
      {catTab === "stocks" && (
        <div className="space-y-1.5">
          {remindMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 mb-4 text-sm text-emerald-800">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {remindMsg}
            </div>
          )}
          {staleCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 mb-4 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{staleCount} référence{staleCount > 1 ? "s" : ""} sans mise à jour depuis plus de 14 jours</span>
            </div>
          )}
          {filteredStocks.map(s => (
            <div key={s.ref} className={`flex items-center gap-4 bg-white border px-4 py-3 transition-all ${s.stale ? "border-amber-200 bg-amber-50/30" : s.status === "Rupture" ? "border-red-200 bg-red-50/20" : "border-[rgba(13,34,101,0.08)] hover:border-[#0d2265]/20"}`}>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${stockDot(s.status)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[#0a0a0f]">{s.name}</span>
                  {s.stale && <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5">Non actualisé</span>}
                  {s.status === "Rupture" && <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5">Rupture</span>}
                </div>
                <p className="text-xs text-[#64697d] mt-0.5"><span className="font-mono">{s.ref}</span> · {s.category} · {s.supplier_name}</p>
              </div>
              {s.stale && (
                <button onClick={() => remindSupplier(s.supplier_id)} title={`Relancer ${s.supplier_name} par e-mail`}
                  className="shrink-0 flex items-center gap-1.5 border border-amber-300 text-amber-700 text-xs font-semibold px-2.5 py-1.5 cursor-pointer hover:bg-amber-100 transition-colors">
                  <Bell className="w-3.5 h-3.5" /> Relancer
                </button>
              )}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#0a0a0f]">{s.stock_kg.toLocaleString("fr-FR")} kg</p>
                <p className="text-[10px] text-[#64697d]">Màj {fmtDate(s.updated_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
