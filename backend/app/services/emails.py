"""E-mails transactionnels E1/E2/E3 et notifications internes (CDC CATA-02, FOR-05).

Backend « console » par défaut (logs) ; SMTP en staging/production via variables d'env.
"""

import logging
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

# Pièce jointe = (nom de fichier, type MIME, contenu binaire).
Attachment = tuple[str, str, bytes]

logger = logging.getLogger("alasource.emails")

TEMPLATES = {
    "E1_catalogue": {
        "fr": ("Votre catalogue Funti", "Bonjour {name},\n\nMerci pour votre intérêt. "
               "Votre catalogue est disponible ici : {link}\n\nL'équipe Funti"),
        "en": ("Your Funti catalogue", "Hello {name},\n\nThank you for your interest. "
               "Your catalogue is available here: {link}\n\nThe Funti team"),
    },
    "E2_devis": {
        "fr": ("Votre demande de cotation est bien reçue", "Bonjour {name},\n\nNotre équipe vous revient "
               "sous 24 à 48 h ouvrées avec une proposition complète.\n\nL'équipe Funti"),
        "en": ("Your quote request has been received", "Hello {name},\n\nOur team will get back to you "
               "within 24–48 business hours with a complete proposal.\n\nThe Funti team"),
    },
    "E3_candidature": {
        "fr": ("Candidature fournisseur reçue", "Bonjour {name},\n\nMerci pour votre candidature. "
               "Chaque dossier est étudié avec attention : réponse sous 10 jours ouvrés.\n\nL'équipe Funti"),
        "en": ("Supplier application received", "Hello {name},\n\nThank you for your application. "
               "Each file is carefully reviewed: reply within 10 business days.\n\nThe Funti team"),
    },
    "supplier_credentials": {
        "fr": ("Vos accès — Espace fournisseurs Funti", "Bonjour {name},\n\nVotre compte fournisseur "
               "est prêt.\nIdentifiant : {email}\nMot de passe temporaire : {password}\n\nConnectez-vous sur "
               "l'espace fournisseurs et conservez ce mot de passe en lieu sûr.\n\nL'équipe Funti"),
        "en": ("Your access — Funti supplier area", "Hello {name},\n\nYour supplier account is ready."
               "\nLogin: {email}\nTemporary password: {password}\n\nSign in to the supplier area and keep "
               "this password safe.\n\nThe Funti team"),
    },
    "stock_reminder": {
        "fr": ("Actualisez vos stocks — Funti", "Bonjour {name},\n\nCertaines de vos références "
               "n'ont pas été actualisées depuis plus de {days} jours :\n{products}\n\nConnectez-vous à "
               "votre espace fournisseurs pour mettre à jour stocks, disponibilités et délais.\n\n"
               "L'équipe Funti"),
        "en": ("Update your stock — Funti", "Hello {name},\n\nSome of your references have not "
               "been updated for more than {days} days:\n{products}\n\nSign in to your supplier area to "
               "update stock, availability and lead times.\n\nThe Funti team"),
    },
    "proposal_rejected": {
        "fr": ("Votre proposition de produit · Funti", "Bonjour {name},\n\nMerci pour votre proposition « {product} ». Après examen, nous ne pouvons pas la retenir pour le moment.\n\nMotif : {reason}\n\nVous pouvez nous soumettre une nouvelle proposition ajustée à tout moment depuis votre espace fournisseur.\n\nL'équipe Funti"),
        "en": ("Your product proposal · Funti", "Hello {name},\n\nThank you for your proposal \"{product}\". After review, we are unable to accept it at this time.\n\nReason: {reason}\n\nYou are welcome to submit an adjusted proposal anytime from your supplier area.\n\nThe Funti team"),
    },
    "product_expiring": {
        "fr": ("Votre produit se retire bientôt du site · Funti", "Bonjour {name},\n\n"
               "Le produit « {product} » ({ref}) que vous avez déclaré disponible arrive à échéance : "
               "il se retirera automatiquement du site le {date} (dans {days} jour(s)).\n\n"
               "Pour le maintenir en ligne, connectez-vous à votre espace fournisseurs et prolongez sa "
               "date de disponibilité. Sans action de votre part, il sera retiré à cette date.\n\n"
               "L'équipe Funti"),
        "en": ("Your product is about to leave the site · Funti", "Hello {name},\n\n"
               "The product \"{product}\" ({ref}) you marked as available is nearing its end date: "
               "it will be automatically removed from the site on {date} (in {days} day(s)).\n\n"
               "To keep it online, sign in to your supplier area and extend its availability date. "
               "Without action, it will be removed on that date.\n\nThe Funti team"),
    },
    "product_withdrawn": {
        "fr": ("Votre produit a été retiré du site · Funti", "Bonjour {name},\n\n"
               "Le produit « {product} » ({ref}) a atteint sa date de disponibilité et a donc été "
               "retiré du site le {date}. Il reste conservé (corbeille) : vous pouvez le remettre en "
               "ligne en indiquant une nouvelle date de disponibilité depuis votre espace fournisseurs.\n\n"
               "L'équipe Funti"),
        "en": ("Your product has been removed from the site · Funti", "Hello {name},\n\n"
               "The product \"{product}\" ({ref}) reached its availability date and was removed from the "
               "site on {date}. It is kept (trash): you can bring it back online by setting a new "
               "availability date from your supplier area.\n\nThe Funti team"),
    },
    "rdv_confirmation": {
        "fr": ("Rendez-vous confirmé — Funti", "Bonjour {name},\n\nVotre échange du {day} à {slot} "
               "({duration} min) est confirmé. Le lien de visioconférence suivra.\n\nL'équipe Funti"),
        "en": ("Appointment confirmed — Funti", "Hello {name},\n\nYour call on {day} at {slot} "
               "({duration} min) is confirmed. The video link will follow.\n\nThe Funti team"),
    },
}


