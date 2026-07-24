# PROMPT GÉNÉRAL — REFONTE DESIGN « À LA SOURCE »
*(à coller tel quel dans Figma Make)*

---

Tu es directeur artistique senior avec 25 ans d'expérience en identité de marque et sites B2B premium (références : études Pentagram, sites Maison Margiela Business, rapports annuels suisses). Tu refais entièrement le design du site « À la Source » — société d'intermédiation en sourcing et export de matières premières africaines vers des acheteurs professionnels européens. Le site doit inspirer **confiance institutionnelle + matière + précision logistique**. Il ne doit ressembler ni à un template SaaS, ni à un site e-commerce, mais à un **document éditorial de maison de négoce**.

## 1. Concept directeur : « La Ligne de Route »

Le fil conducteur visuel du site est **la route commerciale Afrique → Europe**. Il se matérialise par un élément signature récurrent : **une fine ligne verticale terracotta (2px)** qui traverse les sections, ponctuée de points d'étape, comme un tracé de connaissement maritime. Chaque produit, chaque chiffre, chaque étape porte une **mention d'origine en typographie monospace** (ex : `SN · DAKAR · 14.69°N`), à la manière d'étiquettes d'expédition. C'est cet appareil typographique documentaire qui donne au site son caractère unique.

## 2. Tokens (inchangés mais enrichis)

