/** Champs de formulaire partagés (labels, inputs, sélecteurs, tags, certifications, RGPD). */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Info } from "lucide-react";
import {
  CERTS_OPTIONS, composeMoq, composePackaging, EMBALLAGE_PLURIEL, EMBALLAGES,
  INCOTERM_INFO, INCOTERM_STRATEGIES, INCOTERMS_CHOIX, MESURES,
} from "@/lib/constants";

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-[#0a0a0f] uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5 normal-case">*</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0d2265] focus:ring-1 focus:ring-[#0d2265]/20 transition-colors ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0d2265] focus:ring-1 focus:ring-[#0d2265]/20 transition-colors resize-none ${props.className ?? ""}`}
    />
  );
}

export function SelectInput({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-[rgba(13,34,101,0.18)] bg-white px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function RGPD({ id = "rgpd" }: { id?: string }) {
  return (
    <div className="flex gap-3 items-start">
      <input type="checkbox" id={id} required className="mt-0.5 h-4 w-4 accent-[#0d2265] cursor-pointer shrink-0" />
      <label htmlFor={id} className="text-xs text-[#64697d] leading-relaxed cursor-pointer">
        J'accepte que mes coordonnées soient utilisées par À la Source pour me transmettre le catalogue et me recontacter au sujet de ma demande.{" "}
        <span className="underline text-[#0d2265]">Politique de confidentialité.</span>
      </label>
    </div>
  );
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
    </div>
  );
}

export function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-[#C4613A] tracking-[0.22em] uppercase mb-5">{label}</p>
      {children}
    </div>
  );
}

