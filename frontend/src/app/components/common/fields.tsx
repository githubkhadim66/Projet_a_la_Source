/** Champs de formulaire partagés (labels, inputs, sélecteurs, tags, certifications, RGPD). */

import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { CERTS_OPTIONS } from "@/lib/constants";

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

export function TagInput({ tags, setTags, placeholder }: { tags: string[]; setTags: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = (v: string) => { const s = v.trim(); if (s && !tags.includes(s)) setTags([...tags, s]); setInput(""); };
  return (
    <div className="flex flex-wrap gap-2 items-center border border-[rgba(13,34,101,0.15)] px-3 py-2 min-h-[42px] focus-within:border-[#0d2265] transition-colors">
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 bg-[#eef1f8] text-[#0d2265] text-xs px-2 py-0.5">
          {t}
          <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} className="text-[#64697d] hover:text-[#0d2265] cursor-pointer">&times;</button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } }}
        onBlur={() => add(input)}
        placeholder={placeholder || "+ ajouter…"}
        className="text-sm text-[#0a0a0f] outline-none flex-1 min-w-[90px] placeholder:text-[#9ca3af]" />
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
