/** Fait défiler un nombre de 0 jusqu'à sa valeur cible quand il entre à l'écran.
 *
 *  Accepte une valeur texte : la partie numérique de tête est animée, le reste
 *  (unité, « + »…) est conservé tel quel. Une valeur sans chiffre initial
 *  (« Bio UE ») s'affiche directement, sans animation.
 *
 *  Respecte « réduire les animations » : la valeur finale s'affiche d'emblée.
 */

import { useEffect, useRef, useState } from "react";

export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const match = /^(\d+)(.*)$/.exec(value.trim());
  const ref = useRef<HTMLSpanElement | null>(null);

  // Pas de nombre en tête → rendu statique (ex. « Bio UE »).
  if (!match) return <span className={className}>{value}</span>;

  const target = parseInt(match[1], 10);
  const suffix = match[2];
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") { setN(target); return; }

    let raf = 0;
    let started = false;
    const duration = 1300; // ms

    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        // easing easeOutCubic pour une décélération naturelle
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            run();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);

  return <span ref={ref} className={className}>{n}{suffix}</span>;
}
