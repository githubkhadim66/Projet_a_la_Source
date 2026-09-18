"""Tâches de maintenance quotidiennes liées à la fenêtre de disponibilité produit.

Distinct du rappel d'actualisation 14 j (FRS-05), qui reste manuel et inchangé.

Deux opérations, exécutées chaque jour :
  1. Alerte « 3 jours avant » : prévient le fournisseur ET l'équipe À la Source qu'un
     produit va se retirer du site.
  2. Retrait automatique : à l'échéance, le produit est archivé (corbeille) — il disparaît
     du site et du catalogue, comme un retrait manuel.

Idempotence (le backend tourne avec plusieurs workers) : chaque produit est « réclamé »
par un UPDATE conditionnel atomique ; seul le worker dont le rowcount vaut 1 envoie l'e-mail.
"""

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import Product
from app.services import emails

logger = logging.getLogger("alasource.maintenance")

EXPIRY_ALERT_DAYS = 3  # on prévient 3 jours avant le retrait


def _now_naive() -> datetime:
    # Les colonnes DateTime sont sans fuseau ; on compare donc avec un UTC naïf.
    return datetime.now(UTC).replace(tzinfo=None)


def _send_expiry_alerts(db: Session, now: datetime) -> int:
    soon = now + timedelta(days=EXPIRY_ALERT_DAYS)
    candidates = db.scalars(
        select(Product).where(
            Product.available_until.is_not(None),
            Product.archived_at.is_(None),
            Product.expiry_alert_sent_at.is_(None),
            Product.available_until <= soon,
            Product.available_until > now,
        )
    ).all()

    sent = 0
    for p in candidates:
        claimed = db.execute(
            update(Product)
            .where(Product.id == p.id, Product.expiry_alert_sent_at.is_(None))
            .values(expiry_alert_sent_at=now)
        ).rowcount
        if not claimed:
            db.rollback()  # un autre worker a déjà pris ce produit
            continue
        db.commit()
        date_str = f"{p.available_until:%d/%m/%Y}"
        days = max((p.available_until - now).days, 0)
        supplier = p.supplier
        if supplier and supplier.email:
            emails.send_template(
                "product_expiring", supplier.email, "fr",
                name=supplier.contact_name or supplier.name,
                product=p.name, ref=p.ref, date=date_str, days=days,
            )
        emails.notify_internal(
            f"Produit bientôt retiré · {p.name}",
            f"Le produit {p.name} ({p.ref}) du fournisseur "
            f"{supplier.name if supplier else '?'} se retirera du site le {date_str} "
            f"(dans {days} jour(s)), date de disponibilité atteinte.",
        )
        sent += 1
    return sent


def _withdraw_expired(db: Session, now: datetime) -> int:
    expired = db.scalars(
        select(Product).where(
            Product.available_until.is_not(None),
            Product.archived_at.is_(None),
            Product.available_until <= now,
        )
    ).all()

    withdrawn = 0
    for p in expired:
        claimed = db.execute(
            update(Product)
            .where(Product.id == p.id, Product.archived_at.is_(None))
            .values(archived_at=now)
        ).rowcount
        if not claimed:
            db.rollback()
            continue
        db.commit()
        date_str = f"{p.available_until:%d/%m/%Y}"
        supplier = p.supplier
        if supplier and supplier.email:
            emails.send_template(
                "product_withdrawn", supplier.email, "fr",
                name=supplier.contact_name or supplier.name,
                product=p.name, ref=p.ref, date=date_str,
            )
        emails.notify_internal(
            f"Produit retiré automatiquement · {p.name}",
            f"Le produit {p.name} ({p.ref}) du fournisseur "
            f"{supplier.name if supplier else '?'} a atteint sa date de disponibilité "
            f"({date_str}) et a été retiré du site (corbeille).",
        )
        withdrawn += 1
    return withdrawn


def run_expiry_maintenance(db: Session) -> dict[str, int]:
    """Exécute les deux opérations et renvoie un bilan. Ne lève jamais : une tâche de fond
    ne doit pas planter le processus."""
    now = _now_naive()
    try:
        alerted = _send_expiry_alerts(db, now)
        withdrawn = _withdraw_expired(db, now)
    except Exception:
        db.rollback()
        logger.exception("Échec de la maintenance de disponibilité produit")
        return {"alerted": 0, "withdrawn": 0}
    if alerted or withdrawn:
        logger.info("Maintenance disponibilité : %s alerte(s), %s retrait(s)", alerted, withdrawn)
    return {"alerted": alerted, "withdrawn": withdrawn}
