"""Garde-fou du staging : liste de destinataires autorisés et préfixe d'objet."""

from app.core.config import settings
from app.services import emails


def _smtp_settings(monkeypatch, allowlist: str) -> list[str]:
    sent: list[str] = []

    class FakeSMTP:
        def __init__(self, *_args):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *_exc):
            return False

        def starttls(self):
            pass

        def login(self, *_args):
            pass

        def send_message(self, msg):
            sent.append(f"{msg['To']}|{msg['Subject']}")

    monkeypatch.setattr(emails.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(settings, "EMAIL_BACKEND", "smtp")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
    monkeypatch.setattr(settings, "EMAIL_ALLOWLIST", allowlist)
    monkeypatch.setattr(settings, "EMAIL_SUBJECT_PREFIX", "[STAGING] ")
    return sent


def test_allowlist_blocks_unlisted_recipients(monkeypatch):
    sent = _smtp_settings(monkeypatch, "@funtiworld.com, testeur@gmail.com")
    emails._send("k.assi@tropicalci.com", "Relance", "x")
    emails._send("Testeur@Gmail.com", "Devis", "x")
    emails._send("direction@funtiworld.com", "Alerte", "x")
    assert sent == ["Testeur@Gmail.com|[STAGING] Devis", "direction@funtiworld.com|[STAGING] Alerte"]


def test_empty_allowlist_sends_everything(monkeypatch):
    sent = _smtp_settings(monkeypatch, "")
    emails._send("client@exemple.fr", "Devis", "x")
    assert sent == ["client@exemple.fr|[STAGING] Devis"]


def test_domain_entry_does_not_match_lookalike(monkeypatch):
    sent = _smtp_settings(monkeypatch, "@funtiworld.com")
    emails._send("pirate@evilfuntiworld.com", "Devis", "x")
    assert sent == []
