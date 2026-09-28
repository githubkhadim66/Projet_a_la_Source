/** Sections de la landing page (S0 → S13 de la maquette de contenu). */

import { useEffect, useState } from "react";
import {
  ArrowRight, Calendar, Check, CheckCircle, ChevronDown,
  Download, FileText, Package, Search, Shield, Truck,
} from "lucide-react";
import * as api from "@/lib/api";
import { CALENDLY_URL, IMG_HERO } from "@/lib/constants";
import { productImg } from "@/lib/format";
import { useLang, useLandingText } from "@/lib/landingText";
import type { Nav } from "@/lib/routes";
import { BtnAccent, BtnNavy, BtnOutlineWhite, BtnWhite } from "@/app/components/common/buttons";
import { CountUp } from "@/app/components/common/CountUp";

// ─── Hero ────────────────────────────────────────────────────────────────────

export function Hero({ nav }: { nav: Nav }) {
  const t = useLandingText().hero;
  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight: "clamp(420px,62vh,680px)" }}>
      <div className="absolute inset-0">
        <img src={IMG_HERO} alt={t.imgAlt} className="w-full h-full object-cover object-center als-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080f2e]/98 via-[#0d2265]/80 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full" style={{ paddingTop: "clamp(3rem,8vh,5rem)", paddingBottom: "clamp(3rem,8vh,5rem)" }}>
        <div className="max-w-[620px]">
          <div className="flex items-center gap-3 mb-6 als-hero-in" style={{ ["--hero-delay" as string]: "60ms" }}>
            {/* <div className="w-6 h-[1.5px] bg-white/40" /> */}
            <p className="text-[10px] font-bold text-white/50 tracking-[0.22em] uppercase">{t.kicker}</p>
          </div>
          <h1
            className="font-['Playfair_Display',Georgia,serif] font-bold text-white leading-[1.06] mb-5 als-hero-in"
            style={{ fontSize: "clamp(2.6rem,5vw,4rem)", ["--hero-delay" as string]: "160ms" }}
          >
            {t.title}
          </h1>
          <p className="text-white/55 leading-relaxed mb-9 als-hero-in" style={{ fontSize: "15px", ["--hero-delay" as string]: "280ms" }}>
            {t.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-5 als-hero-in als-arrow-parent" style={{ ["--hero-delay" as string]: "400ms" }}>
            <BtnAccent onClick={() => window.open(CALENDLY_URL, '_blank')} className="als-cta">
              {t.ctaExpert}
            </BtnAccent>
            <button onClick={() => nav("devis")} className="inline-flex items-center gap-1.5 text-white/60 text-sm font-medium cursor-pointer hover:text-white transition-colors">
              {t.ctaQuote} <span className="als-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C4613A]/40" />
    </section>
  );
}

// ─── Chiffres clés ───────────────────────────────────────────────────────────

