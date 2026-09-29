"""Génération du catalogue PDF — mise en page professionnelle à la charte Funti.

Le document est produit à la volée depuis le référentiel : couverture, page de garde,
fiches produits ordonnées par l'administrateur, puis page de contact.
Disponible en français et en anglais (textes fixes + contenu produit traduit).

Conforme au CDC : aucun prix, aucun nom de fournisseur (LP-05 / CATA-05).
"""

import io
import logging
from datetime import date
from pathlib import Path
from types import SimpleNamespace
from urllib.request import Request, urlopen

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

logger = logging.getLogger("alasource.catalogue")

# ─── Charte graphique ────────────────────────────────────────────────────────

NAVY = HexColor("#0d2265")
DARK = HexColor("#080f2e")
TERRACOTTA = HexColor("#C4613A")
LIGHT = HexColor("#f4f5f9")
GREY = HexColor("#64697d")
BORDER = HexColor("#dfe3ee")
WHITE = HexColor("#ffffff")

SERIF = "Times-Bold"          # rappel de Playfair Display
SERIF_ITALIC = "Times-Italic"
SANS = "Helvetica"
SANS_BOLD = "Helvetica-Bold"

PAGE_W, PAGE_H = A4
MARGIN = 44
CONTENT_W = PAGE_W - 2 * MARGIN

MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin",
           "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

_image_cache: dict[str, ImageReader | None] = {}


# ─── Utilitaires ─────────────────────────────────────────────────────────────

def _load_image_bytes(image: str) -> bytes | None:
    """Charge les octets d'une photo produit selon sa forme.

    - URL complète (S3, CDN, http…) → téléchargement
    - chemin /api/v1/media/... (fichier hébergé localement) → lecture disque
    - identifiant Unsplash hérité → URL Unsplash
    """
    from app.core.config import settings

    # Fichier hébergé sur le serveur
    prefix = f"{settings.API_V1_PREFIX}/media/"
    if image.startswith(prefix):
        path = Path(settings.UPLOAD_DIR) / image[len(prefix):]
        return path.read_bytes() if path.is_file() else None

    # URL complète (S3, CDN…)
    url = image if image.startswith("http") else (
        f"https://images.unsplash.com/photo-{image}?w=500&h=350&fit=crop&auto=format&q=70"
    )
    req = Request(url, headers={"User-Agent": "alasource-catalogue/1.0"})
    with urlopen(req, timeout=8) as resp:  # noqa: S310 · source interne ou identifiant produit
        return resp.read()


def _fetch_image(image: str) -> ImageReader | None:
    """Photo du produit, avec cache et repli silencieux si indisponible."""
    if not image:
        return None
    if image in _image_cache:
        return _image_cache[image]
    try:
        data = _load_image_bytes(image)
        reader = ImageReader(io.BytesIO(data)) if data else None
    except Exception:
        logger.info("Photo indisponible pour le catalogue : %s", image[:60])
        reader = None
    _image_cache[image] = reader
    return reader


def _wrap(text: str, font: str, size: float, max_width: float, max_lines: int = 2) -> list[str]:
    """Découpe un texte en lignes tenant dans `max_width`."""
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
        if len(lines) == max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    if lines and len(lines) == max_lines:
        # Ellipse si le texte déborde encore
        last = lines[-1]
        while stringWidth(last + "…", font, size) > max_width and len(last) > 1:
            last = last[:-1]
        if len(" ".join(lines)) < len(text):
            lines[-1] = last.rstrip() + "…"
    return lines


def spaced(text: str) -> str:
    """Capitales espacées de la charte (« NOS ENGAGEMENTS » → « N O S   E N G A G E M E N T S »)."""
    return "   ".join(" ".join(word) for word in text.upper().split())


# ─── Textes FR / EN ──────────────────────────────────────────────────────────

