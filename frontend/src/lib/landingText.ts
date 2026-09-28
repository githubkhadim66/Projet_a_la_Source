/** Contenu bilingue de la landing page (FR/EN).
 *  Chaque section lit `useLandingText()` pour obtenir les textes de la langue courante
 *  (langue globale du site : voir lib/i18n).
 *  Le dictionnaire `fr` et `en` DOIVENT avoir exactement la même forme.
 */

import { useLang, type Lang } from "@/lib/i18n";

export { useLang, type Lang };

const fr = {
  nav: { services: "Services", catalogue: "Catalogue", expertise: "Expertise", contact: "Contact" },
  header: { suppliers: "Fournisseurs", talk: "Échanger", request: "Ma demande", supplierArea: "Espace fournisseurs", language: "Langue" },
  hero: {
    kicker: "Sourcing · Export · Afrique · Europe",
    title: "Matières premières et produits finis africains : de la source à votre entrepôt.",
    subtitle: "Un seul interlocuteur entre vos exigences et un réseau de fournisseurs audités.",
    ctaExpert: "Échanger avec un expert",
    ctaQuote: "Demander une cotation",
    imgAlt: "Épices et produits du terroir africain",
  },
  figures: [
    { n: "24 ans", tag: "Expertise cumulée" },
    { n: "14 ans", tag: "En grande distribution" },
    { n: "200+", tag: "Organisations accompagnées" },
    { n: "Bio UE", tag: "Export certifié" },
    { n: "2", tag: "Continents" },
  ],
  services: {
    title: ["Trois barrières.", "Zéro compromis."],
    pillars: [
      { tag: "Fournisseurs", title: "Audités sur place", cta: "Voir le catalogue" },
      { tag: "Conformité", title: "Normes UE garanties", cta: "Discuter de vos besoins" },
      { tag: "Logistique", title: "Supply chain clé en main", cta: "Demander un devis" },
    ],
  },
  catalogue: { title: "50+ références", full: "Catalogue complet", view: "Voir la fiche", add: "+ Ma demande", added: "Ajouté" },
  how: {
    title: "De votre besoin à la livraison.",
    start: "Démarrer",
    steps: ["Transmettez votre besoin", "Nous sélectionnons & vérifions", "Devis unique sous 48 h", "Livraison de bout en bout"],
  },
  quote: {
    title: "Dites-nous ce qu'il vous faut.",
    subtitle: "Une réponse sous 48 h, sans aucun engagement, avec un seul interlocuteur du début à la fin.",
    devis: { label: "Devis catalogue", cta: "Accéder au formulaire", bullets: ["Sélection depuis le catalogue", "Volume & conditionnement", "Incoterm au choix", "Réponse sous 48 h"] },
    sourcing: { label: "Sourcing sur mesure", cta: "Décrire mon besoin", bullets: ["Produit introuvable ailleurs", "Origine & certifications sur mesure", "Accompagnement dédié", "Réponse sous 48 h"] },
  },
  expertise: {
    title: ["Deux expertises,", "une chaîne maîtrisée."],
    quotes: [
      { text: "« De la parcelle jusqu'au conteneur ; nous connaissons les producteurs par leur nom. »", by: "Ousmane BA · Cofondateur" },
      { text: "« Un sourcing avec le meilleur rapport qualité prix afin de vous démarquer de la concurrence. »", by: "Oumou Soumano · Cofondatrice" },
    ],
    founders: [
      { role: "Cofondateur · Filières et Sourcing", label: "AMONT", tags: ["Filières bio UE", "Coopératives", "Traçabilité"] },
      { role: "Cofondatrice · Supply chain & Retail", label: "AVAL", tags: ["Logistique", "Import", "Export"] },
    ],
    cta: "Échanger avec un expert",
  },
  suppliers: {
    title: ["Vous produisez en Afrique ?", "Accédez au marché européen."],
    becomeTitle: "Devenir fournisseur référencé",
    apply: "Candidater",
    alreadyTitle: "Déjà référencé ?",
    space: "Espace fournisseurs",
  },
  engagements: [
    "Fournisseurs audités sur place avant référencement",
    "Réponse à toute demande sous 24 à 48 h ouvrées",
    "Un devis unique : produits + logistique + incoterm",
    "Catalogue actualisé régulièrement",
  ],
  faq: {
    title: "Questions fréquentes",
    items: [
      { q: "Quels types de produits proposez-vous ?", a: "Notre catalogue couvre quatre familles : épicerie (épices, condiments, farines…), boissons (jus, infusions, sirops…), fruits & légumes (frais, séchés, transformés) et matières premières (huiles végétales, beurres, gommes…). Près de 50 références sont disponibles, et nous acceptons les demandes de sourcing sur mesure pour tout produit absent du catalogue." },
      { q: "Comment garantissez-vous la conformité aux normes européennes ?", a: "Chaque fournisseur est audité sur place par notre équipe avant d'être référencé. Pour chaque produit, nous évaluons les normes sanitaires (HACCP), la traçabilité, l'étiquetage et les certifications requises (Bio, Halal, ISO). Si un produit nécessite une mise à niveau, nous accompagnons le fournisseur dans ce processus avant toute commande." },
      { q: "Quels sont vos délais de réponse et de livraison ?", a: "Nous répondons à toute demande de devis sous 24 à 48 h ouvrées. Les délais de livraison varient selon le produit, le mode de transport et la destination · ils sont précisés dans chaque devis. Le fret maritime vers l'Europe occidentale prend en général 12 à 25 jours selon le port d'origine." },
      { q: "Quelles quantités minimum commandez-vous (MOQ) ?", a: "Les quantités minimum (MOQ) varient selon les produits et les fournisseurs. Elles sont indiquées dans le catalogue pour chaque référence, et précisées à la demande de devis. Pour les premières commandes ou les commandes tests, nous étudions chaque situation au cas par cas." },
      { q: "Quels incoterms proposez-vous ? Gérez-vous les formalités douanières ?", a: "Nous travaillons sur les principaux incoterms : EXW, FOB, CIF, CFR, DAP, DDP. Le plus adapté est proposé dans chaque devis. Nous prenons en charge les formalités d'export côté africain et, sur demande, accompagnons jusqu'à la livraison en entrepôt européen." },
      { q: "Est-il possible de commander des échantillons ou de visiter les fournisseurs ?", a: "L'envoi d'échantillons est possible pour la plupart de nos références · ils sont facturés au coût réel. Les visites fournisseurs sont organisées dans le cadre de partenariats établis : notre experte coordonne chaque visite pour garantir des échanges productifs et en phase avec vos exigences qualité." },
    ],
  },
  finalCta: {
    title: ["Votre prochain", "approvisionnement", "commence ici."],
    catalogue: "Accéder au catalogue",
    quote: "Demander un devis",
    expert: "Échanger avec l'experte",
  },
  footer: {
    tagline: "Intermédiation experte · sourcing de matières premières africaines pour l'Europe.",
    navTitle: "Navigation",
    links: ["Nos services", "Catalogue", "Notre expertise", "FAQ", "Contact"],
    supplierArea: "Espace fournisseurs",
    contactTitle: "Contact",
    legal: "© 2026 Funti World · Mentions légales · RGPD",
  },
  cookie: { title: "Ce site utilise des cookies", desc: "Des cookies analytiques améliorent votre expérience.", customize: "Personnaliser", refuse: "Tout refuser", accept: "Tout accepter" },
  basket: {
    title: "Ma demande de devis",
    selectedLabel: (n: number) => `${n} produit${n > 1 ? "s" : ""} sélectionné${n > 1 ? "s" : ""}`,
    empty: "Aucun produit ajouté.", priceOnQuote: "Prix sur devis",
    note: "Prix communiqués sur devis sous 24 à 48 h ouvrées.", cta: "Demander mon devis",
  },
  hint: {
    title: "Vous êtes producteur ou fournisseur ?",
    body: "Rejoignez le réseau Funti et proposez vos produits aux acheteurs européens.",
    apply: "Candidater", later: "Plus tard",
  },
};

