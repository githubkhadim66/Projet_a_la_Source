/** Écrans de l'application et correspondance URL ↔ écran. */

export type Screen =
  | "landing"
  | "catalogue" | "catalogue-confirm"
  | "devis" | "devis-confirm"
  | "sourcing" | "sourcing-confirm"
  | "candidature" | "candidature-confirm"
  | "rdv"
  | "login" | "supplier-password" | "supplier-coordonnees"
  | "supplier-products" | "supplier-propose" | "supplier-propose-confirm"
  | "admin-dashboard" | "admin-leads" | "admin-catalogue" | "admin-fournisseurs" | "admin-rdv";

export type Nav = (s: Screen) => void;

export const SCREEN_PATHS: Record<Screen, string> = {
  "landing": "/",
  "catalogue": "/catalogue",
  "catalogue-confirm": "/catalogue/confirmation",
  "devis": "/devis",
  "devis-confirm": "/devis/confirmation",
  "sourcing": "/sourcing",
  "sourcing-confirm": "/sourcing/confirmation",
  "candidature": "/candidature",
  "candidature-confirm": "/candidature/confirmation",
  "rdv": "/rdv",
  "login": "/login",
  "supplier-password": "/fournisseurs/mot-de-passe",
  "supplier-coordonnees": "/fournisseurs/coordonnees",
  "supplier-products": "/fournisseurs/produits",
  "supplier-propose": "/fournisseurs/proposer",
  "supplier-propose-confirm": "/fournisseurs/proposer/confirmation",
  "admin-dashboard": "/admin/dashboard",
  "admin-leads": "/admin/leads",
  "admin-catalogue": "/admin/catalogue",
  "admin-fournisseurs": "/admin/fournisseurs",
  "admin-rdv": "/admin/rdv",
};

const PATH_SCREENS: Record<string, Screen> = {
  ...Object.fromEntries(Object.entries(SCREEN_PATHS).map(([s, p]) => [p, s as Screen])),
  // Anciennes URL de connexion → page de connexion unique
  "/admin": "login",
  "/fournisseurs/connexion": "login",
  // Le catalogue PDF est désormais un onglet de la rubrique Catalogue
  "/admin/catalogue-pdf": "admin-catalogue",
};

export const screenFromPath = (path: string): Screen =>
  PATH_SCREENS[path.replace(/\/+$/, "") || "/"] ?? "landing";
