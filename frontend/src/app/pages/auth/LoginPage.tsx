/** Page de connexion unique : le backend détecte le rôle (admin ou fournisseur). */

import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import * as api from "@/lib/api";
import type { Nav } from "@/lib/routes";
import { BtnNavy } from "@/app/components/common/buttons";
import { FieldLabel, FormError, TextInput } from "@/app/components/common/fields";
import { ScreenShell } from "@/app/components/common/layout";

export function Login({ nav }: { nav: Nav }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Déjà connecté ? Direction l'espace correspondant.
  useEffect(() => {
    if (api.getAdminToken()) { nav("admin-dashboard"); return; }
    if (api.getSupplierToken()) nav("supplier-products");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      if (res.role === "admin") {
        api.setAdminToken(res.access_token);
        localStorage.setItem("als-admin-email", email);
        nav("admin-dashboard");
      } else {
        api.setSupplierToken(res.access_token);
        nav(res.must_change_password ? "supplier-password" : "supplier-products");
      }
    } catch (err) {
      setError(err instanceof api.ApiError && err.status === 401
        ? "Identifiants invalides. Vérifiez votre e-mail et votre mot de passe."
        : "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenShell nav={nav} title="Connexion" directBack>
      <div className="bg-white border border-[rgba(13,34,101,0.1)] p-10 text-center">
        <div className="w-14 h-14 bg-[rgba(13,34,101,0.06)] flex items-center justify-center mx-auto mb-6">
          <Lock className="w-7 h-7 text-[#0d2265]" />
        </div>
        <h2 className="text-xl font-bold text-[#0a0a0f] mb-1">Connexion</h2>
        <p className="text-sm text-[#64697d] mb-8">Espace fournisseurs et administration.</p>
        <form onSubmit={submit} className="text-left space-y-4">
          <div>
            <FieldLabel required>Adresse e-mail</FieldLabel>
            <TextInput type="email" required placeholder="vous@entreprise.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <FieldLabel required>Mot de passe</FieldLabel>
            <div className="relative">
              <TextInput type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64697d] hover:text-[#0d2265] cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <FormError error={error} />
          <BtnNavy type="submit" className="w-full justify-center">
            {sending ? "Connexion…" : "Se connecter"} <ArrowRight className="w-4 h-4" />
          </BtnNavy>
        </form>
        <p className="text-xs text-[#64697d] mt-4">
          Mot de passe oublié ? Contactez l'équipe À la Source pour le réinitialiser.
        </p>
        <p className="text-xs text-[#64697d] mt-2">
          Pas encore référencé ?{" "}
          <button onClick={() => nav("candidature")} className="text-[#0d2265] underline cursor-pointer">Candidatez ici</button>
        </p>
      </div>
    </ScreenShell>
  );
}