PDF_TEXT: dict[str, dict] = {
    "fr": {
        "months": MOIS_FR,
        "edition": lambda month, year: f"Édition {month} {year}",
        "tagline": "Sourcing & export de produits d'origine africaine",
        "title": ("Catalogue", "produits"),
        "count": lambda n: f"{n} référence{'s' if n > 1 else ''} disponibles",
        "families": ["Épicerie", "Boissons", "Fruits & légumes", "Matières premières"],
        "cover_line": "Un seul interlocuteur entre vos exigences et un réseau de fournisseurs audités.",
        "cover_price": "Prix communiqués sur devis sous 24 à 48 h ouvrées.",
        "headline": "De la source à votre entrepôt.",
        "about": (
            "Funti sélectionne, audite et référence des producteurs africains pour les acheteurs "
            "professionnels européens. Chaque fournisseur est évalué sur place avant tout référencement : "
            "normes sanitaires, traçabilité, certifications et capacité à tenir des volumes réguliers."
        ),
        "commitments_title": "Nos engagements",
        "commitments": [
            "Fournisseurs audités sur place avant référencement",
            "Réponse à toute demande sous 24 à 48 h ouvrées",
            "Un devis unique : produits + logistique + incoterm",
            "Conformité aux normes européennes (HACCP, Bio UE, Halal)",
        ],
        "families_title": "Les familles de ce catalogue",
        "other_category": "Autres",
        "how_title": "Comment commander ?",
        "how_steps": [
            "Repérez les références qui vous intéressent dans les pages suivantes.",
            "Transmettez-nous votre besoin (volume, conditionnement, incoterm) via le formulaire de cotation.",
            "Vous recevez un devis unique sous 24 à 48 h ouvrées, logistique comprise.",
        ],
        "footer": "Prix sur devis · contact@funtiworld.com · funtiworld.com",
        "products_title": "Nos références",
        "range": lambda a, b, n: f"{a}–{b} sur {n}",
        "reference": "Référence",
        "origin": lambda o: f"Origine : {o}",
        "benefits": "Bienfaits",
        "packaging": "Conditionnement",
        "moq": "MOQ",
        "availability": "Disponibilité",
        "on_request": "Sur demande",
        "status": {},
        "price_on_quote": "PRIX SUR DEVIS",
        "back_title": ("Votre prochain", "approvisionnement", "commence ici."),
        "back_blocks": [
            ("Demander une cotation", "Sélectionnez vos références et recevez un devis unique sous 24 à 48 h ouvrées."),
            ("Sourcing sur mesure", "Un produit absent de ce catalogue ? Notre équipe le source pour vous."),
            ("Échanger avec l'experte", "30 minutes pour cadrer votre projet d'importation, sans engagement."),
        ],
        "disclaimer": "Document non contractuel. Prix, disponibilités et délais communiqués sur devis.",
        "doc_title": "Catalogue Funti",
        "doc_subject": "Catalogue produits · sourcing & export de produits d'origine africaine",
    },
    "en": {
        "months": ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"],
        "edition": lambda month, year: f"{month} {year} edition",
        "tagline": "Sourcing & export of products of African origin",
        "title": ("Product", "catalogue"),
        "count": lambda n: f"{n} product{'s' if n > 1 else ''} available",
        "families": ["Grocery", "Beverages", "Fruits & vegetables", "Raw materials"],
        "cover_line": "A single point of contact between your requirements and a network of audited suppliers.",
        "cover_price": "Prices provided on quotation within 24 to 48 business hours.",
        "headline": "From the source to your warehouse.",
        "about": (
            "Funti selects, audits and lists African producers for European professional buyers. "
            "Every supplier is assessed on site before being listed: food safety standards, traceability, "
            "certifications and the ability to supply regular volumes."
        ),
        "commitments_title": "Our commitments",
        "commitments": [
            "Suppliers audited on site before being listed",
            "An answer to every request within 24 to 48 business hours",
            "A single quotation: products + logistics + Incoterm",
            "Compliance with European standards (HACCP, EU Organic, Halal)",
        ],
        "families_title": "Product families in this catalogue",
        "other_category": "Other",
        "how_title": "How to order?",
        "how_steps": [
            "Spot the products that interest you in the following pages.",
            "Send us your needs (volume, packaging, Incoterm) through the quotation form.",
            "You receive a single quotation within 24 to 48 business hours, logistics included.",
        ],
        "footer": "Price on quotation · contact@funtiworld.com · funtiworld.com",
        "products_title": "Our products",
        "range": lambda a, b, n: f"{a}–{b} of {n}",
        "reference": "Product",
        "origin": lambda o: f"Origin: {o}",
        "benefits": "Benefits",
        "packaging": "Packaging",
        "moq": "MOQ",
        "availability": "Availability",
        "on_request": "On request",
        "status": {"En stock": "In stock", "Sur commande": "Made to order", "Rupture": "Out of stock"},
        "price_on_quote": "PRICE ON QUOTATION",
        "back_title": ("Your next", "supply", "starts here."),
        "back_blocks": [
            ("Request a quotation",
             "Select your products and receive a single quotation within 24 to 48 business hours."),
            ("Custom sourcing", "A product missing from this catalogue? Our team will source it for you."),
            ("Talk with our expert", "30 minutes to frame your import project, with no commitment."),
        ],
        "disclaimer": "Non-contractual document. Prices, availability and lead times provided on quotation.",
        "doc_title": "Funti catalogue",
        "doc_subject": "Product catalogue · sourcing & export of products of African origin",
    },
}

