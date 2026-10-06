/** Demandes de catalogue reçues + fenêtre d'envoi présentée comme un message e-mail. */

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Mail, Paperclip, Send, X } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiLead } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { statusBadge } from "@/lib/leads";
import type { LeadStatus } from "@/lib/leads";
import { CATALOGUE_EMAIL, useAdminText } from "@/lib/adminText";
import { useOptionLabel } from "@/lib/formsText";

export function CatalogueRequests({ onApiError }: { onApiError: (err: unknown) => void }) {
  const { requests: t, common } = useAdminText();
  const tr = useOptionLabel();
  const [requests, setRequests] = useState<ApiLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [compose, setCompose] = useState<ApiLead | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.catalogueRequests().then(setRequests).catch(onApiError).finally(() => setLoading(false));
  }, [onApiError]);

  const envoyer = async () => {
    if (!compose) return;
    setSending(true);
    try {
      await api.admin.resendCatalogue(compose.id);
      setCompose(null);
      setBanner(t.resent(compose.email));
      setTimeout(() => setBanner(null), 6000);
    } catch (err) {
      onApiError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {banner && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 mb-5 text-sm text-emerald-800">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {banner}
          <button onClick={() => setBanner(null)} className="ml-auto text-emerald-600 hover:text-emerald-800 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      <p className="text-sm text-[#64697d] mb-4">
        {t.intro}<strong className="text-[#0a0a0f]">{t.introStrong}</strong>{t.introEnd}
      </p>

      <div className="bg-white border border-[rgba(13,34,101,0.1)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(13,34,101,0.08)] bg-[#f4f5f9]">
              {t.headers.map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold text-[#64697d] uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#64697d]">{common.loading}</td></tr>}
            {!loading && requests.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#64697d]">{t.empty}</td></tr>
            )}
            {requests.map(r => (
              <tr key={r.id} className="border-b border-[rgba(13,34,101,0.06)] hover:bg-[#f4f5f9] transition-colors">
                <td className="px-4 py-3 text-[#64697d] text-xs whitespace-nowrap">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-3 font-semibold text-[#0a0a0f]">{r.contact_name}</td>
                <td className="px-4 py-3 text-[#64697d]">{r.company}</td>
                <td className="px-4 py-3 text-[#64697d] text-xs break-all">{r.email}</td>
                <td className="px-4 py-3 text-[#64697d]">{tr(r.country)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 ${statusBadge[r.status as LeadStatus] ?? "bg-gray-100 text-gray-500 border border-gray-200"}`}>{tr(r.status)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.catalogue_downloaded_at ? (
                    <span className="flex items-center gap-1.5 text-xs text-teal-700" title={t.downloads(r.catalogue_download_count)}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {fmtDateTime(r.catalogue_downloaded_at)}
                      {r.catalogue_download_count > 1 && <span className="text-[10px] text-[#64697d]">×{r.catalogue_download_count}</span>}
                    </span>
                  ) : (
                    <span className="text-xs text-[#64697d]/60">{t.notYet}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setCompose(r)}
                    className="flex items-center gap-1.5 border border-[rgba(13,34,101,0.2)] text-[#0d2265] text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-[#eef1f8] transition-colors whitespace-nowrap">
                    <Send className="w-3.5 h-3.5" /> {t.resend}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fenêtre d'envoi · présentée comme un message e-mail (dans la langue du client) */}
      {compose && (() => { const mail = CATALOGUE_EMAIL[compose.language === "en" ? "en" : "fr"]; return (
        <>
          <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => !sending && setCompose(null)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white w-full max-w-lg shadow-2xl pointer-events-auto">
              {/* Barre de titre */}
              <div className="bg-[#0d2265] text-white px-5 py-3.5 flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" />
                <p className="font-semibold text-sm">{t.sendTitle}</p>
                <button onClick={() => !sending && setCompose(null)} className="ml-auto text-white/60 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* En-têtes du message */}
              <div className="px-5 divide-y divide-[rgba(13,34,101,0.07)]">
                {[
                  [t.from, "contact@funtiworld.com"],
                  [t.to, `${compose.contact_name} · ${compose.email}`],
                  [t.subject, mail.subject],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 py-2.5 text-sm">
                    <span className="w-14 shrink-0 text-[#64697d]">{label}</span>
                    <span className="text-[#0a0a0f] break-all">{value}</span>
                  </div>
                ))}
              </div>

              {/* Corps du message */}
              <div className="px-5 py-4">
                <div className="bg-[#f4f5f9] border border-[rgba(13,34,101,0.08)] p-4 text-sm text-[#0a0a0f] leading-relaxed">
                  <p>{mail.hello(compose.contact_name)}</p>
                  <p className="mt-3">{mail.body}</p>
                  <p className="mt-3 text-[#0d2265] underline">{mail.link}</p>
                  <p className="mt-3 text-[#64697d]">{mail.signature}</p>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-[#64697d] mt-3">
                  <Paperclip className="w-3.5 h-3.5" />
                  {t.linkNote}
                </p>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 border-t border-[rgba(13,34,101,0.08)] flex items-center gap-3">
                <button onClick={envoyer} disabled={sending}
                  className="flex items-center gap-2 bg-[#C4613A] text-white text-sm font-semibold px-5 py-2.5 cursor-pointer hover:bg-[#A84E2D] transition-colors disabled:opacity-60">
                  <Send className="w-4 h-4" /> {sending ? common.sendingLong : common.send}
                </button>
                <button onClick={() => setCompose(null)} disabled={sending}
                  className="text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer px-3 py-2.5">
                  {common.cancel}
                </button>
              </div>
            </div>
          </div>
        </>
      ); })()}
    </div>
  );
}
