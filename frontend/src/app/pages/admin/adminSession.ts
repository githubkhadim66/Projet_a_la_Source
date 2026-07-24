/** Session et données transverses du back-office (garde, déconnexion, notifications). */

import { useCallback, useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { ApiAdminProduct, ApiProposal } from "@/lib/api";
import { toUiLead } from "@/lib/leads";
import type { Lead } from "@/lib/leads";
import type { Nav } from "@/lib/routes";

export const adminLogout = (nav: Nav) => {
  api.setAdminToken(null);
  localStorage.removeItem("als-admin-email");
  nav("login");
};

/** Redirige vers /login si aucun jeton, et déconnecte sur 401. */
export function useAdminGuard(nav: Nav) {
  useEffect(() => {
    if (!api.getAdminToken()) nav("login");
  }, [nav]);
  return useCallback((err: unknown) => {
    if (err instanceof api.ApiError && err.status === 401) adminLogout(nav);
  }, [nav]);
}

const NOTIFS_READ_KEY = "als-notifs-read";

/** Notifications du back-office (nouveaux leads, propositions, alertes stock).
 *
 *  « Marquer tout comme lu » enregistre la signature des notifications courantes ;
 *  tant qu'aucun élément nouveau n'arrive, elles restent masquées. Un nouveau lead,
 *  une nouvelle proposition ou une nouvelle alerte réaffiche la cloche.
 */
export function useAdminNotifications() {
  const [newLeads, setNewLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [stockAlerts, setStockAlerts] = useState<ApiAdminProduct[]>([]);
  const [readSignature, setReadSignature] = useState<string>(() => localStorage.getItem(NOTIFS_READ_KEY) ?? "");

  useEffect(() => {
    if (!api.getAdminToken()) return;
    api.admin.leads({ lead_status: "Nouveau" }).then(ls => setNewLeads(ls.map(toUiLead))).catch(() => {});
    api.admin.proposals(true).then(setProposals).catch(() => {});
    api.admin.products().then(ps => setStockAlerts(ps.filter(p => p.status === "Rupture" || p.stale))).catch(() => {});
  }, []);

  // Empreinte stable de l'état courant des notifications
  const signature = [
    "l:" + newLeads.map(l => l.id).sort().join(","),
    "p:" + proposals.map(p => p.id).sort().join(","),
    "s:" + stockAlerts.map(s => s.id).sort().join(","),
  ].join("|");

  const allRead = signature === readSignature;

  const markAllRead = useCallback(() => {
    localStorage.setItem(NOTIFS_READ_KEY, signature);
    setReadSignature(signature);
  }, [signature]);

  return { newLeads, proposals, stockAlerts, allRead, markAllRead };
}
