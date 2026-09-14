/** Suggestion de produits tolérante aux fautes de frappe (façon barre de suggestions clavier).
 *  Purement local : compare la saisie à une liste connue (catalogue / référentiel),
 *  insensible aux accents et à la casse. Ne bloque rien · propose seulement.
 */

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** Distance de Levenshtein (nombre d'éditions) entre deux chaînes. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

const tolerance = (len: number) => Math.max(1, Math.floor(len / 4) + 1);

/** Score de proximité entre une requête et un produit (plus petit = meilleur, Infinity = rejeté). */
function score(query: string, product: string): number {
  const q = norm(query);
  const n = norm(product);
  if (!q) return Infinity;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  // Comparaison mot à mot, tolérante aux fautes : chaque mot saisi doit matcher
  // un mot du produit (par préfixe ou à quelques éditions près).
  const qWords = q.split(/\s+/).filter(Boolean);
  const nWords = n.split(/\s+/).filter(Boolean);
  let total = 0;
  for (const qw of qWords) {
    const tol = tolerance(qw.length);
    let best = Infinity;
    for (const nw of nWords) best = Math.min(best, nw.startsWith(qw) ? 0 : levenshtein(qw, nw));
    if (best > tol) return Infinity; // ce mot ne correspond à rien → produit écarté
    total += best;
  }
  return 3 + total;
}

/** Renvoie jusqu'à `limit` produits connus proches de la saisie, triés du plus pertinent au moins. */
export function suggestProducts(query: string, products: string[], limit = 5): string[] {
  if (norm(query).length < 2) return [];
  return products
    .map(p => ({ p, s: score(query, p) }))
    .filter(x => x.s !== Infinity)
    .sort((a, b) => a.s - b.s || a.p.length - b.p.length)
    .slice(0, limit)
    .map(x => x.p);
}
