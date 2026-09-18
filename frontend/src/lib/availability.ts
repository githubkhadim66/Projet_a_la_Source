/** Fenêtre de disponibilité produit : conversions date ↔ datetime et libellé du badge.
 *  À l'échéance, le produit se retire du site (retrait automatique côté serveur).
 *  Distinct du rappel d'actualisation 14 j (FRS-05).
 */

/** Valeur du champ <input type="date"> ("AAAA-MM-JJ") → datetime ISO fin de journée
 *  (la date choisie est incluse). Chaîne vide → null (aucune limite). */
export function dateToAvailableUntil(date: string): string | null {
  const d = date.trim();
  return d ? `${d}T23:59:59` : null;
}

/** datetime ISO du serveur → valeur pour <input type="date"> ("AAAA-MM-JJ"). */
export function availableUntilToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Nombre de jours calendaires entre aujourd'hui et l'échéance (négatif si passée). */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = startOfDay(end).getTime() - startOfDay(new Date()).getTime();
  return Math.round(diff / 86_400_000);
}

export type AvailabilityTone = "ok" | "warn" | "expired";

export interface AvailabilityBadge {
  label: string;
  tone: AvailabilityTone;
  date: string; // JJ/MM/AAAA
}

/** Badge « se retire dans X j » / « expiré » à afficher sur la fiche produit. */
export function availabilityBadge(iso: string | null): AvailabilityBadge | null {
  const days = daysUntil(iso);
  if (days === null) return null;
  const date = new Date(iso as string).toLocaleDateString("fr-FR");
  if (days < 0) return { label: "Disponibilité expirée", tone: "expired", date };
  if (days === 0) return { label: "Se retire aujourd'hui", tone: "warn", date };
  if (days <= 3) return { label: `Se retire dans ${days} j`, tone: "warn", date };
  return { label: `Dispo jusqu'au ${date}`, tone: "ok", date };
}