- **Couleurs** : navy profond `#0d2265`, navy nuit `#080f2e`, terracotta `#C4613A`, encre `#0a0a0f`, gris texte `#64697d`, fond clair `#f4f5f9`, blanc `#ffffff`. Ajouter un seul ton : **terracotta pâle `#F3E4DC`** utilisé uniquement en fond de tags et de surlignage. Ratio strict 60 % blanc / 30 % navy / 10 % terracotta.
- **Typographie** : Playfair Display (display, 700–900, avec usage ponctuel de l'**italique** pour un mot-clé par titre), Inter (corps, 400–600), et **troisième voix : monospace** (`IBM Plex Mono` ou `JetBrains Mono`, 10–11px, uppercase, tracking 0.15em) pour tous les tags, origines, numéros, métadonnées. Cette voix mono est la nouveauté structurante : elle remplace tous les micro-labels actuels.
- **Échelle typo** : monter d'un cran partout. H1 hero `clamp(3.4rem, 6.5vw, 6rem)`, H2 sections `clamp(2.4rem, 4.5vw, 4rem)`, interlignage serré 1.02–1.08 sur les display.
- **Grille** : Swiss stricte, `gap-px` conservé, hover-invert blanc→navy conservé, `border-radius: 0` partout, aucun ombrage — le relief vient uniquement du contraste et des filets.

## 3. Règles immuables (ne jamais transgresser)

1. Zéro prix affiché publiquement — toujours « Prix sur devis ».
2. Zéro nom de fournisseur visible côté public.
3. Pas de « Fournisseurs » dans la nav principale (lien discret à droite uniquement).
4. Boutons rectangulaires nets, radius 0, sans ombre.
5. Aucun dégradé décoratif hors overlay photo du hero. Aucun glassmorphism, aucun emoji, aucune icône colorée.

## 4. Motion (globale, sobre)

Un seul système : **reveal au scroll** (translateY 24px + fade, 500ms, ease-out, stagger 80ms sur les grilles) + hover-invert instantané (150ms) + la ligne de route qui **se dessine au scroll** (stroke-dashoffset). Respecter `prefers-reduced-motion`. Rien d'autre — pas de parallaxe, pas de compteurs animés criards (les chiffres clés peuvent compter une seule fois, discrètement, 800ms).

---

## 5. Refonte section par section

### S1 — Header
Deux niveaux. **Microbarre supérieure** (28px, fond navy `#0d2265`) : à gauche en mono blanc/60 `SOURCING · EXPORT · AFRIQUE — EUROPE`, à droite `Réponse sous 48h` + sélecteur `FR / EN`. **Barre principale** (64px, blanc) : logo « À la Source » en Playfair 800 navy avec un **point terracotta** après le mot Source ; nav Inter 13px medium (Services / Catalogue / Expertise / Contact) avec soulignement terracotta 2px au hover et sur l'item actif ; à droite lien discret « Fournisseurs » (mono, gris) + bouton navy « Échanger » qui passe terracotta au hover. Badge panier : pastille carrée terracotta `MA DEMANDE · N` en mono. Au scroll, le header gagne une bordure basse navy/10 et la microbarre se replie.

### S2 — Hero
Composition asymétrique dramatisée. Photo plein fond (épices, cadrage plus serré, plus sombre), overlay `from-#080f2e/98 via-#0d2265/75 to-transparent`. **La ligne de route naît ici** : filet vertical terracotta 2px à gauche du bloc texte, partant du haut et continuant hors de la section. Au-dessus du H1, en mono blanc/50 : `— DE LA PARCELLE AU CONTENEUR · 14.69°N → 48.85°N`. H1 Playfair blanc `clamp(3.4rem,6.5vw,6rem)`, interligne 1.03, avec « la source » en *italique* : « Matières premières africaines — de *la source* à votre entrepôt. » Sous-titre Inter 16px blanc/60, max 46ch. CTA 1 terracotta plein « Échanger avec un expert », CTA 2 lien blanc souligné « Demander une cotation → ». En bas à droite du hero, une **fiche d'expédition décorative** en mono blanc/35 sur 3 lignes (`ORIGINE : AFRIQUE DE L'OUEST / DEST. : UE / STATUT : AUDITÉ`) encadrée d'un filet blanc/20 — l'élément signature du site. Hauteur `clamp(520px, 74vh, 760px)`.

### S3 — Chiffres clés
Inverser : **bandeau plein fond navy `#0d2265`**, pleine largeur, la ligne de route le traverse verticalement. 4 colonnes séparées par filets blanc/10. Chiffres Playfair 900 blanc `clamp(3rem,5vw,4.5rem)`, labels en mono terracotta 10px uppercase. Chaque chiffre porte au-dessus un micro-index mono blanc/30 (`FIG. 01` … `FIG. 04`). Comptage animé une fois à l'entrée.

### S4 — Services « Trois barrières. Zéro compromis. »
Titre mis en scène sur deux lignes : « Trois barrières. » en Playfair romain navy / « *Zéro compromis.* » en italique terracotta, aligné gauche avec la ligne de route qui passe devant. Grille 3 cards `gap-px` conservée : icône Lucide navy trait fin, tag en mono sur fond terracotta pâle `#F3E4DC`, titre Playfair 1.5rem, CTA flèche. Numéros `01/02/03` en mono 11px top-right (pas en 4rem : ici l'ordre n'est pas une séquence, on reste discret). Hover-invert complet blanc→navy conservé, **avec apparition d'un filet supérieur terracotta 2px** sur la card survolée.

### S5 — Catalogue teaser
Passage en **grille éditoriale** : le premier produit devient une **card featured** occupant 2 colonnes × 2 rangées (photo large, nom en Playfair 2rem, origine en mono terracotta `BF · BOBO-DIOULASSO`), les 5 autres en cards standard. Sur chaque card : photo 4:3 duotone léger au repos (saturation -20 %) qui reprend ses couleurs au hover, tag catégorie en mono, **bandeau origine en mono gris** sous le nom, bouton « + Ma demande » carré qui devient navy « Ajouté ✓ ». Titre de section : « 50+ références » avec « références » en italique, CTA terracotta « Catalogue complet → ». Aucune mention de prix.

### S6 — Processus « De votre besoin à la livraison. »
Remplacer la grille 2×2 pâle par une **timeline horizontale reliée** : les 4 étapes sur une ligne continue terracotta 2px (la ligne de route à l'horizontale), points d'étape carrés navy 10px, la ligne se dessine au scroll. Ici les numéros `01 → 04` en mono terracotta sont légitimes (vraie séquence) et bien visibles au-dessus de chaque étape. Icônes Lucide navy, titres Inter 600, une ligne de description max. Sous la timeline, mention mono grise : `DEVIS UNIQUE · PRODUITS + LOGISTIQUE + INCOTERM`. Colonne gauche : titre Playfair + lien « Démarrer → » conservés. Sur mobile, la timeline devient verticale et rejoint la ligne de route.

### S7 — Demande de devis (fond navy)
Côté gauche, remplacer le vide textuel par un **grand « 48h » en Playfair 900 blanc/8** (≈12rem) posé en arrière-plan derrière le H2, façon filigrane de document douanier — le H2 « Dites-nous ce qu'il vous faut. » passe devant en blanc plein. Les 3 mini-stats en dessous en mono (48H / RÉPONSE · 0 / ENGAGEMENT · 1 / INTERLOCUTEUR), séparées par des filets blanc/10. Côté droit : les 2 onglets conservés, mais l'onglet actif souligné d'un filet terracotta 2px, bullets avec ✓ terracotta, CTA blanc plein qui passe terracotta au hover.

### S8 — Expertise
Bios ramenées à **une seule ligne + 3 tags mono**. Pullquote agrandie : Playfair italique `clamp(1.6rem,2.5vw,2.2rem)` navy sur fond `#f4f5f9`, filet gauche terracotta 3px, attribution en mono. Les 2 cards fondateurs : **monogrammes typographiques** (« OB » / « OS » en Playfair 900 navy 4rem dans un carré filet navy/15 — pas de photo tant qu'il n'y a pas de vrais portraits ; si portraits fournis, les traiter en **duotone navy**), labels `AMONT` / `AVAL` en mono sur fond terracotta pâle, tags en mono gris. La ligne de route relie visuellement AMONT → AVAL entre les deux cards. CTA navy conservé.

### S9 — Fournisseurs (fond `#080f2e`)
Donner de la matière : en fond, **motif topographique très subtil** (courbes de niveau en traits blanc/4, SVG). Titre « Vous produisez en Afrique ? » en Playfair blanc 3rem. Les 2 cards gagnent chacune : un index mono terracotta (`RÉFÉRENCEMENT` / `ESPACE PARTENAIRE`), 2 lignes de bénéfices avec ✓, et leurs boutons actuels (blanc plein / outline blanc). Filets blanc/10, hover blanc/5.

### S10 — Preuve sociale
Témoignages **raccourcis à 2 phrases max**. Cards blanches `gap-px` sur fond `#f4f5f9` : guillemet Playfair terracotta/20 en 5rem, citation Inter 15px, attribution en deux niveaux — nom + fonction en Inter 600, puis **entreprise + pays en mono gris** (`BIOIMPORT GMBH · ALLEMAGNE`). La bande des 4 engagements passe sur **fond navy pleine largeur** : ✓ terracotta, textes blancs Inter 14px, séparés par filets blanc/10 — elle ferme la section comme un cachet de garantie.

### S11 — FAQ
Conserver la sobriété, ajouter la voix documentaire : chaque question précédée d'un index mono terracotta (`Q.01` … `Q.06`), question en Inter 600 navy, chevron remplacé par un **+ qui pivote en ×**, réponse en `#64697d` avec filet gauche navy/10. Filets de séparation navy/8. Max-w-3xl centré, la ligne de route passe discrètement à gauche du bloc.

### S12 — CTA final (fond navy)
H2 Playfair `clamp(3rem,5.5vw,5.5rem)` blanc sur 3 lignes, « commence *ici*. » en italique terracotta. **La ligne de route se termine ici** : elle descend, marque un dernier point d'étape carré terracotta, et s'arrête sous le mot « ici » — conclusion visuelle du parcours. À droite, les 3 boutons empilés conservés (terracotta plein / outline blanc ×2), pleine largeur de colonne, avec flèche → qui se décale au hover. Texture grille opacity-0.025 conservée.

### S13 — Footer (fond `#080f2e`)
Structure 3 colonnes conservée, plus **rangée colophon** en bas : filet blanc/10, puis en mono blanc/35 sur une ligne : `À LA SOURCE — SOURCING & EXPORT · DAKAR — PARIS · RÉPONSE SOUS 48H`, copyright, liens légaux, sélecteur FR/EN, lien admin caché. Logo colonne 1 en Playfair avec le point terracotta.

---

## 6. Qualité & contraintes techniques

- React 18 + Tailwind + Lucide, un seul fichier par composant de section, aucun `border-radius`, aucune ombre portée.
- Responsive mobile-first : la ligne de route devient un simple filet gauche 2px sur mobile ; grilles 4→2→1 ; hero ≥ 520px ; typo fluide en `clamp()`.
- Accessibilité : contrastes AA minimum (terracotta sur blanc réservé aux gros corps et filets, jamais en texte 10px sur blanc — utiliser navy pour le petit texte), focus visible 2px terracotta, `prefers-reduced-motion` respecté, alt sur toutes les photos.
- Photos : Unsplash, dominantes chaudes terre/épices, traitées légèrement désaturées pour cohérence.
- Copy : voix active, phrases courtes, vocabulaire de négoce (cotation, incoterm, référencement, conteneur), jamais de superlatif marketing creux.

**Test final avant livraison** : masquer le logo — le site doit rester immédiatement identifiable grâce à la ligne de route, la voix monospace documentaire et le duo Playfair/navy-terracotta. Si une section pourrait appartenir à n'importe quel template SaaS, la retravailler.