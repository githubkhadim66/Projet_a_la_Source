/** Candidature fournisseur : formulaire public + confirmation. */

import { useState } from "react";
import { ArrowRight, CheckCircle, Upload } from "lucide-react";
import * as api from "@/lib/api";
import { CAT_CATEGORIES, CERTS_FOURNISSEUR } from "@/lib/constants";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { CountrySelect, FieldLabel, FormError, RGPD, TextInput } from "@/app/components/common/fields";
import { Confirm, FormCard, ScreenShell } from "@/app/components/common/layout";

export function CandidatureForm({ nav }: { nav: Nav }) {
  const [form, setForm] = useState({ company: "", contact_name: "", email: "", phone: "", country: "", city: "", volumes: "" });
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [certs, setCerts] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleIn = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await api.leads.candidature({
        ...form, product_types: productTypes, certifications: certs, rgpd_consent: true,
      });
      nav("candidature-confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title="Candidature fournisseur">
      <FormCard title="Devenir fournisseur référencé" subtitle="Chaque dossier est étudié avec attention. Notre équipe vous recontacte sous 10 jours ouvrés.">
        <form onSubmit={submit} className="space-y-4">
          <div><FieldLabel required>Société</FieldLabel><TextInput placeholder="Coopérative Kaydara" required value={form.company} onChange={set("company")} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel required>Nom du contact</FieldLabel><TextInput placeholder="Amadou Diallo" required value={form.contact_name} onChange={set("contact_name")} /></div>
            <div><FieldLabel required>E-mail</FieldLabel><TextInput type="email" required placeholder="contact@coop.sn" value={form.email} onChange={set("email")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel>Téléphone</FieldLabel><TextInput type="tel" placeholder="+221 77 000 00 00" value={form.phone} onChange={set("phone")} /></div>
            <CountrySelect label="Pays" required value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
          </div>
          <div><FieldLabel>Ville</FieldLabel><TextInput placeholder="Dakar" value={form.city} onChange={set("city")} /></div>
          <div>
            <FieldLabel required>Types de produits</FieldLabel>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CAT_CATEGORIES.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm text-[#0a0a0f] cursor-pointer">
                  <input type="checkbox" className="accent-[#0d2265]" checked={productTypes.includes(c)} onChange={() => toggleIn(productTypes, setProductTypes, c)} />{c}
                </label>
              ))}
            </div>
          </div>
          <div><FieldLabel>Volumes indicatifs</FieldLabel><TextInput placeholder="Ex : 10 t / mois" value={form.volumes} onChange={set("volumes")} /></div>
          <div>
            <FieldLabel>Certifications détenues</FieldLabel>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {CERTS_FOURNISSEUR.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm text-[#0a0a0f] cursor-pointer">
                  <input type="checkbox" className="accent-[#0d2265]" checked={certs.includes(c)} onChange={() => toggleIn(certs, setCerts, c)} />{c}
                </label>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Photos / documents (facultatif)</FieldLabel>
            <div className="border border-dashed border-[rgba(13,34,101,0.2)] p-5 text-center">
              <Upload className="w-5 h-5 text-[#64697d] mx-auto mb-1.5" />
              <p className="text-xs text-[#64697d]">Photos produits, fiches techniques, certifications</p>
            </div>
          </div>
          <RGPD id="rgpd-cand" />
          <FormError error={error} />
          <BtnNavy type="submit" className="w-full justify-center">
            {sending ? "Envoi en cours…" : "Envoyer ma candidature"} <ArrowRight className="w-4 h-4" />
          </BtnNavy>
        </form>
      </FormCard>
    </ScreenShell>
  );
}

export function CandidatureConfirm({ nav }: { nav: Nav }) {
  return (
    <ScreenShell nav={nav} title="Confirmation">
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<CheckCircle className="w-8 h-8 text-[#0d2265]" />}
          title="Candidature reçue"
          subtitle="Merci pour votre candidature. Chaque dossier est étudié avec attention : notre équipe vous recontactera sous 10 jours ouvrés pour la suite · échanges, évaluation des produits, audit."
          nav={nav}
        />
      </div>
    </ScreenShell>
  );
}
