"""cache des traductions automatiques (DeepL)

Revision ID: b8d9e0f1a2b3
Revises: a7c8d9e0f1a2
Create Date: 2026-09-28

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b8d9e0f1a2b3"
down_revision: str | None = "a7c8d9e0f1a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "translations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_hash", sa.String(length=64), nullable=False),
        sa.Column("target_lang", sa.String(length=5), nullable=False),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("translated_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("source_hash", "target_lang", name="uq_translation_src_lang"),
    )
    op.create_index("ix_translations_source_hash", "translations", ["source_hash"])
    op.create_index("ix_translations_target_lang", "translations", ["target_lang"])


def downgrade() -> None:
    op.drop_index("ix_translations_target_lang", table_name="translations")
    op.drop_index("ix_translations_source_hash", table_name="translations")
    op.drop_table("translations")
