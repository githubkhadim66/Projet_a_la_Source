/** Réservation d'un échange avec l'experte : créneaux réels via l'API. */

import { useEffect, useMemo, useState } from "react";
import { Calendar, Globe } from "lucide-react";
import * as api from "@/lib/api";
import { MOTIFS_RDV } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useFormsText, useOptionLabel } from "@/lib/formsText";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, FormError, SelectInput, TextInput } from "@/app/components/common/fields";
import { Confirm, ScreenShell } from "@/app/components/common/layout";

// 7 prochains jours ouvrés à partir de demain (libellés dans la langue du visiteur)
function nextBusinessDays(locale: string, count = 7): { iso: string; label: string }[] {
  const days: { iso: string; label: string }[] = [];
  const d = new Date();
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return days;
}

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function RDVScreen({ nav }: { nav: Nav }) {
  const lang = useLang();
  const tx = useFormsText();
  const t = tx.rdv;
  const tr = useOptionLabel();
  const days = useMemo(() => nextBusinessDays(lang === "en" ? "en-GB" : "fr-FR"), [lang]);
  const [dur, setDur] = useState<15 | 30>(30);
  const [motif, setMotif] = useState("");
  const [day, setDay] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (day === null) return;
    setLoadingSlots(true);
    api.rdv.slots(days[day].iso)
      .then(res => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [day, days]);

  const book = async () => {
    if (day === null || !slot) return;
    setSending(true);
    setError(null);
    try {
      await api.rdv.book({
        duration_minutes: dur, motif, day: days[day].iso, slot, name, company, email,
        timezone: TIMEZONE, language: lang,
      });
      setDone(true);
    } catch (err) {
      const msg = err instanceof api.ApiError && err.status === 409 ? t.slotTaken : tx.common.genericError;
      setError(msg);
      if (day !== null) api.rdv.slots(days[day].iso).then(res => setSlots(res.slots)).catch(() => {});
    } finally {
      setSending(false);
    }
  };

  if (done) return (
    <ScreenShell nav={nav} title={t.confirmed}>
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<Calendar className="w-8 h-8 text-[#0d2265]" />}
          title={t.confirmed}
          subtitle={t.confirmedText(day !== null ? days[day].label : "", slot ?? "", dur)}
          nav={nav}
        />
      </div>
    </ScreenShell>
  );

  return (
    <ScreenShell nav={nav} title={t.screen}>
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-8 md:p-10 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-[#0a0a0f]">{t.title}</h2>
          <p className="text-sm text-[#64697d] mt-1">{t.subtitle}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0f] mb-3">{t.duration}</p>
          <div className="flex gap-3">
            {([15, 30] as const).map(d => (
              <button key={d} type="button" onClick={() => setDur(d)}
                className={`flex-1 py-3 text-sm font-medium border transition-colors cursor-pointer ${dur === d ? "bg-[#0d2265] text-white border-[#0d2265]" : "border-[rgba(13,34,101,0.18)] text-[#0d2265] hover:border-[#0d2265]"}`}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>{t.motif}</FieldLabel>
          <SelectInput value={motif} onChange={e => setMotif(e.target.value)}>
            <option value="">{t.motifPlaceholder}</option>
            {MOTIFS_RDV.map(m => <option key={m} value={m}>{tr(m)}</option>)}
          </SelectInput>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0f] mb-3">{t.pickDay}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {days.map((d, i) => (
              <button key={d.iso} type="button" onClick={() => { setDay(i); setSlot(null); }}
                className={`py-2.5 px-1 text-xs font-medium border transition-colors cursor-pointer text-center leading-tight ${day === i ? "bg-[#0d2265] text-white border-[#0d2265]" : "border-[rgba(13,34,101,0.18)] text-[#0d2265] hover:border-[#0d2265]"}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {day !== null && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0f] mb-3">{t.slots(days[day].label)}</p>
            {loadingSlots && <p className="text-xs text-[#64697d]">{t.loadingSlots}</p>}
            {!loadingSlots && slots.length === 0 && <p className="text-xs text-[#64697d]">{t.noSlot}</p>}
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map(s => (
                <button key={s} type="button" onClick={() => setSlot(s)}
                  className={`py-2 text-sm border transition-colors cursor-pointer ${slot === s ? "bg-[#0d2265] text-white border-[#0d2265]" : "border-[rgba(13,34,101,0.15)] text-[#0a0a0f] hover:border-[#0d2265]"}`}>
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#64697d] mt-2 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> {t.timezone(TIMEZONE)}
            </p>
          </div>
        )}

        {slot && (
          <div className="space-y-4 pt-2 border-t border-[rgba(13,34,101,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0f]">{t.yourDetails}</p>
            <div className="grid grid-cols-2 gap-4">
              <div><FieldLabel required>{t.name}</FieldLabel><TextInput required placeholder="Marie Dupont" value={name} onChange={e => setName(e.target.value)} /></div>
              <div><FieldLabel required>{t.company}</FieldLabel><TextInput required placeholder={t.companyPlaceholder} value={company} onChange={e => setCompany(e.target.value)} /></div>
            </div>
            <div><FieldLabel required>{t.email}</FieldLabel><TextInput type="email" required placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} /></div>
            <FormError error={error} />
            <BtnNavy className="w-full justify-center" onClick={book}>
              <Calendar className="w-4 h-4" /> {sending ? t.confirming : t.confirm(days[day!].label, slot)}
            </BtnNavy>
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
