/** Superpositions de la landing : bandeau cookies (RGPD) et panneau « Ma demande ». */

import { ArrowRight, FileText, Sprout, X } from "lucide-react";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";

/** Indication discrète, à la première visite : oriente les producteurs/fournisseurs
 *  vers la candidature. Volontairement compact et peu bavard. */
export function SupplierHint({ nav, onClose }: { nav: Nav; onClose: () => void }) {
  return (
    <div style={{ animation: "funtiHintIn .35s ease-out" }}
      className="fixed bottom-5 right-5 z-[150] w-[min(320px,calc(100vw-2.5rem))] bg-white border border-[rgba(13,34,101,0.15)] shadow-2xl">
      <style>{`@keyframes funtiHintIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-[#eef1f8] flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 text-[#0d2265]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0a0a0f]">Vous êtes producteur ou fournisseur ?</p>
            <p className="text-xs text-[#64697d] leading-relaxed mt-1">
              Rejoignez le réseau Funti et proposez vos produits aux acheteurs européens.
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer"
            className="text-[#9ca3af] hover:text-[#0a0a0f] cursor-pointer shrink-0 -mt-1 -mr-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => { onClose(); nav("candidature"); }}
            className="flex-1 bg-[#0d2265] text-white text-xs font-semibold px-3 py-2 hover:bg-[#091a52] cursor-pointer transition-colors flex items-center justify-center gap-1.5">
            Candidater <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="text-xs text-[#64697d] hover:text-[#0d2265] px-2 py-2 cursor-pointer">Plus tard</button>
        </div>
      </div>
    </div>
  );
}

export function CookieBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t-2 border-[#0d2265] shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0a0a0f] mb-0.5">Ce site utilise des cookies</p>
          <p className="text-xs text-[#64697d] leading-relaxed">
            Des cookies analytiques améliorent votre expérience.{" "}
            <button className="text-[#0d2265] underline hover:text-[#C4613A] transition-colors cursor-pointer">Personnaliser</button>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onDismiss} className="border border-[rgba(13,34,101,0.3)] text-[#0a0a0f] text-sm px-5 py-2.5 hover:bg-[#f4f5f9] cursor-pointer transition-colors font-medium whitespace-nowrap">
            Tout refuser
          </button>
          <button onClick={onDismiss} className="bg-[#0d2265] text-white text-sm px-5 py-2.5 hover:bg-[#091a52] cursor-pointer transition-colors font-medium whitespace-nowrap">
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}

export function BasketPanel({ basket, setBasket, nav, onClose }: { basket: string[]; setBasket: (b: string[]) => void; nav: Nav; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[90]" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-[100] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(13,34,101,0.1)]">
          <div>
            <p className="font-bold text-[#0a0a0f]">Ma demande de devis</p>
            <p className="text-xs text-[#64697d] mt-0.5">{basket.length} produit{basket.length > 1 ? "s" : ""} sélectionné{basket.length > 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="text-[#64697d] hover:text-[#0a0a0f] cursor-pointer transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {basket.length === 0 ? (
            <p className="text-sm text-[#64697d] text-center py-12">Aucun produit ajouté.</p>
          ) : basket.map((name, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[rgba(13,34,101,0.06)]">
              <div>
                <p className="text-sm font-medium text-[#0a0a0f]">{name}</p>
                <p className="text-xs text-[#64697d] mt-0.5">Prix sur devis</p>
              </div>
              <button onClick={() => setBasket(basket.filter((_, j) => j !== i))} className="text-[#9ca3af] hover:text-red-500 cursor-pointer transition-colors ml-3">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-6 py-5 border-t border-[rgba(13,34,101,0.1)] space-y-3">
          <p className="text-xs text-[#64697d]">Prix communiqués sur devis sous 24 à 48 h ouvrées.</p>
          <BtnNavy onClick={() => { onClose(); nav("devis"); }} className="w-full justify-center">
            <FileText className="w-4 h-4" /> Demander mon devis <ArrowRight className="w-4 h-4" />
          </BtnNavy>
        </div>
      </div>
    </>
  );
}
