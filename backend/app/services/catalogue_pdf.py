"""Génération du catalogue PDF — mise en page professionnelle à la charte À la Source.

Le document est produit à la volée depuis le référentiel : couverture, page de garde,
fiches produits ordonnées par l'administrateur, puis page de contact.

Conforme au CDC : aucun prix, aucun nom de fournisseur (LP-05 / CATA-05).
"""

import io
import logging
from datetime import date
from pathlib import Path
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
    with urlopen(req, timeout=8) as resp:  # noqa: S310 — source interne ou identifiant produit
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


def edition_label(day: date | None = None) -> str:
    d = day or date.today()
    return f"Édition {MOIS_FR[d.month - 1]} {d.year}"


# ─── Pages ───────────────────────────────────────────────────────────────────

def _cover(c: canvas.Canvas, edition: str, total: int) -> None:
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Filets d'accent
    c.setFillColor(TERRACOTTA)
    c.rect(0, PAGE_H - 8, PAGE_W, 8, stroke=0, fill=1)
    c.rect(MARGIN, PAGE_H - 200, 54, 3, stroke=0, fill=1)

    c.setFillColor(WHITE)
    c.setFont(SERIF, 46)
    c.drawString(MARGIN, PAGE_H - 168, "À la Source")

    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 11.5)
    c.drawString(MARGIN, PAGE_H - 232, "Sourcing & export de produits d'origine africaine")

    # Bloc titre
    c.setFillColor(WHITE)
    c.setFont(SERIF, 34)
    c.drawString(MARGIN, PAGE_H - 360, "Catalogue")
    c.setFont(SERIF, 34)
    c.drawString(MARGIN, PAGE_H - 400, "produits")

    c.setFillColor(TERRACOTTA)
    c.setFont(SANS_BOLD, 11)
    c.drawString(MARGIN, PAGE_H - 436, edition.upper())

    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 10.5)
    c.drawString(MARGIN, PAGE_H - 462, f"{total} référence{'s' if total > 1 else ''} disponibles")

    # Bandeau des familles
    y = 168
    c.setFillColor(HexColor("#131c44"))
    c.rect(0, 0, PAGE_W, y, stroke=0, fill=1)
    c.setFillColor(HexColor("#5f6a92"))
    c.setFont(SANS_BOLD, 8)
    familles = "    ·    ".join([
        "É P I C E R I E", "B O I S S O N S", "F R U I T S  &  L É G U M E S", "M A T I È R E S  P R E M I È R E S",
    ])
    c.drawString(MARGIN, y - 34, familles)

    c.setFillColor(WHITE)
    c.setFont(SANS, 9.5)
    c.drawString(MARGIN, y - 78, "Un seul interlocuteur entre vos exigences et un réseau de fournisseurs audités.")
    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 9)
    c.drawString(MARGIN, y - 100, "Prix communiqués sur devis sous 24 à 48 h ouvrées.")
    c.drawString(MARGIN, y - 122, "contact@alasource.fr")

    c.showPage()


def _intro(c: canvas.Canvas, edition: str, by_category: dict[str, int]) -> None:
    _header(c, edition)

    y = PAGE_H - 132
    c.setFillColor(NAVY)
    c.setFont(SERIF, 26)
    c.drawString(MARGIN, y, "De la source à votre entrepôt.")

    y -= 34
    c.setFillColor(GREY)
    c.setFont(SANS, 10)
    for line in _wrap(
        "À la Source sélectionne, audite et référence des producteurs africains pour les acheteurs "
        "professionnels européens. Chaque fournisseur est évalué sur place avant tout référencement : "
        "normes sanitaires, traçabilité, certifications et capacité à tenir des volumes réguliers.",
        SANS, 10, CONTENT_W, max_lines=4,
    ):
        c.drawString(MARGIN, y, line)
        y -= 16

    # Engagements
    y -= 22
    c.setFillColor(TERRACOTTA)
    c.setFont(SANS_BOLD, 9)
    c.drawString(MARGIN, y, "N O S   E N G A G E M E N T S")
    y -= 24

    engagements = [
        "Fournisseurs audités sur place avant référencement",
        "Réponse à toute demande sous 24 à 48 h ouvrées",
        "Un devis unique : produits + logistique + incoterm",
        "Conformité aux normes européennes (HACCP, Bio UE, Halal)",
    ]
    for item in engagements:
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
    c.drawString(MARGIN + 24, y - 6, "L E S   F A M I L L E S   D E   C E   C A T A L O G U E")

    col_x = MARGIN + 24
    for category, count in sorted(by_category.items(), key=lambda kv: -kv[1]):
        c.setFillColor(NAVY)
        c.setFont(SERIF, 20)
        c.drawString(col_x, y - 48, str(count))
        c.setFillColor(GREY)
        c.setFont(SANS, 8)
        for i, line in enumerate(_wrap(category, SANS, 8, 108, max_lines=2)):
            c.drawString(col_x, y - 66 - i * 10, line)
        col_x += (CONTENT_W - 48) / max(len(by_category), 1)

    # Mode d'emploi
    y -= 150
    c.setFillColor(NAVY)
    c.setFont(SANS_BOLD, 10)
    c.drawString(MARGIN, y, "Comment commander ?")
    y -= 20
    for step, text in enumerate([
        "Repérez les références qui vous intéressent dans les pages suivantes.",
        "Transmettez-nous votre besoin (volume, conditionnement, incoterm) via le formulaire de cotation.",
        "Vous recevez un devis unique sous 24 à 48 h ouvrées, logistique comprise.",
    ], start=1):
        c.setFillColor(TERRACOTTA)
        c.setFont(SANS_BOLD, 10)
        c.drawString(MARGIN, y, f"0{step}")
        c.setFillColor(GREY)
        c.setFont(SANS, 9.5)
        c.drawString(MARGIN + 26, y, text)
        y -= 18

    _footer(c, edition)
    c.showPage()


