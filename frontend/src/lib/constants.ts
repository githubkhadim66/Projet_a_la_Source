/** Constantes métier partagées entre les pages. */

export const CALENDLY_URL = "https://calendly.com/oumou-soumano/rdv-de-diagnostic?month=2026-07";

// Images de la landing
export const IMG_HERO = "https://images.unsplash.com/photo-1758745464235-ccb8c1253074?w=1100&h=900&fit=crop&auto=format";
export const IMG_PORTRAIT = "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=600&h=800&fit=crop&auto=format";
export const IMG_MARKET = "https://images.unsplash.com/photo-1778079247396-9c0e01c83c8b?w=800&h=600&fit=crop&auto=format";

// Options des formulaires
export const PAYS_EU = ["France","Allemagne","Belgique","Pays-Bas","Espagne","Italie","Portugal","Suisse","Luxembourg","Autre"];

// Liste mondiale des pays (français), pour les champs « Pays » avec recherche.
export const PAYS_MONDE = [
  "Afghanistan","Afrique du Sud","Albanie","Algérie","Allemagne","Andorre","Angola","Antigua-et-Barbuda","Arabie saoudite","Argentine","Arménie","Australie","Autriche","Azerbaïdjan",
  "Bahamas","Bahreïn","Bangladesh","Barbade","Belgique","Belize","Bénin","Bhoutan","Biélorussie","Birmanie (Myanmar)","Bolivie","Bosnie-Herzégovine","Botswana","Brésil","Brunei","Bulgarie","Burkina Faso","Burundi",
  "Cambodge","Cameroun","Canada","Cap-Vert","Chili","Chine","Chypre","Colombie","Comores","Congo","Congo (RDC)","Corée du Nord","Corée du Sud","Costa Rica","Côte d'Ivoire","Croatie","Cuba",
  "Danemark","Djibouti","Dominique","Égypte","Émirats arabes unis","Équateur","Érythrée","Espagne","Estonie","Eswatini","États-Unis","Éthiopie",
  "Fidji","Finlande","France","Gabon","Gambie","Géorgie","Ghana","Grèce","Grenade","Guatemala","Guinée","Guinée-Bissau","Guinée équatoriale","Guyana",
  "Haïti","Honduras","Hongrie","Îles Marshall","Îles Salomon","Inde","Indonésie","Irak","Iran","Irlande","Islande","Israël","Italie",
  "Jamaïque","Japon","Jordanie","Kazakhstan","Kenya","Kirghizistan","Kiribati","Koweït","Laos","Lesotho","Lettonie","Liban","Liberia","Libye","Liechtenstein","Lituanie","Luxembourg",
  "Macédoine du Nord","Madagascar","Malaisie","Malawi","Maldives","Mali","Malte","Maroc","Maurice","Mauritanie","Mexique","Micronésie","Moldavie","Monaco","Mongolie","Monténégro","Mozambique",
  "Namibie","Nauru","Népal","Nicaragua","Niger","Nigeria","Norvège","Nouvelle-Zélande","Oman","Ouganda","Ouzbékistan",
  "Pakistan","Palaos","Palestine","Panama","Papouasie-Nouvelle-Guinée","Paraguay","Pays-Bas","Pérou","Philippines","Pologne","Portugal","Qatar",
  "République centrafricaine","République dominicaine","République tchèque","Roumanie","Royaume-Uni","Russie","Rwanda",
  "Saint-Christophe-et-Niévès","Saint-Marin","Saint-Vincent-et-les-Grenadines","Sainte-Lucie","Salvador","Samoa","Sao Tomé-et-Principe","Sénégal","Serbie","Seychelles","Sierra Leone","Singapour","Slovaquie","Slovénie","Somalie","Soudan","Soudan du Sud","Sri Lanka","Suède","Suisse","Suriname","Syrie",
  "Tadjikistan","Tanzanie","Tchad","Thaïlande","Timor oriental","Togo","Tonga","Trinité-et-Tobago","Tunisie","Turkménistan","Turquie","Tuvalu",
  "Ukraine","Uruguay","Vanuatu","Vatican","Venezuela","Viêt Nam","Yémen","Zambie","Zimbabwe",
];
export const CERTS_OPTIONS = ["Bio UE","HACCP","Halal","Casher","ISO 22000"];
// Certifications côté fournisseur (candidature + proposition de produit)
export const CERTS_FOURNISSEUR = ["Bio","Halal","Casher","HACCP","ISO","Autre","Aucune"];
export const INCOTERMS = ["EXW","FCA","FAS","FOB","CFR","CIF","CPT","CIP","DPU","DAP","DDP"];
// Incoterms proposés dans les formulaires de demande, avec l'option « à conseiller » (CDC FOR-01)
export const INCOTERMS_CHOIX = [...INCOTERMS, "À conseiller"];

