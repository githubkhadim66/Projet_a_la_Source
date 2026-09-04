/** Retour cohérent : revient à la page précédente réelle (historique du navigateur)
 *  au lieu de sauter en haut de l'accueil. Repli sur `fallback` s'il n'y a pas
 *  d'historique interne (accès direct par lien). */

import type { Nav, Screen } from "./routes";

export function goBack(nav: Nav, fallback: Screen = "landing") {
  if (typeof window !== "undefined" && window.history.length > 1) {
    window.history.back();
  } else {
    nav(fallback);
  }
}
