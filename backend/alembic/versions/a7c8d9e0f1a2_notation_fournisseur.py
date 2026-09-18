"""notation interne du fournisseur par l'admin (critères + commentaire)

Revision ID: a7c8d9e0f1a2
Revises: f6b7c8d9e0f1
Create Date: 2026-09-18

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a7c8d9e0f1a2"
down_revision: str | None = "f6b7c8d9e0f1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("suppliers", sa.Column("ratings", sa.JSON(), nullable=True))
    op.add_column("suppliers", sa.Column("rating_note", sa.Text(), nullable=True))
    op.add_column("suppliers", sa.Column("rated_at", sa.DateTime(), nullable=True))
    # Backfill des lignes existantes pour éviter les valeurs NULL.
    op.execute("UPDATE suppliers SET ratings = '{}' WHERE ratings IS NULL")
    op.execute("UPDATE suppliers SET rating_note = '' WHERE rating_note IS NULL")


def downgrade() -> None:
    op.drop_column("suppliers", "rated_at")
    op.drop_column("suppliers", "rating_note")
    op.drop_column("suppliers", "ratings")
