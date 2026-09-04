/** Page d'accueil : assemblage des sections + état local (menu, panier, cookies, langue). */

import { useEffect, useState } from "react";
import type { Nav } from "@/lib/routes";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BasketPanel, CookieBanner } from "./overlays";
import { Reveal } from "@/app/components/common/Reveal";
import {
  CatalogueTeaser, Expertise, FAQSection, FinalCTA, Hero, HowItWorks,
  KeyFigures, QuoteSection, ServicesSection, SocialProof, SupplierSection,
} from "./sections";

export function LandingPage({ nav }: { nav: Nav }) {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [basket, setBasket] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("als-basket") || "[]"); } catch { return []; }
  });
  const [basketOpen, setBasketOpen] = useState(false);
  const [cookieDismissed, setCookieDismissed] = useState(() =>
    localStorage.getItem("als-cookie") === "1"
  );

  useEffect(() => {
    localStorage.setItem("als-basket", JSON.stringify(basket));
  }, [basket]);

  useEffect(() => {
    if (cookieDismissed) localStorage.setItem("als-cookie", "1");
  }, [cookieDismissed]);

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      <Header
        nav={nav}
        open={menuOpen} setOpen={setMenuOpen}
        basket={basket} onBasketOpen={() => setBasketOpen(true)}
      />
      {basketOpen && (
        <BasketPanel basket={basket} setBasket={setBasket} nav={nav} onClose={() => setBasketOpen(false)} />
      )}
      <main className="pt-[60px]">
        {/* Le hero s'anime au chargement ; les sections suivantes se révèlent au défilement. */}
        <Hero nav={nav} />
        <Reveal><KeyFigures /></Reveal>
        <Reveal><ServicesSection nav={nav} /></Reveal>
        <Reveal><CatalogueTeaser nav={nav} basket={basket} setBasket={setBasket} /></Reveal>
        <Reveal><HowItWorks nav={nav} /></Reveal>
        <Reveal><QuoteSection nav={nav} /></Reveal>
        <Reveal><Expertise nav={nav} /></Reveal>
        <Reveal><SupplierSection nav={nav} /></Reveal>
        {/* SocialProof : témoignages masqués dans sections.tsx ; seule la barre
            d'engagements factuels reste affichée. */}
        <Reveal><SocialProof /></Reveal>
        <Reveal><FAQSection /></Reveal>
        <Reveal><FinalCTA nav={nav} /></Reveal>
        <Footer nav={nav} lang={lang} setLang={setLang} />
      </main>
      {!cookieDismissed && <CookieBanner onDismiss={() => setCookieDismissed(true)} />}
    </div>
  );
}