export function FormInput({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm text-[#0a0a0f] mb-1.5">{label}{required && <span className="text-[#C4613A] ml-0.5">*</span>}</label>
      <input {...props} className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors" />
    </div>
  );
}

export function FormSelect({ label, required, children, ...props }: { label: string; required?: boolean; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm text-[#0a0a0f] mb-1.5">{label}{required && <span className="text-[#C4613A] ml-0.5">*</span>}</label>
      <select {...props} required={required} className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
        {children}
      </select>
    </div>
  );
}

/** Reconstruit les champs structurés à partir d'un libellé de conditionnement. */
function parsePackaging(s: string): { type: string; size: string; unit: string } {
  const t = (s || "").trim();
  if (!t) return { type: "Sac", size: "", unit: "kg" };
  if (/^vrac$/i.test(t)) return { type: "Vrac", size: "", unit: "kg" };
  const m = /^(.+?)\s+de\s+([\d.,]+)\s*(kg|l)\b/i.exec(t);
  if (m) {
    const type = EMBALLAGES.find(e => e.toLowerCase() === m[1].toLowerCase()) || "Sac";
    return { type, size: m[2], unit: m[3].toLowerCase() === "l" ? "L" : "kg" };
  }
  const m2 = /^([\d.,]+)\s*(kg|l)\b/i.exec(t); // ancien format libre « 25 kg »
  if (m2) return { type: "Sac", size: m2[1], unit: m2[2].toLowerCase() === "l" ? "L" : "kg" };
  return { type: "Sac", size: "", unit: "kg" };
}

/** Reconstruit valeur + unité à partir d'un libellé de MOQ (« 500 kg (20 sacs) »). */
function parseMoq(s: string): { value: string; unit: string } {
  const t = (s || "").trim();
  const m = /^([\d.,\s]+?)\s*(kg|tonnes?|l)\b/i.exec(t);
  if (m) {
    const u = m[2].toLowerCase();
    const unit = u.startsWith("t") ? "tonnes" : u === "l" ? "L" : "kg";
    return { value: m[1].replace(/\s/g, ""), unit };
  }
  return { value: "", unit: "kg" };
}

/** Saisie structurée du Conditionnement (format) et de la MOQ, avec calcul auto de
 *  l'équivalent (20 sacs ⇄ 500 kg). Rapporte les libellés composés vers le parent.
 *  Partagé entre la proposition fournisseur et l'ajout produit côté admin. */
export function PackagingMoqFields({ packaging, moq, onPackaging, onMoq }: {
  packaging: string; moq: string;
  onPackaging: (v: string) => void; onMoq: (v: string) => void;
}) {
  const p0 = parsePackaging(packaging);
  const m0 = parseMoq(moq);
  const [packType, setPackType] = useState(p0.type);
  const [packSize, setPackSize] = useState(p0.size);
  const [packUnit, setPackUnit] = useState(p0.unit);
  const [moqValue, setMoqValue] = useState(m0.value);
  const [moqUnit, setMoqUnit] = useState(m0.unit);

  const isVrac = packType === "Vrac";
  const packPlural = EMBALLAGE_PLURIEL[packType] || packType.toLowerCase();
  const moqUnits = ["kg", "tonnes", "L", ...(!isVrac ? [packPlural] : [])];
  const moqIsColis = moqUnit === packPlural && !isVrac;
  const packagingText = composePackaging(packType, packSize, packUnit);
  const moqText = composeMoq(moqValue, moqIsColis ? "colis" : "base", moqUnit, packType, packSize, packUnit);

  // Remonte les libellés composés — mais pas au montage, pour ne pas écraser
  // une valeur existante tant que l'utilisateur n'a rien modifié.
  const firstPack = useRef(true);
  const firstMoq = useRef(true);
  useEffect(() => {
    if (firstPack.current) { firstPack.current = false; return; }
    onPackaging(packagingText);
  }, [packagingText]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (firstMoq.current) { firstMoq.current = false; return; }
    onMoq(moqText);
  }, [moqText]); // eslint-disable-line react-hooks/exhaustive-deps

  const selCls = "border border-[rgba(13,34,101,0.18)] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#0d2265] appearance-none cursor-pointer";
  const inCls = "border border-[rgba(13,34,101,0.18)] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#0d2265]";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[#0a0a0f] mb-1.5">Conditionnement (format de vente)</label>
        <div className="grid grid-cols-3 gap-2">
          <select value={packType} onChange={e => setPackType(e.target.value)} className={selCls}>
            {EMBALLAGES.map(t => <option key={t}>{t}</option>)}
          </select>
          {!isVrac && <>
            <input type="text" inputMode="decimal" placeholder="25" value={packSize} onChange={e => setPackSize(e.target.value)} className={inCls} />
            <select value={packUnit} onChange={e => setPackUnit(e.target.value)} className={selCls}>
              {MESURES.map(u => <option key={u}>{u}</option>)}
            </select>
          </>}
        </div>
        {packagingText && <p className="text-xs text-[#2E6B4F] mt-1.5">→ {packagingText}</p>}
      </div>
      <div>
        <label className="block text-sm text-[#0a0a0f] mb-1.5">MOQ — quantité minimum de commande</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" inputMode="decimal" placeholder="500" value={moqValue} onChange={e => setMoqValue(e.target.value)} className={inCls} />
          <select value={moqUnit} onChange={e => setMoqUnit(e.target.value)} className={selCls}>
            {moqUnits.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        {moqText
          ? <p className="text-xs text-[#2E6B4F] mt-1.5">→ MOQ : {moqText}</p>
          : <p className="text-[11px] text-[#64697d] mt-1.5">Choisissez « {packPlural} » pour saisir la MOQ en nombre de colis — l'équivalent en {packUnit} est calculé.</p>}
      </div>
    </div>
  );
}

/** Sélecteur d'incoterm avec explication en langage clair + panneau « comprendre ». */
export function IncotermField({ value, onChange, label = "Incoterm souhaité" }: {
  value: string; onChange: (v: string) => void; label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-[#0a0a0f]">{label}</label>
        <button type="button" onClick={() => setOpen(o => !o)}
          className="text-xs font-semibold text-[#0d2265] hover:text-[#C4613A] cursor-pointer inline-flex items-center gap-1 transition-colors">
          <Info className="w-3.5 h-3.5" /> Comprendre les incoterms
        </button>
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-[rgba(13,34,101,0.15)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0d2265] transition-colors appearance-none">
        {INCOTERMS_CHOIX.map(i => <option key={i}>{i}</option>)}
      </select>
      {INCOTERM_INFO[value] && (
        <p className="text-xs text-[#64697d] mt-1.5 leading-relaxed">{INCOTERM_INFO[value]}</p>
      )}
      {open && (
        <div className="mt-2 bg-[#f4f5f9] border border-[rgba(13,34,101,0.1)] p-3 space-y-2.5">
          <p className="text-[11px] font-bold text-[#C4613A] uppercase tracking-wide">Choisir selon votre confort</p>
          {INCOTERM_STRATEGIES.map(s => (
            <div key={s.title}>
              <p className="text-xs font-semibold text-[#0d2265]">{s.emoji} {s.title}</p>
              <p className="text-xs text-[#64697d] leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bascule à 2+ choix mutuellement exclusifs (ex. Afrique/Europe, Oui/Non). */
export function ChoiceToggle({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-[#0a0a0f] mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`px-4 py-2 text-xs font-semibold border cursor-pointer transition-colors ${value === o ? "border-[#0d2265] bg-[#0d2265] text-white" : "border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:border-[#0d2265]"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TagInput({ tags, setTags, placeholder, suggestions = [] }: {
  tags: string[]; setTags: (t: string[]) => void; placeholder?: string; suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const add = (v: string) => {
    const s = v.trim();
    if (s && !tags.includes(s)) setTags([...tags, s]);
    setInput(""); setOpen(false); setActive(-1);
  };

  // Suggestions du catalogue correspondant à la saisie (évite les fautes d'orthographe).
  // On matche sur le début d'un mot du libellé (ex. « gin » → « Gingembre »), pas
  // n'importe quelle sous-chaîne (« gin » ne doit pas matcher « ori-gin-es »).
  const q = input.trim().toLowerCase();
  const matches = q
    ? suggestions.filter(s => {
        if (tags.includes(s)) return false;
        const l = s.toLowerCase();
        return l.startsWith(q) || l.split(/[\s(«»,·/-]+/).some(w => w.startsWith(q));
      }).slice(0, 8)
    : [];
  const showList = open && matches.length > 0;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (showList && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const n = matches.length;
      setActive(a => e.key === "ArrowDown" ? (a + 1) % n : (a - 1 + n) % n);
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(showList && active >= 0 ? matches[active] : input);
      return;
    }
    if (e.key === "Escape") { setOpen(false); setActive(-1); }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 items-center border border-[rgba(13,34,101,0.15)] px-3 py-2 min-h-[42px] focus-within:border-[#0d2265] transition-colors">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-[#eef1f8] text-[#0d2265] text-xs px-2 py-0.5">
            {t}
            <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} className="text-[#64697d] hover:text-[#0d2265] cursor-pointer">&times;</button>
          </span>
        ))}
        <input value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); setActive(-1); }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => { add(input); }}
          placeholder={placeholder || "+ ajouter…"}
          className="text-sm text-[#0a0a0f] outline-none flex-1 min-w-[90px] placeholder:text-[#9ca3af]" />
      </div>
      {showList && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[rgba(13,34,101,0.15)] shadow-[0_10px_30px_-12px_rgba(13,34,101,0.35)] max-h-56 overflow-auto">
          {matches.map((m, i) => (
            <li key={m}>
              {/* onMouseDown + preventDefault : ajoute sans déclencher le blur de l'input */}
              <button type="button" onMouseDown={e => { e.preventDefault(); add(m); }}
                className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${i === active ? "bg-[#f4f5f9] text-[#0d2265]" : "text-[#0a0a0f] hover:bg-[#f4f5f9]"}`}>
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CertToggle({ certs, setCerts }: { certs: string[]; setCerts: (c: string[]) => void }) {
  const toggle = (c: string) => setCerts(certs.includes(c) ? certs.filter(x => x !== c) : [...certs, c]);
  return (
    <div className="flex flex-wrap gap-2">
      {CERTS_OPTIONS.map(c => (
        <button key={c} type="button" onClick={() => toggle(c)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-colors ${certs.includes(c) ? "border-[#0d2265] bg-[#0d2265] text-white" : "border-[rgba(13,34,101,0.2)] text-[#0d2265] hover:border-[#0d2265]"}`}>
          {certs.includes(c) && <Check className="w-3 h-3" />} {c}
        </button>
      ))}
    </div>
  );
}
