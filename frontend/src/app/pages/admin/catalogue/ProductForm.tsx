/** Formulaire complet d'une fiche produit : identité, description, bienfaits et photo. */

import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiAdminProduct, ApiSupplier } from "@/lib/api";
import { CAT_CATEGORIES } from "@/lib/constants";
import { productImg } from "@/lib/format";
import type { StockStatus } from "@/lib/leads";

export interface ProductFormValues {
  name: string; ref: string; origin: string; category: string; moq: string;
  image: string; description: string; benefits: string;
  supplier_id: string; delay: string; stock: string; status: StockStatus;
}

export const emptyProduct = (supplierId?: number): ProductFormValues => ({
  name: "", ref: "", origin: "", category: "Épicerie", moq: "",
  image: "", description: "", benefits: "",
  supplier_id: supplierId ? String(supplierId) : "", delay: "", stock: "0", status: "En stock",
});

export const productToForm = (p: ApiAdminProduct): ProductFormValues => ({
  name: p.name, ref: p.ref, origin: p.origin ?? "", category: p.category ?? "Épicerie",
  moq: p.moq, image: p.image, description: p.description, benefits: p.benefits,
  supplier_id: String(p.supplier_id), delay: p.delay, stock: String(p.stock_kg), status: p.status,
});

const TEXT_FIELDS = [
  ["name", "Nom du produit *", "Fonio"],
  ["ref", "Référence", "ALS-XX-000"],
  ["origin", "Origine", "Afrique de l'Ouest"],
  ["moq", "Conditionnement / MOQ", "25 kg"],
  ["delay", "Délai indicatif", "2–3 semaines"],
] as const;

export function ProductForm({ values, setValues, suppliers, isEdit, error, onSubmit, onCancel }: {
  values: ProductFormValues;
  setValues: (v: ProductFormValues) => void;
  suppliers: ApiSupplier[];
  isEdit: boolean;
  error: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const set = (key: keyof ProductFormValues, value: string) => setValues({ ...values, [key]: value });

  const choisirPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      set("image", await api.admin.uploadImage(file));
    } catch (err) {
      setUploadError(err instanceof api.ApiError ? err.message : "Téléversement impossible.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-[rgba(13,34,101,0.15)] p-5">
      <p className="font-semibold text-sm text-[#0a0a0f] mb-4">
        {isEdit ? "Modifier la fiche produit" : "Nouvelle fiche produit"}
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Photo */}
        <div className="lg:w-52 shrink-0">
          <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1.5">Photo du produit</label>
          <div className="aspect-[4/3] bg-[#eef1f8] overflow-hidden border border-[rgba(13,34,101,0.1)]">
            <img src={productImg(values.image)} alt="" className="w-full h-full object-cover" />
          </div>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
            onChange={e => choisirPhoto(e.target.files?.[0])} />
          <div className="flex gap-1.5 mt-2">
            <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-xs font-semibold py-2 cursor-pointer hover:bg-[#f4f5f9] transition-colors disabled:opacity-60">
              {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi…</> : <><ImagePlus className="w-3.5 h-3.5" /> Choisir une photo</>}
            </button>
            {values.image && (
              <button type="button" onClick={() => set("image", "")} title="Retirer la photo"
                className="border border-[rgba(13,34,101,0.15)] text-[#64697d] px-2.5 cursor-pointer hover:border-red-300 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-[#64697d] mt-1.5 leading-relaxed">JPG, PNG ou WebP — 5 Mo maximum.</p>
          {uploadError && <p className="text-[10px] text-red-600 mt-1">{uploadError}</p>}
        </div>

        {/* Champs */}
        <div className="flex-1 min-w-0">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            {TEXT_FIELDS.map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">{label}</label>
                <input value={values[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                  disabled={key === "ref" && isEdit}
                  className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0d2265] disabled:bg-[#f4f5f9] disabled:text-[#64697d]" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Catégorie</label>
              <select value={values.category} onChange={e => set("category", e.target.value)}
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:border-[#0d2265]">
                {CAT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {!isEdit && (
              <div>
                <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Fournisseur *</label>
                <select value={values.supplier_id} onChange={e => set("supplier_id", e.target.value)}
                  className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:border-[#0d2265]">
                  <option value="">Sélectionner…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Stock (kg)</label>
              <input type="number" value={values.stock} onChange={e => set("stock", e.target.value)}
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0d2265]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Disponibilité</label>
              <select value={values.status} onChange={e => set("status", e.target.value)}
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:border-[#0d2265]">
                <option>En stock</option><option>Sur commande</option><option>Rupture</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Description</label>
              <textarea rows={4} value={values.description} onChange={e => set("description", e.target.value)}
                placeholder="Ce qu'est le produit, sa provenance, son usage…"
                className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0d2265] resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#C4613A] uppercase tracking-widest mb-1">Bienfaits</label>
              <textarea rows={4} value={values.benefits} onChange={e => set("benefits", e.target.value)}
                placeholder="Apports nutritionnels, atouts pour l'acheteur…"
                className="w-full border border-[rgba(196,97,58,0.3)] px-3 py-2 text-sm bg-[#fffaf7] focus:outline-none focus:border-[#C4613A] resize-none" />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button onClick={onSubmit} disabled={uploading}
          className="bg-[#0d2265] text-white text-xs font-bold px-4 py-2 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center gap-1.5 disabled:opacity-60">
          <Check className="w-3.5 h-3.5" /> {isEdit ? "Enregistrer les modifications" : "Créer le produit"}
        </button>
        <button onClick={onCancel}
          className="border border-[rgba(13,34,101,0.15)] text-[#64697d] text-xs px-4 py-2 cursor-pointer hover:bg-[#f4f5f9] transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}
