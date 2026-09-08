/** Espace fournisseur · Mon dossier : consultation et modification de son propre profil (FRS-02). */

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import * as api from "@/lib/api";
import { CountrySelect, FieldLabel, FormError, TextInput } from "@/app/components/common/fields";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { SupplierShell } from "./SupplierShell";

export function SupplierCoordonnees({ nav }: { nav: Nav }) {
  const [form, setForm] = useState({ name: "", contact_name: "", phone: "", country: "", city: "" });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const logout = () => { api.setSupplierToken(null); nav("login"); };

  useEffect(() => {
    if (!api.getSupplierToken()) { nav("login"); return; }
    api.supplier.me()
      .then(me => {
        setForm({
          name: me.name, contact_name: me.contact_name ?? "", phone: me.phone ?? "",
          country: me.country ?? "", city: me.city ?? "",
        });
        setEmail(me.email);
      })
      .catch(err => { if (err instanceof api.ApiError && err.status === 401) logout(); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSaved(false);
    try {
      await api.supplier.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SupplierShell nav={nav} active="dossier">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-[#0a0a0f]">Mon dossier</h1>
        <p className="text-sm text-[#64697d] mt-0.5 mb-6">
          Tenez à jour les informations de votre société. Votre e-mail de connexion et vos catégories sont gérés par l'équipe À la Source.
        </p>

        <div className="bg-white border border-[rgba(13,34,101,0.1)] p-6">
          {loading ? (
            <p className="text-sm text-[#64697d] py-6 text-center">Chargement de votre profil…</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <FieldLabel>E-mail de connexion</FieldLabel>
                <TextInput value={email} disabled className="bg-[#f4f5f9] text-[#64697d] cursor-not-allowed" />
                <p className="text-[11px] text-[#64697d] mt-1">Pour changer d'e-mail, contactez l'équipe À la Source.</p>
              </div>
              <div><FieldLabel required>Nom de la société</FieldLabel><TextInput required value={form.name} onChange={set("name")} placeholder="Coopérative Kaydara" /></div>
              <div><FieldLabel>Nom du contact</FieldLabel><TextInput value={form.contact_name} onChange={set("contact_name")} placeholder="Amadou Diallo" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><FieldLabel>Téléphone</FieldLabel><TextInput type="tel" value={form.phone} onChange={set("phone")} placeholder="+221 77 000 00 00" /></div>
                <CountrySelect label="Pays" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
              </div>
              <div><FieldLabel>Ville</FieldLabel><TextInput value={form.city} onChange={set("city")} placeholder="Dakar" /></div>

              <FormError error={error} />
              {saved && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  <Check className="w-4 h-4 shrink-0" /> Coordonnées enregistrées.
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <BtnNavy type="submit" className="flex-1 justify-center">
                  <Check className="w-4 h-4" /> {sending ? "Enregistrement…" : "Enregistrer mon dossier"}
                </BtnNavy>
                <button type="button" onClick={() => nav("supplier-dashboard")}
                  className="text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer px-4 py-3">
                  Retour
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SupplierShell>
  );
}
