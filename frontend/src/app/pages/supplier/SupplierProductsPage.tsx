/** Espace fournisseur · Produits & stocks : exploration des fiches (photo + détails complets),
 *  recherche, et mise à jour stock/dispo/délai. Les références non actualisées depuis 14 jours
 *  (FRS-05) sont signalées visuellement. Le fournisseur voit l'intégralité de ses propres fiches,
 *  informations commerciales internes comprises.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Edit2, PackageX, Plus, Search } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiProduct } from "@/lib/api";
import { fmtDate, productImg } from "@/lib/format";
import { baseUnitOf, isStale, packagesFor, STALE_DAYS, staleProducts, stockInPackages } from "@/lib/supplierMetrics";
import type { StockStatus } from "@/lib/leads";
import type { Nav } from "@/lib/routes";
import { DELAIS_PRODUIT } from "@/lib/constants";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, SelectInput, TextInput } from "@/app/components/common/fields";
import { SupplierShell } from "./SupplierShell";

const AUTRE_DELAI = "Autre (préciser)";

const STATUS_BADGE: Record<StockStatus, string> = {
  "En stock": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Sur commande": "bg-amber-50 text-amber-700 border border-amber-200",
  "Rupture": "bg-red-50 text-red-600 border border-red-200",
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function SupplierProducts({ nav }: { nav: Nav }) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ stock: string; status: StockStatus; delay: string }>({ stock: "", status: "En stock", delay: "" });
  const [delayCustom, setDelayCustom] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const logout = useCallback(() => { api.setSupplierToken(null); nav("login"); }, [nav]);

  useEffect(() => {
    if (!api.getSupplierToken()) { nav("login"); return; }
    api.supplier.myProducts()
      .then(setProducts)
      .catch(err => { if (err instanceof api.ApiError && err.status === 401) logout(); })
      .finally(() => setLoading(false));
  }, [nav, logout]);

  const openEdit = (p: ApiProduct) => {
    setEditing(p.id); setExpanded(null);
    setEditData({ stock: String(p.stock_kg), status: p.status, delay: p.delay });
    setDelayCustom(!!p.delay && !DELAIS_PRODUIT.includes(p.delay));
  };

  // Cohérence statut ↔ stock : « Rupture » force la quantité à 0.
  const changeStatus = (status: StockStatus) =>
    setEditData(d => ({ ...d, status, stock: status === "Rupture" ? "0" : d.stock }));

  const save = async (id: number) => {
    const qty = Number(editData.stock);
    if (editData.status === "En stock" && (!editData.stock || qty <= 0)) {
      setToast("Un produit « En stock » doit avoir une quantité supérieure à 0 · choisissez « Sur commande » ou « Rupture ».");
      setTimeout(() => setToast(null), 4500);
      return;
    }
    try {
      const updated = await api.supplier.updateProduct(id, {
        stock_kg: Number(editData.stock), status: editData.status, delay: editData.delay,
      });
      const wasRupture = products.find(p => p.id === id)?.status === "Rupture";
      setProducts(ps => ps.map(p => p.id === id ? updated : p));
      setEditing(null);
      setToast(updated.status === "Rupture" && !wasRupture
        ? "Rupture enregistrée · pensez à réapprovisionner au plus vite."
        : `Mise à jour enregistrée le ${fmtDate(updated.updated_at)}`);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      setToast("Échec de l'enregistrement · réessayez.");
      setTimeout(() => setToast(null), 3500);
    }
  };

  const staleCount = staleProducts(products).length;

  const statusCounts = useMemo(() => ({
    "En stock": products.filter(p => p.status === "En stock").length,
    "Sur commande": products.filter(p => p.status === "Sur commande").length,
    "Rupture": products.filter(p => p.status === "Rupture").length,
  }), [products]);

  const categories = useMemo(
    () => [...new Set(products.map(p => p.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, "fr")),
    [products]);

  const anyFilter = !!query || statusFilter !== "all" || categoryFilter !== "all" || staleOnly;
  const resetFilters = () => { setQuery(""); setStatusFilter("all"); setCategoryFilter("all"); setStaleOnly(false); };

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return products.filter(p => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (staleOnly && !isStale(p)) return false;
      if (q && ![p.name, p.ref, p.origin ?? "", p.category ?? ""].some(v => norm(v).includes(q))) return false;
      return true;
    });
  }, [products, query, statusFilter, categoryFilter, staleOnly]);

  return (
    <SupplierShell nav={nav} active="products" staleCount={staleCount}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0a0a0f]">Produits & stocks</h1>
            <p className="text-sm text-[#64697d] mt-0.5">
              {loading ? "…" : `${products.length} référence${products.length > 1 ? "s" : ""} active${products.length > 1 ? "s" : ""}`}
              {staleCount > 0 && <span className="text-[#C4613A]"> · {staleCount} à actualiser</span>}
            </p>
          </div>
          <BtnNavy onClick={() => nav("supplier-propose")}>
            <Plus className="w-4 h-4" /> Proposer un produit
          </BtnNavy>
        </div>

        {/* Recherche produit */}
        {!loading && products.length > 0 && (
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-[#64697d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un produit · nom, référence, origine, catégorie…"
              className="w-full border border-[rgba(13,34,101,0.18)] bg-white pl-9 pr-9 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] transition-colors" />
            {query && (
              <button onClick={() => setQuery("")} title="Effacer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64697d] hover:text-[#0a0a0f] cursor-pointer text-lg leading-none">×</button>
            )}
          </div>
        )}

        {/* Filtres */}
        {!loading && products.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Tous</Chip>
            <Chip active={statusFilter === "En stock"} onClick={() => setStatusFilter("En stock")}>En stock · {statusCounts["En stock"]}</Chip>
            <Chip active={statusFilter === "Sur commande"} onClick={() => setStatusFilter("Sur commande")}>Sur commande · {statusCounts["Sur commande"]}</Chip>
            <Chip active={statusFilter === "Rupture"} onClick={() => setStatusFilter("Rupture")} tone="red">Rupture · {statusCounts["Rupture"]}</Chip>
            <Chip active={staleOnly} onClick={() => setStaleOnly(s => !s)} tone="orange">À actualiser · {staleCount}</Chip>
            {categories.length > 0 && (
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="border border-[rgba(13,34,101,0.18)] bg-white px-3 py-1.5 text-xs text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
                <option value="all">Toutes catégories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {anyFilter && (
              <button onClick={resetFilters} className="text-xs text-[#64697d] hover:text-[#0d2265] underline cursor-pointer ml-1">Réinitialiser</button>
            )}
          </div>
        )}

        {/* Rappel de fraîcheur (FRS-05) */}
        {staleCount > 0 && !anyFilter && (
          <div className="flex items-start gap-2.5 bg-[#fbede3] border border-[#C4613A]/30 px-4 py-3 mb-5 text-sm text-[#A84E2D] leading-relaxed">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {staleCount > 1 ? `${staleCount} références ne sont` : "1 référence n'est"} pas actualisée{staleCount > 1 ? "s" : ""} depuis plus de {STALE_DAYS} jours.
              Confirmez le stock pour rester visible auprès des acheteurs.
            </span>
          </div>
        )}

        {loading && <p className="text-sm text-[#64697d] py-8 text-center">Chargement de vos produits…</p>}
        {!loading && products.length === 0 && (
          <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10 text-center text-sm text-[#64697d]">
            Aucun produit rattaché à votre compte pour le moment.
          </div>
        )}
        {!loading && products.length > 0 && filtered.length === 0 && (
          <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10 text-center text-sm text-[#64697d]">
            Aucun produit ne correspond {query ? `à « ${query} »` : "à ces filtres"}.{" "}
            <button onClick={resetFilters} className="text-[#0d2265] underline cursor-pointer">Réinitialiser</button>
          </div>
        )}

        {anyFilter && filtered.length > 0 && (
          <p className="text-xs text-[#64697d] mb-3">{filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur {products.length}</p>
        )}

        <div className="space-y-3">
          {filtered.map(p => {
            const stale = isStale(p);
            const isOpen = expanded === p.id;
            const isEdit = editing === p.id;
            const hasCommercial = p.price_per_kg || p.bulk_price || p.harvest_period;
            return (
            <div key={p.id} className={`bg-white border ${stale ? "border-[#C4613A]/40" : "border-[rgba(13,34,101,0.1)]"}`}>
              <div className="p-4 flex items-start gap-4">
                {/* Vignette photo */}
                <button onClick={() => { setExpanded(isOpen ? null : p.id); setEditing(null); }}
                  className="w-20 h-20 bg-[#eef1f8] overflow-hidden border border-[rgba(13,34,101,0.1)] shrink-0 cursor-pointer">
                  <img src={productImg(p.image)} alt={p.name} className="w-full h-full object-cover" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0a0a0f] text-sm">{p.name}{p.origin && !p.name.includes(p.origin) ? ` · ${p.origin}` : ""}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#64697d] font-mono">{p.ref}</span>
                        {p.category && <span className="text-[10px] bg-[#eef1f8] text-[#0d2265] px-1.5 py-0.5 font-medium">{p.category}</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-[#64697d]">
                    <span>
                      Stock : <strong className="text-[#0a0a0f]">{p.stock_kg.toLocaleString("fr-FR")} {baseUnitOf(p)}</strong>
                      {stockInPackages(p) && <span className="text-[#64697d]"> · {stockInPackages(p)}</span>}
                    </span>
                    <span>Délai : <strong className="text-[#0a0a0f]">{p.delay || "Non précisé"}</strong></span>
                    <span className={stale ? "text-[#C4613A] font-medium" : ""}>Màj le {fmtDate(p.updated_at)}</span>
                    {stale && (
                      <span className="inline-flex items-center gap-1 text-[#C4613A] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> À actualiser
                      </span>
                    )}
                  </div>
                  {p.status === "Rupture" && (
                    <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 leading-relaxed">
                      <PackageX className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>En rupture · réapprovisionnez au plus vite. Mettez à jour le stock dès que le produit est de nouveau disponible pour rester visible auprès des acheteurs.</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => { setExpanded(isOpen ? null : p.id); setEditing(null); }}
                      className="text-xs text-[#0d2265] hover:text-[#C4613A] font-medium cursor-pointer flex items-center gap-1 transition-colors">
                      Détails <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => openEdit(p)} className="border border-[rgba(13,34,101,0.18)] text-[#0d2265] text-xs px-3 py-1.5 hover:bg-[#f4f5f9] cursor-pointer transition-colors flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Mettre à jour
                    </button>
                  </div>
                </div>
              </div>

              {/* Détails complets de la fiche */}
              {isOpen && (
                <div className="border-t border-[rgba(13,34,101,0.08)] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-full sm:w-48 aspect-[4/3] bg-[#eef1f8] overflow-hidden border border-[rgba(13,34,101,0.1)] shrink-0">
                      <img src={productImg(p.image)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-3">
                      <Detail label="Conditionnement" value={p.packaging} />
                      <Detail label="Quantité minimum (MOQ)" value={p.moq} />
                      <Detail label="Origine" value={p.origin ?? ""} />
                      <Detail label="Catégorie" value={p.category ?? ""} />
                    </div>
                  </div>

                  {p.description && (
                    <div>
                      <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm text-[#0a0a0f] leading-relaxed whitespace-pre-line">{p.description}</p>
                    </div>
                  )}
                  {p.benefits && (
                    <div>
                      <p className="text-[10px] font-bold text-[#C4613A] uppercase tracking-widest mb-1">Bienfaits</p>
                      <p className="text-sm text-[#0a0a0f] leading-relaxed whitespace-pre-line">{p.benefits}</p>
                    </div>
                  )}

                  {hasCommercial && (
                    <div className="border border-[rgba(196,97,58,0.25)] bg-[#fffaf7] p-4">
                      <p className="text-[10px] font-bold text-[#C4613A] uppercase tracking-widest mb-2">Informations commerciales · internes</p>
                      <div className="grid grid-cols-3 gap-4">
                        <Detail label="Prix au kilo" value={p.price_per_kg} />
                        <Detail label="Prix en vrac" value={p.bulk_price} />
                        <Detail label="Période de récolte" value={p.harvest_period} />
                      </div>
                      <p className="text-[11px] text-[#64697d] mt-3">Visibles uniquement par vous et l'équipe À la Source · jamais affichées publiquement.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mise à jour stock / dispo / délai */}
              {isEdit && (
                <div className="border-t border-[rgba(13,34,101,0.08)] bg-[#f4f5f9] p-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FieldLabel>Disponibilité</FieldLabel>
                      <SelectInput value={editData.status} onChange={e => changeStatus(e.target.value as StockStatus)}>
                        <option>En stock</option><option>Sur commande</option><option>Rupture</option>
                      </SelectInput>
                    </div>
                    <div>
                      <FieldLabel>Stock ({baseUnitOf(p)})</FieldLabel>
                      <TextInput type="number" min="0" value={editData.stock}
                        disabled={editData.status === "Rupture"}
                        className={editData.status === "Rupture" ? "bg-[#eef1f8] text-[#64697d] cursor-not-allowed" : ""}
                        onChange={e => setEditData({ ...editData, stock: e.target.value })} />
                      {packagesFor(p.packaging, baseUnitOf(p), Number(editData.stock)) && (
                        <p className="text-[11px] text-[#64697d] mt-1">Soit {packagesFor(p.packaging, baseUnitOf(p), Number(editData.stock))}.</p>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Délai indicatif</FieldLabel>
                      <SelectInput value={delayCustom ? AUTRE_DELAI : editData.delay}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === AUTRE_DELAI) { setDelayCustom(true); setEditData(d => ({ ...d, delay: "" })); }
                          else { setDelayCustom(false); setEditData(d => ({ ...d, delay: v })); }
                        }}>
                        <option value="">Sélectionner…</option>
                        {DELAIS_PRODUIT.map(d => <option key={d}>{d}</option>)}
                        <option>{AUTRE_DELAI}</option>
                      </SelectInput>
                      {delayCustom && (
                        <TextInput className="mt-2" placeholder="Ex : sous 10 jours, selon récolte…"
                          value={editData.delay} onChange={e => setEditData(d => ({ ...d, delay: e.target.value }))} />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64697d] mt-2 leading-relaxed">
                    {editData.status === "Rupture"
                      ? "Rupture : le stock est mis à 0. Repassez en « En stock » dès que le produit est de nouveau disponible."
                      : editData.status === "Sur commande"
                      ? "Sur commande : produit fabriqué ou livré à la demande · le stock peut rester à 0."
                      : `En stock : indiquez la quantité réellement disponible (en ${baseUnitOf(p)}), supérieure à 0.`}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <BtnNavy onClick={() => save(p.id)}><Check className="w-4 h-4" /> Enregistrer</BtnNavy>
                    <button onClick={() => setEditing(null)} className="text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer">Annuler</button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0d2265] text-white text-sm px-5 py-3 shadow-xl flex items-center gap-2 z-50">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}
    </SupplierShell>
  );
}

function Chip({ active, onClick, tone = "navy", children }: {
  active: boolean; onClick: () => void; tone?: "navy" | "red" | "orange"; children: React.ReactNode;
}) {
  const activeCls = tone === "red" ? "bg-red-600 border-red-600 text-white"
    : tone === "orange" ? "bg-[#C4613A] border-[#C4613A] text-white"
    : "bg-[#0d2265] border-[#0d2265] text-white";
  return (
    <button onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 border cursor-pointer transition-colors ${
        active ? activeCls : "bg-white border-[rgba(13,34,101,0.18)] text-[#4a4f63] hover:border-[#0d2265]/40"
      }`}>
      {children}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-[#0a0a0f] break-words">{value || "Non renseigné"}</p>
    </div>
  );
}
