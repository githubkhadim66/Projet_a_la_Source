/** Composition du catalogue PDF : deux listes claires (dedans / dehors) et ordre par glisser-déposer. */

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Download, GripVertical, Plus, X } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiAdminProduct } from "@/lib/api";
import { productImg } from "@/lib/format";

export function CatalogueComposition({ onApiError }: { onApiError: (err: unknown) => void }) {
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
      flash(inCatalogue ? `« ${p.name} » ajouté au catalogue.` : `« ${p.name} » retiré du catalogue.`);
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

  const telecharger = async () => {
    try {
      await api.admin.downloadCataloguePreview();
      flash("Catalogue PDF généré — le téléchargement a démarré.");
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 409) flash(err.message);
      else onApiError(err);
    }
  };

  if (loading) {
    return <div className="bg-white border border-[rgba(13,34,101,0.08)] p-10 text-center text-sm text-[#64697d]">Chargement du catalogue…</div>;
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
          <p className="font-bold text-lg">Votre catalogue contient {dedans.length} produit{dedans.length > 1 ? "s" : ""}</p>
          <p className="text-white/60 text-sm mt-0.5">
            Environ {Math.ceil(dedans.length / 4) + 3} pages · couverture, présentation et contacts inclus
          </p>
        </div>
        <button onClick={telecharger}
          className="flex items-center gap-2 bg-[#C4613A] text-white text-sm font-semibold px-5 py-3 cursor-pointer hover:bg-[#A84E2D] transition-colors shrink-0">
          <Download className="w-4 h-4" /> Télécharger le catalogue PDF
        </button>
      </div>

      {/* Liste ordonnable */}
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <h2 className="font-bold text-[#0a0a0f]">Dans le catalogue</h2>
        <p className="text-xs text-[#64697d] flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5" /> Attrapez une ligne et faites-la glisser pour changer l'ordre des pages
        </p>
      </div>

      <div className="space-y-1.5 mb-10">
        {dedans.length === 0 && (
          <div className="bg-white border border-dashed border-[rgba(13,34,101,0.2)] p-10 text-center text-sm text-[#64697d]">
            Aucun produit dans le catalogue. Ajoutez-en depuis la liste ci-dessous.
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
                {p.category && <span className="text-[10px] text-[#64697d] bg-[#f0f2f7] px-1.5 py-0.5">{p.category}</span>}
              </div>
              <p className="text-xs text-[#64697d] mt-0.5">{p.origin}{p.moq ? ` · ${p.moq}` : ""}</p>
            </div>
            <button onClick={() => setMembership(p, false)}
              className="shrink-0 border border-[rgba(13,34,101,0.15)] text-[#64697d] text-xs px-3 py-1.5 cursor-pointer hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors">
              Retirer
            </button>
          </div>
        ))}
      </div>

      {/* Produits disponibles à ajouter */}
      <h2 className="font-bold text-[#0a0a0f] mb-1">Pas dans le catalogue</h2>
      <p className="text-xs text-[#64697d] mb-3">
        Ces produits existent au référentiel mais n'apparaissent pas dans le PDF. Cliquez sur « Ajouter » pour les y faire entrer.
      </p>
      <div className="space-y-1.5">
        {dehors.length === 0 && (
          <div className="bg-white border border-[rgba(13,34,101,0.08)] p-8 text-center text-sm text-[#64697d]">
            Tous vos produits figurent dans le catalogue.
          </div>
        )}
        {dehors.map(p => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-[rgba(13,34,101,0.06)] px-3 py-2.5 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-11 h-11 bg-[#eef1f8] overflow-hidden shrink-0 ml-[44px]">
              <img src={productImg(p.image, "w=80&h=80")} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-[#0a0a0f]">{p.name}</span>
              <p className="text-xs text-[#64697d] mt-0.5">{p.origin}{p.moq ? ` · ${p.moq}` : ""} · {p.supplier_name}</p>
            </div>
            <button onClick={() => setMembership(p, true)}
              className="shrink-0 flex items-center gap-1.5 bg-[#0d2265] text-white text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-[#091a52] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
