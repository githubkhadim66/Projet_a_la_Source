"""Insère le référentiel produits transmis par À la Source.

Usage : python -m app.seed_catalogue
Idempotent : une référence déjà présente est complétée, jamais dupliquée.
"""

import logging

from sqlalchemy import select

from app.catalogue_reel import PRODUITS_REELS
from app.db.session import SessionLocal
from app.models import Product, StockStatus, Supplier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alasource.catalogue")


def seed_catalogue() -> None:
    db = SessionLocal()
    try:
        supplier = db.scalar(select(Supplier).order_by(Supplier.id))
        if supplier is None:
            logger.error("Aucun fournisseur en base — lancez d'abord `python -m app.initial_data`.")
            return

        base_position = db.scalar(select(Product.catalogue_position).order_by(
            Product.catalogue_position.desc()
        )) or 0

        crees = completes = 0
        for offset, (ref, name, category, origin, moq, description, benefits) in enumerate(PRODUITS_REELS):
            existant = db.scalar(select(Product).where(Product.ref == ref))
            if existant is None:
                db.add(Product(
                    supplier_id=supplier.id,
                    ref=ref, name=name, category=category, origin=origin, packaging=moq, moq="",
                    description=description, benefits=benefits,
                    image="",                       # photo à téléverser depuis l'espace admin
                    visible=True, featured=False, in_catalogue=True,
                    catalogue_position=base_position + offset + 1,
                    status=StockStatus.SUR_COMMANDE, delay="À confirmer",
                ))
                crees += 1
            else:
                # Complète les champs vides sans écraser une saisie de l'équipe
                if not existant.description and description:
                    existant.description = description
                if not existant.benefits and benefits:
                    existant.benefits = benefits
                completes += 1

        db.commit()
        logger.info("Catalogue À la Source : %d produits créés, %d déjà présents", crees, completes)

        sans_fiche = [p[1] for p in PRODUITS_REELS if not p[5]]
        if sans_fiche:
            logger.warning("Description à compléter par À la Source : %s", ", ".join(sans_fiche))
    finally:
        db.close()


if __name__ == "__main__":
    seed_catalogue()
