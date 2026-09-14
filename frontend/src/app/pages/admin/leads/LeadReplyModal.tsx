/** Fenêtre de réponse par e-mail à un lead : objet + message pré-remplis, éditables, puis envoi. */

import { useState } from "react";
import { Mail, Send, X } from "lucide-react";
import * as api from "@/lib/api";
import type { Lead } from "@/lib/leads";

export function LeadReplyModal({ lead, defaultSubject, defaultBody, onClose, onSent }: {
  lead: Lead;
  defaultSubject: string;
  defaultBody: string;
  onClose: () => void;
  onSent: (info: string) => void;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!subject.trim() || !body.trim()) { setError("Objet et message sont requis."); return; }
    setSending(true); setError(null);
    try {
      const res = await api.admin.replyLead(lead.id, subject, body);
      onSent(res.message);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Échec de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[rgba(13,34,101,0.08)] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#eef1f8] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-[#0d2265]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[#0a0a0f]">Répondre par e-mail</p>
            <p className="text-[11px] text-[#64697d] truncate">à {lead.contact} · {lead.company}</p>
          </div>
          <button onClick={onClose} className="text-[#64697d] hover:text-[#0a0a0f] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Destinataire</label>
            <input value={lead.email} disabled
              className="w-full border border-[rgba(13,34,101,0.15)] bg-[#f4f5f9] text-[#64697d] px-3 py-2 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Objet</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3 py-2 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest mb-1">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
              className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3 py-2 text-sm text-[#0a0a0f] leading-relaxed focus:outline-none focus:border-[#0d2265] resize-y" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-5 py-3.5 border-t border-[rgba(13,34,101,0.08)] flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm text-[#64697d] hover:text-[#0a0a0f] px-4 py-2 cursor-pointer">Annuler</button>
          <button onClick={send} disabled={sending}
            className="bg-[#0d2265] text-white text-sm font-semibold px-4 py-2 cursor-pointer hover:bg-[#091a52] transition-colors flex items-center gap-2 disabled:opacity-60">
            <Send className="w-3.5 h-3.5" /> {sending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
