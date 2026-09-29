/** Espace fournisseur · Paramètres : changement de mot de passe. */

import { useEffect, useState } from "react";
import { Key } from "lucide-react";
import * as api from "@/lib/api";
import type { Nav } from "@/lib/routes";
import { useSupplierText } from "@/lib/supplierText";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, FormError, TextInput } from "@/app/components/common/fields";
import { SupplierShell } from "./SupplierShell";

export function SupplierChangePassword({ nav }: { nav: Nav }) {
  const { password: t, common } = useSupplierText();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!api.getSupplierToken()) nav("login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) { setError(t.tooShort); return; }
    if (next !== confirm) { setError(t.mismatch); return; }
    setSending(true);
    setError(null);
    try {
      await api.supplier.changePassword(current, next);
      setSaved(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof api.ApiError && err.status === 401 ? t.wrongCurrent : common.genericError);
    } finally {
      setSending(false);
    }
  };

  return (
    <SupplierShell nav={nav} active="settings">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-[#0a0a0f]">{t.title}</h1>
        <p className="text-sm text-[#64697d] mt-0.5 mb-6">{t.intro}</p>

        <div className="bg-white border border-[rgba(13,34,101,0.1)] p-6">
          <p className="text-sm font-semibold text-[#0a0a0f] mb-4">{t.card}</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <FieldLabel required>{t.current}</FieldLabel>
              <TextInput type={show ? "text" : "password"} required value={current} onChange={e => setCurrent(e.target.value)} placeholder={t.current} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>{t.next}</FieldLabel>
                <TextInput type={show ? "text" : "password"} required value={next} onChange={e => setNext(e.target.value)} placeholder={t.nextPlaceholder} />
              </div>
              <div>
                <FieldLabel required>{t.confirm}</FieldLabel>
                <TextInput type={show ? "text" : "password"} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t.confirmPlaceholder} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#64697d] cursor-pointer">
              <input type="checkbox" className="accent-[#0d2265]" checked={show} onChange={() => setShow(s => !s)} />
              {t.show}
            </label>
            <FormError error={error} />
            {saved && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                <Key className="w-4 h-4 shrink-0" /> {t.saved}
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              <BtnNavy type="submit" className="flex-1 justify-center">
                <Key className="w-4 h-4" /> {sending ? common.saving : t.submit}
              </BtnNavy>
              <button type="button" onClick={() => nav("supplier-dashboard")}
                className="text-sm text-[#64697d] hover:text-[#0a0a0f] cursor-pointer px-4 py-3">
                {common.back}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SupplierShell>
  );
}
