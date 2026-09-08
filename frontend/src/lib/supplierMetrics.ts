/** Indicateurs de l'espace fournisseur, calculés côté client à partir de `me()` et `myProducts()`.
 *  - Fraîcheur des stocks (FRS-05) : une référence non actualisée depuis 14 jours est signalée.
 *  - Complétude du dossier : part des informations de profil renseignées.
 */

import type { ApiProduct, ApiSupplier } from "@/lib/api";
import { EMBALLAGE_PLURIEL } from "@/lib/constants";

/** Seuil FRS-05 : au delà, le stock est considéré comme non actualisé. */
export const STALE_DAYS = 14;

/** Nombre de jours entiers écoulés depuis une date ISO (0 si date invalide). */
export const daysSince = (iso: string): number => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((Date.now() - then) / 86_400_000);
};

export const isStale = (p: ApiProduct): boolean => daysSince(p.updated_at) >= STALE_DAYS;

/** Unité de base d'un produit (kg ou L), déduite de son conditionnement / MOQ.
 *  Sert à afficher le stock dans la même unité que celle choisie à la proposition
 *  (ex. huile en litres), au lieu d'un « kg » figé. */
export const baseUnitOf = (p: Pick<ApiProduct, "moq" | "packaging">): "kg" | "L" =>
  /\bL\b/.test(`${p.moq} ${p.packaging}`) ? "L" : "kg";

/** Extrait le format du conditionnement, ex. « Bidon de 20 L » → { type:"Bidon", size:20, unit:"L" }. */
export const parsePackagingLabel = (packaging: string): { type: string; size: number; unit: "kg" | "L" } | null => {
  const m = /^(.+?)\s+de\s+([\d.,]+)\s*(kg|l)\b/i.exec((packaging || "").trim());
  if (!m) return null;
  const size = parseFloat(m[2].replace(",", "."));
  if (!size || Number.isNaN(size)) return null;
  return { type: m[1].trim(), size, unit: m[3].toLowerCase() === "l" ? "L" : "kg" };
};

const packagePlural = (type: string) => EMBALLAGE_PLURIEL[type] || `${type.toLowerCase()}s`;

/** Équivalent d'une quantité en nombre de colis, ex. 800 L → « 40 bidons » (null si non calculable). */
export const packagesFor = (packaging: string, baseUnit: "kg" | "L", quantity: number): string | null => {
  const info = parsePackagingLabel(packaging);
  if (!info || info.unit !== baseUnit || info.size <= 0 || quantity <= 0) return null;
  const n = quantity / info.size;
  const rounded = Math.round(n);
  if (rounded < 1) return null;
  const prefix = Number.isInteger(n) ? "" : "≈ ";
  return `${prefix}${rounded.toLocaleString("fr-FR")} ${packagePlural(info.type)}`;
};

/** Équivalent en colis du stock d'un produit (ex. « 40 bidons »). */
export const stockInPackages = (p: Pick<ApiProduct, "moq" | "packaging" | "stock_kg">): string | null =>
  packagesFor(p.packaging, baseUnitOf(p), p.stock_kg);

export const staleProducts = (products: ApiProduct[]): ApiProduct[] => products.filter(isStale);

export const ruptureProducts = (products: ApiProduct[]): ApiProduct[] =>
  products.filter(p => p.status === "Rupture");

export interface DossierField { key: string; label: string; done: boolean }

/** Champs pris en compte dans la complétude du dossier fournisseur. */
export const dossierFields = (me: ApiSupplier | null, productsCount: number): DossierField[] => [
  { key: "name",         label: "Nom de la société",           done: !!me?.name?.trim() },
  { key: "contact_name", label: "Nom du contact",              done: !!me?.contact_name?.trim() },
  { key: "phone",        label: "Téléphone",                   done: !!me?.phone?.trim() },
  { key: "country",      label: "Pays",                        done: !!me?.country?.trim() },
  { key: "city",         label: "Ville",                       done: !!me?.city?.trim() },
  { key: "products",     label: "Au moins un produit référencé", done: productsCount > 0 },
];

export interface DossierCompleteness {
  fields: DossierField[];
  done: number;
  total: number;
  pct: number;
}

export const dossierCompleteness = (me: ApiSupplier | null, productsCount: number): DossierCompleteness => {
  const fields = dossierFields(me, productsCount);
  const done = fields.filter(f => f.done).length;
  return { fields, done, total: fields.length, pct: Math.round((done / fields.length) * 100) };
};
