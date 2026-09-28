/** Candidature fournisseur : formulaire public + confirmation. */

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle, Upload, X } from "lucide-react";
import * as api from "@/lib/api";
import { CAT_CATEGORIES, CERTS_FOURNISSEUR, PRODUITS_PAR_CATEGORIE } from "@/lib/constants";
import { suggestProducts } from "@/lib/productSuggest";
import { useLang } from "@/lib/i18n";
import { useFormsText, useOptionLabel } from "@/lib/formsText";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { CountrySelect, FieldLabel, FormError, RGPD, TextInput } from "@/app/components/common/fields";
import { Confirm, FormCard, ScreenShell } from "@/app/components/common/layout";

export function CandidatureForm({ nav }: { nav: Nav }) {
  const lang = useLang();
  const tx = useFormsText();
  const t = tx.candidature;
  const tr = useOptionLabel();
  const [form, setForm] = useState({ company: "", contact_name: "", email: "", phone: "", country: "", city: "" });
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customProduct, setCustomProduct] = useState("");
  const [certs, setCerts] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleIn = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  // Produits proposables : union des produits des catégories cochées.
  const availableProducts = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => (PRODUITS_PAR_CATEGORIE[c] ?? []).forEach(p => set.add(p)));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [categories]);

  // Référentiel de tous les produits connus (toutes catégories) pour les suggestions.
  const allKnownProducts = useMemo(() => {
    const set = new Set<string>();
    Object.values(PRODUITS_PAR_CATEGORIE).forEach(list => list.forEach(p => set.add(p)));
    return [...set];
  }, []);
  const addByName = (v: string) => {
    const name = v.trim();
    if (name && !products.includes(name)) setProducts([...products, name]);
  };
  const addProduct = (v: string) => {
    if (!v) return;
    if (v === "__autre__") { setAddingCustom(true); return; }
    addByName(v);
  };
  const addCustom = () => { addByName(customProduct); setCustomProduct(""); setAddingCustom(false); };
  const pickSuggestion = (name: string) => { addByName(name); setCustomProduct(""); setAddingCustom(false); };
  const removeProduct = (v: string) => setProducts(products.filter(x => x !== v));

  // Suggestions tolérantes aux fautes, en excluant ce qui est déjà choisi.
  const suggestions = useMemo(
    () => suggestProducts(customProduct, allKnownProducts).filter(p => !products.includes(p)),
    [customProduct, allKnownProducts, products]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.contact_name.trim() || !form.email.trim() || !form.country.trim()) {
      setError(t.requiredContact); return;
    }
    if (categories.length === 0) { setError(t.requiredCategory); return; }
    if (products.length === 0) { setError(t.requiredProduct); return; }
    setSending(true);
    setError(null);
    try {
      await api.leads.candidature({
        ...form, product_types: categories, products, certifications: certs, rgpd_consent: true,
        language: lang,
      });
      nav("candidature-confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : tx.common.genericError);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title={t.screen}>
      <FormCard title={t.title} subtitle={t.subtitle}>
        <form onSubmit={submit} className="space-y-4">
          <div><FieldLabel required>{t.company}</FieldLabel><TextInput placeholder="Coopérative Kaydara" required value={form.company} onChange={set("company")} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel required>{t.contactName}</FieldLabel><TextInput placeholder="Amadou Diallo" required value={form.contact_name} onChange={set("contact_name")} /></div>
            <div><FieldLabel required>{t.email}</FieldLabel><TextInput type="email" required placeholder="contact@coop.sn" value={form.email} onChange={set("email")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel>{t.phone}</FieldLabel><TextInput type="tel" placeholder="+221 77 000 00 00" value={form.phone} onChange={set("phone")} /></div>
            <CountrySelect label={t.country} required value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
          </div>
          <div><FieldLabel>{t.city}</FieldLabel><TextInput placeholder="Dakar" value={form.city} onChange={set("city")} /></div>
          <div>
            <FieldLabel required>{t.categories}</FieldLabel>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CAT_CATEGORIES.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm text-[#0a0a0f] cursor-pointer">
                  <input type="checkbox" className="accent-[#0d2265]" checked={categories.includes(c)} onChange={() => toggleIn(categories, setCategories, c)} />{tr(c)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel required>{t.products}</FieldLabel>
            {categories.length === 0 ? (
              <p className="text-xs text-[#64697d] mt-1">{t.pickCategoryFirst}</p>
            ) : (
              <>
                <select value="" onChange={e => addProduct(e.target.value)}
                  className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer">
                  <option value="">{t.addProduct}</option>
                  {availableProducts.filter(p => !products.includes(p)).map(p => <option key={p}>{p}</option>)}
                  <option value="__autre__">{t.otherProduct}</option>
                </select>
                {addingCustom && (
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <TextInput placeholder={t.productName} value={customProduct} onChange={e => setCustomProduct(e.target.value)} autoFocus
                        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
                      <button type="button" onClick={addCustom} className="shrink-0 bg-[#0d2265] text-white text-sm px-4 cursor-pointer hover:bg-[#091a52] transition-colors">{t.add}</button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="border border-[rgba(13,34,101,0.15)] border-t-0 bg-white divide-y divide-[rgba(13,34,101,0.06)]">
                        {suggestions.map(s => (
                          <button key={s} type="button" onMouseDown={e => { e.preventDefault(); pickSuggestion(s); }}
                            className="w-full text-left px-3.5 py-2 text-sm text-[#0a0a0f] hover:bg-[#eef1f8] cursor-pointer transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {products.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {products.map(p => (
                      <span key={p} className="inline-flex items-center gap-1.5 bg-[#eef1f8] text-[#0d2265] text-xs font-medium pl-2.5 pr-1.5 py-1">
                        {p}
                        <button type="button" onClick={() => removeProduct(p)} className="text-[#0d2265]/60 hover:text-[#C4613A] cursor-pointer" title={t.remove}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <FieldLabel>{t.certs}</FieldLabel>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {CERTS_FOURNISSEUR.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm text-[#0a0a0f] cursor-pointer">
                  <input type="checkbox" className="accent-[#0d2265]" checked={certs.includes(c)} onChange={() => toggleIn(certs, setCerts, c)} />{tr(c)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>{t.photos}</FieldLabel>
            <div className="border border-dashed border-[rgba(13,34,101,0.2)] p-5 text-center">
              <Upload className="w-5 h-5 text-[#64697d] mx-auto mb-1.5" />
              <p className="text-xs text-[#64697d]">{t.photosHint}</p>
            </div>
          </div>
          <RGPD id="rgpd-cand" />
          <FormError error={error} />
          <BtnNavy type="submit" className="w-full justify-center">
            {sending ? tx.common.sendingLong : t.submit} <ArrowRight className="w-4 h-4" />
          </BtnNavy>
        </form>
      </FormCard>
    </ScreenShell>
  );
}

export function CandidatureConfirm({ nav }: { nav: Nav }) {
  const tx = useFormsText();
  return (
    <ScreenShell nav={nav} title={tx.common.confirmation}>
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<CheckCircle className="w-8 h-8 text-[#0d2265]" />}
          title={tx.candidature.received}
          subtitle={tx.candidature.receivedText}
          nav={nav}
        />
      </div>
    </ScreenShell>
  );
}