LANGS = tuple(PDF_TEXT)


def _text(lang: str) -> dict:
    return PDF_TEXT.get(lang, PDF_TEXT["fr"])


def edition_label(day: date | None = None, lang: str = "fr") -> str:
    d = day or date.today()
    t = _text(lang)
    return t["edition"](t["months"][d.month - 1], d.year)


# ─── Pages ───────────────────────────────────────────────────────────────────

def _cover(c: canvas.Canvas, t: dict, edition: str, total: int) -> None:
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Filets d'accent
    c.setFillColor(TERRACOTTA)
    c.rect(0, PAGE_H - 8, PAGE_W, 8, stroke=0, fill=1)
    c.rect(MARGIN, PAGE_H - 200, 54, 3, stroke=0, fill=1)

    c.setFillColor(WHITE)
    c.setFont(SERIF, 46)
    c.drawString(MARGIN, PAGE_H - 168, "Funti")

    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 11.5)
    c.drawString(MARGIN, PAGE_H - 232, t["tagline"])

    # Bloc titre
    c.setFillColor(WHITE)
    c.setFont(SERIF, 34)
    c.drawString(MARGIN, PAGE_H - 360, t["title"][0])
    c.setFont(SERIF, 34)
    c.drawString(MARGIN, PAGE_H - 400, t["title"][1])

    c.setFillColor(TERRACOTTA)
    c.setFont(SANS_BOLD, 11)
    c.drawString(MARGIN, PAGE_H - 436, edition.upper())

    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 10.5)
    c.drawString(MARGIN, PAGE_H - 462, t["count"](total))

    # Bandeau des familles
    y = 168
    c.setFillColor(HexColor("#131c44"))
    c.rect(0, 0, PAGE_W, y, stroke=0, fill=1)
    c.setFillColor(HexColor("#5f6a92"))
    c.setFont(SANS_BOLD, 8)
    c.drawString(MARGIN, y - 34, "    ·    ".join(spaced(f) for f in t["families"]))

    c.setFillColor(WHITE)
    c.setFont(SANS, 9.5)
    c.drawString(MARGIN, y - 78, t["cover_line"])
    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 9)
    c.drawString(MARGIN, y - 100, t["cover_price"])
    c.drawString(MARGIN, y - 122, "contact@funtiworld.com")

    c.showPage()


