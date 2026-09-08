/** Cotation produit : formulaire multi-sections prérempli avec le panier « Ma demande ». */

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Search } from "lucide-react";
import * as api from "@/lib/api";
import {
  CALENDLY_URL, CONDITIONNEMENTS, CONTINENTS_LIVRAISON, DELAIS_LIVRAISON,
  incotermBuyerArranges, PREVISION_UNITES, SECTEURS,
} from "@/lib/constants";
import type { Nav } from "@/lib/routes";
import { BtnOutlineNavy } from "@/app/components/common/buttons";
import { CertToggle, ChoiceToggle, CountrySelect, FormInput, FormSelect, IncotermField, SelectOther, TagInput } from "@/app/components/common/fields";
import { Confirm, ScreenShell } from "@/app/components/common/layout";
import { FormWizard } from "@/app/components/common/FormWizard";

export function DevisForm({ nav }: { nav: Nav }) {
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

  // Noms du catalogue : sert à repérer une matière absente → suggestion de sourcing.
  const [catalogueNames, setCatalogueNames] = useState<string[]>([]);
  useEffect(() => {
    api.catalogue.products().then(ps => setCatalogueNames(ps.map(p => p.name))).catch(() => {});
  }, []);
  const inCatalogue = (t: string) => {
    const q = t.trim().toLowerCase();
    return catalogueNames.some(n => { const l = n.toLowerCase(); return l.includes(q) || q.includes(l); });
  };
  const unknownTags = catalogueNames.length ? tags.filter(t => !inCatalogue(t)) : [];

  // Bascule vers le sourcing en emportant les produits hors catalogue (préremplissage).
  const goSourcing = () => {
    try { localStorage.setItem("als-sourcing-product", unknownTags.join(", ")); } catch { /* stockage indispo */ }
    nav("sourcing");
  };

  // L'incoterm détermine qui organise le transport → on évite les questions redondantes.
  const buyerArranges = incotermBuyerArranges(incoterm);
  const weOrganize = buyerArranges === false ? true : buyerArranges === true ? false : transport;

  const submit = async () => {
    if (tags.length === 0) { setError("Indiquez au moins une matière recherchée."); return; }
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
      });
      localStorage.removeItem("als-basket");
      nav("devis-confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  const steps = [
    {
      label: "Votre entreprise",
      hint: "Qui êtes-vous ?",
      validate: () =>
        (company && contact && email && country) ? null
          : "Renseignez votre société, votre contact, votre e-mail et votre pays.",
      content: (
        <div className="space-y-4">
          <FormInput label="Société" required type="text" placeholder="SARL Import Europe" value={company} onChange={e => setCompany(e.target.value)} />
          <FormInput label="Contact & fonction" required type="text" placeholder="Marie Dupont · Responsable achats" value={contact} onChange={e => setContact(e.target.value)} />
          <FormInput label="E-mail professionnel" required type="email" placeholder="contact@entreprise.fr" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <CountrySelect label="Pays" required value={country} onChange={setCountry} />
            <SelectOther label="Domaine d'activité" options={SECTEURS} value={sector} onChange={setSector} placeholder="Votre secteur…" />
          </div>
        </div>
      ),
    },
    {
      label: "Votre besoin",
      hint: "Quels produits ?",
      validate: () => tags.length === 0 ? "Indiquez au moins une matière recherchée." : null,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">Matières recherchées<span className="text-[#C4613A] ml-0.5">*</span></label>
            <TagInput tags={tags} setTags={setTags} suggestions={catalogueNames} placeholder="Commencez à écrire · choisissez dans notre catalogue…" />
            {unknownTags.length > 0 ? (
              <div className="mt-2 flex items-start gap-2 bg-[#fbede3] border border-[#C4613A]/30 px-3 py-2.5 text-xs text-[#A84E2D] leading-relaxed">
                <Search className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {unknownTags.map(t => `« ${t} »`).join(", ")} {unknownTags.length > 1 ? "ne figurent" : "ne figure"} pas à notre catalogue · nous {unknownTags.length > 1 ? "les" : "le"} sourçons pour vous.{" "}
                  <button type="button" onClick={goSourcing} className="underline font-semibold cursor-pointer hover:text-[#C4613A]">Passer en sourcing sur mesure →</button>
                </span>
              </div>
            ) : (
              <button type="button" onClick={() => nav("sourcing")} className="mt-2 text-xs text-[#0d2265] hover:text-[#C4613A] underline cursor-pointer">
                Un produit absent de notre catalogue ? Faites une demande de sourcing sur mesure →
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Volume estimé" type="text" placeholder="12 tonnes" value={volume} onChange={e => setVolume(e.target.value)} />
            <SelectOther label="Conditionnement" options={CONDITIONNEMENTS} value={conditionnement} onChange={setConditionnement} placeholder="Préciser le conditionnement…" />
          </div>
          <IncotermField value={incoterm} onChange={setIncoterm} label="Incoterm" />
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">Besoin prévisionnel</label>
            <div className="flex gap-2 max-w-xs">
              <input type="text" placeholder="Ex. 5 tonnes" value={forecast} onChange={e => setForecast(e.target.value)}
                className="flex-1 min-w-0 border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors" />
              <select value={forecastUnit} onChange={e => setForecastUnit(e.target.value)}
                className="border border-[rgba(13,34,101,0.15)] px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
                {PREVISION_UNITES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-3">Certifications requises</label>
            <CertToggle certs={certs} setCerts={setCerts} />
          </div>
        </div>
      ),
    },
    {
      label: "Livraison",
      hint: "Où et quand ?",
      content: (
        <div className="space-y-4">
          <FormSelect label="Délai de livraison souhaité" value={delai} onChange={e => setDelai(e.target.value)}>
            <option value="">Sélectionner</option>
            {DELAIS_LIVRAISON.map(d => <option key={d}>{d}</option>)}
          </FormSelect>

          {buyerArranges === null && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#0a0a0f]">Souhaitez-vous que nous organisions le transport ?</p>
              <div className="flex gap-5">
                {["Oui","Non"].map(v => (
                  <button key={v} type="button" onClick={() => setTransport(v === "Oui")}
                    className={`text-sm font-semibold cursor-pointer transition-colors ${transport === (v === "Oui") ? "text-[#0d2265]" : "text-[#64697d] hover:text-[#0a0a0f]"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {buyerArranges === true && (
            <p className="text-xs text-[#64697d] bg-[#f4f5f9] px-3 py-2 border-l-2 border-[#C4613A]/40">
              Avec cet incoterm, vous organisez le transport principal · nous n'intervenons pas sur l'acheminement.
            </p>
          )}

          {weOrganize && (
            <div className="space-y-4 border-l-2 border-[#C4613A]/30 pl-4">
              <ChoiceToggle label="La livraison est prévue en" options={CONTINENTS_LIVRAISON} value={continent} onChange={setContinent} />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Lieu / port de livraison finale" type="text" placeholder="Ex. port de Rotterdam" value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} />
                <FormInput label="Contact sur place" type="text" placeholder="Nom · téléphone" value={deliveryContact} onChange={e => setDeliveryContact(e.target.value)} />
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
      title="Cotation produit"
      intro="Décrivez votre besoin en 3 étapes : nous revenons vers vous sous 24 à 48 h avec une proposition complète."
      steps={steps}
      onSubmit={submit}
      submitting={sending}
      submitLabel="Recevoir ma cotation"
      error={error}
      footNote="Vos données sont traitées de manière confidentielle (RGPD). Aucun contact direct avec les fournisseurs."
    />
  );
}

/** Confirmation commune devis / sourcing. */
export function FormConfirm({ nav, type }: { nav: Nav; type: "devis" | "sourcing" }) {
  return (
    <ScreenShell nav={nav} title="Confirmation">
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<CheckCircle className="w-8 h-8 text-[#0d2265]" />}
          title="Demande bien reçue"
          subtitle={type === "devis"
            ? "Notre équipe vous revient sous 24 à 48 h ouvrées avec une proposition complète · produits, logistique, incoterm."
            : "Votre demande de sourcing sur mesure est transmise. Notre équipe vous contacte sous 24 à 48 h ouvrées pour qualifier votre besoin."}
          nav={nav}
        >
          <div className="pt-2">
            <p className="text-sm text-[#64697d] mb-3">Besoin d'une réponse urgente ?</p>
            <BtnOutlineNavy onClick={() => window.open(CALENDLY_URL, '_blank')} className="mx-auto">
              <Calendar className="w-4 h-4" /> Réserver un créneau avec l'experte
            </BtnOutlineNavy>
          </div>
        </Confirm>
      </div>
    </ScreenShell>
  );
}
