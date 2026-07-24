"""Génère un aperçu local du catalogue PDF : python scripts/preview_catalogue.py"""

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Product
from app.services.catalogue_pdf import build_catalogue_pdf, edition_label

db = SessionLocal()
products = list(db.scalars(
    select(Product).where(Product.in_catalogue).order_by(Product.catalogue_position, Product.ref)
))
print(f"{len(products)} produits dans le catalogue")

pdf = build_catalogue_pdf(products)
with open("data/apercu_catalogue.pdf", "wb") as f:
    f.write(pdf)
print(f"PDF genere : {len(pdf) // 1024} Ko — {edition_label()}")
