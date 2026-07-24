/** Téléchargement gated du catalogue : formulaire + écran de confirmation avec lien signé. */

import { useState } from "react";
import { Calendar, CheckCircle, Download } from "lucide-react";
import * as api from "@/lib/api";
import { CALENDLY_URL } from "@/lib/constants";
import type { Nav } from "@/lib/routes";
import { BtnNavy, BtnOutlineNavy } from "@/app/components/common/buttons";
import { FieldLabel, FormError, RGPD, SelectInput, TextInput } from "@/app/components/common/fields";
import { Confirm, FormCard, ScreenShell } from "@/app/components/common/layout";

export function CatalogueForm({ nav, onSuccess }: { nav: Nav; onSuccess: (url: string) => void }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", company: "", email: "", country: "", role: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await api.leads.catalogue({ ...form, rgpd_consent: true });
      onSuccess(res.download_url);
      nav("catalogue-confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title="Télécharger le catalogue">
      <FormCard
        title="Catalogue édition Juillet 2026"
        subtitle="Épicerie, boissons, fruits & légumes, matières premières : parcourez nos références d'origine africaine. Les prix sont communiqués sur devis, sous 24 à 48 h ouvrées."
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel required>Prénom</FieldLabel><TextInput placeholder="Marie" required value={form.first_name} onChange={set("first_name")} /></div>
            <div><FieldLabel required>Nom</FieldLabel><TextInput placeholder="Dupont" required value={form.last_name} onChange={set("last_name")} /></div>
          </div>
          <div><FieldLabel required>Société</FieldLabel><TextInput placeholder="Épicerie du Marché SAS" required value={form.company} onChange={set("company")} /></div>
          <div><FieldLabel required>E-mail professionnel</FieldLabel><TextInput type="email" placeholder="m.dupont@epicerie.fr" required value={form.email} onChange={set("email")} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Pays</FieldLabel>
              <SelectInput required value={form.country} onChange={set("country")}>
                <option value="">Sélectionner…</option>
                {["France","Belgique","Suisse","Luxembourg","Allemagne","Pays-Bas","Espagne","Italie","Royaume-Uni","Autre"].map(c=><option key={c}>{c}</option>)}
              </SelectInput>
            </div>
            <div><FieldLabel>Fonction</FieldLabel><TextInput placeholder="Directeur des achats" value={form.role} onChange={set("role")} /></div>
          </div>
          <div><FieldLabel>Téléphone</FieldLabel><TextInput type="tel" placeholder="+33 6 00 00 00 00" value={form.phone} onChange={set("phone")} /></div>
          <RGPD />
          <FormError error={error} />
          <BtnNavy type="submit" className="w-full justify-center">
            <Download className="w-4 h-4" /> {sending ? "Envoi en cours…" : "Recevoir le catalogue"}
          </BtnNavy>
        </form>
      </FormCard>
    </ScreenShell>
  );
}

export function CatalogueConfirm({ nav, downloadUrl }: { nav: Nav; downloadUrl: string | null }) {
  return (
    <ScreenShell nav={nav} title="Confirmation">
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<CheckCircle className="w-8 h-8 text-[#0d2265]" />}
          title="Merci !"
          subtitle="Votre catalogue est en route — vous le recevrez par e-mail dans quelques instants."
          nav={nav}
        >
          <div className="space-y-4">
            <BtnNavy className="mx-auto" onClick={() => downloadUrl && window.open(downloadUrl, "_blank")}>
              <Download className="w-4 h-4" /> Télécharger le catalogue (PDF)
            </BtnNavy>
            <div className="pt-4 border-t border-[rgba(13,34,101,0.08)]">
              <p className="text-sm text-[#64697d] mb-3">Besoin d'une réponse immédiate ?</p>
              <BtnOutlineNavy onClick={() => window.open(CALENDLY_URL, '_blank')} className="mx-auto">
                <Calendar className="w-4 h-4" /> Réserver un échange de 30 min avec l'experte
              </BtnOutlineNavy>
            </div>
          </div>
        </Confirm>
      </div>
    </ScreenShell>
  );
}
