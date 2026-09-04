/** Révèle son contenu quand il entre dans le viewport (une seule fois).
 *
 *  <Reveal>            → fondu + montée
 *  <Reveal delay={120} → décalage pour un effet en cascade
 *  <Reveal variant="left" | "right"> → glissement latéral
 *
 *  L'animation elle-même vit dans styles/animations.css et se désactive
 *  automatiquement si l'utilisateur a demandé « réduire les animations ».
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

type Variant = "up" | "left" | "right";

export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  variant?: Variant;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Déjà (au moins partiellement) dans le viewport au montage : on révèle
    // tout de suite, sans dépendre de l'observer. Couvre le contenu au-dessus
    // de la ligne de flottaison et sert de base robuste.
    const inView = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    if (inView()) { setVisible(true); return; }

    // Pas d'observer disponible → on affiche pour ne jamais masquer le contenu.
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target); // une seule fois
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base =
    variant === "left" ? "reveal reveal-left"
    : variant === "right" ? "reveal reveal-right"
    : "reveal";

  return (
    <Tag
      ref={ref as never}
      className={`${base}${visible ? " is-visible" : ""} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
