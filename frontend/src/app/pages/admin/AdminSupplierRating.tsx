/** Évaluation interne d'un fournisseur par l'admin · note 1–5 par critère + commentaire.
 *  Jamais exposée au fournisseur ni au public (REF interne). Moyenne calculée à l'affichage.
 */

import { useEffect, useState } from "react";
import { Check, Star } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiSupplier } from "@/lib/api";
import { RATING_CRITERES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";

export function SupplierRatingCard({ supplier, onSaved, onApiError }: {
  supplier: ApiSupplier;
  onSaved: (s: ApiSupplier) => void;
  onApiError: (err: unknown) => void;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>(supplier.ratings ?? {});
  const [note, setNote] = useState(supplier.rating_note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Réinitialise l'état quand on change de fournisseur sélectionné.
  useEffect(() => {
    setRatings(supplier.ratings ?? {});
    setNote(supplier.rating_note ?? "");
    setSaved(false);
  }, [supplier.id, supplier.ratings, supplier.rating_note]);

  const noted = RATING_CRITERES.map(c => ratings[c.key]).filter((v): v is number => !!v);
  const avg = noted.length ? Math.round((noted.reduce((a, b) => a + b, 0) / noted.length) * 10) / 10 : null;
  const dirty = JSON.stringify(ratings) !== JSON.stringify(supplier.ratings ?? {}) || note !== (supplier.rating_note ?? "");

  const setCriterion = (key: string, value: number) =>
    setRatings(r => (r[key] === value ? (() => { const { [key]: _, ...rest } = r; return rest; })() : { ...r, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.rateSupplier(supplier.id, { ratings, rating_note: note.trim() });
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      onApiError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-3 border-t border-[rgba(13,34,101,0.08)]">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[#64697d] text-sm">Évaluation interne</p>
        {avg !== null && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0d2265]">
            <Star className="w-3.5 h-3.5 fill-[#f5a623] text-[#f5a623]" /> {avg.toFixed(1)}<span className="text-[#64697d] font-medium">/5</span>
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {RATING_CRITERES.map(c => (
          <div key={c.key} className="flex items-center justify-between gap-2">
            <span className="text-xs text-[#0a0a0f]">{c.label}</span>
            <div className="flex items-center gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" title={`${n}/5`} onClick={() => setCriterion(c.key, n)}
                  className="cursor-pointer p-0.5 hover:scale-110 transition-transform">
                  <Star className={`w-4 h-4 ${(ratings[c.key] ?? 0) >= n
                    ? "fill-[#f5a623] text-[#f5a623]" : "text-[#c3c9dd]"}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <textarea value={note} onChange={e => { setNote(e.target.value); setSaved(false); }} rows={2}
        placeholder="Commentaire interne (facultatif)…"
        className="w-full mt-3 border border-[rgba(13,34,101,0.18)] bg-white px-3 py-2 text-xs text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] resize-y" />

      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-[10px] text-[#64697d]">
          {supplier.rated_at ? `Évalué le ${fmtDate(supplier.rated_at)}` : "Non évalué"}
        </span>
        <button onClick={save} disabled={saving || !dirty}
          className="text-xs font-semibold px-3 py-1.5 cursor-pointer transition-colors flex items-center gap-1.5 bg-[#0d2265] text-white hover:bg-[#091a52] disabled:opacity-40 disabled:cursor-default">
          <Check className="w-3.5 h-3.5" /> {saving ? "…" : saved && !dirty ? "Enregistré" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
