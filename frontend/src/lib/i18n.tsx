/** Langue du parcours client (FR/EN), partagée par tout le site public.
 *
 *  - Choisie sur l'accueil, elle suit le visiteur sur le catalogue, la fiche produit et
 *    chaque formulaire jusqu'à l'envoi (la demande part avec `language` → e-mails dans
 *    la même langue).
 *  - Retenue d'une visite à l'autre (stockage indisponible → français).
 *  - Les espaces fournisseur et admin restent en français : App leur impose "fr".
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

/** Force une langue pour une partie de l'arbre (espaces fournisseur/admin : français). */
export function FixedLang({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <SetLangContext.Provider value={null}>
      <LangContext.Provider value={lang}>{children}</LangContext.Provider>
    </SetLangContext.Provider>
  );
}

/** Sélecteur FR │ EN pour les barres marine des écrans publics (masqué en back-office). */
export function LangSwitch() {
  const lang = useLang();
  const setLang = useContext(SetLangContext);
  if (!setLang) return null;
  const cls = (l: Lang) => `cursor-pointer px-1 transition-colors ${lang === l ? "text-white font-bold" : "text-white/50 hover:text-white"}`;
  return (
    <div className="flex items-center gap-0.5 text-xs" aria-label="Langue / Language">
      <button type="button" onClick={() => setLang("fr")} className={cls("fr")}>FR</button>
      <span className="text-white/30">│</span>
      <button type="button" onClick={() => setLang("en")} className={cls("en")}>EN</button>
    </div>
  );
}