const en: typeof fr = {
  nav: { services: "Services", catalogue: "Catalogue", expertise: "Expertise", contact: "Contact" },
  header: { suppliers: "Suppliers", talk: "Get in touch", request: "My request", supplierArea: "Supplier area", language: "Language" },
  hero: {
    kicker: "Sourcing · Export · Africa · Europe",
    title: "African raw materials and finished products: from source to your warehouse.",
    subtitle: "A single point of contact between your requirements and a network of audited suppliers.",
    ctaExpert: "Talk to an expert",
    ctaQuote: "Request a quote",
    imgAlt: "African spices and local produce",
  },
  figures: [
    { n: "24 years", tag: "Combined expertise" },
    { n: "14 years", tag: "In large-scale retail" },
    { n: "200+", tag: "Organisations supported" },
    { n: "EU Organic", tag: "Certified export" },
    { n: "2", tag: "Continents" },
  ],
  services: {
    title: ["Three barriers.", "Zero compromise."],
    pillars: [
      { tag: "Suppliers", title: "Audited on site", cta: "View the catalogue" },
      { tag: "Compliance", title: "EU standards guaranteed", cta: "Discuss your needs" },
      { tag: "Logistics", title: "Turnkey supply chain", cta: "Request a quote" },
    ],
  },
  catalogue: { title: "50+ references", full: "Full catalogue", view: "View product", add: "+ My request", added: "Added" },
  how: {
    title: "From your need to delivery.",
    start: "Get started",
    steps: ["Send us your requirement", "We select & verify", "Single quote within 48h", "End-to-end delivery"],
  },
  quote: {
    title: "Tell us what you need.",
    subtitle: "A reply within 48h, with no commitment, and a single point of contact from start to finish.",
    devis: { label: "Catalogue quote", cta: "Go to the form", bullets: ["Selection from the catalogue", "Volume & packaging", "Incoterm of your choice", "Reply within 48h"] },
    sourcing: { label: "Custom sourcing", cta: "Describe my need", bullets: ["A product you can't find elsewhere", "Custom origin & certifications", "Dedicated support", "Reply within 48h"] },
  },
  expertise: {
    title: ["Two areas of expertise,", "one fully controlled chain."],
    quotes: [
      { text: "“From the field to the container; we know the producers by name.”", by: "Ousmane BA · Co-founder" },
      { text: "“Sourcing with the best value for money to set you apart from the competition.”", by: "Oumou Soumano · Co-founder" },
    ],
    founders: [
      { role: "Co-founder · Supply chains & Sourcing", label: "UPSTREAM", tags: ["EU organic chains", "Cooperatives", "Traceability"] },
      { role: "Co-founder · Supply chain & Retail", label: "DOWNSTREAM", tags: ["Logistics", "Import", "Export"] },
    ],
    cta: "Talk to an expert",
  },
  suppliers: {
    title: ["Do you produce in Africa?", "Access the European market."],
    becomeTitle: "Become a referenced supplier",
    apply: "Apply",
    alreadyTitle: "Already referenced?",
    space: "Supplier area",
  },
  engagements: [
    "Suppliers audited on site before referencing",
    "Reply to any request within 24–48 business hours",
    "A single quote: products + logistics + incoterm",
    "Catalogue updated regularly",
  ],
  faq: {
    title: "Frequently asked questions",
    items: [
      { q: "What types of products do you offer?", a: "Our catalogue covers four families: grocery (spices, condiments, flours…), beverages (juices, infusions, syrups…), fruit & vegetables (fresh, dried, processed) and raw materials (vegetable oils, butters, gums…). Nearly 50 references are available, and we accept custom sourcing requests for any product not in the catalogue." },
      { q: "How do you guarantee compliance with European standards?", a: "Each supplier is audited on site by our team before being referenced. For each product, we assess health standards (HACCP), traceability, labelling and the required certifications (Organic, Halal, ISO). If a product needs upgrading, we support the supplier through this process before any order." },
      { q: "What are your response and delivery times?", a: "We reply to any quote request within 24 to 48 business hours. Delivery times vary by product, mode of transport and destination; they are specified in each quote. Sea freight to Western Europe generally takes 12 to 25 days depending on the port of origin." },
      { q: "What are your minimum order quantities (MOQ)?", a: "Minimum order quantities (MOQ) vary by product and supplier. They are indicated in the catalogue for each reference, and specified when you request a quote. For first or trial orders, we review each situation on a case-by-case basis." },
      { q: "Which incoterms do you offer? Do you handle customs formalities?", a: "We work with the main incoterms: EXW, FOB, CIF, CFR, DAP, DDP. The most suitable one is proposed in each quote. We handle export formalities on the African side and, on request, support delivery all the way to your European warehouse." },
      { q: "Can I order samples or visit suppliers?", a: "Samples can be sent for most of our references; they are charged at actual cost. Supplier visits are arranged within established partnerships: our expert coordinates each visit to ensure productive exchanges aligned with your quality requirements." },
    ],
  },
  finalCta: {
    title: ["Your next", "sourcing", "starts here."],
    catalogue: "Access the catalogue",
    quote: "Request a quote",
    expert: "Talk to the expert",
  },
  footer: {
    tagline: "Expert intermediation · sourcing African raw materials for Europe.",
    navTitle: "Navigation",
    links: ["Our services", "Catalogue", "Our expertise", "FAQ", "Contact"],
    supplierArea: "Supplier area",
    contactTitle: "Contact",
    legal: "© 2026 Funti World · Legal notice · GDPR",
  },
  cookie: { title: "This site uses cookies", desc: "Analytics cookies improve your experience.", customize: "Customise", refuse: "Reject all", accept: "Accept all" },
  basket: {
    title: "My quote request",
    selectedLabel: (n: number) => `${n} product${n > 1 ? "s" : ""} selected`,
    empty: "No product added.", priceOnQuote: "Price on quote",
    note: "Prices provided by quote within 24 to 48 business hours.", cta: "Request my quote",
  },
  hint: {
    title: "Are you a producer or supplier?",
    body: "Join the Funti network and offer your products to European buyers.",
    apply: "Apply", later: "Later",
  },
};

export const LANDING: Record<Lang, typeof fr> = { fr, en };
export const useLandingText = () => LANDING[useLang()];
