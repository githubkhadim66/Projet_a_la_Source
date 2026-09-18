"""Planificateur minimal en arrière-plan (une tâche asyncio, aucune dépendance externe).

Exécute la maintenance de disponibilité produit une fois au démarrage (rattrapage si le
serveur était éteint), puis chaque jour à heure fixe (UTC). La base étant synchrone, le
travail réel tourne dans un thread pour ne pas bloquer la boucle d'événements.

Le backend tourne avec plusieurs workers : chaque worker lance sa boucle, mais la tâche
elle-même est idempotente (cf. app.services.maintenance), donc les doublons sont neutralisés.
"""

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from app.db.session import SessionLocal
from app.services.maintenance import run_expiry_maintenance

logger = logging.getLogger("alasource.scheduler")

DAILY_HOUR_UTC = 6  # ~08 h en France ; heure du balayage quotidien


def _run_once() -> None:
    db = SessionLocal()
    try:
        run_expiry_maintenance(db)
    finally:
        db.close()


def _seconds_until_next_run() -> float:
    now = datetime.now(UTC)
    nxt = now.replace(hour=DAILY_HOUR_UTC, minute=0, second=0, microsecond=0)
    if nxt <= now:
        nxt += timedelta(days=1)
    return (nxt - now).total_seconds()


async def _loop() -> None:
    # Rattrapage au démarrage, légèrement décalé pour laisser l'app s'initialiser.
    await asyncio.sleep(10)
    while True:
        try:
            await asyncio.to_thread(_run_once)
        except Exception:  # une boucle de fond ne doit jamais s'arrêter sur une erreur
            logger.exception("Erreur dans la boucle du planificateur")
        await asyncio.sleep(_seconds_until_next_run())


def start_scheduler() -> asyncio.Task:
    logger.info("Planificateur de disponibilité produit démarré (balayage quotidien à %sh UTC).", DAILY_HOUR_UTC)
    return asyncio.create_task(_loop())
