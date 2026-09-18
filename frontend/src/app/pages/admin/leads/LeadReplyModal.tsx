/** Fenêtre de réponse par e-mail à un lead : objet + message pré-remplis, éditables, puis envoi. */

import { useRef, useState } from "react";
import { Mail, Paperclip, Send, X } from "lucide-react";
import * as api from "@/lib/api";
import type { Lead } from "@/lib/leads";

const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15 Mo cumulés

const humanSize = (n: number) => n < 1024 ? `${n} o` : n < 1_048_576 ? `${(n / 1024).toFixed(0)} Ko` : `${(n / 1_048_576).toFixed(1)} Mo`;

export function LeadReplyModal({ lead, defaultSubject, defaultBody, onClose, onSent }: {
  lead: Lead;
  defaultSubject: string;
  defaultBody: string;
  onClose: () => void;
  onSent: (info: string) => void;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const incoming = [...list];
    // On évite les doublons (même nom + taille) et on plafonne la taille cumulée.
    const merged = [...files];
    for (const f of incoming) {
      if (!merged.some(x => x.name === f.name && x.size === f.size)) merged.push(f);
    }
    if (merged.reduce((a, f) => a + f.size, 0) > MAX_TOTAL_BYTES) {
      setError("Pièces jointes trop volumineuses (15 Mo maximum au total).");
      return;
    }
    setFiles(merged);
  };
  const removeFile = (i: number) => setFiles(fs => fs.filter((_, idx) => idx !== i));

  const send = async () => {
    if (!subject.trim() || !body.trim()) { setError("Objet et message sont requis."); return; }
    setSending(true); setError(null);
    try {
      const res = await api.admin.replyLead(lead.id, subject, body, files);
      onSent(res.message);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Échec de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={9}
              className="w-full border border-[rgba(13,34,101,0.18)] bg-white px-3 py-2 text-sm text-[#0a0a0f] leading-relaxed focus:outline-none focus:border-[#0d2265] resize-y" />
          </div>

          {/* Pièces jointes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-[#64697d] uppercase tracking-widest">Pièces jointes</label>
              {files.length > 0 && <span className="text-[10px] text-[#64697d]">{files.length} fichier{files.length > 1 ? "s" : ""} · {humanSize(totalSize)}</span>}
            </div>
            <input ref={fileInput} type="file" multiple className="hidden"
              onChange={e => { addFiles(e.target.files); if (fileInput.current) fileInput.current.value = ""; }} />
            <button type="button" onClick={() => fileInput.current?.click()}
              className="flex items-center gap-1.5 border border-dashed border-[rgba(13,34,101,0.3)] text-[#0d2265] text-xs font-semibold px-3 py-2 cursor-pointer hover:bg-[#f4f5f9] transition-colors w-full justify-center">
              <Paperclip className="w-3.5 h-3.5" /> Joindre un fichier (devis, fiche technique…)
            </button>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 bg-[#f4f5f9] border border-[rgba(13,34,101,0.1)] px-2.5 py-1.5">
                    <Paperclip className="w-3 h-3 text-[#64697d] shrink-0" />
                    <span className="text-xs text-[#0a0a0f] truncate flex-1 min-w-0">{f.name}</span>
                    <span className="text-[10px] text-[#64697d] shrink-0">{humanSize(f.size)}</span>
                    <button type="button" onClick={() => removeFile(i)} title="Retirer"
                      className="text-[#64697d] hover:text-red-600 cursor-pointer shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-[#64697d] mt-1.5">15 Mo maximum au total.</p>
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