def _intro(c: canvas.Canvas, t: dict, edition: str, by_category: dict[str, int]) -> None:
    _header(c, edition)

    y = PAGE_H - 132
    c.setFillColor(NAVY)
    c.setFont(SERIF, 26)
    c.drawString(MARGIN, y, t["headline"])

    y -= 34
    c.setFillColor(GREY)
    c.setFont(SANS, 10)
    for line in _wrap(t["about"], SANS, 10, CONTENT_W, max_lines=4):
        c.drawString(MARGIN, y, line)
        y -= 16

    # Engagements
    y -= 22
    c.setFillColor(TERRACOTTA)
    c.setFont(SANS_BOLD, 9)
    c.drawString(MARGIN, y, spaced(t["commitments_title"]))
    y -= 24

    for item in t["commitments"]:
        c.setFillColor(TERRACOTTA)
        c.rect(MARGIN, y + 2, 4, 4, stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont(SANS, 10)
        c.drawString(MARGIN + 16, y, item)
        y -= 20

    # Répartition par famille
    y -= 26
    c.setFillColor(LIGHT)
    c.rect(MARGIN, y - 108, CONTENT_W, 122, stroke=0, fill=1)
    c.setFillColor(TERRACOTTA)
    c.rect(MARGIN, y - 108, 3, 122, stroke=0, fill=1)

    c.setFillColor(NAVY)
    c.setFont(SANS_BOLD, 9)
    c.drawString(MARGIN + 24, y - 6, spaced(t["families_title"]))

    col_x = MARGIN + 24
    col_w = (CONTENT_W - 48) / max(len(by_category), 1)
    for category, count in sorted(by_category.items(), key=lambda kv: -kv[1]):
        c.setFillColor(NAVY)
        c.setFont(SERIF, 20)
        c.drawString(col_x, y - 48, str(count))
        c.setFillColor(GREY)
        c.setFont(SANS, 8)
        # Le libellé passe à la ligne dans sa colonne (jamais sur la voisine).
        for i, line in enumerate(_wrap(category, SANS, 8, min(108, col_w - 8), max_lines=2)):
            c.drawString(col_x, y - 66 - i * 10, line)
        col_x += col_w

    # Mode d'emploi
    y -= 150
    c.setFillColor(NAVY)
    c.setFont(SANS_BOLD, 10)
    c.drawString(MARGIN, y, t["how_title"])
    y -= 20
    for step, text in enumerate(t["how_steps"], start=1):
        c.setFillColor(TERRACOTTA)
        c.setFont(SANS_BOLD, 10)
        c.drawString(MARGIN, y, f"0{step}")
        c.setFillColor(GREY)
        c.setFont(SANS, 9.5)
        c.drawString(MARGIN + 26, y, text)
        y -= 18

    _footer(c, t, edition)
    c.showPage()


def _header(c: canvas.Canvas, edition: str) -> None:
    c.setFillColor(NAVY)
    c.setFont(SERIF, 15)
    c.drawString(MARGIN, PAGE_H - 52, "Funti")
    c.setFillColor(GREY)
    c.setFont(SANS, 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 52, edition)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.7)
    c.line(MARGIN, PAGE_H - 66, PAGE_W - MARGIN, PAGE_H - 66)


def _footer(c: canvas.Canvas, t: dict, edition: str, page_no: int | None = None) -> None:
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.7)
    c.line(MARGIN, 58, PAGE_W - MARGIN, 58)
    c.setFillColor(GREY)
    c.setFont(SANS, 7.5)
    c.drawString(MARGIN, 44, t["footer"])
    if page_no is not None:
        c.drawRightString(PAGE_W - MARGIN, 44, str(page_no))


# ─── Fiches produits ─────────────────────────────────────────────────────────

CARD_GAP = 20
CARD_W = (CONTENT_W - CARD_GAP) / 2
IMG_H = 92
CARD_H = 322          # 2 rangées tiennent entre l'en-tête (736) et le pied de page (66)
CARD_TOP = PAGE_H - 106
FOOTER_BAR = 26       # bandeau référence / prix sur devis en bas de fiche


