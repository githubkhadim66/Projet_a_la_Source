/** Cotation produit : formulaire multi-sections prérempli avec le panier « Ma demande ». */

import { useState } from "react";
import { ArrowRight, Calendar, CheckCircle } from "lucide-react";
import * as api from "@/lib/api";
import { CALENDLY_URL, CONDITIONNEMENTS, INCOTERMS, PAYS_EU } from "@/lib/constants";
import type { Nav } from "@/lib/routes";
import { BtnNavy, BtnOutlineNavy } from "@/app/components/common/buttons";
import { CertToggle, FormError, FormInput, FormSection, FormSelect, TagInput } from "@/app/components/common/fields";
import { Confirm, ScreenShell } from "@/app/components/common/layout";

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
  const [volume, setVolume] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tags.length === 0) { setError("Indiquez au moins une matière recherchée."); return; }
    setSending(true);
    setError(null);
    try {
      await api.leads.devis({
        company, contact, email, country,
        products: tags, volume, packaging: conditionnement, incoterm,
        certifications: certs, transport_needed: transport,
      });
      localStorage.removeItem("als-basket");
      nav("devis-confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title="Cotation produit">
      <form onSubmit={submit}>
        <div className="bg-white border border-[rgba(13,34,101,0.12)] p-8 space-y-10">

          <FormSection label="Votre entreprise">
            <div className="space-y-4">
              <FormInput label="Société" required type="text" placeholder="SARL Import Europe" value={company} onChange={e => setCompany(e.target.value)} />
              <FormInput label="Contact & fonction" required type="text" placeholder="Marie Dupont — Responsable achats" value={contact} onChange={e => setContact(e.target.value)} />
              <FormInput label="E-mail professionnel" required type="email" placeholder="contact@entreprise.fr" value={email} onChange={e => setEmail(e.target.value)} />
              <FormSelect label="Pays" required value={country} onChange={e => setCountry(e.target.value)}>
                <option value="">Sélectionner</option>
                {PAYS_EU.map(c => <option key={c}>{c}</option>)}
              </FormSelect>
            </div>
          </FormSection>

          <div className="h-px bg-[rgba(13,34,101,0.08)]" />

          <FormSection label="Votre besoin">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#0a0a0f] mb-1.5">Matières recherchées<span className="text-[#C4613A] ml-0.5">*</span></label>
                <TagInput tags={tags} setTags={setTags} placeholder="Hibiscus séché, Poudre de baobab… + Entrée" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Volume estimé" type="text" placeholder="12 tonnes" value={volume} onChange={e => setVolume(e.target.value)} />
                <div>
                  <label className="block text-sm text-[#0a0a0f] mb-1.5">Conditionnement</label>
                  <select value={conditionnement} onChange={e => setConditionnement(e.target.value)}
                    className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
                    {CONDITIONNEMENTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#0a0a0f] mb-1.5">Incoterm</label>
                <select value={incoterm} onChange={e => setIncoterm(e.target.value)}
                  className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
                  {INCOTERMS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#0a0a0f] mb-3">Certifications requises</label>
                <CertToggle certs={certs} setCerts={setCerts} />
              </div>
            </div>
          </FormSection>

          <div className="h-px bg-[rgba(13,34,101,0.08)]" />

          <FormSection label="Livraison">
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
            {transport && <p className="text-xs text-[#C4613A] mt-3">→ port de Rotterdam</p>}
          </FormSection>

          <div className="h-px bg-[rgba(13,34,101,0.08)]" />

          <FormError error={error} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <p className="text-xs text-[#64697d] leading-relaxed max-w-xs">
              Vos données sont traitées de manière confidentielle (RGPD). Aucun contact direct avec les fournisseurs.
            </p>
            <BtnNavy type="submit">
              {sending ? "Envoi…" : "Recevoir ma cotation"} <ArrowRight className="w-4 h-4" />
            </BtnNavy>
          </div>
        </div>
      </form>
    </ScreenShell>
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
            ? "Notre équipe vous revient sous 24 à 48 h ouvrées avec une proposition complète — produits, logistique, incoterm."
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
