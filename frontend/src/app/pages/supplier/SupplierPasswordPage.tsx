/** Changement de mot de passe fournisseur (proposé à la première connexion). */

import { useEffect, useState } from "react";
import { Key } from "lucide-react";
import * as api from "@/lib/api";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, FormError, TextInput } from "@/app/components/common/fields";
import { FormCard, ScreenShell } from "@/app/components/common/layout";

export function SupplierChangePassword({ nav }: { nav: Nav }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.getSupplierToken()) nav("login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) { setError("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    if (next !== confirm) { setError("La confirmation ne correspond pas au nouveau mot de passe."); return; }
    setSending(true);
    setError(null);
    try {
      await api.supplier.changePassword(current, next);
      nav("supplier-products");
    } catch (err) {
      setError(err instanceof api.ApiError && err.status === 401
        ? "Mot de passe actuel incorrect."
        : "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title="Changer mon mot de passe" back="supplier-products">
      <FormCard
        title="Choisissez votre mot de passe"
        subtitle="Vous vous êtes connecté avec un mot de passe temporaire. Remplacez-le par un mot de passe personnel (8 caractères minimum) — ou faites-le plus tard."
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel required>Mot de passe actuel</FieldLabel>
            <TextInput type={show ? "text" : "password"} required value={current} onChange={e => setCurrent(e.target.value)} placeholder="Mot de passe temporaire reçu" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Nouveau mot de passe</FieldLabel>
              <TextInput type={show ? "text" : "password"} required value={next} onChange={e => setNext(e.target.value)} placeholder="8 caractères min." />
            </div>
            <div>
              <FieldLabel required>Confirmation</FieldLabel>
              <TextInput type={show ? "text" : "password"} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez-le" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-[#64697d] cursor-pointer">
            <input type="checkbox" className="accent-[#0d2265]" checked={show} onChange={() => setShow(s => !s)} />
            Afficher les mots de passe
          </label>
          <FormError error={error} />
          <div className="flex items-center gap-3">
            <BtnNavy type="submit" className="flex-1 justify-center">
              <Key className="w-4 h-4" /> {sending ? "Enregistrement…" : "Changer mon mot de passe"}
            </BtnNavy>
            <button type="button" onClick={() => nav("supplier-products")}
              className="text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer px-4 py-3">
              Plus tard
            </button>
          </div>
        </form>
      </FormCard>
    </ScreenShell>
  );
}
