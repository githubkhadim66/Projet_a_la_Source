/** Sourcing sur mesure : demande d'un produit hors catalogue. */

import { useState } from "react";
import { ArrowRight, Upload } from "lucide-react";
import * as api from "@/lib/api";
import { PAYS_EU } from "@/lib/constants";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { CertToggle, FormError, FormInput, FormSection, FormSelect } from "@/app/components/common/fields";
import { ScreenShell } from "@/app/components/common/layout";

export function SourcingForm({ nav }: { nav: Nav }) {
  const [certs, setCerts] = useState<string[]>([]);
  const [transport, setTransport] = useState(false);
  const [qualite, setQualite] = useState("Standard");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [volume, setVolume] = useState("");
  const [budget, setBudget] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await api.leads.sourcing({
        company, contact, email, country, product, description,
        volume, budget, quality_level: qualite,
        certifications: certs, transport_needed: transport,
      });
      nav("sourcing-confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title="Sourcing sur mesure">
      <form onSubmit={submit}>
        <div className="bg-white border border-[rgba(13,34,101,0.12)] p-8 space-y-10">

          <FormSection label="Votre entreprise">
            <div className="space-y-4">
              <FormInput label="Société" required type="text" placeholder="SARL Import Europe" value={company} onChange={e => setCompany(e.target.value)} />
              <FormInput label="Contact & fonction" required type="text" placeholder="Nom Prénom — Fonction" value={contact} onChange={e => setContact(e.target.value)} />
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
              <FormInput label="Produit recherché" required type="text" placeholder="Beurre de karité raffiné" value={product} onChange={e => setProduct(e.target.value)} />
              <div>
                <label className="block text-sm text-[#0a0a0f] mb-1.5">Description du besoin<span className="text-[#C4613A] ml-0.5">*</span></label>
                <textarea required rows={4} placeholder="Usage, conditionnement attendu, origine souhaitée, contraintes particulières…"
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Volume estimé" type="text" placeholder="5 000 kg / mois" value={volume} onChange={e => setVolume(e.target.value)} />
                <FormInput label="Budget estimatif" type="text" placeholder="Facultatif" value={budget} onChange={e => setBudget(e.target.value)} />
              </div>
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
            </div>
          </FormSection>

          <div className="h-px bg-[rgba(13,34,101,0.08)]" />

          <FormSection label="Documents">
            <div className="border border-dashed border-[rgba(13,34,101,0.2)] p-8 text-center">
              <Upload className="w-6 h-6 text-[#64697d] mx-auto mb-2" />
              <p className="text-sm text-[#64697d]">Cahier des charges, fiche technique, photos de référence</p>
              <p className="text-xs text-[#9ca3af] mt-1">PDF, XLSX, JPG, PNG — 10 Mo max</p>
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
              {sending ? "Envoi…" : "Envoyer ma demande"} <ArrowRight className="w-4 h-4" />
            </BtnNavy>
          </div>
        </div>
      </form>
    </ScreenShell>
  );
}
