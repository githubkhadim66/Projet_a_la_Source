/** Modification par le fournisseur des informations de sa propre fiche produit.
 *  Réutilise les champs partagés (conditionnement/MOQ, origine, prix internes).
 *  N'inclut pas la curation (visible, vedette, catalogue) · réservée à l'admin.
 */

import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiProduct } from "@/lib/api";
import { CAT_CATEGORIES } from "@/lib/constants";
import { availableUntilToDateInput, dateToAvailableUntil } from "@/lib/availability";
import { productImg } from "@/lib/format";
import { useOptionLabel } from "@/lib/formsText";
import { useSupplierText } from "@/lib/supplierText";
import { CountrySelect, FieldLabel, PackagingMoqFields, TextArea, TextInput } from "@/app/components/common/fields";

export function SupplierProductEditModal({ product, onClose, onSaved, onAuthError }: {
  product: ApiProduct;
  onClose: () => void;
  onSaved: (p: ApiProduct) => void;
  onAuthError: () => void;
}) {
  const { edit: t, fields: f, common } = useSupplierText();
  const tr = useOptionLabel();
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
    available_until: availableUntilToDateInput(product.available_until),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const choisirPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true); setUploadError(null);
    try {
      const url = await api.supplier.uploadImage(file);
      setForm(prev => ({ ...prev, image: url }));
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { onAuthError(); return; }
      setUploadError(err instanceof api.ApiError ? err.message : common.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { setError(common.nameRequired); return; }
    if (!form.description.trim()) { setError(common.descriptionRequired); return; }
    setSaving(true); setError(null);
    try {
      const { available_until, ...rest } = form;
      const updated = await api.supplier.updateProduct(product.id, {
        ...rest, available_until: dateToAvailableUntil(available_until),
      });
      onSaved(updated);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { onAuthError(); return; }
      setError(common.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[rgba(13,34,101,0.08)] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#0a0a0f]">{t.title}</p>
            <p className="text-[11px] text-[#64697d] font-mono truncate">{product.ref}</p>
          </div>
          <button onClick={onClose} className="text-[#64697d] hover:text-[#0a0a0f] cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Photo */}
          <div>
            <FieldLabel>{f.photo}</FieldLabel>
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
                    {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {common.uploading}</> : <><ImagePlus className="w-3.5 h-3.5" /> {t.changePhoto}</>}
                  </button>
                  {form.image && (
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, image: "" }))} title={common.removePhoto}
                      className="border border-[rgba(13,34,101,0.15)] text-[#64697d] px-2.5 cursor-pointer hover:border-red-300 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#64697d] mt-1.5">{common.photoFormats}</p>
                {uploadError && <p className="text-[11px] text-red-600 mt-1">{uploadError}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel required>{f.productName}</FieldLabel><TextInput value={form.name} onChange={set("name")} placeholder={f.productNamePlaceholder} /></div>
            <div>
              <FieldLabel>{f.category}</FieldLabel>
              <select value={form.category} onChange={set("category")}
                className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
                {CAT_CATEGORIES.map(c => <option key={c} value={c}>{tr(c)}</option>)}
              </select>
            </div>
          </div>

          <CountrySelect label={f.origin} value={form.origin} onChange={v => setForm(prev => ({ ...prev, origin: v }))} />

          <PackagingMoqFields
            key={product.ref}
            packaging={form.packaging} moq={form.moq}
            onPackaging={v => setForm(prev => ({ ...prev, packaging: v }))}
            onMoq={v => setForm(prev => ({ ...prev, moq: v }))}
          />

          <div>
            <FieldLabel>{f.availableUntil}</FieldLabel>
            <div className="flex items-center gap-2">
              <input type="date" value={form.available_until} onChange={set("available_until")}
                min={new Date().toISOString().slice(0, 10)}
                className="flex-1 border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265]" />
              {form.available_until && (
                <button type="button" onClick={() => setForm(prev => ({ ...prev, available_until: "" }))}
                  className="text-xs text-[#64697d] hover:text-red-600 px-2 py-2 cursor-pointer whitespace-nowrap">{f.removeLimit}</button>
              )}
            </div>
            <p className="text-[11px] text-[#64697d] mt-1.5">{f.availableUntilHint}</p>
          </div>

          <div><FieldLabel required>{f.description}</FieldLabel><TextArea rows={3} value={form.description} onChange={set("description")} placeholder={f.descriptionPlaceholder} /></div>
          <div>
            <FieldLabel>{f.benefits}</FieldLabel>
            <TextArea rows={3} value={form.benefits} onChange={set("benefits")} placeholder={f.benefitsPlaceholder}
              className="border-[rgba(196,97,58,0.3)] bg-[#fffaf7] focus:border-[#C4613A]" />
          </div>

          {/* Informations commerciales internes · jamais publiées */}
          <div className="border border-[rgba(196,97,58,0.25)] bg-[#fffaf7] p-4 space-y-3">
            <p className="text-[11px] font-semibold text-[#C4613A] uppercase tracking-wide">{f.commercialInternal}</p>
            <div className="grid grid-cols-2 gap-4">
              <div><FieldLabel>{f.pricePerKg}</FieldLabel><TextInput value={form.price_per_kg} onChange={set("price_per_kg")} placeholder={f.pricePerKgPlaceholder} /></div>
              <div><FieldLabel>{f.bulkPrice}</FieldLabel><TextInput value={form.bulk_price} onChange={set("bulk_price")} placeholder={f.bulkPricePlaceholder} /></div>
            </div>
            <div><FieldLabel>{f.harvest}</FieldLabel><TextInput value={form.harvest_period} onChange={set("harvest_period")} placeholder={f.harvestPlaceholder} /></div>
            <p className="text-[11px] text-[#64697d]">{common.internalOnly}</p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-5 py-3.5 border-t border-[rgba(13,34,101,0.08)] flex items-center justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-sm text-[#64697d] hover:text-[#0a0a0f] px-4 py-2 cursor-pointer">{common.cancel}</button>
          <button onClick={save} disabled={saving || uploading}
            className="bg-[#0d2265] text-white text-sm font-semibold px-4 py-2 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center gap-2 disabled:opacity-60">
            <Check className="w-3.5 h-3.5" /> {saving ? common.saving : t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