def _product_card(c: canvas.Canvas, t: dict, product, x: float, y: float) -> None:
    """Dessine une fiche produit dont le coin haut-gauche est (x, y)."""
    # Cadre
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.setFillColor(WHITE)
    c.rect(x, y - CARD_H, CARD_W, CARD_H, stroke=1, fill=1)

    # Visuel
    image = _fetch_image(getattr(product, "image", "") or "")
    if image is not None:
        box_x, box_y, box_w, box_h = x + 1, y - IMG_H - 1, CARD_W - 2, IMG_H
        c.saveState()
        path = c.beginPath()
        path.rect(box_x, box_y, box_w, box_h)
        c.clipPath(path, stroke=0)
        # Recadrage « cover » : l'image remplit la zone, le débordement est rogné
        img_w, img_h = image.getSize()
        scale = max(box_w / img_w, box_h / img_h)
        draw_w, draw_h = img_w * scale, img_h * scale
        c.drawImage(image, box_x - (draw_w - box_w) / 2, box_y - (draw_h - box_h) / 2,
                    draw_w, draw_h, mask="auto")
        c.restoreState()
    else:
        c.setFillColor(LIGHT)
        c.rect(x + 1, y - IMG_H - 1, CARD_W - 2, IMG_H, stroke=0, fill=1)
        c.setFillColor(HexColor("#c3c9dd"))
        c.setFont(SERIF, 30)
        c.drawCentredString(x + CARD_W / 2, y - IMG_H / 2 - 12, (product.name or "?")[:1].upper())

    inner_x = x + 16
    inner_w = CARD_W - 32
    cursor = y - IMG_H - 22

    # Catégorie
    c.setFillColor(TERRACOTTA)
    c.setFont(SANS_BOLD, 7)
    c.drawString(inner_x, cursor, (product.category or t["reference"]).upper())
    cursor -= 15

    # Nom
    c.setFillColor(NAVY)
    c.setFont(SANS_BOLD, 10.5)
    for line in _wrap(product.name, SANS_BOLD, 10.5, inner_w, max_lines=2):
        c.drawString(inner_x, cursor, line)
        cursor -= 14

    # Origine
    if product.origin:
        c.setFillColor(GREY)
        c.setFont(SANS, 8.5)
        c.drawString(inner_x, cursor, t["origin"](product.origin))
        cursor -= 13

    # Description
    description = (getattr(product, "description", "") or "").strip()
    if description:
        cursor -= 6
        c.setFillColor(HexColor("#4b5168"))
        c.setFont(SANS, 7.4)
        for line in _wrap(description, SANS, 7.4, inner_w, max_lines=3):
            c.drawString(inner_x, cursor, line)
            cursor -= 9.5

    # Bienfaits — encadré accentué
    benefits = (getattr(product, "benefits", "") or "").strip()
    if benefits:
        lines = _wrap(benefits, SANS, 7.2, inner_w - 16, max_lines=2)
        block_h = 22 + len(lines) * 9.5
        block_top = cursor - 2
        c.setFillColor(HexColor("#f7f3ef"))
        c.rect(inner_x, block_top - block_h + 8, inner_w, block_h, stroke=0, fill=1)
        c.setFillColor(TERRACOTTA)
        c.rect(inner_x, block_top - block_h + 8, 2, block_h, stroke=0, fill=1)
        c.setFont(SANS_BOLD, 6.2)
        c.drawString(inner_x + 8, block_top - 4, spaced(t["benefits"]))
        c.setFillColor(HexColor("#6b5a4e"))
        c.setFont(SANS, 7.2)
        cursor = block_top - 6
        for line in lines:
            cursor -= 9.5
            c.drawString(inner_x + 8, cursor, line)
        cursor -= 14

    # Caractéristiques essentielles — ancrées au bas de la fiche pour un alignement régulier
    status = getattr(product.status, "value", str(product.status))
    rows = [
        (t["packaging"], getattr(product, "packaging", "") or t["on_request"]),
        (t["moq"], product.moq or t["on_request"]),
        (t["availability"], t["status"].get(status, status)),
    ]
    baseline = y - CARD_H + FOOTER_BAR + 14
    c.setStrokeColor(BORDER)
    c.line(inner_x, baseline + len(rows) * 13, inner_x + inner_w, baseline + len(rows) * 13)
    for offset, (label, value) in enumerate(reversed(rows)):
        row_y = baseline + offset * 13
        c.setFillColor(GREY)
        c.setFont(SANS, 7.8)
        c.drawString(inner_x, row_y, label)
        c.setFillColor(NAVY)
        c.setFont(SANS_BOLD, 7.8)
        c.drawRightString(inner_x + inner_w, row_y, str(value)[:26])

    # Pied de fiche : référence + prix sur devis
    c.setFillColor(LIGHT)
    c.rect(x + 1, y - CARD_H + 1, CARD_W - 2, FOOTER_BAR, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Courier-Bold", 7.5)
    c.drawString(inner_x, y - CARD_H + 11, product.ref)
    c.setFillColor(TERRACOTTA)
    c.setFont(SANS_BOLD, 7.5)
    c.drawRightString(inner_x + inner_w, y - CARD_H + 11, t["price_on_quote"])


def _product_pages(c: canvas.Canvas, t: dict, products: list, edition: str, start_page: int) -> int:
    page_no = start_page
    per_page = 4

    for index in range(0, len(products), per_page):
        chunk = products[index:index + per_page]
        _header(c, edition)

        c.setFillColor(NAVY)
        c.setFont(SERIF, 17)
        c.drawString(MARGIN, PAGE_H - 88, t["products_title"])
        c.setFillColor(GREY)
        c.setFont(SANS, 8)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 88,
                          t["range"](index + 1, min(index + per_page, len(products)), len(products)))

        for position, product in enumerate(chunk):
            col, row = position % 2, position // 2
            x = MARGIN + col * (CARD_W + CARD_GAP)
            y = CARD_TOP - row * (CARD_H + CARD_GAP)
            _product_card(c, t, product, x, y)

        _footer(c, t, edition, page_no)
        c.showPage()
        page_no += 1

    return page_no


