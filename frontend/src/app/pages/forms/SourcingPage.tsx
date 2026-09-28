/** Sourcing sur mesure : demande d'un produit hors catalogue, en assistant multi-étapes. */

import { useEffect, useState } from "react";
import { Info, Upload } from "lucide-react";
import * as api from "@/lib/api";
import {
  CONTINENTS_LIVRAISON, DELAIS_LIVRAISON, incotermBuyerArranges,
  PREVISION_UNITES, SECTEURS,
} from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useFormsText, useOptionLabel } from "@/lib/formsText";
import type { Nav } from "@/lib/routes";
import { CertToggle, ChoiceToggle, CountrySelect, FormInput, FormSelect, IncotermField, SelectOther } from "@/app/components/common/fields";
import { FormWizard } from "@/app/components/common/FormWizard";

const QUALITY_LEVELS = ["Standard", "Premium", "Ultra-premium"];

export function SourcingForm({ nav }: { nav: Nav }) {
  const lang = useLang();
  const tx = useFormsText();
  const t = tx.sourcing;
  const tr = useOptionLabel();
  const [certs, setCerts] = useState<string[]>([]);
  const [logisticsByClient, setLogisticsByClient] = useState(false);
  const [qualite, setQualite] = useState("Standard");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  // Préremplissage si l'on arrive depuis un devis avec un produit hors catalogue.
  const [product, setProduct] = useState(() => {
    try { return localStorage.getItem("als-sourcing-product") || ""; } catch { return ""; }
  });
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [volume, setVolume] = useState("");
  const [forecast, setForecast] = useState("");
  const [forecastUnit, setForecastUnit] = useState(PREVISION_UNITES[0]);
  const [budget, setBudget] = useState("");
  const [incoterm, setIncoterm] = useState("À conseiller");
  const [autreBesoin, setAutreBesoin] = useState("");
  const [delai, setDelai] = useState("");
  const [continent, setContinent] = useState("Europe");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [deliveryContact, setDeliveryContact] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.removeItem("als-sourcing-product"); } catch { /* stockage indispo */ }
  }, []);

  // Catalogue (dans la langue du visiteur) : si le produit saisi existe déjà, on suggère un devis.
  const [products, setProducts] = useState<api.ApiPublicProduct[]>([]);
  useEffect(() => {
    api.catalogue.products(undefined, lang).then(setProducts).catch(() => {});
  }, [lang]);
  const q = product.trim().toLowerCase();
  const catalogueMatch = q.length >= 3
    ? products.find(p => [p.name, p.source_name].some(n => {
        const l = (n || "").toLowerCase();
        return l !== "" && (l.includes(q) || q.includes(l));
      }))?.name
    : undefined;

  // L'incoterm décide qui organise le transport → on masque les questions redondantes.
  const buyerArranges = incotermBuyerArranges(incoterm);
  const weOrganize = buyerArranges === false ? true : buyerArranges === true ? false : !logisticsByClient;

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      await api.leads.sourcing({
        company, contact, email, country, sector, product, description,
        origin: origin || undefined, volume, budget, quality_level: qualite,
        forecast: forecast ? `${forecast} ${forecastUnit}` : undefined,
        incoterm, other_need: autreBesoin || undefined,
        certifications: certs,
        transport_needed: weOrganize,
        delivery_delay: delai || undefined,
        delivery_continent: weOrganize ? continent : undefined,
        delivery_place: weOrganize ? deliveryPlace || undefined : undefined,
        delivery_contact: weOrganize ? deliveryContact || undefined : undefined,
        language: lang,
      });
      nav("sourcing-confirm");
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
      label: tx.devis.needLabel,
      hint: t.needHint,
      validate: () => (product && description) ? null : t.needRequired,
      content: (
        <div className="space-y-4">
          <div>
            <FormInput label={t.product} required type="text" placeholder={t.productPlaceholder} value={product} onChange={e => setProduct(e.target.value)} />
            {catalogueMatch && (
              <div className="mt-2 flex items-start gap-2 bg-[#eaf2ed] border border-[#2E6B4F]/25 px-3 py-2.5 text-xs text-[#2E6B4F] leading-relaxed">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {t.alreadyInCatalogue(catalogueMatch)}{" "}
                  <button type="button" onClick={() => nav("devis")} className="underline font-semibold cursor-pointer hover:text-[#0d2265]">{t.quoteDirect}</button>
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">{t.description}<span className="text-[#C4613A] ml-0.5">*</span></label>
            <textarea rows={4} placeholder={t.descriptionPlaceholder}
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CountrySelect label={t.origin} value={origin} onChange={setOrigin} />
            <FormInput label={t.quantity} type="text" placeholder={t.quantityPlaceholder} value={volume} onChange={e => setVolume(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#0a0a0f] mb-1.5">{tx.devis.forecast}</label>
              <div className="flex gap-2">
                <input type="text" placeholder={t.forecastPlaceholder} value={forecast} onChange={e => setForecast(e.target.value)}
                  className="flex-1 min-w-0 border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors" />
                <select value={forecastUnit} onChange={e => setForecastUnit(e.target.value)}
                  className="border border-[rgba(13,34,101,0.15)] px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
                  {PREVISION_UNITES.map(u => <option key={u} value={u}>{tr(u)}</option>)}
                </select>
              </div>
            </div>
            <FormInput label={t.budget} type="text" placeholder={t.optional} value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
          <IncotermField value={incoterm} onChange={setIncoterm} />
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">{t.quality}</label>
            <div className="flex gap-2">
              {QUALITY_LEVELS.map(level => (
                <button key={level} type="button" onClick={() => setQualite(level)}
                  className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-colors ${qualite === level ? "border-[#0d2265] bg-[#0d2265] text-white" : "border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:border-[#0d2265]"}`}>
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-3">{tx.devis.certs}</label>
            <CertToggle certs={certs} setCerts={setCerts} />
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">{t.otherNeed}</label>
            <textarea rows={2} placeholder={t.otherNeedPlaceholder}
              value={autreBesoin} onChange={e => setAutreBesoin(e.target.value)}
              className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">{t.documents}</label>
            <div className="border border-dashed border-[rgba(13,34,101,0.2)] p-6 text-center">
              <Upload className="w-6 h-6 text-[#64697d] mx-auto mb-2" />
              <p className="text-sm text-[#64697d]">{t.documentsHint}</p>
              <p className="text-xs text-[#9ca3af] mt-1">{t.documentsFormats}</p>
            </div>
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
              <p className="text-sm text-[#0a0a0f]">{t.clientLogistics}</p>
              <div className="flex gap-5">
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => setLogisticsByClient(v)}
                    className={`text-sm font-semibold cursor-pointer transition-colors ${logisticsByClient === v ? "text-[#0d2265]" : "text-[#64697d] hover:text-[#0a0a0f]"}`}>
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
