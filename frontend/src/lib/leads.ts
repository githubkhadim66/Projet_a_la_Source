/** Types et mapping des leads (API → modèle d'affichage du back-office). */

import type { ApiLead } from "./api";
import { fmtDateTime } from "./format";

export type StockStatus = "En stock" | "Sur commande" | "Rupture";
export type LeadStatus = "Nouveau" | "En cours" | "Traité" | "Clos" | "Téléchargé" | "Référencé" | "Devis envoyé" | "Gagné" | "Perdu";
export type LeadTab = "catalogue" | "devis" | "sourcing" | "candidatures";

export interface Lead {
  id: number; date: string; company: string; contact: string; country: string;
  status: LeadStatus; product?: string; email: string; phone?: string | null;
  payload?: Record<string, unknown>;
}

export const statusBadge: Record<LeadStatus, string> = {
  "Nouveau": "bg-blue-50 text-blue-700 border border-blue-200",
  "En cours": "bg-amber-50 text-amber-700 border border-amber-200",
  "Traité": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Clos": "bg-gray-100 text-gray-500 border border-gray-200",
  "Téléchargé": "bg-teal-50 text-teal-700 border border-teal-200",
  "Référencé": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Devis envoyé": "bg-purple-50 text-purple-700 border border-purple-200",
  "Gagné": "bg-emerald-100 text-emerald-800 border border-emerald-300",
  "Perdu": "bg-red-50 text-red-600 border border-red-200",
};

export const STATUSES_FOR: Record<LeadTab, LeadStatus[]> = {
  catalogue: ["Nouveau","Téléchargé","En cours","Traité","Clos"],
  devis: ["Nouveau","En cours","Devis envoyé","Gagné","Perdu","Clos"],
  sourcing: ["Nouveau","En cours","Traité","Clos"],
  candidatures: ["Nouveau","En cours","Référencé","Traité","Clos"],
};

export const TAB_LABELS: Record<LeadTab, string> = {
  catalogue: "Catalogue", devis: "Devis", sourcing: "Sourcing", candidatures: "Candidatures fournisseurs",
};

export const TAB_FOR_QUEUE: Record<string, LeadTab> = {
  catalogue: "catalogue", devis: "devis", sourcing: "sourcing", candidature: "candidatures",
};

function leadSummary(l: ApiLead): string | undefined {
  const p = l.payload as Record<string, unknown>;
  if (l.queue === "devis" && Array.isArray(p.products)) return (p.products as string[]).join(", ");
  if (l.queue === "sourcing" && typeof p.product === "string") return p.product;
  if (l.queue === "candidature" && Array.isArray(p.product_types)) return (p.product_types as string[]).join(", ");
  return undefined;
}

export function toUiLead(l: ApiLead): Lead {
  return {
    id: l.id,
    date: fmtDateTime(l.created_at),
    company: l.company,
    contact: l.contact_name,
    country: l.country,
    status: l.status as LeadStatus,
    product: leadSummary(l),
    email: l.email,
    phone: l.phone,
    payload: l.payload,
  };
}
