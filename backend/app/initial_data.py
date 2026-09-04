"""Données initiales : compte admin + référentiel de démonstration (fournisseurs, produits, vitrine).

Usage : python -m app.initial_data
Idempotent — ne crée rien qui existe déjà.
"""

import logging
import os
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import AdminUser, Product, StockStatus, Supplier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alasource.seed")

# Fournisseurs de démonstration (visibles uniquement côté admin — jamais en public)
SUPPLIERS = [
    {"name": "Coopérative Kaydara", "contact_name": "Amadou Diallo",
     "email": "contact@cooperative-kaydara.sn", "country": "Sénégal", "city": "Dakar",
     "categories": ["Matières premières", "Épicerie"]},
    {"name": "Sahel Vert SARL", "contact_name": "Mariam Koné",
     "email": "contact@sahelvert.ml", "country": "Mali", "city": "Bamako",
     "categories": ["Épicerie", "Boissons"]},
    {"name": "Kartoga SARL", "contact_name": "Fatou Mbaye",
     "email": "f.mbaye@kartoga.sn", "country": "Sénégal", "city": "Thiès",
     "categories": ["Épices"]},
    {"name": "Tropical Export CI", "contact_name": "Koffi Assi",
     "email": "k.assi@tropicalci.com", "country": "Côte d'Ivoire", "city": "Abidjan",
     "categories": ["Matières premières", "Fruits & légumes"]},
]

# (ref, name, origin, category, moq, image_unsplash, supplier_email, visible, featured,
#  stock_kg, status, delay, days_since_update)
PRODUCTS = [
    ("ALS-BS-001", "Beurre de karité brut", "Burkina Faso", "Matières premières", "25 kg",
     "1596040033229-a9821ebd058d", "contact@cooperative-kaydara.sn", True, True,
     4200, StockStatus.EN_STOCK, "2–3 semaines", 2),
    ("ALS-NC-002", "Noix de cajou W240", "Ghana", "Épicerie", "50 kg",
     "1567331711402-509c12c41959", "k.assi@tropicalci.com", True, True,
     12500, StockStatus.EN_STOCK, "1–2 semaines", 1),
    ("ALS-HP-003", "Huile de palme rouge", "Côte d'Ivoire", "Matières premières", "100 L",
     "1474979266404-7eaacbcd87c5", "k.assi@tropicalci.com", True, True,
     800, StockStatus.SUR_COMMANDE, "4–6 semaines", 9),
    ("ALS-GP-004", "Gingembre en poudre", "Sénégal", "Épices", "10 kg",
     "1615485290382-441e4d049cb5", "f.mbaye@kartoga.sn", True, True,
     2200, StockStatus.EN_STOCK, "2 semaines", 5),
    ("ALS-TB-005", "Tamarin en blocs", "Sénégal", "Épicerie", "20 kg",
     "1567359791513-36bd7e5d9be0", "f.mbaye@kartoga.sn", True, True,
     0, StockStatus.RUPTURE, "À confirmer", 25),
    ("ALS-FC-006", "Fève de cacao séchée", "Côte d'Ivoire", "Matières premières", "25 kg",
     "1606312619070-d0bde97f6a20", "k.assi@tropicalci.com", True, True,
     3600, StockStatus.EN_STOCK, "2–3 semaines", 3),
    ("ALS-MB-007", "Moringa en poudre bio", "Sénégal", "Épicerie", "5 kg",
     "1490818715543-0d65de6e3c38", "contact@sahelvert.ml", True, False,
     350, StockStatus.EN_STOCK, "3 semaines", 20),
    ("ALS-HB-008", "Hibiscus séché bio", "Sénégal", "Épicerie", "10 kg",
     "1558642891-54be180ea339", "contact@sahelvert.ml", True, False,
     1500, StockStatus.EN_STOCK, "2 semaines", 4),
    ("ALS-PB-009", "Poudre de baobab", "Mali", "Matières premières", "15 kg",
     "1571019613454-1cb2f99b2d8b", "contact@sahelvert.ml", True, False,
     900, StockStatus.EN_STOCK, "2–3 semaines", 6),
    ("ALS-GF-010", "Graines de fenugrec", "Éthiopie", "Épices", "10 kg",
     "1596040033229-a9821ebd058d", "contact@cooperative-kaydara.sn", False, False,
     600, StockStatus.SUR_COMMANDE, "4 semaines", 16),
    ("ALS-SS-011", "Sésame blanc décortiqué", "Burkina Faso", "Épicerie", "25 kg",
     "1567359791513-36bd7e5d9be0", "contact@cooperative-kaydara.sn", False, False,
     2800, StockStatus.EN_STOCK, "2 semaines", 7),
    ("ALS-GS-012", "Gingembre séché en tranches", "Côte d'Ivoire", "Épicerie", "10 kg",
     "1615485290382-441e4d049cb5", "k.assi@tropicalci.com", False, False,
     600, StockStatus.SUR_COMMANDE, "5 semaines", 30),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_email = os.environ.get("FIRST_ADMIN_EMAIL", "admin@alasource.example")
        admin_password = os.environ.get("FIRST_ADMIN_PASSWORD", "changeme-admin")
        if not db.scalar(select(AdminUser).where(AdminUser.email == admin_email)):
            db.add(AdminUser(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                full_name="Administrateur À la Source",
            ))
            logger.info("Compte admin créé : %s", admin_email)

        if os.environ.get("SEED_DEMO_DATA", "1") == "1":
            supplier_password = os.environ.get("SEED_SUPPLIER_PASSWORD", "fournisseur123")
            suppliers_by_email: dict[str, Supplier] = {}
            for data in SUPPLIERS:
                supplier = db.scalar(select(Supplier).where(Supplier.email == data["email"]))
                if supplier is None:
                    supplier = Supplier(**data, hashed_password=hash_password(supplier_password))
                    db.add(supplier)
                    db.flush()
                    logger.info("Fournisseur créé : %s", supplier.name)
                elif supplier.hashed_password is None:
                    supplier.hashed_password = hash_password(supplier_password)
                    logger.info("Mot de passe de démo défini pour : %s", supplier.name)
                suppliers_by_email[data["email"]] = supplier

            now = datetime.now(UTC)
            for (ref, name, origin, category, moq, image, supplier_email,
                 visible, featured, stock, stock_status, delay, days_ago) in PRODUCTS:
                existing = db.scalar(select(Product).where(Product.ref == ref))
                if existing is not None:
                    # Produit créé avant la migration vitrine : complète les champs manquants
                    if not existing.image:
                        existing.origin = existing.origin or origin
                        existing.category = existing.category or category
                        existing.packaging = existing.packaging or moq
                        existing.image = image
                        existing.featured = featured
                    continue
                db.add(Product(
                    supplier_id=suppliers_by_email[supplier_email].id,
                    ref=ref, name=name, origin=origin, category=category,
                    packaging=moq, moq="", image=image, visible=visible, featured=featured,
                    stock_kg=stock, status=stock_status, delay=delay,
                    updated_at=now - timedelta(days=days_ago),
                ))
            logger.info("Référentiel produits initialisé (%d références)", len(PRODUCTS))

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
