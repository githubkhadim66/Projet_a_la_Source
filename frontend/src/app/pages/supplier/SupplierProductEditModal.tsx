/** Modification par le fournisseur des informations de sa propre fiche produit.
 *  Réutilise les champs partagés (conditionnement/MOQ, origine, prix internes).
 *  N'inclut pas la curation (visible, vedette, catalogue) · réservée à l'admin.
 */

import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiProduct } from "@/lib/api";
import { CAT_CATEGORIES } from "@/lib/constants";
import { productImg } from "@/lib/format";
import { CountrySelect, FieldLabel, PackagingMoqFields, TextArea, TextInput } from "@/app/components/common/fields";

export function SupplierProductEditModal({ product, onClose, onSaved, onAuthError }: {
  product: ApiProduct;
  onClose: () => void;
  onSaved: (p: ApiProduct) => void;
  onAuthError: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    category: product.category ?? "Épicerie",
    origin: product.origin ?? "",
    packaging: product.packaging,
    moq: product.moq,
    image: product.image,
    description: product.description,
    benefits: product.benefits,
    price_per_kg: product.price_per_kg,
    bulk_price: product.bulk_price,
    harvest_period: product.harvest_period,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const choisirPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true); setUploadError(null);
    try {
      const url = await api.supplier.uploadImage(file);
      setForm(f => ({ ...f, image: url }));
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { onAuthError(); return; }
      setUploadError(err instanceof api.ApiError ? err.message : "Téléversement impossible.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Le nom du produit est requis."); return; }
    if (!form.description.trim()) { setError("Une description est requise."); return; }
    setSaving(true); setError(null);
    try {
      const updated = await api.supplier.updateProduct(product.id, { ...form });
      onSaved(updated);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { onAuthError(); return; }
      setError("Échec de l'enregistrement. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[rgba(13,34,101,0.08)] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#0a0a0f]">Modifier la fiche produit</p>
            <p className="text-[11px] text-[#64697d] font-mono truncate">{product.ref}</p>
          </div>
          <button onClick={onClose} className="text-[#64697d] hover:text-[#0a0a0f] cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-5 space-y-5">
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
                    {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi…</> : <><ImagePlus className="w-3.5 h-3.5" /> Changer la photo</>}
                  </button>
                  {form.image && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: "" }))} title="Retirer la photo"
                      className="border border-[rgba(13,34,101,0.15)] text-[#64697d] px-2.5 cursor-pointer hover:border-red-300 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#64697d] mt-1.5">JPG, PNG ou WebP · 5 Mo maximum.</p>
                {uploadError && <p className="text-[11px] text-red-600 mt-1">{uploadError}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel required>Nom du produit</FieldLabel><TextInput value={form.name} onChange={set("name")} placeholder="Beurre de karité brut" /></div>
            <div>
              <FieldLabel>Catégorie</FieldLabel>
              <select value={form.category} onChange={set("category")}
                className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
                {CAT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <CountrySelect label="Origine" value={form.origin} onChange={v => setForm(f => ({ ...f, origin: v }))} />

          <PackagingMoqFields
            key={product.ref}
            packaging={form.packaging} moq={form.moq}
            onPackaging={v => setForm(f => ({ ...f, packaging: v }))}
            onMoq={v => setForm(f => ({ ...f, moq: v }))}
          />

          <div><FieldLabel required>Description</FieldLabel><TextArea rows={3} value={form.description} onChange={set("description")} placeholder="Caractéristiques, usage, origine exacte…" /></div>
          <div>
            <FieldLabel>Bienfaits</FieldLabel>
            <TextArea rows={3} value={form.benefits} onChange={set("benefits")} placeholder="Apports nutritionnels, atouts pour l'acheteur…"
              className="border-[rgba(196,97,58,0.3)] bg-[#fffaf7] focus:border-[#C4613A]" />
          </div>

          {/* Informations commerciales internes · jamais publiées */}
          <div className="border border-[rgba(196,97,58,0.25)] bg-[#fffaf7] p-4 space-y-3">
            <p className="text-[11px] font-semibold text-[#C4613A] uppercase tracking-wide">Informations commerciales · internes</p>
            <div className="grid grid-cols-2 gap-4">
              <div><FieldLabel>Prix au kilo</FieldLabel><TextInput value={form.price_per_kg} onChange={set("price_per_kg")} placeholder="Ex : 1 200 FCFA/kg" /></div>
              <div><FieldLabel>Prix en vrac</FieldLabel><TextInput value={form.bulk_price} onChange={set("bulk_price")} placeholder="Ex : 950 FCFA/kg dès 1 t" /></div>
            </div>
            <div><FieldLabel>Période de récolte</FieldLabel><TextInput value={form.harvest_period} onChange={set("harvest_period")} placeholder="Ex : novembre à février" /></div>
            <p className="text-[11px] text-[#64697d]">Visibles uniquement par vous et l'équipe À la Source · jamais affichées publiquement.</p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-5 py-3.5 border-t border-[rgba(13,34,101,0.08)] flex items-center justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-sm text-[#64697d] hover:text-[#0a0a0f] px-4 py-2 cursor-pointer">Annuler</button>
          <button onClick={save} disabled={saving || uploading}
            className="bg-[#0d2265] text-white text-sm font-semibold px-4 py-2 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center gap-2 disabled:opacity-60">
            <Check className="w-3.5 h-3.5" /> {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
