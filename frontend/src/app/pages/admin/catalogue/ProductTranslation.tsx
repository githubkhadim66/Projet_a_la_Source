/** Version anglaise d'un produit : relecture et correction des traductions automatiques.
 *  Une correction est enregistrée pour ce texte source et servie partout (site, PDF,
 *  suggestions) ; elle n'est jamais écrasée par DeepL. « Revenir à l'automatique »
 *  efface la correction.
 */

import { useEffect, useState } from "react";
import { Check, Languages, Loader2, RotateCcw } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiFieldTranslation } from "@/lib/api";
import { useAdminText } from "@/lib/adminText";

const STATUS_STYLE: Record<ApiFieldTranslation["status"], string> = {
  manual: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  glossary: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  auto: "bg-[#eef1f8] text-[#0d2265] border border-[rgba(13,34,101,0.15)]",
  missing: "bg-amber-50 text-amber-700 border border-amber-200",
};

// Textes longs : zone de saisie sur plusieurs lignes.
const LONG_FIELDS = new Set(["description", "benefits"]);

export function ProductTranslationPanel({ productId, onApiError, onSaved }: {
  productId: number;
  onApiError: (err: unknown) => void;
  onSaved?: () => void;
}) {
  const t = useAdminText().translation;
  const [fields, setFields] = useState<ApiFieldTranslation[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = (data: { fields: ApiFieldTranslation[] }) => {
    setFields(data.fields);
    setDraft(Object.fromEntries(data.fields.map(f => [f.field, f.translated])));
  };

  useEffect(() => {
    setFields(null);
    setMessage(null);
    api.admin.productTranslation(productId).then(load).catch(onApiError);
  }, [productId, onApiError]);

  const changed = (fields ?? []).filter(f => f.editable && (draft[f.field] ?? "").trim() !== f.translated);

  const save = async (updates: Record<string, string | null>, done: string) => {
    setSaving(true);
    try {
      load(await api.admin.updateProductTranslation(productId, updates));
      setMessage(done);
      onSaved?.();
    } catch (err) {
      onApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const saveChanges = () => {
    if (changed.length === 0) { setMessage(t.noChange); return; }
    save(Object.fromEntries(changed.map(f => [f.field, draft[f.field].trim()])), t.saved);
  };

  return (
    <div className="border border-[rgba(13,34,101,0.15)] bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Languages className="w-4 h-4 text-[#0d2265]" />
        <p className="font-semibold text-sm text-[#0a0a0f]">{t.title}</p>
      </div>
      <p className="text-[11px] text-[#64697d] mb-4 leading-relaxed">{t.intro}</p>

      {fields === null ? (
        <p className="text-sm text-[#64697d] flex items-center gap-2 py-4"><Loader2 className="w-4 h-4 animate-spin" /> {t.loading}</p>
      ) : (
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.field} className="grid md:grid-cols-[110px_1fr_1fr] gap-2 md:gap-3 items-start border-t border-[rgba(13,34,101,0.06)] pt-3 first:border-t-0 first:pt-0">
              <div>
                <p className="text-[10px] font-bold text-[#64697d] uppercase tracking-widest">{t.fields[f.field] ?? f.field}</p>
                <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 ${STATUS_STYLE[f.status]}`}>{t.status[f.status]}</span>
              </div>
              <div>
                <p className="text-[9px] text-[#9ca3af] uppercase tracking-widest mb-0.5 md:hidden">{t.french}</p>
                <p className="text-sm text-[#4a4f63] leading-relaxed whitespace-pre-line bg-[#f4f5f9] px-3 py-2">{f.source}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#9ca3af] uppercase tracking-widest mb-0.5 md:hidden">{t.english}</p>
                {f.editable ? (
                  LONG_FIELDS.has(f.field) ? (
                    <textarea rows={3} value={draft[f.field] ?? ""} onChange={e => setDraft(d => ({ ...d, [f.field]: e.target.value }))}
                      className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0d2265] resize-y" />
                  ) : (
                    <input value={draft[f.field] ?? ""} onChange={e => setDraft(d => ({ ...d, [f.field]: e.target.value }))}
                      className="w-full border border-[rgba(13,34,101,0.18)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0d2265]" />
                  )
                ) : (
                  <p className="text-sm text-[#0a0a0f] px-3 py-2">{f.translated}</p>
                )}
                {f.status === "glossary" && <p className="text-[10px] text-[#64697d] mt-1">{t.glossaryHint}</p>}
                {f.status === "missing" && <p className="text-[10px] text-amber-700 mt-1">{t.missingHint}</p>}
                {f.status === "manual" && (
                  <button type="button" onClick={() => save({ [f.field]: null }, t.saved)} disabled={saving}
                    className="mt-1 text-[10px] text-[#64697d] hover:text-[#0d2265] cursor-pointer inline-flex items-center gap-1 disabled:opacity-50">
                    <RotateCcw className="w-3 h-3" /> {t.resetAuto}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {fields !== null && (
        <div className="flex items-center gap-3 mt-4">
          <button type="button" onClick={saveChanges} disabled={saving}
            className="bg-[#0d2265] text-white text-xs font-bold px-4 py-2 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {t.save}
          </button>
          {message && <span className="text-xs text-[#2E6B4F]">{message}</span>}
        </div>
      )}
    </div>
  );
}
