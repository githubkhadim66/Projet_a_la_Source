/** En-tête fixe de la landing : navigation, panier « Ma demande », menu mobile, langue. */

import { Menu, Package, X } from "lucide-react";
import { CALENDLY_URL } from "@/lib/constants";
import type { Nav, Screen } from "@/lib/routes";
import { useLandingText } from "@/lib/landingText";
import { BtnNavy } from "@/app/components/common/buttons";

export function Header({ nav, open, setOpen, basket, onBasketOpen, lang, setLang }: {
  nav: Nav;
  open: boolean; setOpen: (v: boolean) => void;
  basket: string[]; onBasketOpen: () => void;
  lang: string; setLang: (l: "fr" | "en") => void;
}) {
  const t = useLandingText();
  const goAnchor = (a: string) => document.querySelector(a)?.scrollIntoView({ behavior: "smooth" });
  const navItems: { label: string; anchor?: string; screen?: Screen }[] = [
    { label: t.nav.services, anchor: "#services" },
    { label: t.nav.catalogue, screen: "catalogue" },
    { label: t.nav.expertise, anchor: "#expertise" },
    { label: t.nav.contact, anchor: "#contact" },
  ];
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-white border-b border-[rgba(13,34,101,0.08)]">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center gap-8">
          <button onClick={() => nav("landing")} className="font-bold text-[17px] text-[#0d2265] tracking-tight cursor-pointer shrink-0 font-['Playfair_Display',Georgia,serif]">
            Funti
          </button>
          <nav className="hidden lg:flex items-center gap-7 text-[13px]">
            {navItems.map(item => (
              <button key={item.label}
                onClick={() => item.screen ? nav(item.screen) : item.anchor ? goAnchor(item.anchor) : null}
                className="text-[#64697d] hover:text-[#0d2265] cursor-pointer transition-colors">
                {item.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {/* Sélecteur de langue — accessible en haut, sans avoir à descendre en bas */}
            <div className="flex items-center gap-1 text-[12px] text-[#64697d]">
              <button onClick={() => setLang("fr")}
                className={`cursor-pointer px-1 transition-colors ${lang === "fr" ? "text-[#0d2265] font-bold" : "hover:text-[#0d2265]"}`}>FR</button>
              <span className="text-[#c3c9dd]">│</span>
              <button onClick={() => setLang("en")}
                className={`cursor-pointer px-1 transition-colors ${lang === "en" ? "text-[#0d2265] font-bold" : "hover:text-[#0d2265]"}`}>EN</button>
            </div>
            {basket.length > 0 && (
              <button onClick={onBasketOpen} className="hidden sm:flex items-center gap-2 text-[13px] font-semibold text-[#0d2265] border border-[rgba(13,34,101,0.2)] px-3 py-2 hover:bg-[#f4f5f9] cursor-pointer transition-colors">
                <Package className="w-3.5 h-3.5" />
                {t.header.request} <span className="bg-[#0d2265] text-white text-[9px] font-bold px-1.5 py-0.5 leading-none">{basket.length}</span>
              </button>
            )}
            <button onClick={() => nav("login")}
              className="hidden sm:block text-[12px] text-[#64697d] hover:text-[#0d2265] cursor-pointer transition-colors">
              {t.header.suppliers}
            </button>
            <BtnNavy onClick={() => window.open(CALENDLY_URL, '_blank')} className="hidden sm:inline-flex text-[12px] px-4 py-2">
              {t.header.talk}
            </BtnNavy>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-[#0d2265] cursor-pointer">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden bg-white border-t border-[rgba(13,34,101,0.06)] px-6 py-4 space-y-1">
            {navItems.map(item => (
              <button key={item.label}
                onClick={() => { setOpen(false); item.screen ? nav(item.screen) : item.anchor ? goAnchor(item.anchor) : null; }}
                className="block w-full text-left text-sm text-[#0a0a0f] py-2.5 cursor-pointer hover:text-[#0d2265] transition-colors">
                {item.label}
              </button>
            ))}
            <button onClick={() => { setOpen(false); nav("login"); }} className="block w-full text-left text-sm text-[#64697d] py-2.5 cursor-pointer">
              {t.header.supplierArea}
            </button>
            {basket.length > 0 && (
              <button onClick={() => { setOpen(false); onBasketOpen(); }} className="block w-full text-left text-sm font-semibold text-[#0d2265] py-2.5 cursor-pointer">
                {t.header.request} · {basket.length}
              </button>
            )}
            <BtnNavy onClick={() => { setOpen(false); window.open(CALENDLY_URL, '_blank'); }} className="w-full justify-center mt-2">
              {t.header.talk}
            </BtnNavy>
            <div className="flex items-center gap-1 text-[13px] text-[#64697d] pt-3 mt-1 border-t border-[rgba(13,34,101,0.06)]">
              <span className="mr-1">{t.header.language} :</span>
              <button onClick={() => setLang("fr")}
                className={`cursor-pointer px-1.5 py-1 transition-colors ${lang === "fr" ? "text-[#0d2265] font-bold" : "hover:text-[#0d2265]"}`}>FR</button>
              <span className="text-[#c3c9dd]">│</span>
              <button onClick={() => setLang("en")}
                className={`cursor-pointer px-1.5 py-1 transition-colors ${lang === "en" ? "text-[#0d2265] font-bold" : "hover:text-[#0d2265]"}`}>EN</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
