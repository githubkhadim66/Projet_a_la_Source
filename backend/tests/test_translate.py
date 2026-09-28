"""Traduction automatique du catalogue (DeepL simulé) : cache, repli sans clé, langues."""

import pytest

from app.core.config import settings
from app.services import translate


@pytest.fixture()
def fake_deepl(monkeypatch):
    """Remplace l'appel réseau DeepL : « Karité » → « Shea », compte les appels."""
    calls: list[list[str]] = []
    dictionary = {"Karité": "Shea", "Cajou": "Cashew"}

    def _fake(texts, target):
        calls.append(list(texts))
        return [dictionary.get(t, f"{t} [{target}]") for t in texts]

    monkeypatch.setattr(translate, "_deepl", _fake)
    monkeypatch.setattr(settings, "DEEPL_API_KEY", "cle-de-test:fx")
    return calls


def _names(client, lang: str | None = None) -> dict[str, str]:
    url = "/api/v1/catalogue/produits" + (f"?lang={lang}" if lang else "")
    return {p["source_name"]: p["name"] for p in client.get(url).json()}


def test_english_catalogue_is_translated_and_cached(seeded, fake_deepl):
    client = seeded["client"]
    assert _names(client, "en") == {"Karité": "Shea", "Cajou": "Cashew"}
    assert _names(client, "en") == {"Karité": "Shea", "Cajou": "Cashew"}
    # Second affichage servi par le cache : DeepL n'est appelé qu'une fois.
    assert len(fake_deepl) == 1


def test_french_and_unknown_languages_are_never_translated(seeded, fake_deepl):
    client = seeded["client"]
    assert _names(client) == {"Karité": "Karité", "Cajou": "Cajou"}
    assert _names(client, "fr") == {"Karité": "Karité", "Cajou": "Cajou"}
    assert _names(client, "xx") == {"Karité": "Karité", "Cajou": "Cajou"}
    assert fake_deepl == []


def test_without_key_the_site_stays_in_french(seeded, monkeypatch):
    monkeypatch.setattr(settings, "DEEPL_API_KEY", "")
    assert _names(seeded["client"], "en") == {"Karité": "Karité", "Cajou": "Cajou"}


def test_deepl_outage_keeps_original_text(seeded, monkeypatch):
    from urllib import error

    def _down(texts, target):
        raise error.URLError("réseau indisponible")

    monkeypatch.setattr(translate, "_deepl", _down)
    monkeypatch.setattr(settings, "DEEPL_API_KEY", "cle-de-test:fx")
    assert _names(seeded["client"], "en") == {"Karité": "Karité", "Cajou": "Cajou"}


def test_glossary_wins_over_deepl_for_categories(seeded, fake_deepl):
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        out = translate.translate_batch(db, ["Épicerie", "Karité"], "en")
    finally:
        db.close()
    assert out == {"Épicerie": "Grocery", "Karité": "Shea"}
    assert fake_deepl == [["Karité"]]  # la catégorie n'est jamais envoyée à DeepL
