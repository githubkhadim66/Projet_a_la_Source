/** Page d'accueil : assemblage des sections + état local (menu, panier, cookies, langue). */

import { useEffect, useState } from "react";
import type { Nav } from "@/lib/routes";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BasketPanel, CookieBanner } from "./overlays";
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
        <Hero nav={nav} />
        <KeyFigures />
        <ServicesSection nav={nav} />
        <CatalogueTeaser nav={nav} basket={basket} setBasket={setBasket} />
        <HowItWorks nav={nav} />
        <QuoteSection nav={nav} />
        <Expertise nav={nav} />
        <SupplierSection nav={nav} />
        <SocialProof />
        <FAQSection />
        <FinalCTA nav={nav} />
        <Footer nav={nav} lang={lang} setLang={setLang} />
      </main>
      {!cookieDismissed && <CookieBanner onDismiss={() => setCookieDismissed(true)} />}
    </div>
  );
}