// Sens de chaque incoterm (aide en langage clair sous le sélecteur)
export const INCOTERM_INFO: Record<string, string> = {
  "EXW": "Ex Works · Vous gérez tout : enlèvement à l'usine, douane de départ, transport principal et douane d'arrivée. Risque maximal.",
  "FCA": "Free Carrier · Le vendeur dédouane et remet la marchandise au transporteur au départ ; vous gérez le transport principal.",
  "FAS": "Free Alongside Ship · Le vendeur livre le long du navire au port de départ ; vous prenez le relais.",
  "FOB": "Free On Board · Le vendeur charge à bord au port de départ ; vous gérez le fret et l'arrivée. Bon compromis.",
  "CFR": "Cost & Freight · Le vendeur paie le fret jusqu'au port d'arrivée ; le risque vous est transféré dès le chargement.",
  "CIF": "Cost, Insurance & Freight · Comme CFR, avec l'assurance payée par le vendeur jusqu'au port d'arrivée.",
  "CPT": "Carriage Paid To · Le vendeur paie le transport jusqu'au lieu convenu ; risque transféré au premier transporteur.",
  "CIP": "Carriage & Insurance Paid To · Comme CPT, avec l'assurance jusqu'au lieu convenu.",
  "DPU": "Delivered at Place Unloaded · Le vendeur livre et décharge la marchandise au lieu convenu.",
  "DAP": "Delivered at Place · Le vendeur livre chez vous ; vous payez seulement les taxes de douane à l'arrivée.",
  "DDP": "Delivered Duty Paid · Livraison clé en main : le vendeur paie tout, y compris vos taxes locales.",
  "À conseiller": "Vous ne savez pas lequel choisir ? Indiquez-le : nous vous recommandons l'incoterm le plus adapté à votre projet.",
};

// Incoterms où l'ACHETEUR organise le transport principal (le vendeur ne s'en charge pas)
export const INCOTERMS_ACHETEUR = ["EXW", "FCA", "FAS", "FOB"];
// Incoterms où le VENDEUR (À la Source) organise l'acheminement jusqu'à destination
export const INCOTERMS_VENDEUR = ["CFR", "CIF", "CPT", "CIP", "DPU", "DAP", "DDP"];

/** true = l'acheteur organise le transport ; false = le vendeur l'organise ; null = à déterminer. */
export function incotermBuyerArranges(incoterm: string): boolean | null {
  if (INCOTERMS_ACHETEUR.includes(incoterm)) return true;
  if (INCOTERMS_VENDEUR.includes(incoterm)) return false;
  return null;
}

// Les 3 stratégies acheteur (panneau « Comprendre les incoterms »)
export const INCOTERM_STRATEGIES = [
  { emoji: "🚨", title: "Risque maximal · EXW", text: "Vous gérez tout : transporteur à l'usine, douanes, transport. Un blocage en douane ou une casse est à votre charge. À éviter si vous débutez." },
  { emoji: "🤝", title: "Équilibre & contrôle · FCA / FOB", text: "Le vendeur dédouane et dépose au port ou à l'aéroport de départ ; vous prenez le relais. Meilleur compromis : vous maîtrisez le transport international sans gérer les formalités du pays vendeur." },
  { emoji: "🛋️", title: "Confort absolu · DAP / DDP", text: "Le vendeur achemine jusqu'à vos locaux. En DAP vous payez les taxes à l'arrivée ; en DDP tout est inclus (clé en main). Point de vigilance : le transport est refacturé, souvent avec une marge." },
];
export const CONDITIONNEMENTS = ["Palettes","Sacs","Cartons","Vrac","Autre"];
export const MOTIFS_RDV = ["Projet d'importation","Recherche de fournisseurs","Logistique, formalités, certifications"];
export const SUPPLIER_COUNTRIES = ["Sénégal","Côte d'Ivoire","Mali","Burkina Faso","Ghana","Cameroun","Maroc","Autre"];
export const CAT_CATEGORIES = ["Matières premières","Épicerie","Épices","Boissons","Fruits & légumes"];

