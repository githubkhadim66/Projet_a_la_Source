"""Référentiel produits transmis par À la Source (liste d'Oumou Soumano).

Chaque entrée : (référence, nom, catégorie, origine, conditionnement, description, bienfaits)

Les descriptions et bienfaits renseignés ci-dessous portent sur des caractéristiques
nutritionnelles communément établies. Les entrées laissées vides sont à compléter
par À la Source : ce sont des produits dont la définition exacte doit être validée
en interne avant publication commerciale.

Les photos d'attente sont assignées séparément par `scripts/fetch_product_images.py`
et restent remplaçables depuis l'espace admin par la photo réelle du produit.

Usage : python -m app.seed_catalogue
"""

CATEGORIES = {
    "cereales": "Épicerie",
    "fruits": "Fruits & légumes",
    "boissons": "Boissons",
    "matieres": "Matières premières",
    "super": "Superaliments",
}

# ref, nom, catégorie, origine, MOQ, description, bienfaits
PRODUITS_REELS: list[tuple[str, str, str, str, str, str, str]] = [
    (
        "ALS-FON-001", "Fonio", "Épicerie", "Afrique de l'Ouest", "25 kg",
        "Céréale ancestrale d'Afrique de l'Ouest à très petits grains, cultivée sans intrants "
        "sur les plateaux sahéliens. Se prépare comme une semoule, en accompagnement ou en salade.",
        "Naturellement sans gluten, à index glycémique bas. Source de fibres et d'acides aminés "
        "soufrés (méthionine, cystéine) peu présents dans les autres céréales.",
    ),
    (
        "ALS-MAS-002", "Mangue séchée", "Fruits & légumes", "Sénégal", "10 kg",
        "Tranches de mangue mûre séchées à basse température, sans sucre ajouté ni conservateur. "
        "Variétés Kent et Keitt récoltées à maturité.",
        "Riche en fibres alimentaires, en vitamine A (bêta-carotène) et en vitamine C.",
    ),
    (
        "ALS-MAT-003", "Mangue transformée (jus, purée, confiture)", "Boissons", "Sénégal", "12 unités",
        "Gamme de préparations à base de mangue : jus pur, purée pasteurisée pour l'industrie "
        "agroalimentaire, et confiture artisanale.",
        "Source de vitamine C et d'antioxydants. La purée conserve les fibres du fruit entier.",
    ),
    (
        "ALS-CPD-004", "Chips de patate douce", "Épicerie", "Sénégal", "5 kg",
        "Rondelles fines de patate douce, croustillantes, en sachets prêts à la vente ou en vrac.",
        "Source de fibres et de bêta-carotène. Alternative aux chips de pomme de terre "
        "à index glycémique plus modéré.",
    ),
    (
        "ALS-BIS-005", "Bissap", "Boissons", "Sénégal", "10 kg",
        "Calices séchés d'hibiscus (Hibiscus sabdariffa), variété rouge foncé. Se consomme en "
        "infusion chaude ou froide, base de la boisson nationale sénégalaise.",
        "Riche en anthocyanes (pigments antioxydants) et en vitamine C. Naturellement sans caféine.",
    ),
    (
        "ALS-MOR-006", "Moringa", "Superaliments", "Sénégal", "5 kg",
        "Feuilles de Moringa oleifera séchées à l'ombre puis triées, en feuilles entières.",
        "Teneur élevée en protéines végétales, fer, calcium, vitamines A et C, "
        "et en composés antioxydants.",
    ),
    (
        "ALS-BOU-007", "Bouye (baobab)", "Superaliments", "Sénégal", "10 kg",
        "Pulpe du fruit du baobab (Adansonia digitata), appelée « bouye » en wolof. "
        "Se dissout dans l'eau ou le lait pour préparer boissons et desserts.",
        "Très riche en vitamine C, en fibres solubles et en calcium. "
        "Contient des prébiotiques naturels.",
    ),
    (
        "ALS-GOM-008", "Gombo", "Fruits & légumes", "Sénégal", "10 kg",
        "Gombo (okra) séché, entier ou en poudre, utilisé comme liant dans les sauces "
        "traditionnelles ouest-africaines.",
        "Riche en fibres solubles et en mucilages. Source de vitamine K et de folates.",
    ),
    (
        "ALS-TCH-009", "Tablettes de chocolat", "Épicerie", "Côte d'Ivoire", "50 unités",
        "Tablettes de chocolat élaborées à partir de fèves de cacao ouest-africaines, "
        "différents pourcentages de cacao disponibles.",
        "Le cacao est source de magnésium, de fer et de flavonoïdes. "
        "Teneur en sucre variable selon le pourcentage de cacao.",
    ),
    (
        "ALS-PCA-010", "Poudre de cacao", "Matières premières", "Côte d'Ivoire", "25 kg",
        "Cacao en poudre non sucré, obtenu après pressage et dégraissage de la fève. "
        "Destiné à la pâtisserie et à l'industrie agroalimentaire.",
        "Riche en magnésium, en fer et en flavonoïdes. Naturellement peu calorique sans sucre ajouté.",
    ),
    (
        "ALS-BCA-011", "Beurre de cacao", "Matières premières", "Côte d'Ivoire", "25 kg",
        "Matière grasse pressée à froid à partir de la fève de cacao. "
        "Usages alimentaire (chocolaterie) et cosmétique.",
        "Composé d'acides gras stables à l'oxydation. Utilisé en cosmétique "
        "pour ses propriétés émollientes.",
    ),
    (
        "ALS-PDM-012", "Produits du monde (Maroc, autres origines…)", "Épicerie",
        "Maroc et autres origines", "Sur demande",
        "Gamme complémentaire d'épicerie sourcée hors Afrique subsaharienne : "
        "Maroc et autres origines, selon les besoins de l'acheteur.",
        "",
    ),
    (
        "ALS-SUP-013", "Superaliments", "Superaliments", "Afrique de l'Ouest", "Sur demande",
        "Sélection d'aliments à forte densité nutritionnelle : baobab, moringa, spiruline, "
        "et autres références sur demande.",
        "Aliments retenus pour leur concentration en micronutriments "
        "(vitamines, minéraux, antioxydants).",
    ),
    (
        "ALS-SPI-014", "Spiruline", "Superaliments", "Sénégal", "5 kg",
        "Micro-algue Arthrospira platensis cultivée en bassins, séchée puis conditionnée "
        "en poudre ou en paillettes.",
        "Jusqu'à 60 % de protéines sur matière sèche. Source de fer, de bêta-carotène "
        "et de phycocyanine.",
    ),
    (
        "ALS-RIZ-015", "Riz Local", "Épicerie", "Sénégal", "50 kg",
        "Riz cultivé en Afrique de l'Ouest, principalement dans la vallée du fleuve Sénégal. "
        "Disponible en blanc ou semi-complet.",
        "Source de glucides complexes. La version semi-complète conserve fibres "
        "et minéraux du germe.",
    ),
    (
        "ALS-SAN-016", "Sankhal", "Épicerie", "Sénégal", "25 kg",
        "Brisures de mil transformées en semoule fine, base de nombreux plats sénégalais "
        "cuits à la vapeur.",
        "Naturellement sans gluten. Source de fibres et de glucides complexes.",
    ),
    (
        "ALS-PBO-017", "Poudre de bouye", "Superaliments", "Sénégal", "10 kg",
        "Pulpe de baobab tamisée et réduite en poudre fine, prête à l'emploi "
        "pour boissons, smoothies et préparations laitières.",
        "Très riche en vitamine C, en fibres et en calcium. Effet prébiotique reconnu.",
    ),
    (
        "ALS-PMO-018", "Poudre de moringa", "Superaliments", "Sénégal", "5 kg",
        "Feuilles de moringa séchées puis finement moulues, à incorporer dans les boissons, "
        "soupes et préparations culinaires.",
        "Concentrée en protéines végétales, fer, calcium et antioxydants.",
    ),
    (
        "ALS-SOL-019", "Solom", "Fruits & légumes", "Sénégal", "10 kg",
        "",  # définition à valider par À la Source
        "",
    ),
    (
        "ALS-OUL-020", "Oule", "Épicerie", "Sénégal", "10 kg",
        "",  # définition à valider par À la Source
        "",
    ),
    (
        "ALS-SID-021", "Sidem Mali", "Fruits & légumes", "Mali", "10 kg",
        "",  # définition à valider par À la Source
        "",
    ),
    (
        "ALS-MBU-022", "Mburake", "Épicerie", "Sénégal", "10 kg",
        "",  # définition à valider par À la Source
        "",
    ),
    (
        "ALS-CBP-023", "Chips de banane plantain", "Épicerie", "Côte d'Ivoire", "5 kg",
        "Rondelles de banane plantain croustillantes, salées ou nature, "
        "en sachets ou en vrac.",
        "Source de fibres, de potassium et de magnésium.",
    ),
    (
        "ALS-CAF-024", "Café d'Afrique de l'Est", "Boissons", "Afrique de l'Est", "25 kg",
        "Café arabica d'Afrique de l'Est, en grains verts ou torréfiés, "
        "profils aromatiques fruités et acidulés.",
        "Source naturelle de caféine et d'antioxydants (acides chlorogéniques).",
    ),
    (
        "ALS-INF-025", "Infusion Locale", "Boissons", "Sénégal", "5 kg",
        "Mélanges d'infusions à base de plantes locales : kinkeliba, citronnelle, "
        "menthe, hibiscus, selon les assemblages.",
        "Sans caféine. Apprécié pour ses composés antioxydants d'origine végétale.",
    ),
]