export function KeyFigures() {
  const stats = useLandingText().figures;
  return (
    <section className="bg-white border-t-2 border-[#C4613A]">
      {/* Aligné sur le conteneur du site (header, hero…) pour un rendu régulier sur grand écran */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-[rgba(13,34,101,0.08)]">
          {stats.map((s, i) => (
            <div key={i} className="relative py-8 px-5 lg:px-6 text-center stagger-item" style={{ ["--i-delay" as string]: `${i * 110}ms` }}>
              <p className="font-black text-[#0d2265] leading-none tabular-nums" style={{ fontSize: "clamp(2.2rem,3vw,3rem)" }}>
                <span className="als-underline-draw inline-block pb-1.5" style={{ ["--draw-delay" as string]: `${i * 120}ms` }}>
                  <CountUp value={s.n} />
                </span>
              </p>
              <p className="text-[10px] font-bold text-[#C4613A] uppercase tracking-[0.16em] mt-2 leading-snug">{s.tag}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Services (S3+S4 fusionnées) ─────────────────────────────────────────────

export function ServicesSection({ nav }: { nav: Nav }) {
  const tx = useLandingText().services;
  const pillars = [
    { icon: <Shield className="w-8 h-8" />, action: () => nav("catalogue"), num: "01" },
    { icon: <CheckCircle className="w-8 h-8" />, action: () => window.open(CALENDLY_URL, '_blank'), num: "02" },
    { icon: <Truck className="w-8 h-8" />, action: () => nav("devis"), num: "03" },
  ].map((p, i) => ({ ...p, ...tx.pillars[i] }));

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2
          className="font-['Playfair_Display',Georgia,serif] font-bold text-[#0a0a0f] leading-[0.92] mb-12"
          style={{ fontSize: "clamp(2.6rem,4.5vw,4.5rem)" }}
        >
          {tx.title[0]}<br />{tx.title[1]}
        </h2>
        <div className="grid lg:grid-cols-3 gap-px bg-[rgba(13,34,101,0.1)]">
          {pillars.map((p, i) => (
            <div
              key={i}
              onClick={p.action}
              className="relative bg-white p-9 group cursor-pointer hover:bg-[#0d2265] transition-colors duration-300 als-underline stagger-item"
              style={{ ["--i-delay" as string]: `${i * 130}ms` }}
            >
              <span className="absolute top-6 right-7 text-[10px] text-[#64697d]/20 group-hover:text-white/15 transition-colors duration-300 tabular-nums font-mono">
                {p.num}
              </span>
              <div className="text-[#0d2265] group-hover:text-white transition-colors duration-300 mb-7">{p.icon}</div>
              <p className="text-[10px] font-bold text-[#C4613A] tracking-[0.18em] uppercase mb-2">{p.tag}</p>
              <h3 className="text-lg font-bold text-[#0a0a0f] group-hover:text-white transition-colors duration-300 mb-8 leading-tight">{p.title}</h3>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0d2265] group-hover:text-white transition-colors duration-300">
                {p.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Vitrine catalogue (produits en vedette · dynamique) ─────────────────────

export function CatalogueTeaser({ nav, basket, setBasket }: { nav: Nav; basket: string[]; setBasket: (b: string[]) => void }) {
  const tx = useLandingText().catalogue;
  const lang = useLang();
  const [products, setProducts] = useState<api.ApiPublicProduct[]>([]);

  // Rechargé à chaque changement de langue : le serveur renvoie le contenu traduit (EN).
  useEffect(() => {
    api.catalogue.products(true, lang).then(ps => setProducts(ps.slice(0, 6))).catch(() => setProducts([]));
  }, [lang]);

  const toggle = (name: string) => {
    setBasket(basket.includes(name) ? basket.filter(n => n !== name) : [...basket, name]);
  };

  // Ouvre la fiche produit (page dédiée) · la référence est passée via localStorage.
  const openProduct = (refId: string) => {
    try { localStorage.setItem("als-product-ref", refId); } catch { /* stockage indispo */ }
    nav("produit");
  };
  return (
    <section id="catalogue" className="py-16 bg-[#f4f5f9]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f]">
            {tx.title}
          </h2>
          <BtnAccent onClick={() => nav("catalogue")} className="als-cta als-arrow-parent">
            {tx.full} <ArrowRight className="w-4 h-4 als-arrow" />
          </BtnAccent>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(13,34,101,0.1)]">
          {products.map((p, i) => {
            // Le panier garde le nom d'origine (français) : le formulaire de devis le reconnaît.
            const basketName = p.source_name || p.name;
            const inBasket = basket.includes(basketName);
            return (
              <div key={p.ref} className="bg-white group als-lift stagger-item relative z-0 hover:z-10" style={{ ["--i-delay" as string]: `${i * 90}ms` }}>
                <button type="button" onClick={() => openProduct(p.ref)} className="block w-full text-left cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden bg-[#eef1f8] relative">
                    <img
                      src={productImg(p.image)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f]/70 to-transparent text-white text-[11px] font-semibold px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {tx.view} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="px-5 pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-[#C4613A] tracking-[0.13em] uppercase">{p.category}</p>
                      {p.origin && (/sénégal|senegal/i.test(p.origin)
                        ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#C4613A] bg-[#C4613A]/10 px-1.5 py-0.5 uppercase tracking-wide">★ {p.origin}</span>
                        : <span className="text-[10px] text-[#64697d] uppercase tracking-wide">{p.origin}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#0a0a0f] text-sm mb-3 group-hover:text-[#0d2265] transition-colors">{p.name}</h3>
                  </div>
                </button>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => toggle(basketName)}
                    className={`w-full py-2 text-xs font-semibold transition-colors duration-300 cursor-pointer border flex items-center justify-center gap-1.5 ${
                      inBasket
                        ? "bg-[#0d2265] text-white border-[#0d2265]"
                        : "border-[rgba(13,34,101,0.18)] text-[#0d2265] hover:bg-[#0d2265] hover:text-white hover:border-[#0d2265]"
                    }`}
                  >
                    {inBasket ? <><Check className="w-3 h-3" /> {tx.added}</> : <>{tx.add}</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Comment ça marche ───────────────────────────────────────────────────────

export function HowItWorks({ nav }: { nav: Nav }) {
  const tx = useLandingText().how;
  const icons = [<FileText className="w-6 h-6" />, <Search className="w-6 h-6" />, <Package className="w-6 h-6" />, <Truck className="w-6 h-6" />];
  const steps = tx.steps.map((title, i) => ({ n: `0${i + 1}`, icon: icons[i], title }));
  return (
    <section className="py-16 bg-white border-t border-[rgba(13,34,101,0.06)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-12">
          <div className="lg:w-64 shrink-0">
            <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f] leading-[1.1] mb-6">
              {tx.title}
            </h2>
            <button onClick={() => nav("devis")} className="flex items-center gap-2 text-sm font-semibold text-[#0d2265] hover:gap-3 transition-all cursor-pointer">
              {tx.start} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-px bg-[rgba(13,34,101,0.1)]">
            {steps.map((s, i) => (
              <div key={i} className="bg-white p-7 hover:bg-[#f8f9fc] transition-colors duration-300 group stagger-item" style={{ ["--i-delay" as string]: `${i * 120}ms` }}>
                <p className="text-[4rem] font-black text-[rgba(13,34,101,0.05)] group-hover:text-[rgba(196,97,58,0.12)] leading-none mb-1 transition-colors duration-300">{s.n}</p>
                <div className="text-[#0d2265] mb-2 transition-transform duration-300 group-hover:-translate-y-0.5">{s.icon}</div>
                <h3 className="text-sm font-semibold text-[#0a0a0f] leading-snug">{s.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Bloc devis / sourcing ───────────────────────────────────────────────────

export function QuoteSection({ nav }: { nav: Nav }) {
  const tx = useLandingText().quote;
  const [tab, setTab] = useState<"devis" | "sourcing">("devis");

  const panels = {
    devis: { label: tx.devis.label, cta: tx.devis.cta, bullets: tx.devis.bullets, icon: <FileText className="w-4 h-4" />, action: () => nav("devis") },
    sourcing: { label: tx.sourcing.label, cta: tx.sourcing.cta, bullets: tx.sourcing.bullets, icon: <Search className="w-4 h-4" />, action: () => nav("sourcing") },
  };

  const p = panels[tab];

  return (
    <section id="devis" className="bg-[#0d2265]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2">
          {/* Left */}
          <div className="py-16 pr-14 flex flex-col justify-between border-r border-white/10">
            <h2 className="font-['Playfair_Display',Georgia,serif] text-[2.6rem] font-bold text-white leading-[1.05]">
              {tx.title}
            </h2>
            <p className="text-base text-white/70 leading-relaxed mt-10 max-w-md">
              {tx.subtitle}
            </p>
          </div>
          {/* Right */}
          <div className="py-16 pl-14 flex flex-col">
            <div className="flex mb-7 gap-0">
              {(["devis","sourcing"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3 px-4 text-sm font-semibold cursor-pointer transition-colors border-b-2 text-left ${tab === t ? "border-white text-white" : "border-white/12 text-white/35 hover:text-white/60"}`}>
                  {panels[t].label}
                </button>
              ))}
            </div>
            <ul key={tab} className="space-y-2.5 mb-8 als-expand">
              {p.bullets.map(b => (
                <li key={b} className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1 h-1 rounded-full bg-[#C4613A] shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <BtnWhite onClick={p.action} className="als-cta als-arrow-parent">
              {p.icon} {p.cta} <ArrowRight className="w-4 h-4 als-arrow" />
            </BtnWhite>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Expertise (fondateurs) ──────────────────────────────────────────────────

export function Expertise({ nav: _nav }: { nav: Nav }) {
  const tx = useLandingText().expertise;
  const founders = [
    { initials: "OB", name: "Ousmane BA", highlight: "", line: "" },
    { initials: "OS", name: "Oumou Soumano", highlight: "", line: "" },
  ].map((f, i) => ({ ...f, ...tx.founders[i] }));

  return (
    <section id="expertise" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-['Playfair_Display',Georgia,serif] text-4xl font-bold text-[#0a0a0f] leading-[1.1] mb-10">
          {tx.title[0]}<br />{tx.title[1]}
        </h2>
        {/* Pullquotes */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {tx.quotes.map((q, i) => (
            <div key={i} className="bg-[#f4f5f9] px-8 py-7 border-l-[3px] border-[#C4613A] stagger-item" style={{ ["--i-delay" as string]: `${i * 120}ms` }}>
              <p className="font-['Playfair_Display',Georgia,serif] text-lg italic text-[#0d2265] leading-relaxed mb-2">
                {q.text}
              </p>
              <p className="text-xs text-[#64697d]">{q.by}</p>
            </div>
          ))}
        </div>
        {/* Founder cards */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {founders.map((f, i) => (
            <div key={i} className="border border-[rgba(13,34,101,0.12)] p-7 als-lift stagger-item" style={{ ["--i-delay" as string]: `${200 + i * 130}ms` }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-[rgba(13,34,101,0.05)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#64697d] tracking-wide">{f.initials}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-0.5">
                    <p className="font-bold text-[#0d2265]">{f.name}</p>
                    <span className="text-[10px] font-bold text-[#C4613A] tracking-[0.18em] uppercase">{f.label}</span>
                  </div>
                  <p className="text-sm text-[#64697d]">{f.role}</p>
                </div>
              </div>
              {f.highlight && (
                <span className="inline-block bg-[#C4613A]/10 text-[#C4613A] text-xs font-bold px-3 py-1.5 mb-4 tracking-wide">
                  {f.highlight}
                </span>
              )}
              {f.line && <p className="text-sm text-[#64697d] leading-relaxed mb-4">{f.line}</p>}
              <div className="flex flex-wrap gap-2">
                {f.tags.map(t => (
                  <span key={t} className="text-[11px] border border-[rgba(13,34,101,0.15)] text-[#0d2265] px-2.5 py-1">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <BtnNavy onClick={() => window.open(CALENDLY_URL, '_blank')}>
          <Calendar className="w-4 h-4" /> {tx.cta}
        </BtnNavy>
      </div>
    </section>
  );
}

// ─── Section fournisseurs (S9) ───────────────────────────────────────────────

export function SupplierSection({ nav }: { nav: Nav }) {
  const tx = useLandingText().suppliers;
  return (
    <section id="fournisseurs" className="py-16 bg-[#080f2e]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-['Playfair_Display',Georgia,serif] text-4xl font-bold text-white leading-[1.1] mb-8">
          {tx.title[0]}<br />{tx.title[1]}
        </h2>
        <div className="grid lg:grid-cols-2 gap-px bg-white/[0.06]">
          <div className="bg-transparent border border-white/10 p-8 hover:bg-white/[0.04] transition-colors duration-300 stagger-item from-left">
            <h3 className="font-bold text-white text-xl mb-6">{tx.becomeTitle}</h3>
            <BtnWhite onClick={() => nav("candidature")} className="als-arrow-parent">{tx.apply} <ArrowRight className="w-4 h-4 als-arrow" /></BtnWhite>
          </div>
          <div className="bg-transparent border border-white/10 p-8 hover:bg-white/[0.04] transition-colors duration-300 stagger-item from-right" style={{ ["--i-delay" as string]: "120ms" }}>
            <h3 className="font-bold text-white text-xl mb-6">{tx.alreadyTitle}</h3>
            <BtnOutlineWhite onClick={() => nav("login")}>{tx.space} <ArrowRight className="w-4 h-4" /></BtnOutlineWhite>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Preuve sociale ──────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { quote: "Nous cherchions du beurre de karité en volumes réguliers, avec certification Bio. Funti a livré une première commande conforme en six semaines · sans aucun écart sur le cahier des charges.", name: "Sophie M.", role: "Responsable achats", company: "Cosmétiques Naturels Pro", country: "France" },
  { quote: "Ce que j'apprécie, c'est la transparence totale sur les délais et les incoterms. Le devis était clair, la logistique pilotée sans accroc. Je recommande sans hésitation.", name: "Klaus H.", role: "Directeur des opérations", company: "BioImport GmbH", country: "Allemagne" },
  { quote: "En tant qu'épicerie fine, nous avons besoin de cohérence qualitative lot après lot. Funti est le seul interlocuteur qui nous a garanti cette constance, dès la première livraison.", name: "Pauline R.", role: "Co-fondatrice", company: "Épicerie Léontine", country: "Belgique" },
];

export function SocialProof() {
  const ENGAGEMENTS = useLandingText().engagements;
  return (
    <section className="py-16 bg-[#f4f5f9]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Témoignages masqués : placeholders en attente des vrais (accord écrit requis).
            Seule la barre d'engagements factuels reste affichée.
        <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f] mb-10">Ils nous font confiance.</h2>
        <div className="grid lg:grid-cols-3 gap-px bg-[rgba(13,34,101,0.1)] mb-px">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white p-7">
              <div className="text-[4rem] font-serif text-[#0d2265]/10 leading-none -mb-6 select-none">&ldquo;</div>
              <p className="text-[#0a0a0f] text-[15px] leading-relaxed italic">{t.quote}</p>
              <div className="mt-6 pt-6 border-t border-[rgba(13,34,101,0.08)]">
                <p className="font-bold text-[#0a0a0f] text-sm">{t.name}</p>
                <p className="text-xs text-[#64697d] mt-0.5">{t.role} · {t.company}</p>
              </div>
            </div>
          ))}
        </div>
        */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(13,34,101,0.1)]">
          {ENGAGEMENTS.map((e, i) => (
            <div key={i} className="bg-white p-8 flex items-start gap-3 stagger-item" style={{ ["--i-delay" as string]: `${i * 110}ms` }}>
              <div className="w-5 h-5 bg-[#0d2265] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm text-[#0a0a0f] font-medium leading-snug">{e}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export function FAQSection() {
  const faq = useLandingText().faq;
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f] mb-8 text-left">{faq.title}</h2>
        <div>
          {faq.items.map((f, i) => (
            <div key={i} className="py-6 border-b border-[rgba(13,34,101,0.08)] stagger-item" style={{ ["--i-delay" as string]: `${i * 70}ms` }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-left cursor-pointer group">
                <span className={`text-[15px] pr-8 transition-colors duration-300 ${open === i ? "font-semibold text-[#0d2265]" : "font-medium text-[#0a0a0f] group-hover:text-[#0d2265]"}`}>
                  {f.q}
                </span>
                <span className={`shrink-0 transition-transform duration-300 ${open === i ? "rotate-180 text-[#0d2265]" : "text-[#64697d]"}`}>
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>
              {open === i && (
                <div className="mt-3 als-expand">
                  <p className="text-sm text-[#64697d] leading-loose">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ───────────────────────────────────────────────────────────────

export function FinalCTA({ nav }: { nav: Nav }) {
  const tx = useLandingText().finalCta;
  return (
    <section className="py-16 bg-[#0d2265] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,white 59px,white 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,white 59px,white 60px)" }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div>
            <h2
              className="font-['Playfair_Display',Georgia,serif] font-bold text-white leading-[1.0] stagger-item"
              style={{ fontSize: "clamp(3rem,5vw,5rem)" }}
            >
              {tx.title[0]}<br />{tx.title[1]}<br />{tx.title[2]}
            </h2>
          </div>
          <div className="flex flex-col gap-3 shrink-0 min-w-[240px]">
            <BtnAccent onClick={() => nav("catalogue")} className="als-cta stagger-item from-right" style={{ ["--i-delay" as string]: "120ms" }}>
              <Download className="w-4 h-4" /> {tx.catalogue}
            </BtnAccent>
            <BtnOutlineWhite onClick={() => nav("devis")} className="als-cta stagger-item from-right" style={{ ["--i-delay" as string]: "200ms" }}>
              <FileText className="w-4 h-4" /> {tx.quote}
            </BtnOutlineWhite>
            <BtnOutlineWhite onClick={() => window.open(CALENDLY_URL, '_blank')} className="stagger-item from-right" style={{ ["--i-delay" as string]: "280ms" }}>
              <Calendar className="w-4 h-4" /> {tx.expert}
            </BtnOutlineWhite>
          </div>
        </div>
      </div>
    </section>
  );
}
