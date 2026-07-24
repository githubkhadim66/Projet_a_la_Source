/** Espace fournisseur : liste des produits, mise à jour stock/dispo/délai. */

import { useCallback, useEffect, useState } from "react";
import { Check, Edit2, Key, LogOut, Plus } from "lucide-react";
import * as api from "@/lib/api";
import type { ApiProduct, ApiSupplier } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { StockStatus } from "@/lib/leads";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, SelectInput, TextInput } from "@/app/components/common/fields";

const STATUS_BADGE: Record<StockStatus, string> = {
  "En stock": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Sur commande": "bg-amber-50 text-amber-700 border border-amber-200",
  "Rupture": "bg-red-50 text-red-600 border border-red-200",
};

export function SupplierProducts({ nav }: { nav: Nav }) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [me, setMe] = useState<ApiSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ stock: string; status: StockStatus; delay: string }>({ stock: "", status: "En stock", delay: "" });
  const [toast, setToast] = useState<string | null>(null);

  const logout = useCallback(() => { api.setSupplierToken(null); nav("login"); }, [nav]);

  useEffect(() => {
    if (!api.getSupplierToken()) { nav("login"); return; }
    Promise.all([api.supplier.me(), api.supplier.myProducts()])
      .then(([profile, prods]) => { setMe(profile); setProducts(prods); })
      .catch(err => {
        if (err instanceof api.ApiError && err.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [nav, logout]);

  const openEdit = (p: ApiProduct) => { setEditing(p.id); setEditData({ stock: String(p.stock_kg), status: p.status, delay: p.delay }); };

  const save = async (id: number) => {
    try {
      const updated = await api.supplier.updateProduct(id, {
        stock_kg: Number(editData.stock), status: editData.status, delay: editData.delay,
      });
      setProducts(ps => ps.map(p => p.id === id ? updated : p));
      setEditing(null);
      setToast(`Mise à jour enregistrée le ${fmtDate(updated.updated_at)}`);
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) { logout(); return; }
      setToast("Échec de l'enregistrement — réessayez.");
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9] font-['Inter',sans-serif]">
      <div className="bg-[#0d2265] px-6 py-4 flex items-center gap-4">
        <span className="text-white font-bold text-lg tracking-tight">À la Source</span>
        <span className="text-white/30">|</span>
        <span className="text-white/60 text-sm">Espace fournisseurs</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-white/60 text-sm hidden sm:block">{me?.name ?? ""}</span>
          <button onClick={logout} className="text-white/50 hover:text-white cursor-pointer transition-colors" title="Se déconnecter">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a0a0f]">Mes produits</h1>
            <p className="text-sm text-[#64697d] mt-0.5">{me?.name ?? "…"} · {products.length} référence{products.length > 1 ? "s" : ""} active{products.length > 1 ? "s" : ""}</p>
          </div>
          <BtnNavy onClick={() => nav("supplier-propose")}>
            <Plus className="w-4 h-4" /> Proposer un produit
          </BtnNavy>
        </div>

        {loading && <p className="text-sm text-[#64697d] py-8 text-center">Chargement de vos produits…</p>}
        {!loading && products.length === 0 && (
          <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10 text-center text-sm text-[#64697d]">
            Aucun produit rattaché à votre compte pour le moment.
          </div>
        )}
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="bg-white border border-[rgba(13,34,101,0.1)]">
              <div className="p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0a0a0f] text-sm truncate">{p.name}{p.origin && !p.name.includes(p.origin) ? ` — ${p.origin}` : ""}</p>
                      <p className="text-xs text-[#64697d] font-mono mt-0.5">{p.ref}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#64697d]">
                    <span>Stock : <strong className="text-[#0a0a0f]">{p.stock_kg.toLocaleString("fr-FR")} kg</strong></span>
                    <span>Délai : <strong className="text-[#0a0a0f]">{p.delay}</strong></span>
                    <span>Màj le {fmtDate(p.updated_at)}</span>
                  </div>
                </div>
                <button onClick={() => openEdit(p)} className="shrink-0 border border-[rgba(13,34,101,0.18)] text-[#0d2265] text-xs px-3 py-1.5 hover:bg-[#f4f5f9] cursor-pointer transition-colors flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Mettre à jour
                </button>
              </div>

              {editing === p.id && (
                <div className="border-t border-[rgba(13,34,101,0.08)] bg-[#f4f5f9] p-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div><FieldLabel>Stock (kg)</FieldLabel><TextInput type="number" value={editData.stock} onChange={e => setEditData({ ...editData, stock: e.target.value })} /></div>
                    <div>
                      <FieldLabel>Disponibilité</FieldLabel>
                      <SelectInput value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value as StockStatus })}>
                        <option>En stock</option><option>Sur commande</option><option>Rupture</option>
                      </SelectInput>
                    </div>
                    <div><FieldLabel>Délai indicatif</FieldLabel><TextInput value={editData.delay} onChange={e => setEditData({ ...editData, delay: e.target.value })} placeholder="Ex : 2–3 semaines" /></div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <BtnNavy onClick={() => save(p.id)}><Check className="w-4 h-4" /> Enregistrer</BtnNavy>
                    <button onClick={() => setEditing(null)} className="text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer">Annuler</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-[rgba(13,34,101,0.08)] flex items-center gap-6">
          <button onClick={() => nav("supplier-coordonnees")} className="text-sm text-[#0d2265] underline cursor-pointer">Mes coordonnées →</button>
          <button onClick={() => nav("supplier-password")} className="text-sm text-[#0d2265] underline cursor-pointer flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" /> Changer mon mot de passe
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0d2265] text-white text-sm px-5 py-3 shadow-xl flex items-center gap-2 z-50">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}
    </div>
  );
}
