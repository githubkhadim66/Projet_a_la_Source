/** Helpers d'affichage (dates françaises, images produit Unsplash). */

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
};

/** Image d'un produit : URL téléversée (S3 ou locale), identifiant Unsplash hérité, ou visuel neutre. */
export const productImg = (image: string, size = "w=600&h=450") => {
  if (!image) return PLACEHOLDER_IMG;
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `https://images.unsplash.com/photo-${image}?${size}&fit=crop&auto=format`;
};

/** Aplat aux couleurs de la charte, affiché tant qu'aucune photo n'a été téléversée. */
export const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
       <rect width="600" height="450" fill="#eef1f8"/>
       <path d="M225 250l45-55 40 48 30-33 55 65H225z" fill="#c3c9dd"/>
       <circle cx="250" cy="185" r="20" fill="#c3c9dd"/>
     </svg>`,
  );
