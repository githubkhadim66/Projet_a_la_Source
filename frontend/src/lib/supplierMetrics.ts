/** Indicateurs de l'espace fournisseur, calculés côté client à partir de `me()` et `myProducts()`.
 *  - Fraîcheur des stocks (FRS-05) : une référence non actualisée depuis 14 jours est signalée.
 *  - Complétude du dossier : part des informations de profil renseignées.
 */

import type { ApiProduct, ApiSupplier } from "@/lib/api";
import { EMBALLAGE_PLURIEL } from "@/lib/constants";
import { optionLabelEn } from "@/lib/formsText";
import type { Lang } from "@/lib/i18n";
import { SUPPLIER_TEXT } from "@/lib/supplierText";

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

const packagePlural = (type: string, lang: Lang) => {
  const fr = EMBALLAGE_PLURIEL[type] || `${type.toLowerCase()}s`;
  return lang === "en" ? optionLabelEn(fr) : fr;
};

/** Équivalent d'une quantité en nombre de colis, ex. 800 L → « 40 bidons » (null si non calculable). */
export const packagesFor = (packaging: string, baseUnit: "kg" | "L", quantity: number, lang: Lang = "fr"): string | null => {
  const info = parsePackagingLabel(packaging);
  if (!info || info.unit !== baseUnit || info.size <= 0 || quantity <= 0) return null;
  const n = quantity / info.size;
  const rounded = Math.round(n);
  if (rounded < 1) return null;
  const prefix = Number.isInteger(n) ? "" : "≈ ";
  return `${prefix}${rounded.toLocaleString(lang === "en" ? "en-GB" : "fr-FR")} ${packagePlural(info.type, lang)}`;
};

/** Équivalent en colis du stock d'un produit (ex. « 40 bidons »). */
export const stockInPackages = (p: Pick<ApiProduct, "moq" | "packaging" | "stock_kg">, lang: Lang = "fr"): string | null =>
  packagesFor(p.packaging, baseUnitOf(p), p.stock_kg, lang);

export const staleProducts = (products: ApiProduct[]): ApiProduct[] => products.filter(isStale);

export const ruptureProducts = (products: ApiProduct[]): ApiProduct[] =>
  products.filter(p => p.status === "Rupture");

/** Produits physiquement disponibles (statut « En stock »). */
export const inStockProducts = (products: ApiProduct[]): ApiProduct[] =>
  products.filter(p => p.status === "En stock");

/** Taux de détention = articles en stock / total d'articles référencés (en %, null si aucun produit). */
export const detentionRate = (products: ApiProduct[]): number | null =>
  products.length ? Math.round((inStockProducts(products).length / products.length) * 100) : null;

export interface DossierField { key: string; label: string; done: boolean }

/** Champs pris en compte dans la complétude du dossier fournisseur. */
export const dossierFields = (me: ApiSupplier | null, productsCount: number, lang: Lang = "fr"): DossierField[] => {
  const t = SUPPLIER_TEXT[lang].dossier;
  return [
    { key: "name",         label: t.name,     done: !!me?.name?.trim() },
    { key: "contact_name", label: t.contact,  done: !!me?.contact_name?.trim() },
    { key: "phone",        label: t.phone,    done: !!me?.phone?.trim() },
    { key: "country",      label: t.country,  done: !!me?.country?.trim() },
    { key: "city",         label: t.city,     done: !!me?.city?.trim() },
    { key: "products",     label: t.products, done: productsCount > 0 },
  ];
};

export interface DossierCompleteness {
  fields: DossierField[];
  done: number;
  total: number;
  pct: number;
}

export const dossierCompleteness = (me: ApiSupplier | null, productsCount: number, lang: Lang = "fr"): DossierCompleteness => {
  const fields = dossierFields(me, productsCount, lang);
  const done = fields.filter(f => f.done).length;
  return { fields, done, total: fields.length, pct: Math.round((done / fields.length) * 100) };
};
