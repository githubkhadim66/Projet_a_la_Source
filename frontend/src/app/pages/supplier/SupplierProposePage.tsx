/** Proposition d'un nouveau produit par le fournisseur — fiche complète (comme l'ajout admin). */

import { useRef, useState } from "react";
import { ArrowRight, CheckCircle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { CAT_CATEGORIES, PAYS_ORIGINE, PRODUITS_PAR_CATEGORIE } from "@/lib/constants";
import { productImg } from "@/lib/format";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, FormError, TextArea, TextInput } from "@/app/components/common/fields";
import { Confirm, FormCard, ScreenShell } from "@/app/components/common/layout";

const CERT_OPTIONS = ["Bio", "Halal", "Casher", "HACCP", "ISO", "Autre", "Aucune"];

export function SupplierPropose({ nav }: { nav: Nav }) {
  const [form, setForm] = useState({
    name: "", origin: "", category: "Épicerie", moq: "", volumes: "",
    price_per_kg: "", bulk_price: "", harvest_period: "",
    description: "", benefits: "", image: "",
  });
  // Produit choisi dans la liste de la catégorie, ou saisi librement (« Autre »)
  const [productChoice, setProductChoice] = useState("");
  const [customProduct, setCustomProduct] = useState(false);
  const [certs, setCerts] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleCert = (c: string) => setCerts(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);

  const AUTRE = "Autre (préciser)";
  const produitsCategorie = PRODUITS_PAR_CATEGORIE[form.category] ?? [];

  // Changer de catégorie réinitialise le produit choisi
  const changeCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, category: e.target.value, name: "" }));
    setProductChoice("");
    setCustomProduct(false);
  };
  // Choix d'un produit dans la liste (ou « Autre » → saisie libre)
  const changeProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setProductChoice(v);
    if (v === AUTRE) { setCustomProduct(true); setForm(f => ({ ...f, name: "" })); }
    else { setCustomProduct(false); setForm(f => ({ ...f, name: v })); }
  };

  const logout = () => { api.setSupplierToken(null); nav("login"); };

  const choisirPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      setForm(f => ({ ...f, image: "" }));
      const url = await api.supplier.uploadImage(file);
      setForm(f => ({ ...f, image: url }));
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      setUploadError(err instanceof api.ApiError ? err.message : "Téléversement impossible.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Le nom du produit est requis."); return; }
    if (!form.description.trim()) { setError("Une description est requise."); return; }
    setSending(true);
    setError(null);
    try {
      await api.supplier.proposeProduct({ ...form, certifications: certs });
      nav("supplier-propose-confirm");
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title="Proposer un produit" back="supplier-products">
      <FormCard title="Soumettre un produit à validation" subtitle="Renseignez la fiche la plus complète possible. Aucun produit n'est publié automatiquement : l'équipe À la Source examine chaque proposition avant toute décision.">
        <form onSubmit={submit} className="space-y-5">
          {/* Photo */}
          <div>
            <FieldLabel>Photo du produit</FieldLabel>
            <div className="flex gap-4 items-start">
              <div className="w-32 h-24 bg-[#eef1f8] overflow-hidden border border-[rgba(13,34,101,0.1)] shrink-0">
                <img src={productImg(form.image)} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
                  onChange={e => choisirPhoto(e.target.files?.[0])} />
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}
                    className="flex items-center justify-center gap-1.5 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-xs font-semibold px-3 py-2 cursor-pointer hover:bg-[#f4f5f9] transition-colors disabled:opacity-60">
                    {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi…</> : <><ImagePlus className="w-3.5 h-3.5" /> Choisir une photo</>}
                  </button>
                  {form.image && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: "" }))} title="Retirer la photo"
                      className="border border-[rgba(13,34,101,0.15)] text-[#64697d] px-2.5 cursor-pointer hover:border-red-300 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#64697d] mt-1.5">JPG, PNG ou WebP — 5 Mo maximum.</p>
                {uploadError && <p className="text-[11px] text-red-600 mt-1">{uploadError}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Catégorie</FieldLabel>
              <select value={form.category} onChange={changeCategory}
                className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
                {CAT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Origine</FieldLabel>
              <select value={form.origin} onChange={set("origin")}
                className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
                <option value="">Sélectionner</option>
                {PAYS_ORIGINE.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel required>Produit</FieldLabel>
            <select value={productChoice} onChange={changeProduct}
              className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
              <option value="">Sélectionner un produit…</option>
              {produitsCategorie.map(p => <option key={p}>{p}</option>)}
              <option>{AUTRE}</option>
            </select>
            {customProduct && (
              <TextInput required className="mt-2" placeholder="Nom du produit" value={form.name} onChange={set("name")} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel>Conditionnement / MOQ</FieldLabel><TextInput placeholder="25 kg" value={form.moq} onChange={set("moq")} /></div>
            <div><FieldLabel>Volumes disponibles</FieldLabel><TextInput placeholder="Ex : 2 000 kg / mois" value={form.volumes} onChange={set("volumes")} /></div>
          </div>

          <div className="border border-[rgba(196,97,58,0.25)] bg-[#fffaf7] p-4 space-y-4">
            <p className="text-[11px] font-semibold text-[#C4613A] uppercase tracking-wide">Informations commerciales — confidentielles</p>
            <div className="grid grid-cols-2 gap-4">
              <div><FieldLabel>Prix au kilo</FieldLabel><TextInput placeholder="Ex : 1 200 FCFA/kg" value={form.price_per_kg} onChange={set("price_per_kg")} /></div>
              <div><FieldLabel>Prix en vrac</FieldLabel><TextInput placeholder="Ex : 950 FCFA/kg dès 1 t" value={form.bulk_price} onChange={set("bulk_price")} /></div>
            </div>
            <div><FieldLabel>Période de récolte</FieldLabel><TextInput placeholder="Ex : novembre à février" value={form.harvest_period} onChange={set("harvest_period")} /></div>
            <p className="text-[11px] text-[#64697d]">Ces informations restent internes à À la Source et ne sont jamais affichées publiquement.</p>
          </div>

          <div><FieldLabel required>Description</FieldLabel><TextArea required rows={3} placeholder="Caractéristiques, usage, conditionnement, origine exacte…" value={form.description} onChange={set("description")} /></div>
          <div>
            <FieldLabel>Bienfaits</FieldLabel>
            <TextArea rows={3} placeholder="Apports nutritionnels, atouts pour l'acheteur…" value={form.benefits} onChange={set("benefits")}
              className="border-[rgba(196,97,58,0.3)] bg-[#fffaf7] focus:border-[#C4613A]" />
          </div>

          <div>
            <FieldLabel>Certifications détenues pour ce produit</FieldLabel>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {CERT_OPTIONS.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[#0d2265]" checked={certs.includes(c)} onChange={() => toggleCert(c)} />{c}</label>
              ))}
            </div>
          </div>

          <FormError error={error} />
          <BtnNavy type="submit" className="w-full justify-center">{sending ? "Envoi…" : "Soumettre à validation"} <ArrowRight className="w-4 h-4" /></BtnNavy>
        </form>
      </FormCard>
    </ScreenShell>
  );
}

export function SupplierProposeConfirm({ nav }: { nav: Nav }) {
  return (
    <ScreenShell nav={nav} title="Proposition envoyée" back="supplier-products">
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<CheckCircle className="w-8 h-8 text-[#0d2265]" />}
          title="Proposition transmise"
          subtitle="Votre proposition a été transmise à l'équipe À la Source pour validation. Vous serez informé par e-mail de la décision. Aucune publication automatique."
          nav={nav}
          back="supplier-products"
          backLabel="Retour à mes produits"
        />
      </div>
    </ScreenShell>
  );
}
