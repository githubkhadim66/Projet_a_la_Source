/** Routeur de l'application : synchronise l'URL avec l'écran affiché.
 *
 * Chaque écran vit dans `pages/` :
 *   - pages/landing     → page d'accueil (sections de la maquette)
 *   - pages/forms       → catalogue, devis, sourcing, candidature, RDV
 *   - pages/auth        → connexion unique (admin + fournisseur)
 *   - pages/supplier    → espace fournisseur (produits, proposition, mot de passe)
 *   - pages/admin       → back-office (dashboard, leads, catalogue, fournisseurs)
 */

import { useCallback, useEffect, useState } from "react";
import { SCREEN_PATHS, screenFromPath } from "@/lib/routes";
import type { Nav, Screen } from "@/lib/routes";
import { LandingPage } from "./pages/landing/LandingPage";
import { CatalogueConfirm, CatalogueForm } from "./pages/forms/CataloguePage";
import { DevisForm, FormConfirm } from "./pages/forms/DevisPage";
import { ProductPage } from "./pages/forms/ProductPage";
import { SourcingForm } from "./pages/forms/SourcingPage";
import { CandidatureConfirm, CandidatureForm } from "./pages/forms/CandidaturePage";
import { RDVScreen } from "./pages/forms/RdvPage";
import { Login } from "./pages/auth/LoginPage";
import { SupplierChangePassword } from "./pages/supplier/SupplierPasswordPage";
import { SupplierCoordonnees } from "./pages/supplier/SupplierCoordonneesPage";
import { SupplierProducts } from "./pages/supplier/SupplierProductsPage";
import { SupplierPropose, SupplierProposeConfirm } from "./pages/supplier/SupplierProposePage";
import { AdminDashboard } from "./pages/admin/AdminDashboardPage";
import { AdminLeads } from "./pages/admin/AdminLeadsPage";
import { AdminCatalogue } from "./pages/admin/AdminCataloguePage";
import { AdminFournisseurs } from "./pages/admin/AdminSuppliersPage";
import { AdminRdv } from "./pages/admin/AdminRdvPage";

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => screenFromPath(window.location.pathname));
  const [catalogueUrl, setCatalogueUrl] = useState<string | null>(null);

  // Boutons précédent/suivant du navigateur
  useEffect(() => {
    const onPop = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const nav: Nav = useCallback((s) => {
    setScreen(s);
    const path = SCREEN_PATHS[s];
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
    window.scrollTo(0, 0);
  }, []);

  switch (screen) {
    case "produit": return <ProductPage nav={nav} />;
    case "catalogue": return <CatalogueForm nav={nav} onSuccess={setCatalogueUrl} />;
    case "catalogue-confirm": return <CatalogueConfirm nav={nav} downloadUrl={catalogueUrl} />;
    case "devis": return <DevisForm nav={nav} />;
    case "devis-confirm": return <FormConfirm nav={nav} type="devis" />;
    case "sourcing": return <SourcingForm nav={nav} />;
    case "sourcing-confirm": return <FormConfirm nav={nav} type="sourcing" />;
    case "candidature": return <CandidatureForm nav={nav} />;
    case "candidature-confirm": return <CandidatureConfirm nav={nav} />;
    case "rdv": return <RDVScreen nav={nav} />;
    case "login": return <Login nav={nav} />;
    case "supplier-password": return <SupplierChangePassword nav={nav} />;
    case "supplier-coordonnees": return <SupplierCoordonnees nav={nav} />;
    case "supplier-products": return <SupplierProducts nav={nav} />;
    case "supplier-propose": return <SupplierPropose nav={nav} />;
    case "supplier-propose-confirm": return <SupplierProposeConfirm nav={nav} />;
    case "admin-dashboard": return <AdminDashboard nav={nav} />;
    case "admin-leads": return <AdminLeads nav={nav} />;
    case "admin-catalogue": return <AdminCatalogue nav={nav} />;
    case "admin-fournisseurs": return <AdminFournisseurs nav={nav} />;
    case "admin-rdv": return <AdminRdv nav={nav} />;
    default: return <LandingPage nav={nav} />;
  }
}
