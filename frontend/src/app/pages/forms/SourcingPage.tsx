/** Sourcing sur mesure : demande d'un produit hors catalogue, en assistant multi-étapes. */

import { useEffect, useState } from "react";
import { Info, Upload } from "lucide-react";
import * as api from "@/lib/api";
import {
  CONTINENTS_LIVRAISON, DELAIS_LIVRAISON, incotermBuyerArranges, ORIGINES,
  PAYS_EU, PREVISION_UNITES, SECTEURS,
} from "@/lib/constants";
import type { Nav } from "@/lib/routes";
import { CertToggle, ChoiceToggle, FormInput, FormSelect, IncotermField } from "@/app/components/common/fields";
import { FormWizard } from "@/app/components/common/FormWizard";

export function SourcingForm({ nav }: { nav: Nav }) {
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

  // Catalogue : si le produit saisi existe déjà, on suggère plutôt un devis.
  const [catalogueNames, setCatalogueNames] = useState<string[]>([]);
  useEffect(() => {
    api.catalogue.products().then(ps => setCatalogueNames(ps.map(p => p.name))).catch(() => {});
    try { localStorage.removeItem("als-sourcing-product"); } catch { /* stockage indispo */ }
  }, []);
  const catalogueMatch = product.trim().length >= 3
    ? catalogueNames.find(n => { const l = n.toLowerCase(); const q = product.trim().toLowerCase(); return l.includes(q) || q.includes(l); })
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
      });
      nav("sourcing-confirm");
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
          <FormInput label="Contact & fonction" required type="text" placeholder="Nom Prénom — Fonction" value={contact} onChange={e => setContact(e.target.value)} />
          <FormInput label="E-mail professionnel" required type="email" placeholder="contact@entreprise.fr" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Pays" required value={country} onChange={e => setCountry(e.target.value)}>
              <option value="">Sélectionner</option>
              {PAYS_EU.map(c => <option key={c}>{c}</option>)}
            </FormSelect>
            <FormSelect label="Domaine d'activité" value={sector} onChange={e => setSector(e.target.value)}>
              <option value="">Sélectionner</option>
              {SECTEURS.map(s => <option key={s}>{s}</option>)}
            </FormSelect>
          </div>
        </div>
      ),
    },
    {
      label: "Votre besoin",
      hint: "Le produit recherché",
      validate: () =>
        (product && description) ? null
          : "Indiquez le produit souhaité et une description de votre besoin.",
      content: (
        <div className="space-y-4">
          <div>
            <FormInput label="Produit souhaité" required type="text" placeholder="Beurre de karité raffiné" value={product} onChange={e => setProduct(e.target.value)} />
            {catalogueMatch && (
              <div className="mt-2 flex items-start gap-2 bg-[#eaf2ed] border border-[#2E6B4F]/25 px-3 py-2.5 text-xs text-[#2E6B4F] leading-relaxed">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  « {catalogueMatch} » figure déjà à notre catalogue — vous pouvez obtenir un{" "}
                  <button type="button" onClick={() => nav("devis")} className="underline font-semibold cursor-pointer hover:text-[#0d2265]">devis directement →</button>
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">Description du besoin<span className="text-[#C4613A] ml-0.5">*</span></label>
            <textarea rows={4} placeholder="Usage, conditionnement attendu, contraintes particulières…"
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Pays de provenance souhaité" value={origin} onChange={e => setOrigin(e.target.value)}>
              <option value="">Sélectionner</option>
              {ORIGINES.map(o => <option key={o}>{o}</option>)}
            </FormSelect>
            <FormInput label="Quantité souhaitée" type="text" placeholder="Ex. 5 000 kg" value={volume} onChange={e => setVolume(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#0a0a0f] mb-1.5">Besoin prévisionnel</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Ex. 2 tonnes" value={forecast} onChange={e => setForecast(e.target.value)}
                  className="flex-1 min-w-0 border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors" />
                <select value={forecastUnit} onChange={e => setForecastUnit(e.target.value)}
                  className="border border-[rgba(13,34,101,0.15)] px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
                  {PREVISION_UNITES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <FormInput label="Budget estimatif" type="text" placeholder="Facultatif" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
          <IncotermField value={incoterm} onChange={setIncoterm} />
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">Niveau de qualité</label>
            <div className="flex gap-2">
              {["Standard","Premium","Ultra-premium"].map(q => (
                <button key={q} type="button" onClick={() => setQualite(q)}
                  className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-colors ${qualite === q ? "border-[#0d2265] bg-[#0d2265] text-white" : "border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:border-[#0d2265]"}`}>
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-3">Certifications requises</label>
            <CertToggle certs={certs} setCerts={setCerts} />
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">Autre besoin ?</label>
            <textarea rows={2} placeholder="Toute précision utile : marque, saisonnalité, échantillon souhaité…"
              value={autreBesoin} onChange={e => setAutreBesoin(e.target.value)}
              className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-sm text-[#0a0a0f] mb-1.5">Documents (facultatif)</label>
            <div className="border border-dashed border-[rgba(13,34,101,0.2)] p-6 text-center">
              <Upload className="w-6 h-6 text-[#64697d] mx-auto mb-2" />
              <p className="text-sm text-[#64697d]">Cahier des charges, fiche technique, photos de référence</p>
              <p className="text-xs text-[#9ca3af] mt-1">PDF, XLSX, JPG, PNG — 10 Mo max</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Livraison",
      hint: "Logistique & délai",
      content: (
        <div className="space-y-4">
          <FormSelect label="Délai de livraison souhaité" value={delai} onChange={e => setDelai(e.target.value)}>
            <option value="">Sélectionner</option>
            {DELAIS_LIVRAISON.map(d => <option key={d}>{d}</option>)}
          </FormSelect>

          {buyerArranges === null && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#0a0a0f]">La logistique est-elle prise en charge par le client ?</p>
              <div className="flex gap-5">
                {["Oui","Non"].map(v => (
                  <button key={v} type="button" onClick={() => setLogisticsByClient(v === "Oui")}
                    className={`text-sm font-semibold cursor-pointer transition-colors ${logisticsByClient === (v === "Oui") ? "text-[#0d2265]" : "text-[#64697d] hover:text-[#0a0a0f]"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {buyerArranges === true && (
            <p className="text-xs text-[#64697d] bg-[#f4f5f9] px-3 py-2 border-l-2 border-[#C4613A]/40">
              Avec cet incoterm, le client organise le transport principal — nous n'intervenons pas sur l'acheminement.
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
      title="Sourcing sur mesure"
      intro="Un produit absent du catalogue ? Décrivez-le en 3 étapes : notre équipe le source dans son réseau de 100+ fournisseurs."
      steps={steps}
      onSubmit={submit}
      submitting={sending}
      submitLabel="Envoyer ma demande"
      error={error}
      footNote="Vos données sont traitées de manière confidentielle (RGPD). Aucun contact direct avec les fournisseurs."
    />
  );
}
