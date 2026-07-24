"""E-mails transactionnels E1/E2/E3 et notifications internes (CDC CATA-02, FOR-05).

Backend « console » par défaut (logs) ; SMTP en staging/production via variables d'env.
"""

import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("alasource.emails")

TEMPLATES = {
    "E1_catalogue": {
        "fr": ("Votre catalogue À la Source", "Bonjour {name},\n\nMerci pour votre intérêt. "
               "Votre catalogue est disponible ici : {link}\n\nL'équipe À la Source"),
        "en": ("Your À la Source catalogue", "Hello {name},\n\nThank you for your interest. "
               "Your catalogue is available here: {link}\n\nThe À la Source team"),
    },
    "E2_devis": {
        "fr": ("Votre demande de cotation est bien reçue", "Bonjour {name},\n\nNotre équipe vous revient "
               "sous 24 à 48 h ouvrées avec une proposition complète.\n\nL'équipe À la Source"),
        "en": ("Your quote request has been received", "Hello {name},\n\nOur team will get back to you "
               "within 24–48 business hours with a complete proposal.\n\nThe À la Source team"),
    },
    "E3_candidature": {
        "fr": ("Candidature fournisseur reçue", "Bonjour {name},\n\nMerci pour votre candidature. "
               "Chaque dossier est étudié avec attention : réponse sous 10 jours ouvrés.\n\nL'équipe À la Source"),
        "en": ("Supplier application received", "Hello {name},\n\nThank you for your application. "
               "Each file is carefully reviewed: reply within 10 business days.\n\nThe À la Source team"),
    },
    "supplier_credentials": {
        "fr": ("Vos accès — Espace fournisseurs À la Source", "Bonjour {name},\n\nVotre compte fournisseur "
               "est prêt.\nIdentifiant : {email}\nMot de passe temporaire : {password}\n\nConnectez-vous sur "
               "l'espace fournisseurs et conservez ce mot de passe en lieu sûr.\n\nL'équipe À la Source"),
        "en": ("Your access — À la Source supplier area", "Hello {name},\n\nYour supplier account is ready."
               "\nLogin: {email}\nTemporary password: {password}\n\nSign in to the supplier area and keep "
               "this password safe.\n\nThe À la Source team"),
    },
    "stock_reminder": {
        "fr": ("Actualisez vos stocks — À la Source", "Bonjour {name},\n\nCertaines de vos références "
               "n'ont pas été actualisées depuis plus de {days} jours :\n{products}\n\nConnectez-vous à "
               "votre espace fournisseurs pour mettre à jour stocks, disponibilités et délais.\n\n"
               "L'équipe À la Source"),
        "en": ("Update your stock — À la Source", "Hello {name},\n\nSome of your references have not "
               "been updated for more than {days} days:\n{products}\n\nSign in to your supplier area to "
               "update stock, availability and lead times.\n\nThe À la Source team"),
    },
    "rdv_confirmation": {
        "fr": ("Rendez-vous confirmé — À la Source", "Bonjour {name},\n\nVotre échange du {day} à {slot} "
               "({duration} min) est confirmé. Le lien de visioconférence suivra.\n\nL'équipe À la Source"),
        "en": ("Appointment confirmed — À la Source", "Hello {name},\n\nYour call on {day} at {slot} "
               "({duration} min) is confirmed. The video link will follow.\n\nThe À la Source team"),
    },
}


def _send(to: str, subject: str, body: str) -> None:
    if settings.EMAIL_BACKEND == "smtp" and settings.SMTP_HOST:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    else:
        logger.info("EMAIL [console] to=%s subject=%r\n%s", to, subject, body)


def send_template(template: str, to: str, language: str = "fr", **kwargs) -> None:
    subject, body = TEMPLATES[template].get(language, TEMPLATES[template]["fr"])
    try:
        _send(to, subject, body.format(**kwargs))
    except Exception:  # l'échec d'un e-mail ne doit jamais perdre un lead
        logger.exception("Échec d'envoi e-mail (%s → %s)", template, to)


def notify_internal(subject: str, body: str) -> None:
    """Notification interne immédiate à chaque nouvelle demande (CDC : zéro lead perdu)."""
    try:
        _send(settings.NOTIFY_INTERNAL_EMAIL, f"[À la Source] {subject}", body)
    except Exception:
        logger.exception("Échec de notification interne : %s", subject)
