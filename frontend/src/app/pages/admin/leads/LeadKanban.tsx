/** Vue pipeline (Kanban) des leads : colonnes par statut, glisser-déposer pour faire avancer.
 *  Glisser-déposer natif HTML5 (aucune dépendance). Le drop appelle onMove(id, statut).
 */

import { useRef, useState } from "react";
import { alertPill, leadAlert, statusBadge } from "@/lib/leads";
import type { Lead, LeadStatus } from "@/lib/leads";

export function LeadKanban({ leads, statuses, selectedId, onSelect, onMove }: {
  leads: Lead[];
  statuses: LeadStatus[];
  selectedId?: number;
  onSelect: (l: Lead) => void;
  onMove: (id: number, status: LeadStatus) => void;
}) {
  // Ref (et non state) pour l'id glissé : le handler onDrop lit toujours la valeur à jour.
  const dragId = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);
  const endDrag = () => { dragId.current = null; setDraggingId(null); setOverCol(null); };

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
      {statuses.map(col => {
        const items = leads.filter(l => l.status === col);
        const isOver = overCol === col;
        return (
          <div key={col}
            onDragOver={e => { e.preventDefault(); if (overCol !== col) setOverCol(col); }}
            onDragLeave={() => setOverCol(c => (c === col ? null : c))}
            onDrop={e => { e.preventDefault(); if (dragId.current != null) onMove(dragId.current, col); endDrag(); }}
            className={`bg-[#f4f5f9] rounded-lg flex flex-col min-h-[220px] border transition-all ${isOver ? "border-[#0d2265]/40 ring-2 ring-[#0d2265]/15 bg-[#eef1f8]" : "border-[rgba(13,34,101,0.06)]"}`}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(13,34,101,0.06)]">
              <span className={`text-xs font-semibold px-2.5 py-1 ${statusBadge[col]}`}>{col}</span>
              <span className="min-w-[24px] h-6 px-1.5 rounded-full bg-white border border-[rgba(13,34,101,0.1)] text-xs font-bold text-[#64697d] flex items-center justify-center">{items.length}</span>
            </div>
            <div className="p-3 space-y-2.5 flex-1">
              {items.map(l => {
                const a = leadAlert(l);
                return (
                  <div key={l.id} draggable
                    onDragStart={() => { dragId.current = l.id; setDraggingId(l.id); }}
                    onDragEnd={endDrag}
                    onClick={() => onSelect(l)}
                    className={`bg-white border p-3.5 rounded cursor-pointer transition-all shadow-[0_1px_2px_rgba(13,34,101,0.04)] hover:shadow-[0_6px_20px_-8px_rgba(13,34,101,0.35)] ${
                      selectedId === l.id ? "border-[#0d2265]/50 ring-1 ring-[#0d2265]/20" : "border-[rgba(13,34,101,0.1)] hover:border-[#0d2265]/30"
                    } ${draggingId === l.id ? "opacity-40" : ""}`}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className="w-7 h-7 bg-[#eef1f8] flex items-center justify-center shrink-0">
                        <span className="text-[#0d2265] font-bold text-[10px]">{l.company.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <p className="font-semibold text-[#0a0a0f] text-sm leading-tight flex-1 min-w-0 break-words">{l.company}</p>
                      {a && <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 leading-none ${alertPill(a.kind)}`}>{a.label}</span>}
                    </div>
                    {l.product && <p className="text-xs text-[#4a4f63] leading-snug break-words">{l.product}</p>}
                    <p className="text-[11px] text-[#9ca3af] mt-1.5">{l.country} · {l.date}</p>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="h-full min-h-[100px] flex items-center justify-center border border-dashed border-[rgba(13,34,101,0.15)] rounded text-xs text-[#9ca3af] select-none">
                  Déposer ici
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
