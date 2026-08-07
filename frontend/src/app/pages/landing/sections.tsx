/** Sections de la landing page (S0 → S13 de la maquette de contenu). */

import { useEffect, useState } from "react";
import {
  ArrowRight, Calendar, Check, CheckCircle, ChevronDown, ChevronUp,
  Download, FileText, Package, Search, Shield, Truck,
} from "lucide-react";
import * as api from "@/lib/api";
import { CALENDLY_URL, IMG_HERO } from "@/lib/constants";
import { productImg } from "@/lib/format";
import type { Nav } from "@/lib/routes";
import { BtnAccent, BtnNavy, BtnOutlineWhite, BtnWhite } from "@/app/components/common/buttons";

// ─── Hero ────────────────────────────────────────────────────────────────────

export function Hero({ nav }: { nav: Nav }) {
  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight: "clamp(420px,62vh,680px)" }}>
      <div className="absolute inset-0">
        <img src={IMG_HERO} alt="Épices et produits du terroir africain" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080f2e]/98 via-[#0d2265]/80 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full" style={{ paddingTop: "clamp(3rem,8vh,5rem)", paddingBottom: "clamp(3rem,8vh,5rem)" }}>
        <div className="max-w-[620px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-[1.5px] bg-white/40" />
            <p className="text-[10px] font-bold text-white/50 tracking-[0.22em] uppercase">Sourcing · Export · Afrique · Europe</p>
          </div>
          <h1
            className="font-['Playfair_Display',Georgia,serif] font-bold text-white leading-[1.06] mb-5"
            style={{ fontSize: "clamp(2.6rem,5vw,4rem)" }}
          >
            Matières premières et produits finis africains — de la source à votre entrepôt.
          </h1>
          <p className="text-white/55 leading-relaxed mb-9" style={{ fontSize: "15px" }}>
            Un seul interlocuteur entre vos exigences et un réseau de fournisseurs audités.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <BtnAccent onClick={() => window.open(CALENDLY_URL, '_blank')}>
              Échanger avec un expert
            </BtnAccent>
            <button onClick={() => nav("devis")} className="text-white/60 text-sm font-medium cursor-pointer hover:text-white transition-colors">
              Demander une cotation →
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
  const stats = [
    { n: "24 ans", tag: "Expertise cumulée" },
    { n: "14 ans", tag: "En grande distribution" },
    { n: "200+", tag: "Organisations accompagnées" },
    { n: "Bio UE", tag: "Export certifié" },
    { n: "2", tag: "Continents" },
  ];
  return (
    <section className="bg-white border-t-2 border-[#C4613A]">
      {/* Aligné sur le conteneur du site (header, hero…) pour un rendu régulier sur grand écran */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-[rgba(13,34,101,0.08)]">
          {stats.map((s, i) => (
            <div key={i} className="py-8 px-5 lg:px-6 text-center">
              <p className="font-black text-[#0d2265] leading-none tabular-nums" style={{ fontSize: "clamp(2.2rem,3vw,3rem)" }}>{s.n}</p>
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
  const pillars = [
    {
      icon: <Shield className="w-8 h-8" />, tag: "Fournisseurs", title: "Audités sur place",
      line: "Chaque fournisseur est évalué en personne avant tout référencement.",
      action: () => nav("catalogue"), cta: "Voir le catalogue", num: "01",
    },
    {
      icon: <CheckCircle className="w-8 h-8" />, tag: "Conformité", title: "Normes UE garanties",
      line: "HACCP, Bio, Halal — conformité européenne vérifiée pour chaque produit.",
      action: () => window.open(CALENDLY_URL, '_blank'), cta: "Discuter de vos besoins", num: "02",
    },
    {
      icon: <Truck className="w-8 h-8" />, tag: "Logistique", title: "Supply chain clé en main",
      line: "Un seul devis, un seul interlocuteur, de la source à votre entrepôt.",
      action: () => nav("devis"), cta: "Demander un devis", num: "03",
    },
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2
          className="font-['Playfair_Display',Georgia,serif] font-bold text-[#0a0a0f] leading-[0.92] mb-12"
          style={{ fontSize: "clamp(2.6rem,4.5vw,4.5rem)" }}
        >
          Trois barrières.<br />Zéro compromis.
        </h2>
        <div className="grid lg:grid-cols-3 gap-px bg-[rgba(13,34,101,0.1)]">
          {pillars.map((p, i) => (
            <div
              key={i}
              onClick={p.action}
              className="relative bg-white p-9 group cursor-pointer hover:bg-[#0d2265] transition-colors duration-300"
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

// ─── Vitrine catalogue (produits en vedette — dynamique) ─────────────────────

export function CatalogueTeaser({ nav, basket, setBasket }: { nav: Nav; basket: string[]; setBasket: (b: string[]) => void }) {
  const [products, setProducts] = useState<api.ApiPublicProduct[]>([]);

  useEffect(() => {
    api.catalogue.products(true).then(ps => setProducts(ps.slice(0, 6))).catch(() => setProducts([]));
  }, []);

  const toggle = (name: string) => {
    setBasket(basket.includes(name) ? basket.filter(n => n !== name) : [...basket, name]);
  };
  return (
    <section id="catalogue" className="py-16 bg-[#f4f5f9]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f]">
            50+ références
          </h2>
          <BtnAccent onClick={() => nav("catalogue")}>
            Catalogue complet <ArrowRight className="w-4 h-4" />
          </BtnAccent>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(13,34,101,0.1)]">
          {products.map((p) => {
            const inBasket = basket.includes(p.name);
            return (
              <div key={p.ref} className="bg-white group">
                <div className="aspect-[4/3] overflow-hidden bg-[#eef1f8]">
                  <img
                    src={productImg(p.image)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-[#C4613A] tracking-[0.13em] uppercase">{p.category}</p>
                    <p className="text-[10px] text-[#64697d] uppercase tracking-wide">{p.origin}</p>
                  </div>
                  <h3 className="font-semibold text-[#0a0a0f] text-sm mb-3">{p.name}</h3>
                  <button
                    onClick={() => toggle(p.name)}
                    className={`w-full py-2 text-xs font-semibold transition-colors duration-300 cursor-pointer border flex items-center justify-center gap-1.5 ${
                      inBasket
                        ? "bg-[#0d2265] text-white border-[#0d2265]"
                        : "border-[rgba(13,34,101,0.18)] text-[#0d2265] hover:bg-[#0d2265] hover:text-white hover:border-[#0d2265]"
                    }`}
                  >
                    {inBasket ? <><Check className="w-3 h-3" /> Ajouté</> : <>+ Ma demande</>}
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
  const steps = [
    { n: "01", icon: <FileText className="w-6 h-6" />, title: "Transmettez votre besoin" },
    { n: "02", icon: <Search className="w-6 h-6" />, title: "Nous sélectionnons & vérifions" },
    { n: "03", icon: <Package className="w-6 h-6" />, title: "Devis unique sous 48 h" },
    { n: "04", icon: <Truck className="w-6 h-6" />, title: "Livraison de bout en bout" },
  ];
  return (
    <section className="py-16 bg-white border-t border-[rgba(13,34,101,0.06)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-12">
          <div className="lg:w-64 shrink-0">
            <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f] leading-[1.1] mb-6">
              De votre besoin à la livraison.
            </h2>
            <button onClick={() => nav("devis")} className="flex items-center gap-2 text-sm font-semibold text-[#0d2265] hover:gap-3 transition-all cursor-pointer">
              Démarrer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-px bg-[rgba(13,34,101,0.1)]">
            {steps.map((s, i) => (
              <div key={i} className="bg-white p-7 hover:bg-[#f8f9fc] transition-colors duration-300">
                <p className="text-[4rem] font-black text-[rgba(13,34,101,0.05)] leading-none mb-1">{s.n}</p>
                <div className="text-[#0d2265] mb-2">{s.icon}</div>
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
  const [tab, setTab] = useState<"devis" | "sourcing">("devis");

  const panels = {
    devis: {
      label: "Devis catalogue",
      desc: "Vous avez repéré un produit dans notre catalogue. Recevez un devis sous 24 à 48 h ouvrées.",
      cta: "Accéder au formulaire",
      icon: <FileText className="w-4 h-4" />,
      action: () => nav("devis"),
      bullets: ["Sélection depuis le catalogue", "Volume & conditionnement", "Incoterm au choix", "Réponse sous 48 h"],
    },
    sourcing: {
      label: "Sourcing sur mesure",
      desc: "Un besoin spécifique absent du catalogue ? Décrivez-le et notre équipe sourcing s'en charge.",
      cta: "Décrire mon besoin",
      icon: <Search className="w-4 h-4" />,
      action: () => nav("sourcing"),
      bullets: ["Produit introuvable ailleurs", "Origine & certifications sur mesure", "Accompagnement dédié", "Réponse sous 48 h"],
    },
  };

  const p = panels[tab];

  return (
    <section id="devis" className="bg-[#0d2265]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2">
          {/* Left */}
          <div className="py-16 pr-14 flex flex-col justify-between border-r border-white/10">
            <h2 className="font-['Playfair_Display',Georgia,serif] text-[2.6rem] font-bold text-white leading-[1.05]">
              Dites-nous ce qu&apos;il vous faut.
            </h2>
            <div className="flex gap-8 mt-10">
              {[{ n: "48h", l: "Réponse" }, { n: "0", l: "Engagement" }, { n: "1", l: "Interlocuteur" }].map(s => (
                <div key={s.n}>
                  <p className="text-xl font-bold text-white">{s.n}</p>
                  <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wider">{s.l}</p>
                </div>
              ))}
            </div>
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
            <ul className="space-y-2.5 mb-8">
              {p.bullets.map(b => (
                <li key={b} className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1 h-1 rounded-full bg-[#C4613A] shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <BtnWhite onClick={p.action}>
              {p.icon} {p.cta} <ArrowRight className="w-4 h-4" />
            </BtnWhite>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Expertise (fondateurs) ──────────────────────────────────────────────────

export function Expertise({ nav: _nav }: { nav: Nav }) {
  const founders = [
    {
      initials: "OB", name: "Ousmane BA", role: "Cofondateur · Filières et Sourcing",
      bio: "10+ ans à structurer des chaînes de valeur agricoles entre l'Afrique de l'Ouest et l'Europe. Export bio certifié UE et lien direct avec les coopératives et groupements de producteurs. Fondateur d'ENDAM Agri.",
      highlight: "",
      line: "",
      tags: ["Filières bio UE", "Coopératives", "Traçabilité"],
      label: "AMONT",
    },
    {
      initials: "OS", name: "Oumou Soumano", role: "Cofondatrice · Supply chain & Retail",
      bio: "14 ans en supply chain et grande distribution, entre l'Europe et l'Afrique. Ex-responsable supply chain Carrefour Sénégal, 200+ organisations accompagnées, stratégies d'import et pilotage de la performance logistique.",
      highlight: "",
      line: "",
      tags: ["Logistique", "Import", "Export"],
      label: "AVAL",
    },
  ];

  return (
    <section id="expertise" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-['Playfair_Display',Georgia,serif] text-4xl font-bold text-[#0a0a0f] leading-[1.1] mb-10">
          Deux expertises,<br />une chaîne maîtrisée.
        </h2>
        {/* Pullquotes */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#f4f5f9] px-8 py-7 border-l-[3px] border-[#C4613A]">
            <p className="font-['Playfair_Display',Georgia,serif] text-lg italic text-[#0d2265] leading-relaxed mb-2">
              « De la parcelle jusqu&apos;au conteneur — nous connaissons les producteurs par leur nom. »
            </p>
            <p className="text-xs text-[#64697d]">Ousmane BA — cofondateur</p>
          </div>
          <div className="bg-[#f4f5f9] px-8 py-7 border-l-[3px] border-[#C4613A]">
            <p className="font-['Playfair_Display',Georgia,serif] text-lg italic text-[#0d2265] leading-relaxed mb-2">
              « Un sourcing avec le meilleur rapport qualité prix afin de vous démarquer de la concurrence. »
            </p>
            <p className="text-xs text-[#64697d]">Oumou Soumano — cofondatrice</p>
          </div>
        </div>
        {/* Founder cards */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {founders.map((f, i) => (
            <div key={i} className="border border-[rgba(13,34,101,0.12)] p-7">
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
          <Calendar className="w-4 h-4" /> Échanger avec un expert
        </BtnNavy>
      </div>
    </section>
  );
}

// ─── Section fournisseurs (S9) ───────────────────────────────────────────────

export function SupplierSection({ nav }: { nav: Nav }) {
  return (
    <section id="fournisseurs" className="py-16 bg-[#080f2e]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-['Playfair_Display',Georgia,serif] text-4xl font-bold text-white leading-[1.1] mb-8">
          Vous produisez en Afrique ?<br />Accédez au marché européen.
        </h2>
        <div className="grid lg:grid-cols-2 gap-px bg-white/[0.06]">
          <div className="bg-transparent border border-white/10 p-8 hover:bg-white/[0.04] transition-colors duration-300">
            <h3 className="font-bold text-white text-xl mb-6">Devenir fournisseur référencé</h3>
            <BtnWhite onClick={() => nav("candidature")}>Candidater <ArrowRight className="w-4 h-4" /></BtnWhite>
          </div>
          <div className="bg-transparent border border-white/10 p-8 hover:bg-white/[0.04] transition-colors duration-300">
            <h3 className="font-bold text-white text-xl mb-6">Déjà référencé ?</h3>
            <BtnOutlineWhite onClick={() => nav("login")}>Espace fournisseurs <ArrowRight className="w-4 h-4" /></BtnOutlineWhite>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Preuve sociale ──────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { quote: "Nous cherchions du beurre de karité en volumes réguliers, avec certification Bio. À la Source a livré une première commande conforme en six semaines — sans aucun écart sur le cahier des charges.", name: "Sophie M.", role: "Responsable achats", company: "Cosmétiques Naturels Pro", country: "France" },
  { quote: "Ce que j'apprécie, c'est la transparence totale sur les délais et les incoterms. Le devis était clair, la logistique pilotée sans accroc. Je recommande sans hésitation.", name: "Klaus H.", role: "Directeur des opérations", company: "BioImport GmbH", country: "Allemagne" },
  { quote: "En tant qu'épicerie fine, nous avons besoin de cohérence qualitative lot après lot. À la Source est le seul interlocuteur qui nous a garanti cette constance, dès la première livraison.", name: "Pauline R.", role: "Co-fondatrice", company: "Épicerie Léontine", country: "Belgique" },
];

const ENGAGEMENTS = [
  "Fournisseurs audités sur place avant référencement",
  "Réponse à toute demande sous 24 à 48 h ouvrées",
  "Un devis unique : produits + logistique + incoterm",
  "Catalogue actualisé régulièrement",
];

export function SocialProof() {
  return (
    <section className="py-16 bg-[#f4f5f9]">
      <div className="max-w-7xl mx-auto px-6">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(13,34,101,0.1)] border-t border-[rgba(13,34,101,0.08)]">
          {ENGAGEMENTS.map((e, i) => (
            <div key={i} className="bg-white p-8 flex items-start gap-3">
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

const FAQS = [
  { q: "Quels types de produits proposez-vous ?", a: "Notre catalogue couvre quatre familles : épicerie (épices, condiments, farines…), boissons (jus, infusions, sirops…), fruits & légumes (frais, séchés, transformés) et matières premières (huiles végétales, beurres, gommes…). Près de 50 références sont disponibles, et nous acceptons les demandes de sourcing sur mesure pour tout produit absent du catalogue." },
  { q: "Comment garantissez-vous la conformité aux normes européennes ?", a: "Chaque fournisseur est audité sur place par notre équipe avant d'être référencé. Pour chaque produit, nous évaluons les normes sanitaires (HACCP), la traçabilité, l'étiquetage et les certifications requises (Bio, Halal, ISO). Si un produit nécessite une mise à niveau, nous accompagnons le fournisseur dans ce processus avant toute commande." },
  { q: "Quels sont vos délais de réponse et de livraison ?", a: "Nous répondons à toute demande de devis sous 24 à 48 h ouvrées. Les délais de livraison varient selon le produit, le mode de transport et la destination — ils sont précisés dans chaque devis. Le fret maritime vers l'Europe occidentale prend en général 12 à 25 jours selon le port d'origine." },
  { q: "Quelles quantités minimum commandez-vous (MOQ) ?", a: "Les quantités minimum (MOQ) varient selon les produits et les fournisseurs. Elles sont indiquées dans le catalogue pour chaque référence, et précisées à la demande de devis. Pour les premières commandes ou les commandes tests, nous étudions chaque situation au cas par cas." },
  { q: "Quels incoterms proposez-vous ? Gérez-vous les formalités douanières ?", a: "Nous travaillons sur les principaux incoterms : EXW, FOB, CIF, CFR, DAP, DDP. Le plus adapté est proposé dans chaque devis. Nous prenons en charge les formalités d'export côté africain et, sur demande, accompagnons jusqu'à la livraison en entrepôt européen." },
  { q: "Est-il possible de commander des échantillons ou de visiter les fournisseurs ?", a: "L'envoi d'échantillons est possible pour la plupart de nos références — ils sont facturés au coût réel. Les visites fournisseurs sont organisées dans le cadre de partenariats établis : notre experte coordonne chaque visite pour garantir des échanges productifs et en phase avec vos exigences qualité." },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-[#0a0a0f] mb-8 text-left">Questions fréquentes</h2>
        <div>
          {FAQS.map((f, i) => (
            <div key={i} className="py-6 border-b border-[rgba(13,34,101,0.08)]">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-left cursor-pointer group">
                <span className={`text-[15px] pr-8 transition-colors duration-300 ${open === i ? "font-semibold text-[#0d2265]" : "font-medium text-[#0a0a0f] group-hover:text-[#0d2265]"}`}>
                  {f.q}
                </span>
                {open === i
                  ? <ChevronUp className="w-4 h-4 text-[#0d2265] shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-[#64697d] shrink-0" />
                }
              </button>
              {open === i && (
                <div className="mt-3">
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
  return (
    <section className="py-16 bg-[#0d2265] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,white 59px,white 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,white 59px,white 60px)" }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div>
            <h2
              className="font-['Playfair_Display',Georgia,serif] font-bold text-white leading-[1.0]"
              style={{ fontSize: "clamp(3rem,5vw,5rem)" }}
            >
              Votre prochain<br />approvisionnement<br />commence ici.
            </h2>
          </div>
          <div className="flex flex-col gap-3 shrink-0 min-w-[240px]">
            <BtnAccent onClick={() => nav("catalogue")}>
              <Download className="w-4 h-4" /> Accéder au catalogue
            </BtnAccent>
            <BtnOutlineWhite onClick={() => nav("devis")}>
              <FileText className="w-4 h-4" /> Demander un devis
            </BtnOutlineWhite>
            <BtnOutlineWhite onClick={() => window.open(CALENDLY_URL, '_blank')}>
              <Calendar className="w-4 h-4" /> Échanger avec l'experte
            </BtnOutlineWhite>
          </div>
        </div>
      </div>
    </section>
  );
}