def _send(to: str, subject: str, body: str, attachments: list[Attachment] | None = None) -> None:
    if settings.EMAIL_BACKEND == "smtp" and settings.SMTP_HOST:
        if attachments:
            msg = MIMEMultipart()
            msg.attach(MIMEText(body, "plain", "utf-8"))
            for filename, content_type, content in attachments:
                subtype = content_type.split("/", 1)[1] if "/" in content_type else "octet-stream"
                part = MIMEApplication(content, _subtype=subtype)
                part.add_header("Content-Disposition", "attachment", filename=filename)
                msg.attach(part)
        else:
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
        extra = ""
        if attachments:
            extra = "\n[pièces jointes] " + ", ".join(f"{n} ({len(c)} o)" for n, _, c in attachments)
        logger.info("EMAIL [console] to=%s subject=%r\n%s%s", to, subject, body, extra)


def send_template(template: str, to: str, language: str = "fr", **kwargs) -> None:
    subject, body = TEMPLATES[template].get(language, TEMPLATES[template]["fr"])
    try:
        _send(to, subject, body.format(**kwargs))
    except Exception:  # l'échec d'un e-mail ne doit jamais perdre un lead
        logger.exception("Échec d'envoi e-mail (%s → %s)", template, to)


def send_direct(to: str, subject: str, body: str, attachments: list[Attachment] | None = None) -> None:
    """Envoi d'un e-mail libre (réponse de l'équipe Funti à un lead), pièces jointes possibles.
    Laisse remonter l'erreur : l'admin doit savoir si l'envoi a échoué."""
    _send(to, subject, body, attachments)


def notify_internal(subject: str, body: str) -> None:
    """Notification interne immédiate à chaque nouvelle demande (CDC : zéro lead perdu)."""
    try:
        _send(settings.NOTIFY_INTERNAL_EMAIL, f"[Funti] {subject}", body)
    except Exception:
        logger.exception("Échec de notification interne : %s", subject)
