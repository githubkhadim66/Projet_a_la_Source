from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Translation(Base):
    """Cache des traductions automatiques (DeepL).

    Chaque texte source n'est traduit qu'une fois par langue cible, puis servi
    depuis ce cache. L'admin peut corriger `translated_text` à la main.
    """

    __tablename__ = "translations"
    __table_args__ = (UniqueConstraint("source_hash", "target_lang", name="uq_translation_src_lang"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    # sha256 du texte source (clé compacte indexable même pour de longs textes)
    source_hash: Mapped[str] = mapped_column(String(64), index=True)
    target_lang: Mapped[str] = mapped_column(String(5), index=True)  # ex. "EN"
    source_text: Mapped[str] = mapped_column(Text)
    translated_text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