// Domaine d'activité de l'acheteur (formulaires devis / sourcing)
export const SECTEURS = ["Agroalimentaire","Distribution / Grossiste","Cosmétique","Restauration / CHR","Industrie","Autre"];
// Délai de livraison souhaité
export const DELAIS_LIVRAISON = ["Dès que possible","Sous 2 semaines","Sous 1 mois","1 à 3 mois","Flexible"];
// Délai indicatif de préparation/expédition d'un produit (renseigné par le fournisseur).
export const DELAIS_PRODUIT = ["Sous 1 semaine","1 à 2 semaines","2 à 3 semaines","3 à 4 semaines","1 à 2 mois","Selon la récolte"];
// Pays de provenance souhaité (sourcing sur mesure)
export const ORIGINES = ["Sénégal","Côte d'Ivoire","Mali","Burkina Faso","Ghana","Cameroun","Maroc","Nigeria","Togo","Bénin","Guinée","Autre / à définir"];
// Destination de la livraison finale
export const CONTINENTS_LIVRAISON = ["Afrique","Europe"];
// Unité du besoin prévisionnel
export const PREVISION_UNITES = ["par mois","par an"];

// Pays d'origine des produits (valorisation du local · filtre catalogue admin)
export const PAYS_ORIGINE = [
  "Sénégal","Côte d'Ivoire","Mali","Burkina Faso","Ghana","Guinée","Bénin","Togo",
  "Nigeria","Cameroun","Maroc","Autre",
];

// ─── Conditionnement & MOQ (formulaire fournisseur) ──────────────────────────
// Conditionnement = format de vente ; MOQ = quantité minimum de commande.
export const EMBALLAGES = ["Sac", "Carton", "Bidon", "Seau", "Palette", "Conteneur 20'", "Conteneur 40'", "Vrac"];
export const EMBALLAGE_PLURIEL: Record<string, string> = {
  "Sac": "sacs", "Carton": "cartons", "Bidon": "bidons", "Seau": "seaux",
  "Palette": "palettes", "Conteneur 20'": "conteneurs 20'", "Conteneur 40'": "conteneurs 40'",
};
export const MESURES = ["kg", "L"];

/** Compose le libellé du conditionnement, ex. « Sac de 25 kg » (ou « Vrac »). */
export function composePackaging(type: string, size: string, unit: string): string {
  if (!type) return "";
  if (type === "Vrac") return "Vrac";
  return size.trim() ? `${type} de ${size.trim()} ${unit}` : "";
}

/** Compose le libellé de la MOQ avec l'équivalent calculé, ex. « 500 kg (20 sacs) ».
 *  `unitMode` = "base" (kg/L/tonnes) ou "colis" (multiples du conditionnement). */
export function composeMoq(
  value: string, unitMode: "base" | "colis", baseUnit: string,
  packType: string, packSize: string, packUnit: string,
): string {
  const v = parseFloat(value.replace(",", "."));
  if (!value || Number.isNaN(v)) return "";
  const size = parseFloat((packSize || "").replace(",", "."));
  const plural = EMBALLAGE_PLURIEL[packType] || (packType ? packType.toLowerCase() : "colis");

  if (unitMode === "colis" && size > 0) {
    const total = v * size;
    return `${total.toLocaleString("fr-FR")} ${packUnit} (${v.toLocaleString("fr-FR")} ${plural})`;
  }
  // Mode base : équivalent en colis si l'unité correspond et que ça tombe juste
  let suffix = "";
  if (size > 0 && packType && packType !== "Vrac" && baseUnit === packUnit) {
    const n = v / size;
    if (Number.isInteger(n)) suffix = ` (${n.toLocaleString("fr-FR")} ${plural})`;
  }
  return `${v.toLocaleString("fr-FR")} ${baseUnit}${suffix}`;
}

// Listes de produits par catégorie (formulaire fournisseur). Base modifiable :
// « Autre (préciser) » ouvre un champ libre. À compléter avec le client.
export const PRODUITS_PAR_CATEGORIE: Record<string, string[]> = {
  "Matières premières": [
    "Beurre de karité brut","Beurre de karité raffiné","Huile de palme rouge",
    "Huile d'arachide","Gomme arabique","Fèves de cacao","Beurre de cacao","Noix de cajou brute",
  ],
  "Épicerie": [
    "Fonio","Mil / Sorgho","Riz local","Sésame","Arachide","Poudre de baobab (bouye)",
    "Poudre de moringa","Tamarin","Néré (soumbala)",
  ],
  "Épices": [
    "Gingembre en poudre","Poivre de Penja","Piment séché","Curcuma","Clou de girofle",
    "Poudre de djansang","Mélange d'épices",
  ],
  "Boissons": [
    "Bissap (hibiscus séché)","Jus de bouye (baobab)","Jus de gingembre","Jus de tamarin",
    "Infusion de kinkeliba","Café Robusta","Café Arabica",
  ],
  "Fruits & légumes": [
    "Mangue séchée","Ananas séché","Banane séchée","Noix de coco","Gombo séché",
    "Aubergine africaine","Patate douce",
  ],
};
