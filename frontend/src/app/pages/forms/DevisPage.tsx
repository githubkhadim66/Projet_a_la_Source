/** Cotation produit : formulaire multi-sections prérempli avec le panier « Ma demande ». */

import { useEffect, useRef, useState } from "react";
import { Calendar, CheckCircle, Search } from "lucide-react";
import * as api from "@/lib/api";
import {
  CALENDLY_URL, CONDITIONNEMENTS, CONTINENTS_LIVRAISON, DELAIS_LIVRAISON,
  incotermBuyerArranges, PREVISION_UNITES, SECTEURS,
} from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useFormsText, useOptionLabel } from "@/lib/formsText";
import type { Nav } from "@/lib/routes";
import { BtnOutlineNavy } from "@/app/components/common/buttons";
import { CertToggle, ChoiceToggle, CountrySelect, FormInput, FormSelect, IncotermField, SelectOther, TagInput } from "@/app/components/common/fields";
import { Confirm, ScreenShell } from "@/app/components/common/layout";
import { FormWizard } from "@/app/components/common/FormWizard";

export function DevisForm({ nav }: { nav: Nav }) {
  const lang = useLang();
  const tx = useFormsText();
  const t = tx.devis;
  const tr = useOptionLabel();
  const [tags, setTags] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("als-basket") || "[]"); } catch { return []; }
  });
  const [certs, setCerts] = useState<string[]>(["Bio UE","HACCP"]);
  const [transport, setTransport] = useState(true);
  const [incoterm, setIncoterm] = useState("CIF");
  const [conditionnement, setConditionnement] = useState("Palettes");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [volume, setVolume] = useState("");
  const [forecast, setForecast] = useState("");
  const [forecastUnit, setForecastUnit] = useState(PREVISION_UNITES[0]);
  const [delai, setDelai] = useState("");
  const [continent, setContinent] = useState("Europe");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [deliveryContact, setDeliveryContact] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalogue dans la langue du visiteur : suggestions et repérage d'une matière absente
  // (→ suggestion de sourcing). Le panier garde les noms d'origine (français) : en
  // anglais, on les remplace par leur traduction pour un affichage cohérent.
  const [products, setProducts] = useState<api.ApiPublicProduct[]>([]);
  // Tout nom déjà vu (FR ou EN) → nom d'origine : permet de convertir dans les deux sens.
  const sourceOf = useRef(new Map<string, string>());
  useEffect(() => {
    api.catalogue.products(undefined, lang).then(ps => {
      setProducts(ps);
      const current = new Map<string, string>();
      ps.forEach(p => {
        const src = p.source_name || p.name;
        sourceOf.current.set(p.name, src);
        sourceOf.current.set(src, src);
        current.set(src, p.name);
      });
      setTags(ts => ts.map(tag => current.get(sourceOf.current.get(tag) ?? "") ?? tag));
    }).catch(() => {});
  }, [lang]);
  const catalogueNames = products.map(p => p.name);
  const knownNames = [...new Set(products.flatMap(p => [p.name, p.source_name].filter(Boolean)))];
  const inCatalogue = (tag: string) => {
    const q = tag.trim().toLowerCase();
    return knownNames.some(n => { const l = n.toLowerCase(); return l.includes(q) || q.includes(l); });
  };
  const unknownTags = products.length ? tags.filter(tag => !inCatalogue(tag)) : [];

  // Bascule vers le sourcing en emportant les produits hors catalogue (préremplissage).
  const goSourcing = () => {
    try { localStorage.setItem("als-sourcing-product", unknownTags.join(", ")); } catch { /* stockage indispo */ }
    nav("sourcing");
  };

  // L'incoterm détermine qui organise le transport → on évite les questions redondantes.
  const buyerArranges = incotermBuyerArranges(incoterm);
  const weOrganize = buyerArranges === false ? true : buyerArranges === true ? false : transport;

  const submit = async () => {
    if (tags.length === 0) { setError(t.needRequired); return; }
    setSending(true);
    setError(null);
    try {
      await api.leads.devis({
        company, contact, email, country, sector,
        products: tags, volume, packaging: conditionnement, incoterm,
        forecast: forecast ? `${forecast} ${forecastUnit}` : undefined,
        certifications: certs, transport_needed: weOrganize,
        delivery_delay: delai || undefined,
        delivery_continent: weOrganize ? continent : undefined,
        delivery_place: weOrganize ? deliveryPlace || undefined : undefined,
        delivery_contact: weOrganize ? deliveryContact || undefined : undefined,
        language: lang,
      });
      localStorage.removeItem("als-basket");
      nav("devis-confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : tx.common.genericError);
    } finally {
      setSending(false);
    }
  };

  const steps = [
    {
      label: tx.company.stepLabel,
      hint: tx.company.stepHint,
      validate: () => (company && contact && email && country) ? null : tx.company.required,
      content: (
        <div className="space-y-4">
          <FormInput label={tx.company.company} required type="text" placeholder="SARL Import Europe" value={company} onChange={e => setCompany(e.target.value)} />
          <FormInput label={tx.company.contact} required type="text" placeholder={t.contactPlaceholder} value={contact} onChange={e => setContact(e.target.value)} />
          <FormInput label={tx.company.email} required type="email" placeholder="contact@entreprise.fr" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <CountrySelect label={tx.company.country} required value={country} onChange={setCountry} />
            <SelectOther label={tx.company.sector} options={SECTEURS} value={sector} onChange={setSector} placeholder={tx.company.sectorPlaceholder} />
          </div>
        </div>
      ),
    },
    {
      label: t.needLabel,
      hint: t.needHint,
      validate: () => tags.length === 0 ? t.needRequired : null,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">{t.materials}<span className="text-[#C4613A] ml-0.5">*</span></label>
            <TagInput tags={tags} setTags={setTags} suggestions={catalogueNames} placeholder={t.materialsPlaceholder} />
            {unknownTags.length > 0 ? (
              <div className="mt-2 flex items-start gap-2 bg-[#fbede3] border border-[#C4613A]/30 px-3 py-2.5 text-xs text-[#A84E2D] leading-relaxed">
                <Search className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {t.notInCatalogue(unknownTags.map(tag => lang === "en" ? `"${tag}"` : `« ${tag} »`).join(", "), unknownTags.length > 1)}{" "}
                  <button type="button" onClick={goSourcing} className="underline font-semibold cursor-pointer hover:text-[#C4613A]">{t.goSourcing}</button>
                </span>
              </div>
            ) : (
              <button type="button" onClick={() => nav("sourcing")} className="mt-2 text-xs text-[#0d2265] hover:text-[#C4613A] underline cursor-pointer">
                {t.absent}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label={t.volume} type="text" placeholder={t.volumePlaceholder} value={volume} onChange={e => setVolume(e.target.value)} />
            <SelectOther label={t.packaging} options={CONDITIONNEMENTS} value={conditionnement} onChange={setConditionnement} placeholder={t.packagingPlaceholder} />
          </div>
          <IncotermField value={incoterm} onChange={setIncoterm} label={t.incoterm} />
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">{t.forecast}</label>
            <div className="flex gap-2 max-w-xs">
              <input type="text" placeholder={t.forecastPlaceholder} value={forecast} onChange={e => setForecast(e.target.value)}
                className="flex-1 min-w-0 border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors" />
              <select value={forecastUnit} onChange={e => setForecastUnit(e.target.value)}
                className="border border-[rgba(13,34,101,0.15)] px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
                {PREVISION_UNITES.map(u => <option key={u} value={u}>{tr(u)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-3">{t.certs}</label>
            <CertToggle certs={certs} setCerts={setCerts} />
          </div>
        </div>
      ),
    },
    {
      label: tx.delivery.stepLabel,
      hint: t.deliveryHint,
      content: (
        <div className="space-y-4">
          <FormSelect label={tx.delivery.delay} value={delai} onChange={e => setDelai(e.target.value)}>
            <option value="">{tx.common.select}</option>
            {DELAIS_LIVRAISON.map(d => <option key={d} value={d}>{tr(d)}</option>)}
          </FormSelect>

          {buyerArranges === null && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#0a0a0f]">{t.weTransport}</p>
              <div className="flex gap-5">
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => setTransport(v)}
                    className={`text-sm font-semibold cursor-pointer transition-colors ${transport === v ? "text-[#0d2265]" : "text-[#64697d] hover:text-[#0a0a0f]"}`}>
                    {v ? tx.common.yes : tx.common.no}
                  </button>
                ))}
              </div>
            </div>
          )}

          {buyerArranges === true && (
            <p className="text-xs text-[#64697d] bg-[#f4f5f9] px-3 py-2 border-l-2 border-[#C4613A]/40">
              {t.buyerTransport}
            </p>
          )}

          {weOrganize && (
            <div className="space-y-4 border-l-2 border-[#C4613A]/30 pl-4">
              <ChoiceToggle label={tx.delivery.continent} options={CONTINENTS_LIVRAISON} value={continent} onChange={setContinent} />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label={tx.delivery.place} type="text" placeholder={tx.delivery.placePlaceholder} value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} />
                <FormInput label={tx.delivery.onSite} type="text" placeholder={tx.delivery.onSitePlaceholder} value={deliveryContact} onChange={e => setDeliveryContact(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <FormWizard
      nav={nav}
      title={t.title}
      intro={t.intro}
      steps={steps}
      onSubmit={submit}
      submitting={sending}
      submitLabel={t.submit}
      error={error}
      footNote={tx.common.rgpdFoot}
    />
  );
}

/** Confirmation commune devis / sourcing. */
export function FormConfirm({ nav, type }: { nav: Nav; type: "devis" | "sourcing" }) {
  const tx = useFormsText();
  const t = tx.devis;
  return (
    <ScreenShell nav={nav} title={tx.common.confirmation}>
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<CheckCircle className="w-8 h-8 text-[#0d2265]" />}
          title={t.received}
          subtitle={type === "devis" ? t.receivedDevis : t.receivedSourcing}
          nav={nav}
        >
          <div className="pt-2">
            <p className="text-sm text-[#64697d] mb-3">{tx.common.urgent}</p>
            <BtnOutlineNavy onClick={() => window.open(CALENDLY_URL, '_blank')} className="mx-auto">
              <Calendar className="w-4 h-4" /> {tx.common.bookExpert}
            </BtnOutlineNavy>
          </div>
        </Confirm>
      </div>
    </ScreenShell>
  );
}
