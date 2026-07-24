/** En-tête fixe de la landing : navigation, panier « Ma demande », menu mobile. */

import { Menu, Package, X } from "lucide-react";
import { CALENDLY_URL } from "@/lib/constants";
import type { Nav, Screen } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";

export function Header({ nav, open, setOpen, basket, onBasketOpen }: {
  nav: Nav;
  open: boolean; setOpen: (v: boolean) => void;
  basket: string[]; onBasketOpen: () => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-white border-b border-[rgba(13,34,101,0.08)]">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center gap-8">
          <button onClick={() => nav("landing")} className="font-bold text-[17px] text-[#0d2265] tracking-tight cursor-pointer shrink-0 font-['Playfair_Display',Georgia,serif]">
            À la Source
          </button>
          <nav className="hidden lg:flex items-center gap-7 text-[13px]">
            {[
              { label: "Services", anchor: "#services" },
              { label: "Catalogue", screen: "catalogue" as Screen },
              { label: "Expertise", anchor: "#expertise" },
              { label: "Contact", anchor: "#contact" },
            ].map(item => (
              <button key={item.label}
                onClick={() => item.screen ? nav(item.screen) : (item.anchor ? document.querySelector(item.anchor)?.scrollIntoView({ behavior: "smooth" }) : null)}
                className="text-[#64697d] hover:text-[#0d2265] cursor-pointer transition-colors">
                {item.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {basket.length > 0 && (
              <button onClick={onBasketOpen} className="hidden sm:flex items-center gap-2 text-[13px] font-semibold text-[#0d2265] border border-[rgba(13,34,101,0.2)] px-3 py-2 hover:bg-[#f4f5f9] cursor-pointer transition-colors">
                <Package className="w-3.5 h-3.5" />
                Ma demande <span className="bg-[#0d2265] text-white text-[9px] font-bold px-1.5 py-0.5 leading-none">{basket.length}</span>
              </button>
            )}
            <button onClick={() => nav("login")}
              className="hidden sm:block text-[12px] text-[#64697d] hover:text-[#0d2265] cursor-pointer transition-colors">
              Fournisseurs
            </button>
            <BtnNavy onClick={() => window.open(CALENDLY_URL, '_blank')} className="hidden sm:inline-flex text-[12px] px-4 py-2">
              Échanger
            </BtnNavy>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-[#0d2265] cursor-pointer">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden bg-white border-t border-[rgba(13,34,101,0.06)] px-6 py-4 space-y-1">
            {["Services","Catalogue","Expertise","Contact"].map(l => (
              <button key={l} onClick={() => { setOpen(false); if (l === "Catalogue") nav("catalogue"); }}
                className="block w-full text-left text-sm text-[#0a0a0f] py-2.5 cursor-pointer hover:text-[#0d2265] transition-colors">
                {l}
              </button>
            ))}
            <button onClick={() => { setOpen(false); nav("login"); }} className="block w-full text-left text-sm text-[#64697d] py-2.5 cursor-pointer">
              Espace fournisseurs
            </button>
            {basket.length > 0 && (
              <button onClick={() => { setOpen(false); onBasketOpen(); }} className="block w-full text-left text-sm font-semibold text-[#0d2265] py-2.5 cursor-pointer">
                Ma demande · {basket.length}
              </button>
            )}
            <BtnNavy onClick={() => { setOpen(false); window.open(CALENDLY_URL, '_blank'); }} className="w-full justify-center mt-2">
              Échanger
            </BtnNavy>
          </div>
        )}
      </div>
    </header>
  );
}
