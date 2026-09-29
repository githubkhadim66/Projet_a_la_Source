/** Téléchargement gated du catalogue : formulaire + écran de confirmation avec lien signé. */

import { useState } from "react";
import { Calendar, CheckCircle, Download } from "lucide-react";
import * as api from "@/lib/api";
import { CALENDLY_URL } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useFormsText } from "@/lib/formsText";
import type { Nav } from "@/lib/routes";
import { BtnNavy, BtnOutlineNavy } from "@/app/components/common/buttons";
import { CountrySelect, FieldLabel, FormError, RGPD, TextInput } from "@/app/components/common/fields";
import { Confirm, FormCard, ScreenShell } from "@/app/components/common/layout";

export function CatalogueForm({ nav, onSuccess }: { nav: Nav; onSuccess: (url: string) => void }) {
  const lang = useLang();
  const tx = useFormsText();
  const t = tx.catalogue;
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
      // La langue part avec la demande : l'e-mail du catalogue est envoyé dans cette langue.
      const res = await api.leads.catalogue({ ...form, rgpd_consent: true, language: lang });
      onSuccess(res.download_url);
      nav("catalogue-confirm");
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
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel required>{t.firstName}</FieldLabel><TextInput placeholder="Marie" required value={form.first_name} onChange={set("first_name")} /></div>
            <div><FieldLabel required>{t.lastName}</FieldLabel><TextInput placeholder="Dupont" required value={form.last_name} onChange={set("last_name")} /></div>
          </div>
          <div><FieldLabel required>{t.company}</FieldLabel><TextInput placeholder={t.companyPlaceholder} required value={form.company} onChange={set("company")} /></div>
          <div><FieldLabel required>{t.email}</FieldLabel><TextInput type="email" placeholder={t.emailPlaceholder} required value={form.email} onChange={set("email")} /></div>
          <div className="grid grid-cols-2 gap-4">
            <CountrySelect label={t.country} required value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
            <div><FieldLabel>{t.role}</FieldLabel><TextInput placeholder={t.rolePlaceholder} value={form.role} onChange={set("role")} /></div>
          </div>
          <div><FieldLabel>{t.phone}</FieldLabel><TextInput type="tel" placeholder="+33 6 00 00 00 00" value={form.phone} onChange={set("phone")} /></div>
          <RGPD />
          <FormError error={error} />
          <BtnNavy type="submit" className="w-full justify-center">
            <Download className="w-4 h-4" /> {sending ? tx.common.sendingLong : t.submit}
          </BtnNavy>
        </form>
      </FormCard>
    </ScreenShell>
  );
}

export function CatalogueConfirm({ nav, downloadUrl }: { nav: Nav; downloadUrl: string | null }) {
  const lang = useLang();
  const tx = useFormsText();
  const t = tx.catalogue;
  // Le catalogue existe en français et en anglais : la langue du visiteur est proposée d'abord.
  const other = lang === "fr" ? "en" : "fr";
  const open = (l: "fr" | "en") => downloadUrl && window.open(`${downloadUrl}&lang=${l}`, "_blank");
  return (
    <ScreenShell nav={nav} title={tx.common.confirmation}>
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10">
        <Confirm
          icon={<CheckCircle className="w-8 h-8 text-[#0d2265]" />}
          title={t.thanks}
          subtitle={t.onItsWay}
          nav={nav}
        >
          <div className="space-y-4">
            <BtnNavy className="mx-auto" onClick={() => open(lang)}>
              <Download className="w-4 h-4" /> {t.downloadIn[lang]}
            </BtnNavy>
            <button type="button" onClick={() => open(other)}
              className="mx-auto flex items-center gap-1.5 text-sm text-[#0d2265] hover:text-[#C4613A] underline cursor-pointer">
              <Download className="w-3.5 h-3.5" /> {t.downloadIn[other]}
            </button>
            <div className="pt-4 border-t border-[rgba(13,34,101,0.08)]">
              <p className="text-sm text-[#64697d] mb-3">{t.immediate}</p>
              <BtnOutlineNavy onClick={() => window.open(CALENDLY_URL, '_blank')} className="mx-auto">
                <Calendar className="w-4 h-4" /> {t.book30}
              </BtnOutlineNavy>
            </div>
          </div>
        </Confirm>
      </div>
    </ScreenShell>
  );
}
