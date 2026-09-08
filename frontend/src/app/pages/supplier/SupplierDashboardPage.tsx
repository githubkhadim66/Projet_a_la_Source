/** Tableau de bord fournisseur : prochaine action, indicateurs clés, alerte fraîcheur
 *  des stocks (FRS-05) et complétude du dossier. Tout est calculé à partir de
 *  `me()` et `myProducts()` · aucune donnée client ni prix n'y figure (cloison FRS-04).
 */

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Package, PackageX, PlusCircle, RefreshCw } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiProduct, ApiSupplier } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { daysSince, dossierCompleteness, ruptureProducts, STALE_DAYS, staleProducts } from "@/lib/supplierMetrics";
import type { Nav } from "@/lib/routes";
import { KpiCard, SupplierShell } from "./SupplierShell";

export function SupplierDashboard({ nav }: { nav: Nav }) {
  const [me, setMe] = useState<ApiSupplier | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => { api.setSupplierToken(null); nav("login"); }, [nav]);

  useEffect(() => {
    if (!api.getSupplierToken()) { nav("login"); return; }
    Promise.all([api.supplier.me(), api.supplier.myProducts()])
      .then(([profile, prods]) => { setMe(profile); setProducts(prods); })
      .catch(err => { if (err instanceof api.ApiError && err.status === 401) logout(); })
      .finally(() => setLoading(false));
  }, [nav, logout]);

  const stale = staleProducts(products);
  const rupture = ruptureProducts(products);
  const dossier = dossierCompleteness(me, products.length);
  const firstName = (me?.contact_name || me?.name || "").split(/\s+/)[0] || "";

  // Prochaine action prioritaire : premier motif applicable.
  const nextAction = (() => {
    if (!loading && products.length === 0)
      return { icon: PlusCircle, tone: "navy" as const, title: "Référencez votre premier produit",
        body: "Proposez une première fiche · notre équipe la validera avant publication.",
        cta: "Proposer un produit", go: () => nav("supplier-propose") };
    if (stale.length > 0)
      return { icon: RefreshCw, tone: "orange" as const, title: `Actualisez ${stale.length} référence${stale.length > 1 ? "s" : ""}`,
        body: `${stale.length > 1 ? "Elles n'ont" : "Elle n'a"} pas été mise${stale.length > 1 ? "s" : ""} à jour depuis plus de ${STALE_DAYS} jours. Confirmez le stock pour rester visible auprès des acheteurs.`,
        cta: "Mettre à jour mes stocks", go: () => nav("supplier-products") };
    if (rupture.length > 0)
      return { icon: PackageX, tone: "red" as const, title: `${rupture.length} référence${rupture.length > 1 ? "s" : ""} en rupture`,
        body: "Réapprovisionnez au plus vite, puis mettez à jour la disponibilité dès que le produit est de nouveau en stock.",
        cta: "Voir mes produits", go: () => nav("supplier-products") };
    if (dossier.pct < 100)
      return { icon: ClipboardList, tone: "navy" as const, title: `Complétez votre dossier (${dossier.pct} %)`,
        body: "Un dossier complet inspire confiance et accélère la mise en relation.",
        cta: "Compléter mon dossier", go: () => nav("supplier-coordonnees") };
    return { icon: CheckCircle2, tone: "green" as const, title: "Tout est à jour",
      body: "Vos stocks sont actualisés et votre dossier est complet. Merci !",
      cta: "Voir mes produits", go: () => nav("supplier-products") };
  })();

  const TONE: Record<string, { bg: string; bd: string; ic: string; btn: string }> = {
    navy:   { bg: "bg-[#eef1f8]", bd: "border-[rgba(13,34,101,0.18)]", ic: "#0d2265", btn: "bg-[#0d2265] hover:bg-[#091a52]" },
    orange: { bg: "bg-[#fbede3]", bd: "border-[rgba(196,97,58,0.35)]",  ic: "#C4613A", btn: "bg-[#C4613A] hover:bg-[#a84e2d]" },
    red:    { bg: "bg-red-50",    bd: "border-red-200",                 ic: "#dc2626", btn: "bg-[#0d2265] hover:bg-[#091a52]" },
    green:  { bg: "bg-emerald-50", bd: "border-emerald-200",            ic: "#2E6B4F", btn: "bg-[#2E6B4F] hover:bg-[#245640]" },
  };
  const t = TONE[nextAction.tone];
  const NextIcon = nextAction.icon;

  return (
    <SupplierShell nav={nav} active="dashboard" staleCount={stale.length}>
      <div className="max-w-5xl">
        <h1 className="text-xl font-bold text-[#0a0a0f]">Bonjour{firstName ? ` ${firstName}` : ""}</h1>
        <p className="text-sm text-[#64697d] mt-0.5 mb-6">Voici l'état de votre espace fournisseur.</p>

        {/* Prochaine action */}
        <div className={`border ${t.bd} ${t.bg} p-5 flex items-start gap-4 mb-6`}>
          <div className="w-11 h-11 bg-white/70 flex items-center justify-center shrink-0 rounded">
            <NextIcon className="w-5 h-5" style={{ color: t.ic }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64697d] mb-1">Prochaine action</p>
            <p className="text-base font-bold text-[#0a0a0f]">{nextAction.title}</p>
            <p className="text-sm text-[#4a4f63] mt-1 leading-relaxed">{nextAction.body}</p>
          </div>
          <button onClick={nextAction.go}
            className={`shrink-0 self-center ${t.btn} text-white text-xs font-bold px-4 py-2.5 cursor-pointer transition-colors flex items-center gap-1.5`}>
            {nextAction.cta} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicateurs clés */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Références actives" value={loading ? "…" : products.length} icon={Package}
            onClick={() => nav("supplier-products")} />
          <KpiCard label={`À actualiser (+${STALE_DAYS} j)`} value={loading ? "…" : stale.length}
            color={stale.length > 0 ? "#C4613A" : "#2E6B4F"} icon={RefreshCw}
            sub={stale.length === 0 && !loading ? "Stocks à jour" : undefined}
            onClick={() => nav("supplier-products")} />
          <KpiCard label="En rupture" value={loading ? "…" : rupture.length}
            color={rupture.length > 0 ? "#dc2626" : "#2E6B4F"} icon={PackageX}
            onClick={() => nav("supplier-products")} />
          <KpiCard label="Complétude du dossier" value={loading ? "…" : `${dossier.pct} %`}
            color={dossier.pct === 100 ? "#2E6B4F" : "#0d2265"} icon={ClipboardList}
            onClick={() => nav("supplier-coordonnees")} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Alerte fraîcheur des stocks (FRS-05) */}
          <div className="bg-white border border-[rgba(13,34,101,0.08)]">
            <div className="px-5 py-3.5 border-b border-[rgba(13,34,101,0.07)] flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${stale.length > 0 ? "text-[#C4613A]" : "text-[#64697d]"}`} />
              <p className="text-sm font-semibold text-[#0a0a0f]">Stocks non actualisés</p>
              {stale.length > 0 && <span className="ml-auto text-[10px] bg-[#C4613A] text-white font-bold px-1.5 py-0.5">{stale.length}</span>}
            </div>
            <div className="p-2">
              {loading && <p className="text-sm text-[#64697d] p-4 text-center">Chargement…</p>}
              {!loading && stale.length === 0 && (
                <p className="text-sm text-[#64697d] px-3 py-6 text-center">
                  Aucune référence à actualiser · tous vos stocks datent de moins de {STALE_DAYS} jours.
                </p>
              )}
              {stale.slice(0, 5).map(p => (
                <button key={p.id} onClick={() => nav("supplier-products")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f4f5f9] cursor-pointer text-left transition-colors">
                  <div className="w-8 h-8 bg-[#fbede3] flex items-center justify-center shrink-0">
                    <RefreshCw className="w-3.5 h-3.5 text-[#C4613A]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0a0a0f] truncate">{p.name}</p>
                    <p className="text-[11px] text-[#64697d]">Actualisé le {fmtDate(p.updated_at)} · il y a {daysSince(p.updated_at)} j</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64697d] shrink-0" />
                </button>
              ))}
              {stale.length > 5 && (
                <button onClick={() => nav("supplier-products")}
                  className="w-full text-xs text-[#0d2265] hover:text-[#C4613A] font-semibold px-3 py-2.5 text-left cursor-pointer">
                  Voir les {stale.length} références →
                </button>
              )}
            </div>
          </div>

          {/* Complétude du dossier */}
          <div className="bg-white border border-[rgba(13,34,101,0.08)]">
            <div className="px-5 py-3.5 border-b border-[rgba(13,34,101,0.07)] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#0d2265]" />
              <p className="text-sm font-semibold text-[#0a0a0f]">Complétude du dossier</p>
              <span className="ml-auto text-sm font-bold text-[#0d2265]">{dossier.pct} %</span>
            </div>
            <div className="p-5">
              <div className="h-2 w-full bg-[#eef1f8] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-[#0d2265] rounded-full transition-all" style={{ width: `${dossier.pct}%` }} />
              </div>
              <ul className="space-y-2">
                {dossier.fields.map(f => (
                  <li key={f.key} className="flex items-center gap-2.5 text-sm">
                    {f.done
                      ? <CheckCircle2 className="w-4 h-4 text-[#2E6B4F] shrink-0" />
                      : <span className="w-4 h-4 rounded-full border-2 border-[#c3c9dd] shrink-0" />}
                    <span className={f.done ? "text-[#0a0a0f]" : "text-[#64697d]"}>{f.label}</span>
                  </li>
                ))}
              </ul>
              {dossier.pct < 100 && (
                <button onClick={() => nav("supplier-coordonnees")}
                  className="mt-4 text-xs text-[#0d2265] hover:text-[#C4613A] font-semibold cursor-pointer flex items-center gap-1.5">
                  Compléter mon dossier <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SupplierShell>
  );
}