def _header(c: canvas.Canvas, edition: str) -> None:
    c.setFillColor(NAVY)
    c.setFont(SERIF, 15)
    c.drawString(MARGIN, PAGE_H - 52, "À la Source")
    c.setFillColor(GREY)
    c.setFont(SANS, 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 52, edition)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.7)
    c.line(MARGIN, PAGE_H - 66, PAGE_W - MARGIN, PAGE_H - 66)


def _footer(c: canvas.Canvas, edition: str, page_no: int | None = None) -> None:
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.7)
    c.line(MARGIN, 58, PAGE_W - MARGIN, 58)
    c.setFillColor(GREY)
    c.setFont(SANS, 7.5)
    c.drawString(MARGIN, 44, "Prix sur devis · contact@alasource.fr · alasource.fr")
    if page_no is not None:
        c.drawRightString(PAGE_W - MARGIN, 44, str(page_no))


# ─── Fiches produits ─────────────────────────────────────────────────────────

CARD_GAP = 20
CARD_W = (CONTENT_W - CARD_GAP) / 2
IMG_H = 92
CARD_H = 322          # 2 rangées tiennent entre l'en-tête (736) et le pied de page (66)
CARD_TOP = PAGE_H - 106
FOOTER_BAR = 26       # bandeau référence / prix sur devis en bas de fiche


def _product_card(c: canvas.Canvas, product, x: float, y: float) -> None:
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
    c.drawString(inner_x, cursor, (product.category or "Référence").upper())
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
        c.drawString(inner_x, cursor, f"Origine : {product.origin}")
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
        c.drawString(inner_x + 8, block_top - 4, "B I E N F A I T S")
        c.setFillColor(HexColor("#6b5a4e"))
        c.setFont(SANS, 7.2)
        cursor = block_top - 6
        for line in lines:
            cursor -= 9.5
            c.drawString(inner_x + 8, cursor, line)
        cursor -= 14

    # Caractéristiques essentielles — ancrées au bas de la fiche pour un alignement régulier
    rows = [
        ("Conditionnement", product.moq or "Sur demande"),
        ("Disponibilité", getattr(product.status, "value", str(product.status))),
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
    c.drawRightString(inner_x + inner_w, y - CARD_H + 11, "PRIX SUR DEVIS")


def _product_pages(c: canvas.Canvas, products: list, edition: str, start_page: int) -> int:
    page_no = start_page
    per_page = 4

    for index in range(0, len(products), per_page):
        chunk = products[index:index + per_page]
        _header(c, edition)

        c.setFillColor(NAVY)
        c.setFont(SERIF, 17)
        c.drawString(MARGIN, PAGE_H - 88, "Nos références")
        c.setFillColor(GREY)
        c.setFont(SANS, 8)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 88,
                          f"{index + 1}–{min(index + per_page, len(products))} sur {len(products)}")

        for position, product in enumerate(chunk):
            col, row = position % 2, position // 2
            x = MARGIN + col * (CARD_W + CARD_GAP)
            y = CARD_TOP - row * (CARD_H + CARD_GAP)
            _product_card(c, product, x, y)

        _footer(c, edition, page_no)
        c.showPage()
        page_no += 1

    return page_no


def _back_cover(c: canvas.Canvas, edition: str) -> None:
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(TERRACOTTA)
    c.rect(0, PAGE_H - 8, PAGE_W, 8, stroke=0, fill=1)

    c.setFillColor(WHITE)
    c.setFont(SERIF, 30)
    c.drawString(MARGIN, PAGE_H - 200, "Votre prochain")
    c.drawString(MARGIN, PAGE_H - 238, "approvisionnement")
    c.drawString(MARGIN, PAGE_H - 276, "commence ici.")

    c.setFillColor(TERRACOTTA)
    c.rect(MARGIN, PAGE_H - 312, 54, 3, stroke=0, fill=1)

    y = PAGE_H - 372
    blocks = [
        ("Demander une cotation", "Sélectionnez vos références et recevez un devis unique sous 24 à 48 h ouvrées."),
        ("Sourcing sur mesure", "Un produit absent de ce catalogue ? Notre équipe le source pour vous."),
        ("Échanger avec l'experte", "30 minutes pour cadrer votre projet d'importation, sans engagement."),
    ]
    for title, text in blocks:
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
    c.drawString(MARGIN, 104, "À la Source")
    c.setFillColor(HexColor("#8f98b8"))
    c.setFont(SANS, 9)
    c.drawString(MARGIN, 80, "contact@alasource.fr  ·  +33 1 00 00 00 00  ·  alasource.fr")
    c.drawString(MARGIN, 62, edition)
    c.setFont(SANS, 7.5)
    c.drawString(MARGIN, 38, "Document non contractuel. Prix, disponibilités et délais communiqués sur devis.")

    c.showPage()


# ─── Point d'entrée ──────────────────────────────────────────────────────────

def build_catalogue_pdf(products: list, edition: str | None = None) -> bytes:
    """Assemble le catalogue complet et renvoie le PDF en octets."""
    edition = edition or edition_label()
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setTitle(f"Catalogue À la Source — {edition}")
    c.setAuthor("À la Source")
    c.setSubject("Catalogue produits — sourcing & export de produits d'origine africaine")

    by_category: dict[str, int] = {}
    for p in products:
        by_category[p.category or "Autres"] = by_category.get(p.category or "Autres", 0) + 1

    _cover(c, edition, len(products))
    _intro(c, edition, by_category)
    _product_pages(c, products, edition, start_page=3)
    _back_cover(c, edition)

    c.save()
    buffer.seek(0)
    return buffer.read()
