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


# ─── Catalogue PDF bilingue ──────────────────────────────────────────────────

def _pdf_text(pdf: bytes) -> str:
    """Texte des flux du PDF (ReportLab : ASCII85 + Flate)."""
    import base64
    import re
    import zlib

    out = []
    for m in re.finditer(rb"stream\r?\n(.*?)endstream", pdf, re.S):
        raw = m.group(1).strip()
        if raw.endswith(b"~>"):
            raw = raw[:-2]
        try:
            out.append(zlib.decompress(base64.a85decode(raw)).decode("latin-1"))
        except (ValueError, zlib.error):
            continue
    return "\n".join(out)


def _catalogue_token(client, language: str) -> str:
    payload = {
        "first_name": "Mary", "last_name": "Smith", "company": "Market Foods Ltd",
        "email": "mary@marketfoods.com", "country": "Royaume-Uni", "rgpd_consent": True, "language": language,
    }
    return client.post("/api/v1/leads/catalogue", json=payload).json()["download_url"].split("token=")[1]


def test_english_client_gets_english_catalogue(seeded, fake_deepl):
    client = seeded["client"]
    res = client.get("/api/v1/catalogue/download", params={"token": _catalogue_token(client, "en")})
    assert res.status_code == 200
    assert "catalogue-funti-en.pdf" in res.headers["content-disposition"]
    text = _pdf_text(res.content)
    assert "Our products" in text and "PRICE ON QUOTATION" in text
    assert "Shea" in text  # contenu produit traduit (DeepL simulé)
    assert "Nos références" not in text


def test_catalogue_language_can_be_chosen_explicitly(seeded, fake_deepl):
    client = seeded["client"]
    token = _catalogue_token(client, "en")
    res = client.get("/api/v1/catalogue/download", params={"token": token, "lang": "fr"})
    text = _pdf_text(res.content)
    assert "catalogue-funti-fr.pdf" in res.headers["content-disposition"]
    # Accents encodés dans le flux PDF : on vérifie sur la partie ASCII des mots.
    assert "Nos r" in text and "PRIX SUR DEVIS" in text and "Karit" in text


def test_admin_preview_in_english(seeded, fake_deepl):
    from tests.conftest import admin_token

    client = seeded["client"]
    headers = {"Authorization": f"Bearer {admin_token(client)}"}
    res = client.get("/api/v1/admin/catalogue/preview", params={"lang": "en"}, headers=headers)
    assert res.status_code == 200
    assert "Our products" in _pdf_text(res.content)
