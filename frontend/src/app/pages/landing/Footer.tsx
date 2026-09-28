/** Pied de page : navigation, contact, sélecteur de langue, accès admin discret. */

import { Globe, Mail, Phone } from "lucide-react";
import type { Nav, Screen } from "@/lib/routes";
import { useLandingText } from "@/lib/landingText";

export function Footer({ nav, lang, setLang }: { nav: Nav; lang: string; setLang: (l: "fr" | "en") => void }) {
  const t = useLandingText();
  const links: { l: string; s?: Screen; anchor?: string }[] = [
    { l: t.footer.links[0], anchor: "#services" },
    { l: t.footer.links[1], s: "catalogue" },
    { l: t.footer.links[2], anchor: "#expertise" },
    { l: t.footer.links[3], anchor: "#faq" },
    { l: t.footer.links[4], anchor: "#contact" },
  ];
  return (
    <footer id="contact" className="bg-[#080f2e] text-white pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12 pb-12 border-b border-white/10">
          <div>
            <p className="font-bold text-xl tracking-tight mb-3">Funti</p>
            <p className="text-white/40 text-sm leading-relaxed">
              {t.footer.tagline}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-5">{t.footer.navTitle}</p>
            <div className="space-y-2">
              {links.map((item, i) => (
                <button
                  key={i}
                  onClick={() => item.s
                    ? nav(item.s)
                    : item.anchor ? document.querySelector(item.anchor)?.scrollIntoView({ behavior: "smooth" }) : undefined}
                  className="block text-sm text-white/50 hover:text-white cursor-pointer transition-colors"
                >
                  {item.l}
                </button>
              ))}
              <button onClick={() => nav("login")} className="block text-sm text-white/25 hover:text-white/60 cursor-pointer transition-colors mt-1">
                {t.footer.supplierArea}
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-5">{t.footer.contactTitle}</p>
            <div className="space-y-2.5 text-sm text-white/50">
              <a href="mailto:contact@funtiworld.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 shrink-0" /> contact@funtiworld.com
              </a>
              <a href="tel:+33100000000" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 shrink-0" /> +33 1 00 00 00 00
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
                <Globe className="w-4 h-4 shrink-0" /> LinkedIn · Oumou Soumano
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-white/25 text-xs">
            {t.footer.legal}
            <button onClick={() => nav("admin-dashboard")} className="ml-4 opacity-20 hover:opacity-60 cursor-pointer transition-opacity text-white underline">Admin</button>
          </p>
          <div className="flex items-center gap-1 text-xs text-white/30">
            <button onClick={() => setLang("fr")} className={`cursor-pointer px-1 transition-colors ${lang === "fr" ? "text-white font-bold" : "hover:text-white/60"}`}>FR</button>
            <span>│</span>
            <button onClick={() => setLang("en")} className={`cursor-pointer px-1 transition-colors ${lang === "en" ? "text-white font-bold" : "hover:text-white/60"}`}>EN</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
