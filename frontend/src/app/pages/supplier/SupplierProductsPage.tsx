/** Espace fournisseur · Produits & stocks : exploration des fiches (photo + détails complets),
 *  recherche, et mise à jour stock/dispo/délai. Les références non actualisées depuis 14 jours
 *  (FRS-05) sont signalées visuellement. Le fournisseur voit l'intégralité de ses propres fiches,
 *  informations commerciales internes comprises.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Clock, Edit2, PackageX, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiProduct } from "@/lib/api";
import { fmtDate, productImg } from "@/lib/format";
import { availabilityBadge } from "@/lib/availability";
import { baseUnitOf, isStale, packagesFor, STALE_DAYS, staleProducts, stockInPackages } from "@/lib/supplierMetrics";
import type { StockStatus } from "@/lib/leads";
import type { Nav } from "@/lib/routes";
import { DELAIS_PRODUIT } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useOptionLabel } from "@/lib/formsText";
import { useSupplierText } from "@/lib/supplierText";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, SelectInput, TextInput } from "@/app/components/common/fields";
import { useConfirm, useToast } from "@/app/components/common/feedback";
import { SupplierShell } from "./SupplierShell";
import { SupplierProductEditModal } from "./SupplierProductEditModal";

const AUTRE_DELAI = "Autre (préciser)";

const STATUS_BADGE: Record<StockStatus, string> = {
  "En stock": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Sur commande": "bg-amber-50 text-amber-700 border border-amber-200",
  "Rupture": "bg-red-50 text-red-600 border border-red-200",
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function SupplierProducts({ nav }: { nav: Nav }) {
  const lang = useLang();
  const { products: t, fields: f, common } = useSupplierText();
  const tr = useOptionLabel();
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  // Filtre unique (exclusif) : "all" | statut | "stale" | "cat:<catégorie>". Un seul à la fois.
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ stock: string; status: StockStatus; delay: string }>({ stock: "", status: "En stock", delay: "" });
  const [delayCustom, setDelayCustom] = useState(false);
  const [editInfo, setEditInfo] = useState<ApiProduct | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState<ApiProduct[]>([]);
  const [archivedLoaded, setArchivedLoaded] = useState(false);

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
      toast(t.inStockNeedsQty, "error");
      return;
    }
    try {
      const updated = await api.supplier.updateProduct(id, {
        stock_kg: Number(editData.stock), status: editData.status, delay: editData.delay,
      });
      const wasRupture = products.find(p => p.id === id)?.status === "Rupture";
      setProducts(ps => ps.map(p => p.id === id ? updated : p));
      setEditing(null);
      toast(updated.status === "Rupture" && !wasRupture ? t.ruptureSaved : t.updateSaved(fmtDate(updated.updated_at)));
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      toast(t.saveFailed, "error");
    }
  };

  // Retrait doux (réversible) d'un produit · confirmation puis passage en corbeille.
  const archiveProduct = async (p: ApiProduct) => {
    const ok = await confirm({
      title: t.confirmRemoveTitle(p.name),
      message: t.confirmRemoveMessage,
      confirmLabel: t.remove, tone: "danger",
    });
    if (!ok) return;
    try {
      const done = await api.supplier.archiveProduct(p.id);
      setProducts(ps => ps.filter(x => x.id !== p.id));
      setArchived(a => [done, ...a.filter(x => x.id !== p.id)]);
      toast(t.removed);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      toast(t.removeFailed, "error");
    }
  };
  const restoreProduct = async (p: ApiProduct) => {
    try {
      const done = await api.supplier.restoreProduct(p.id);
      setArchived(a => a.filter(x => x.id !== p.id));
      setProducts(ps => [done, ...ps.filter(x => x.id !== p.id)]);
      toast(t.restored);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      toast(t.restoreFailed, "error");
    }
  };
  // Ouvre/ferme la corbeille · charge les produits retirés à la première ouverture.
  const openArchived = () => {
    setShowArchived(true);
    if (!archivedLoaded) {
      api.supplier.myProducts(true).then(a => { setArchived(a); setArchivedLoaded(true); })
        .catch(err => { if (err instanceof api.ApiError && err.status === 401) logout(); });
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

  const anyFilter = !!query || filter !== "all";
  const resetFilters = () => { setQuery(""); setFilter("all"); };

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return products.filter(p => {
      // La recherche texte s'applique toujours ; le filtre (chip/catégorie) est exclusif.
      if (q && ![p.name, p.ref, p.origin ?? "", p.category ?? ""].some(v => norm(v).includes(q))) return false;
      if (filter === "all") return true;
      if (filter === "stale") return isStale(p);
      if (filter.startsWith("cat:")) return p.category === filter.slice(4);
      return p.status === filter; // En stock / Sur commande / Rupture
    }).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  }, [products, query, filter]);

  return (
    <SupplierShell nav={nav} active="products" staleCount={staleCount}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0a0a0f]">{t.title}</h1>
            <p className="text-sm text-[#64697d] mt-0.5">
              {loading ? "…" : t.activeCount(products.length)}
              {staleCount > 0 && <span className="text-[#C4613A]"> · {t.toRefresh(staleCount)}</span>}
            </p>
          </div>
          <BtnNavy onClick={() => nav("supplier-propose")}>
            <Plus className="w-4 h-4" /> {t.propose}
          </BtnNavy>
        </div>

        {/* Recherche produit */}
        {!loading && products.length > 0 && (
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-[#64697d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full border border-[rgba(13,34,101,0.18)] bg-white pl-9 pr-9 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] transition-colors" />
            {query && (
              <button onClick={() => setQuery("")} title={t.clear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64697d] hover:text-[#0a0a0f] cursor-pointer text-lg leading-none">×</button>
            )}
          </div>
        )}

        {/* Filtres */}
        {!loading && products.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>{t.all}</Chip>
            <Chip active={filter === "En stock"} onClick={() => setFilter("En stock")}>{tr("En stock")} · {statusCounts["En stock"]}</Chip>
            <Chip active={filter === "Sur commande"} onClick={() => setFilter("Sur commande")}>{tr("Sur commande")} · {statusCounts["Sur commande"]}</Chip>
            <Chip active={filter === "Rupture"} onClick={() => setFilter("Rupture")} tone="red">{tr("Rupture")} · {statusCounts["Rupture"]}</Chip>
            <Chip active={filter === "stale"} onClick={() => setFilter("stale")} tone="orange">{t.stale} · {staleCount}</Chip>
            {categories.length > 0 && (
              <select value={filter.startsWith("cat:") ? filter.slice(4) : "all"}
                onChange={e => setFilter(e.target.value === "all" ? "all" : `cat:${e.target.value}`)}
                className="border border-[rgba(13,34,101,0.18)] bg-white px-3 py-1.5 text-xs text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
                <option value="all">{t.allCategories}</option>
                {categories.map(c => <option key={c} value={c}>{tr(c)}</option>)}
              </select>
            )}
            {anyFilter && (
              <button onClick={resetFilters} className="text-xs text-[#64697d] hover:text-[#0d2265] underline cursor-pointer ml-1">{common.reset}</button>
            )}
          </div>
        )}

        {/* Rappel de fraîcheur (FRS-05) */}
        {staleCount > 0 && !anyFilter && (
          <div className="flex items-start gap-2.5 bg-[#fbede3] border border-[#C4613A]/30 px-4 py-3 mb-5 text-sm text-[#A84E2D] leading-relaxed">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{t.staleWarning(staleCount, STALE_DAYS)}</span>
          </div>
        )}

        {loading && <p className="text-sm text-[#64697d] py-8 text-center">{t.loading}</p>}
        {!loading && products.length === 0 && (
          <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10 text-center text-sm text-[#64697d]">
            {t.none}
          </div>
        )}
        {!loading && products.length > 0 && filtered.length === 0 && (
          <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10 text-center text-sm text-[#64697d]">
            {t.noMatch(query)}{" "}
            <button onClick={resetFilters} className="text-[#0d2265] underline cursor-pointer">{common.reset}</button>
          </div>
        )}

        {anyFilter && filtered.length > 0 && (
          <p className="text-xs text-[#64697d] mb-3">{t.results(filtered.length, products.length)}</p>
        )}

        <div className="space-y-3">
          {filtered.map(p => {
            const stale = isStale(p);
            const isOpen = expanded === p.id;
            const isEdit = editing === p.id;
            const hasCommercial = p.price_per_kg || p.bulk_price || p.harvest_period;
            const avail = availabilityBadge(p.available_until, lang);
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
                        {p.category && <span className="text-[10px] bg-[#eef1f8] text-[#0d2265] px-1.5 py-0.5 font-medium">{tr(p.category)}</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 ${STATUS_BADGE[p.status]}`}>{tr(p.status)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-[#64697d]">
                    <span>
                      {t.stock}{lang === "fr" ? " : " : ": "}<strong className="text-[#0a0a0f]">{p.stock_kg.toLocaleString(lang === "en" ? "en-GB" : "fr-FR")} {baseUnitOf(p)}</strong>
                      {stockInPackages(p, lang) && <span className="text-[#64697d]"> · {stockInPackages(p, lang)}</span>}
                    </span>
                    <span>{t.delay}{lang === "fr" ? " : " : ": "}<strong className="text-[#0a0a0f]">{p.delay ? tr(p.delay) : common.notSpecified}</strong></span>
                    <span className={stale ? "text-[#C4613A] font-medium" : ""}>{t.updatedOn(fmtDate(p.updated_at))}</span>
                    {stale && (
                      <span className="inline-flex items-center gap-1 text-[#C4613A] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> {t.stale}
                      </span>
                    )}
                    {avail && (
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        avail.tone === "ok" ? "text-[#0d2265]"
                        : avail.tone === "warn" ? "text-[#C4613A]" : "text-red-600"}`}>
                        <Clock className="w-3 h-3" /> {avail.label}
                      </span>
                    )}
                  </div>
                  {p.status === "Rupture" && (
                    <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 leading-relaxed">
                      <PackageX className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{t.ruptureNotice}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button onClick={() => { setExpanded(isOpen ? null : p.id); setEditing(null); }}
                      className="text-xs text-[#0d2265] hover:text-[#C4613A] font-medium cursor-pointer flex items-center gap-1 transition-colors">
                      {t.details} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => setEditInfo(p)} className="border border-[rgba(13,34,101,0.18)] text-[#0d2265] text-xs px-3 py-1.5 hover:bg-[#f4f5f9] cursor-pointer transition-colors flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> {t.editSheet}
                    </button>
                    <button onClick={() => openEdit(p)} className="border border-[rgba(13,34,101,0.18)] text-[#0d2265] text-xs px-3 py-1.5 hover:bg-[#f4f5f9] cursor-pointer transition-colors flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> {t.updateStock}
                    </button>
                    <button onClick={() => archiveProduct(p)} title={t.removeTitle}
                      className="border border-red-200 text-red-600 text-xs px-3 py-1.5 hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-1.5 ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> {t.remove}
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
                      <Detail label={f.packaging} value={p.packaging} empty={common.notProvided} />
                      <Detail label={f.moq} value={p.moq} empty={common.notProvided} />
                      <Detail label={f.origin} value={p.origin ? tr(p.origin) : ""} empty={common.notProvided} />
                      <Detail label={f.category} value={p.category ? tr(p.category) : ""} empty={common.notProvided} />
                      {avail && <Detail label={f.availableUntilShort} value={`${avail.date}${avail.tone === "expired" ? ` ${f.expired}` : ""}`} empty={common.notProvided} />}
                    </div>
                  </div>

                  {p.description && (
                    <div>
                      <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">{f.description}</p>
                      <p className="text-sm text-[#0a0a0f] leading-relaxed whitespace-pre-line">{p.description}</p>
                    </div>
                  )}
                  {p.benefits && (
                    <div>
                      <p className="text-[10px] font-bold text-[#C4613A] uppercase tracking-widest mb-1">{f.benefits}</p>
                      <p className="text-sm text-[#0a0a0f] leading-relaxed whitespace-pre-line">{p.benefits}</p>
                    </div>
                  )}

                  {hasCommercial && (
                    <div className="border border-[rgba(196,97,58,0.25)] bg-[#fffaf7] p-4">
                      <p className="text-[10px] font-bold text-[#C4613A] uppercase tracking-widest mb-2">{f.commercialInternal}</p>
                      <div className="grid grid-cols-3 gap-4">
                        <Detail label={f.pricePerKg} value={p.price_per_kg} empty={common.notProvided} />
                        <Detail label={f.bulkPrice} value={p.bulk_price} empty={common.notProvided} />
                        <Detail label={f.harvest} value={p.harvest_period} empty={common.notProvided} />
                      </div>
                      <p className="text-[11px] text-[#64697d] mt-3">{common.internalOnly}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mise à jour stock / dispo / délai */}
              {isEdit && (
                <div className="border-t border-[rgba(13,34,101,0.08)] bg-[#f4f5f9] p-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FieldLabel>{t.availability}</FieldLabel>
                      <SelectInput value={editData.status} onChange={e => changeStatus(e.target.value as StockStatus)}>
                        {(["En stock", "Sur commande", "Rupture"] as const).map(s => <option key={s} value={s}>{tr(s)}</option>)}
                      </SelectInput>
                    </div>
                    <div>
                      <FieldLabel>{t.stockUnit(baseUnitOf(p))}</FieldLabel>
                      <TextInput type="number" min="0" value={editData.stock}
                        disabled={editData.status === "Rupture"}
                        className={editData.status === "Rupture" ? "bg-[#eef1f8] text-[#64697d] cursor-not-allowed" : ""}
                        onChange={e => setEditData({ ...editData, stock: e.target.value })} />
                      {packagesFor(p.packaging, baseUnitOf(p), Number(editData.stock), lang) && (
                        <p className="text-[11px] text-[#64697d] mt-1">{t.equivalent(packagesFor(p.packaging, baseUnitOf(p), Number(editData.stock), lang) ?? "")}</p>
                      )}
                    </div>
                    <div>
                      <FieldLabel>{t.delayIndicative}</FieldLabel>
                      <SelectInput value={delayCustom ? AUTRE_DELAI : editData.delay}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === AUTRE_DELAI) { setDelayCustom(true); setEditData(d => ({ ...d, delay: "" })); }
                          else { setDelayCustom(false); setEditData(d => ({ ...d, delay: v })); }
                        }}>
                        <option value="">{common.select}</option>
                        {DELAIS_PRODUIT.map(d => <option key={d} value={d}>{tr(d)}</option>)}
                        <option value={AUTRE_DELAI}>{t.delayOther}</option>
                      </SelectInput>
                      {delayCustom && (
                        <TextInput className="mt-2" placeholder={t.delayOtherPlaceholder}
                          value={editData.delay} onChange={e => setEditData(d => ({ ...d, delay: e.target.value }))} />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64697d] mt-2 leading-relaxed">
                    {editData.status === "Rupture" ? t.hintRupture
                      : editData.status === "Sur commande" ? t.hintOnOrder
                      : t.hintInStock(baseUnitOf(p))}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <BtnNavy onClick={() => save(p.id)}><Check className="w-4 h-4" /> {common.save}</BtnNavy>
                    <button onClick={() => setEditing(null)} className="text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer">{common.cancel}</button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>

        {/* Produits retirés (corbeille) · réversible */}
        {!loading && (
          <div className="mt-8 pt-6 border-t border-[rgba(13,34,101,0.08)]">
            <button onClick={() => showArchived ? setShowArchived(false) : openArchived()}
              className="text-sm text-[#64697d] hover:text-[#0d2265] font-medium cursor-pointer flex items-center gap-1.5 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              {showArchived ? t.hideArchived : t.showArchived}
              {archivedLoaded && ` (${archived.length})`}
            </button>
            {showArchived && (
              <div className="space-y-2 mt-4">
                {archived.length === 0 && (
                  <p className="text-sm text-[#64697d] py-6 text-center bg-white border border-[rgba(13,34,101,0.08)]">{t.noArchived}</p>
                )}
                {[...archived].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" })).map(p => (
                  <div key={p.id} className="bg-white border border-[rgba(13,34,101,0.1)] p-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#eef1f8] overflow-hidden border border-[rgba(13,34,101,0.1)] shrink-0">
                      <img src={productImg(p.image)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0a0a0f] truncate">{p.name}</p>
                      <p className="text-xs text-[#64697d] font-mono">{p.ref}</p>
                    </div>
                    <button onClick={() => restoreProduct(p)}
                      className="border border-[rgba(13,34,101,0.18)] text-[#0d2265] text-xs px-3 py-1.5 hover:bg-[#f4f5f9] cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" /> {t.restore}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editInfo && (
        <SupplierProductEditModal
          product={editInfo}
          onClose={() => setEditInfo(null)}
          onAuthError={logout}
          onSaved={updated => {
            setProducts(ps => ps.map(p => p.id === updated.id ? updated : p));
            setEditInfo(null);
            toast(t.sheetUpdated);
          }}
        />
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

function Detail({ label, value, empty }: { label: string; value: string; empty: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-[#0a0a0f] break-words">{value || empty}</p>
    </div>
  );
}
