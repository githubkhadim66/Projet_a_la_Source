/** Langue du site (FR/EN), partagée par tous les écrans.
 *
 *  - Choisie sur l'accueil, elle suit le visiteur sur le catalogue, la fiche produit et
 *    chaque formulaire jusqu'à l'envoi (la demande part avec `language` → e-mails dans
 *    la même langue).
 *  - Retenue d'une visite à l'autre (stockage indisponible → français).
 *  - Valable aussi pour l'espace fournisseur (choix enregistré sur son compte) et l'admin.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type Lang = "fr" | "en";

const LANG_KEY = "als-lang";

export const getStoredLang = (): Lang => {
  try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "fr"; } catch { return "fr"; }
};

const storeLang = (lang: Lang) => {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* navigation privée : sans effet */ }
};

export const LangContext = createContext<Lang>("fr");
// null = langue imposée (back-office) : aucun sélecteur n'est proposé.
const SetLangContext = createContext<((l: Lang) => void) | null>(null);

export const useLang = () => useContext(LangContext);
export const useSetLang = () => useContext(SetLangContext) ?? (() => {});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang);
  const setLang = useCallback((l: Lang) => { setLangState(l); storeLang(l); }, []);
  return (
    <SetLangContext.Provider value={setLang}>
      <LangContext.Provider value={lang}>{children}</LangContext.Provider>
    </SetLangContext.Provider>
  );
}

/** Sélecteur FR │ EN : `dark` pour les barres marine, `light` pour les barres blanches. */
export function LangSwitch({ tone = "dark", onChange }: { tone?: "dark" | "light"; onChange?: (l: Lang) => void }) {
  const lang = useLang();
  const setLang = useContext(SetLangContext);
  if (!setLang) return null;
  const active = tone === "dark" ? "text-white font-bold" : "text-[#0d2265] font-bold";
  const idle = tone === "dark" ? "text-white/50 hover:text-white" : "text-[#64697d] hover:text-[#0d2265]";
  const pick = (l: Lang) => { setLang(l); onChange?.(l); };
  return (
    <div className="flex items-center gap-0.5 text-xs" aria-label="Langue / Language">
      <button type="button" onClick={() => pick("fr")} className={`cursor-pointer px-1 transition-colors ${lang === "fr" ? active : idle}`}>FR</button>
      <span className={tone === "dark" ? "text-white/30" : "text-[#c3c9dd]"}>│</span>
      <button type="button" onClick={() => pick("en")} className={`cursor-pointer px-1 transition-colors ${lang === "en" ? active : idle}`}>EN</button>
    </div>
  );
}
