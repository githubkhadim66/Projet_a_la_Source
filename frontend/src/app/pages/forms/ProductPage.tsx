/** Fiche produit publique : détails (jamais de prix ni de fournisseur) + autres produits.
 *
 *  Le produit courant est identifié par sa référence, stockée dans localStorage au
 *  moment du clic depuis le catalogue. Cliquer un « autre produit » met à jour la
 *  fiche sans quitter la page (pas besoin de revenir sur le site).
 */

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Loader2 } from "lucide-react";
import * as api from "@/lib/api";
import { productImg } from "@/lib/format";
import type { Nav } from "@/lib/routes";

const REF_KEY = "als-product-ref";
const isSenegal = (o?: string | null) => (o ? /sénégal|senegal/i.test(o) : false);

export function ProductPage({ nav }: { nav: Nav }) {
  const [products, setProducts] = useState<api.ApiPublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [ref, setRef] = useState<string>(() => {
    try { return localStorage.getItem(REF_KEY) || ""; } catch { return ""; }
  });
  const [basket, setBasket] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("als-basket") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    api.catalogue.products()
      .then(ps => setProducts(ps))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (name: string) => {
    const next = basket.includes(name) ? basket.filter(n => n !== name) : [...basket, name];
    setBasket(next);
    try { localStorage.setItem("als-basket", JSON.stringify(next)); } catch { /* stockage indispo */ }
  };

  const openProduct = (r: string) => {
    setRef(r);
    try { localStorage.setItem(REF_KEY, r); } catch { /* stockage indispo */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Retour sur le site, directement à la section catalogue de la page d'accueil.
  const backToCatalogue = () => {
    nav("landing");
    setTimeout(() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const current = products.find(p => p.ref === ref) ?? (products.length ? products[0] : undefined);
  const others = products.filter(p => p.ref !== current?.ref).slice(0, 6);
  const inBasket = current ? basket.includes(current.name) : false;

  return (
    <div className="min-h-screen bg-[#f4f5f9] font-['Inter',sans-serif]">
      {/* Barre supérieure */}
      <div className="bg-[#0d2265] px-6 py-4 flex items-center gap-4">
        <button onClick={backToCatalogue} className="text-white/60 hover:text-white text-sm flex items-center gap-1.5 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> Catalogue
        </button>
        <span className="text-white/50 text-sm">·</span>
        <span className="text-white text-sm font-medium">Fiche produit</span>
        <button onClick={() => nav("landing")} className="ml-auto font-bold text-lg tracking-tight text-white cursor-pointer font-['Playfair_Display',Georgia,serif]">
          À la Source
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#64697d]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement…
          </div>
        ) : !current ? (
          <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10 text-center">
            <p className="text-[#0a0a0f] font-semibold mb-2">Produit introuvable.</p>
            <p className="text-sm text-[#64697d] mb-6">Ce produit n'est pas au catalogue — nous pouvons le sourcer pour vous.</p>
            <button onClick={() => nav("sourcing")} className="inline-flex items-center gap-1.5 bg-[#C4613A] text-white text-sm font-semibold px-6 py-3 hover:bg-[#A84E2D] transition-colors cursor-pointer">
              Sourcing sur mesure <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* ── Fiche ── */}
            <div className="bg-white border border-[rgba(13,34,101,0.1)] grid md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto md:h-full bg-[#eef1f8] overflow-hidden">
                <img src={productImg(current.image)} alt={current.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 sm:p-9">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[10px] font-bold text-[#C4613A] tracking-[0.15em] uppercase">{current.category}</p>
                  {current.origin && (isSenegal(current.origin)
                    ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#C4613A] bg-[#C4613A]/10 px-1.5 py-0.5 uppercase tracking-wide">★ {current.origin}</span>
                    : <span className="text-[10px] text-[#64697d] uppercase tracking-wide">Vérifié — {current.origin}</span>
                  )}
                </div>
                <h1 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f] leading-tight mb-3">{current.name}</h1>
                <span className="inline-block text-xs font-semibold text-[#C4613A] bg-[#C4613A]/8 px-3 py-1 mb-6">Prix sur devis</span>

                <div className="space-y-2.5 mb-6">
                  {current.origin && (
                    <div className="flex justify-between gap-4 text-sm border-b border-[rgba(13,34,101,0.07)] pb-2">
                      <span className="text-[#64697d]">Origine</span>
                      <span className="text-[#0d2265] font-medium text-right">Fournisseur vérifié — {current.origin}</span>
                    </div>
                  )}
                  {current.packaging && (
                    <div className="flex justify-between gap-4 text-sm border-b border-[rgba(13,34,101,0.07)] pb-2">
                      <span className="text-[#64697d]">Conditionnement</span>
                      <span className="text-[#0d2265] font-medium text-right">{current.packaging}</span>
                    </div>
                  )}
                  {current.moq && (
                    <div className="flex justify-between gap-4 text-sm border-b border-[rgba(13,34,101,0.07)] pb-2">
                      <span className="text-[#64697d]">Quantité minimum (MOQ)</span>
                      <span className="text-[#0d2265] font-medium text-right">{current.moq}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button onClick={() => toggle(current.name)}
                    className={`flex-1 py-2.5 text-sm font-semibold cursor-pointer border flex items-center justify-center gap-1.5 transition-colors ${inBasket ? "bg-[#0d2265] text-white border-[#0d2265]" : "border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:bg-[#0d2265] hover:text-white"}`}>
                    {inBasket ? <><Check className="w-4 h-4" /> Ajouté</> : <>+ Ajouter à ma demande</>}
                  </button>
                  <button onClick={() => { if (!basket.includes(current.name)) toggle(current.name); nav("devis"); }}
                    className="flex-1 py-2.5 text-sm font-semibold cursor-pointer bg-[#C4613A] text-white hover:bg-[#A84E2D] transition-colors flex items-center justify-center gap-1.5">
                    Demander un devis <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-[#64697d] mt-3 leading-relaxed">Fournisseur vérifié — identité protégée. Aucun contact direct : À la Source porte votre devis de bout en bout.</p>
              </div>
            </div>

            {/* ── Description & bienfaits ── */}
            {(current.description || current.benefits) && (
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {current.description && (
                  <div className="bg-white border border-[rgba(13,34,101,0.1)] p-6">
                    <p className="text-[11px] font-bold text-[#64697d] uppercase tracking-widest mb-2">Description</p>
                    <p className="text-sm text-[#43423c] leading-relaxed">{current.description}</p>
                  </div>
                )}
                {current.benefits && (
                  <div className="bg-[#fffaf7] border border-[rgba(196,97,58,0.25)] p-6">
                    <p className="text-[11px] font-bold text-[#C4613A] uppercase tracking-widest mb-2">Bienfaits</p>
                    <p className="text-sm text-[#43423c] leading-relaxed">{current.benefits}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Autres produits ── */}
            {others.length > 0 && (
              <div className="mt-14">
                <div className="flex items-end justify-between mb-6">
                  <h2 className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold text-[#0a0a0f]">Autres produits</h2>
                  <button onClick={() => nav("catalogue")} className="text-sm font-semibold text-[#0d2265] hover:text-[#C4613A] transition-colors cursor-pointer inline-flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> Télécharger le catalogue complet
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(13,34,101,0.1)]">
                  {others.map(p => (
                    <button key={p.ref} type="button" onClick={() => openProduct(p.ref)}
                      className="bg-white text-left group cursor-pointer">
                      <div className="aspect-[4/3] overflow-hidden bg-[#eef1f8] relative">
                        <img src={productImg(p.image)} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                        <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f]/70 to-transparent text-white text-[11px] font-semibold px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Voir la fiche <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold text-[#C4613A] tracking-[0.13em] uppercase">{p.category}</p>
                          {p.origin && (isSenegal(p.origin)
                            ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#C4613A] bg-[#C4613A]/10 px-1.5 py-0.5 uppercase tracking-wide">★ {p.origin}</span>
                            : <span className="text-[10px] text-[#64697d] uppercase tracking-wide">{p.origin}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-[#0a0a0f] text-sm group-hover:text-[#0d2265] transition-colors">{p.name}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
