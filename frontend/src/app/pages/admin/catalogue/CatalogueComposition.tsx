/** Composition du catalogue PDF : deux listes claires (dedans / dehors) et ordre par glisser-déposer. */

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Download, GripVertical, Languages, Plus, X } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiAdminProduct, ApiCatalogueTranslationRow } from "@/lib/api";
import { ProductTranslationPanel } from "./ProductTranslation";
import { productImg } from "@/lib/format";
import { useAdminText } from "@/lib/adminText";
import { useOptionLabel } from "@/lib/formsText";

export function CatalogueComposition({ onApiError }: { onApiError: (err: unknown) => void }) {
  const { composition: t, translation: tt, common } = useAdminText();
  const tr = useOptionLabel();
  // Relecture de la version anglaise du catalogue (chargée à la demande).
  const [review, setReview] = useState<ApiCatalogueTranslationRow[] | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const loadReview = () => api.admin.catalogueTranslation().then(setReview).catch(onApiError);
  const toggleReview = () => {
    if (!reviewOpen && review === null) loadReview();
    setReviewOpen(o => !o);
  };
  const [products, setProducts] = useState<ApiAdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // Référence lue au moment du dépôt : l'état React n'est pas encore rafraîchi à cet instant
  const dragIndexRef = useRef<number | null>(null);

  const flash = (msg: string) => { setBanner(msg); setTimeout(() => setBanner(null), 5000); };

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.catalogueProducts().then(setProducts).catch(onApiError).finally(() => setLoading(false));
  }, [onApiError]);

  const dedans = products.filter(p => p.in_catalogue);
  const dehors = products.filter(p => !p.in_catalogue);

  const setMembership = async (p: ApiAdminProduct, inCatalogue: boolean) => {
    try {
      const updated = await api.admin.updateProduct(p.id, { in_catalogue: inCatalogue });
      setProducts(prev => prev.map(x => x.id === p.id ? updated : x));
      flash(inCatalogue ? t.added(p.name) : t.removed(p.name));
    } catch (err) { onApiError(err); }
  };

  const startDrag = (index: number, e: React.DragEvent) => {
    dragIndexRef.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index)); // requis par Firefox
  };

  /** Réordonne la liste « dedans » puis enregistre l'ordre complet. */
  const drop = async (target: number) => {
    const source = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
    if (source === null || source === target) return;

    const reordered = [...dedans];
    const [moved] = reordered.splice(source, 1);
    reordered.splice(target, 0, moved);
    setProducts([...reordered, ...dehors]); // retour visuel immédiat
    try {
      setProducts(await api.admin.catalogueReorder([...reordered, ...dehors].map(p => p.id)));
    } catch (err) { onApiError(err); }
  };

  const telecharger = async (lang: "fr" | "en") => {
    try {
      await api.admin.downloadCataloguePreview(lang);
      flash(t.generated(lang));
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 409) flash(err.message);
      else onApiError(err);
    }
  };

  if (loading) {
    return <div className="bg-white border border-[rgba(13,34,101,0.08)] p-10 text-center text-sm text-[#64697d]">{t.loading}</div>;
  }

  return (
    <div>
      {banner && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 mb-5 text-sm text-emerald-800">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {banner}
          <button onClick={() => setBanner(null)} className="ml-auto text-emerald-600 hover:text-emerald-800 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Résumé + génération */}
      <div className="bg-[#0d2265] text-white p-6 mb-6 flex items-center gap-6 flex-wrap">
        <div className="w-12 h-12 bg-white/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-lg">{t.contains(dedans.length)}</p>
          <p className="text-white/60 text-sm mt-0.5">{t.pages(Math.ceil(dedans.length / 4) + 3)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => telecharger("fr")}
            className="flex items-center gap-2 bg-[#C4613A] text-white text-sm font-semibold px-5 py-3 cursor-pointer hover:bg-[#A84E2D] transition-colors">
            <Download className="w-4 h-4" /> Catalogue PDF · FR
          </button>
          <button onClick={() => telecharger("en")}
            className="flex items-center gap-2 border border-[#C4613A] text-[#C4613A] text-sm font-semibold px-4 py-3 cursor-pointer hover:bg-[#C4613A] hover:text-white transition-colors">
            <Download className="w-4 h-4" /> EN
          </button>
          <button onClick={toggleReview}
            className="flex items-center gap-2 border border-white/30 text-white text-sm font-semibold px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors">
            <Languages className="w-4 h-4" /> {reviewOpen ? tt.hideReview : tt.review}
          </button>
        </div>
      </div>

      {/* Relecture de la version anglaise : un produit par ligne, correction sur place */}
      {reviewOpen && (
        <div className="bg-white border border-[rgba(13,34,101,0.12)] p-5 mb-8">
          <h2 className="font-bold text-[#0a0a0f] flex items-center gap-2"><Languages className="w-4 h-4 text-[#0d2265]" /> {tt.reviewTitle}</h2>
          <p className="text-xs text-[#64697d] mt-1 mb-4">{tt.reviewIntro}</p>
          {review === null && <p className="text-sm text-[#64697d] py-4">{tt.loading}</p>}
          {review !== null && review.length === 0 && <p className="text-sm text-[#64697d] py-4">{tt.empty}</p>}
          <div className="space-y-1.5">
            {review?.map((r, i) => (
              <div key={r.product_id} className="border border-[rgba(13,34,101,0.08)]">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-7 text-center text-sm font-bold text-[#0d2265] tabular-nums shrink-0">{i + 1}</span>
                  <div className="w-10 h-10 bg-[#eef1f8] overflow-hidden shrink-0">
                    <img src={productImg(r.image, "w=80&h=80")} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0a0a0f] truncate">{r.name_translated}</p>
                    <p className="text-[11px] text-[#64697d] truncate">{r.name} · <span className="font-mono">{r.ref}</span></p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {r.manual_count > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">{tt.corrected(r.manual_count)}</span>}
                    {r.missing_count > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">{tt.untranslated(r.missing_count)}</span>}
                    {r.manual_count === 0 && r.missing_count === 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#eef1f8] text-[#0d2265]">{tt.allAuto}</span>}
                  </div>
                  <button onClick={() => setReviewing(reviewing === r.product_id ? null : r.product_id)}
                    className="shrink-0 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-[#f4f5f9] transition-colors">
                    {reviewing === r.product_id ? tt.close : tt.edit}
                  </button>
                </div>
                {reviewing === r.product_id && (
                  <div className="border-t border-[rgba(13,34,101,0.08)] bg-[#f4f5f9] p-3">
                    <ProductTranslationPanel productId={r.product_id} onApiError={onApiError} onSaved={loadReview} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste ordonnable */}
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <h2 className="font-bold text-[#0a0a0f]">{t.inCatalogue}</h2>
        <p className="text-xs text-[#64697d] flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5" /> {t.dragHint}
        </p>
      </div>

      <div className="space-y-1.5 mb-10">
        {dedans.length === 0 && (
          <div className="bg-white border border-dashed border-[rgba(13,34,101,0.2)] p-10 text-center text-sm text-[#64697d]">
            {t.emptyIn}
          </div>
        )}
        {dedans.map((p, i) => (
          <div key={p.id}
            draggable
            onDragStart={e => startDrag(i, e)}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverIndex(i); }}
            onDragLeave={() => setOverIndex(o => (o === i ? null : o))}
            onDrop={e => { e.preventDefault(); drop(i); }}
            onDragEnd={() => { dragIndexRef.current = null; setDragIndex(null); setOverIndex(null); }}
            className={`flex items-center gap-3 bg-white border px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all ${
              dragIndex === i ? "opacity-40 border-[#0d2265]"
                : overIndex === i ? "border-[#C4613A] border-dashed bg-[#fff8f5]"
                : "border-[rgba(13,34,101,0.08)] hover:border-[#0d2265]/25"
            }`}>
            <GripVertical className="w-4 h-4 text-[#64697d]/40 shrink-0" />
            <span className="w-7 text-center text-sm font-bold text-[#0d2265] tabular-nums shrink-0">{i + 1}</span>
            <div className="w-11 h-11 bg-[#eef1f8] overflow-hidden shrink-0">
              <img src={productImg(p.image, "w=80&h=80")} alt="" className="w-full h-full object-cover pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-[#0a0a0f]">{p.name}</span>
                {p.category && <span className="text-[10px] text-[#64697d] bg-[#f0f2f7] px-1.5 py-0.5">{tr(p.category)}</span>}
              </div>
              <p className="text-xs text-[#64697d] mt-0.5">{p.origin}{p.packaging ? ` · ${p.packaging}` : ""}{p.moq ? ` · MOQ ${p.moq}` : ""}</p>
            </div>
            <button onClick={() => setMembership(p, false)}
              className="shrink-0 border border-[rgba(13,34,101,0.15)] text-[#64697d] text-xs px-3 py-1.5 cursor-pointer hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors">
              {common.remove}
            </button>
          </div>
        ))}
      </div>

      {/* Produits disponibles à ajouter */}
      <h2 className="font-bold text-[#0a0a0f] mb-1">{t.outTitle}</h2>
      <p className="text-xs text-[#64697d] mb-3">{t.outIntro}</p>
      <div className="space-y-1.5">
        {dehors.length === 0 && (
          <div className="bg-white border border-[rgba(13,34,101,0.08)] p-8 text-center text-sm text-[#64697d]">
            {t.allIn}
          </div>
        )}
        {dehors.map(p => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-[rgba(13,34,101,0.06)] px-3 py-2.5 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-11 h-11 bg-[#eef1f8] overflow-hidden shrink-0 ml-[44px]">
              <img src={productImg(p.image, "w=80&h=80")} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-[#0a0a0f]">{p.name}</span>
              <p className="text-xs text-[#64697d] mt-0.5">{p.origin}{p.packaging ? ` · ${p.packaging}` : ""}{p.moq ? ` · MOQ ${p.moq}` : ""} · {p.supplier_name}</p>
            </div>
            <button onClick={() => setMembership(p, true)}
              className="shrink-0 flex items-center gap-1.5 bg-[#0d2265] text-white text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-[#091a52] transition-colors">
              <Plus className="w-3.5 h-3.5" /> {common.add}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
