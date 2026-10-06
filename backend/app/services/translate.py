"""Moteur de traduction automatique du contenu (DeepL) avec cache en base.

- Chaque texte n'est traduit qu'une fois par langue cible, puis servi depuis le cache.
- Sans clé DeepL configurée (ou en cas d'erreur réseau), on renvoie le texte d'origine :
  le site continue de fonctionner (en français), sans jamais planter.
- La langue par défaut (français) n'est jamais traduite.
"""

import hashlib
import json
import logging
from urllib import error, parse, request

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.translation import Translation

logger = logging.getLogger("alasource.translate")

DEFAULT_LANG = "fr"
_DEEPL_TARGET = {"EN": "EN-GB"}  # DeepL préfère EN-GB/EN-US à « EN »

# Traductions validées des libellés fixes (catégories) : prioritaires sur DeepL et le cache,
# car un mot isolé est souvent mal interprété (« Épicerie » → « Grocery shop »).
GLOSSARY: dict[str, dict[str, str]] = {
    "EN": {
        "Épicerie": "Grocery",
        "Épices": "Spices",
        "Boissons": "Beverages",
        "Fruits & légumes": "Fruits & vegetables",
        "Matières premières": "Raw materials",
        "Superaliments": "Superfoods",
    },
}


def _hash(text: str, target: str) -> str:
    return hashlib.sha256(f"{target}\n{text}".encode()).hexdigest()


def _deepl(texts: list[str], target: str) -> list[str]:
    """Appelle l'API DeepL pour une liste de textes ; renvoie les traductions dans le même ordre."""
    data: list[tuple[str, str]] = [("target_lang", _DEEPL_TARGET.get(target, target))]
    data += [("text", t) for t in texts]  # DeepL conserve l'ordre des `text`
    req = request.Request(
        settings.DEEPL_API_URL,
        data=parse.urlencode(data).encode(),
        headers={
            "Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with request.urlopen(req, timeout=15) as resp:  # noqa: S310 (URL fixe, de confiance)
        payload = json.loads(resp.read().decode())
    return [tr["text"] for tr in payload["translations"]]


def translate_batch(db: Session, texts: list[str], target_lang: str) -> dict[str, str]:
    """Traduit une liste de textes vers `target_lang`. Renvoie {texte_source: traduction}.

    Les textes déjà en cache sont réutilisés ; seuls les manquants sont envoyés à DeepL,
    puis mis en cache. En français (défaut) ou sans clé DeepL : renvoie l'identité.
    """
    target = target_lang.upper()
    result: dict[str, str] = {t: t for t in texts}
    if target_lang.lower() == DEFAULT_LANG:
        return result
    glossary = GLOSSARY.get(target, {})
    for t in texts:
        if t in glossary:
            result[t] = glossary[t]
    uniq = {t for t in texts if t and t.strip() and t not in glossary}
    if not uniq:
        return result

    hash_of = {t: _hash(t, target) for t in uniq}
    rows = db.scalars(
        select(Translation).where(
            Translation.target_lang == target,
            Translation.source_hash.in_(list(hash_of.values())),
        )
    ).all()
    cached = {r.source_hash: r.translated_text for r in rows}
    for t, h in hash_of.items():
        if h in cached:
            result[t] = cached[h]

    missing = [t for t, h in hash_of.items() if h not in cached]
    if missing and settings.DEEPL_API_KEY:
        try:
            for tr, src in zip(_deepl(missing, target), missing, strict=False):
                result[src] = tr
                db.add(Translation(source_hash=hash_of[src], target_lang=target, source_text=src, translated_text=tr))
            db.commit()
        except (error.URLError, KeyError, ValueError, TimeoutError):
            logger.exception("Échec de traduction DeepL (le texte d'origine est conservé)")
            db.rollback()
        except SQLAlchemyError:
            # Deux requêtes simultanées ont pu mettre en cache le même texte : la traduction
            # obtenue reste valable pour cette réponse, le cache sera relu la fois suivante.
            logger.warning("Traduction déjà mise en cache par une requête concurrente")
            db.rollback()
    return result


# ─── Relecture et correction par l'admin ─────────────────────────────────────

def translation_details(db: Session, texts: list[str], target_lang: str) -> dict[str, tuple[str, str]]:
    """Comme `translate_batch`, mais précise l'origine de chaque traduction :
    {texte_source: (traduction, statut)} avec statut « manual » (corrigée par l'admin),
    « glossary » (libellé validé), « auto » (DeepL) ou « missing » (pas encore traduite,
    p. ex. sans clé DeepL)."""
    target = target_lang.upper()
    translated = translate_batch(db, texts, target_lang)
    glossary = GLOSSARY.get(target, {})
    uniq = {t for t in texts if t and t.strip()}
    rows = db.scalars(
        select(Translation).where(
            Translation.target_lang == target,
            Translation.source_hash.in_([_hash(t, target) for t in uniq]),
        )
    ).all()
    manual = {r.source_hash for r in rows if r.is_manual}
    cached = {r.source_hash for r in rows}
    details: dict[str, tuple[str, str]] = {}
    for t in uniq:
        h = _hash(t, target)
        status = ("glossary" if t in glossary else "manual" if h in manual
                  else "auto" if h in cached else "missing")
        details[t] = (translated.get(t, t), status)
    return details


def set_manual_translation(db: Session, source: str, target_lang: str, text: str) -> None:
    """Enregistre la traduction corrigée par l'admin (elle remplace celle de DeepL)."""
    target = target_lang.upper()
    h = _hash(source, target)
    row = db.scalar(select(Translation).where(Translation.source_hash == h, Translation.target_lang == target))
    if row is None:
        db.add(Translation(source_hash=h, target_lang=target, source_text=source,
                           translated_text=text, is_manual=True))
    else:
        row.translated_text = text
        row.is_manual = True


def reset_translation(db: Session, source: str, target_lang: str) -> None:
    """Oublie la traduction (corrigée ou non) : DeepL la recalculera au prochain affichage."""
    target = target_lang.upper()
    row = db.scalar(select(Translation).where(
        Translation.source_hash == _hash(source, target), Translation.target_lang == target))
    if row is not None:
        db.delete(row)