def _back_cover(c: canvas.Canvas, t: dict, edition: str) -> None:
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(TERRACOTTA)
    c.rect(0, PAGE_H - 8, PAGE_W, 8, stroke=0, fill=1)

    c.setFillColor(WHITE)
    c.setFont(SERIF, 30)
    for i, line in enumerate(t["back_title"]):
        c.drawString(MARGIN, PAGE_H - 200 - i * 38, line)

    c.setFillColor(TERRACOTTA)
    c.rect(MARGIN, PAGE_H - 312, 54, 3, stroke=0, fill=1)

    y = PAGE_H - 372
    for title, text in t["back_blocks"]:
        c.setFillColor(WHITE)
        c.setFont(SANS_BOLD, 11)
        c.drawString(MARGIN, y, title)
        c.setFillColor(HexColor("#8f98b8"))
        c.setFont(SANS, 9.5)
        for line in _wrap(text, SANS, 9.5, CONTENT_W - 40, max_lines=2):
            y -= 15
            c.drawString(MARGIN, y, line)
        y -= 32

    c.setFillColor(HexColor("#131c44"))
    c.rect(0, 0, PAGE_W, 150, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont(SERIF, 20)
    c.drawString(MARGIN, 104, "Funti")
    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 9)
    c.drawString(MARGIN, 80, "contact@funtiworld.com  ·  +33 1 00 00 00 00  ·  funtiworld.com")
    c.drawString(MARGIN, 62, edition)
    c.setFont(SANS, 7.5)
    c.drawString(MARGIN, 38, t["disclaimer"])

    c.showPage()


# ─── Point d'entrée ──────────────────────────────────────────────────────────

# Champs texte d'un produit traduits dans la version anglaise du catalogue.
_TRANSLATED_FIELDS = ("name", "category", "origin", "packaging", "moq", "description", "benefits")


def localize_products(db, products: list, lang: str) -> list:
    """Copies des produits avec leurs textes traduits (DeepL + cache) ; inchangés en français.

    Les objets en base ne sont jamais modifiés : le catalogue anglais est une vue.
    """
    if lang == "fr":
        return products
    from app.services.translate import translate_batch

    texts = [getattr(p, f, "") or "" for p in products for f in _TRANSLATED_FIELDS]
    tmap = translate_batch(db, texts, lang)
    localized = []
    for p in products:
        view = SimpleNamespace(ref=p.ref, image=p.image, status=p.status)
        for f in _TRANSLATED_FIELDS:
            value = getattr(p, f, "") or ""
            setattr(view, f, tmap.get(value, value) if value else value)
        localized.append(view)
    return localized


def build_catalogue_pdf(products: list, edition: str | None = None, lang: str = "fr") -> bytes:
    """Assemble le catalogue complet (FR ou EN) et renvoie le PDF en octets.
    Les produits doivent déjà être dans la langue voulue (voir `localize_products`)."""
    t = _text(lang)
    edition = edition or edition_label(lang=lang)
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setTitle(f"{t['doc_title']} · {edition}")
    c.setAuthor("Funti World")
    c.setSubject(t["doc_subject"])

    by_category: dict[str, int] = {}
    for p in products:
        by_category[p.category or t["other_category"]] = by_category.get(p.category or t["other_category"], 0) + 1

    _cover(c, t, edition, len(products))
    _intro(c, t, edition, by_category)
    _product_pages(c, t, products, edition, start_page=3)
    _back_cover(c, t, edition)

    c.save()
    buffer.seek(0)
    return buffer.read()
