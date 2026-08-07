"""Assigne une photo d'attente à chaque produit d'Oumou (référence ALS-...).

Les photos sont téléchargées depuis loremflickr (par mots-clés) puis stockées via le
service de stockage du projet (S3 si configuré, disque serveur sinon). Le champ `image`
du produit reçoit l'URL servie — remplaçable ensuite depuis l'espace admin.

Usage : python scripts/fetch_product_images.py
Idempotent : un produit qui a déjà une image téléversée est laissé tel quel.
"""

import os
import sys
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

# Rend le paquet `app` importable même lancé en tant que fichier (python scripts/…)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from app.db.session import SessionLocal  # noqa: E402
from app.models import Product  # noqa: E402
from app.services.storage import upload_product_image  # noqa: E402

# Mots-clés de recherche par référence produit (loremflickr renvoie une photo pertinente)
KEYWORDS: dict[str, str] = {
    "ALS-FON-001": "fonio,grain,cereal",
    "ALS-MAS-002": "dried,mango,fruit",
    "ALS-MAT-003": "mango,juice,puree",
    "ALS-CPD-004": "sweet,potato,chips",
    "ALS-BIS-005": "hibiscus,flower,tea",
    "ALS-MOR-006": "moringa,leaf,green",
    "ALS-BOU-007": "baobab,fruit,africa",
    "ALS-GOM-008": "okra,vegetable,green",
    "ALS-TCH-009": "chocolate,bar,cocoa",
    "ALS-PCA-010": "cocoa,powder,chocolate",
    "ALS-BCA-011": "cocoa,butter,block",
    "ALS-PDM-012": "moroccan,spices,market",
    "ALS-SUP-013": "superfood,powder,bowl",
    "ALS-SPI-014": "spirulina,powder,algae",
    "ALS-RIZ-015": "rice,grain,white",
    "ALS-SAN-016": "millet,semolina,couscous",
    "ALS-PBO-017": "baobab,powder,fruit",
    "ALS-PMO-018": "moringa,powder,green",
    "ALS-SOL-019": "african,fruit,market",
    "ALS-OUL-020": "african,food,grain",
    "ALS-SID-021": "african,vegetable,market",
    "ALS-MBU-022": "african,spice,food",
    "ALS-CBP-023": "banana,plantain,chips",
    "ALS-CAF-024": "coffee,beans,roasted",
    "ALS-INF-025": "herbal,tea,infusion",
}


def _download(keywords: str, seed: int) -> tuple[bytes, str] | None:
    # `lock` fige la photo par mot-clé+seed pour rester stable d'une exécution à l'autre
    url = f"https://loremflickr.com/600/450/{quote(keywords)}?lock={seed}"
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 alasource-catalogue"})
        with urlopen(req, timeout=15) as resp:  # noqa: S310 — URL construite en interne
            return resp.read(), resp.headers.get("content-type", "image/jpeg")
    except Exception as exc:  # noqa: BLE001
        print(f"  ! téléchargement impossible ({keywords}) : {exc}")
        return None


def run() -> None:
    db = SessionLocal()
    try:
        produits = db.scalars(
            select(Product).where(Product.ref.in_(KEYWORDS.keys())).order_by(Product.ref)
        ).all()
        if not produits:
            print("Aucun produit ALS-... trouvé — lancez d'abord `python -m app.seed_catalogue`.")
            return

        assignes = ignores = echecs = 0
        for i, product in enumerate(produits, start=1):
            # On ne touche pas à une photo déjà téléversée par l'équipe
            if product.image and (product.image.startswith("http") or product.image.startswith("/api")):
                ignores += 1
                continue

            keywords = KEYWORDS[product.ref]
            print(f"[{i}/{len(produits)}] {product.name} — {keywords}")
            result = _download(keywords, seed=product.id)
            if result is None:
                echecs += 1
                continue
            content, content_type = result
            try:
                product.image = upload_product_image(content, f"{product.ref}.jpg", content_type)
                db.commit()
                assignes += 1
            except Exception as exc:  # noqa: BLE001
                db.rollback()
                echecs += 1
                print(f"  ! stockage impossible : {exc}")
            time.sleep(0.4)  # courtoisie envers loremflickr

        print(f"\nTerminé : {assignes} photos assignées, {ignores} déjà présentes, {echecs} échecs.")
        if echecs:
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run()
