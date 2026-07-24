"""fiche complète de proposition (image, origine, catégorie, MOQ, bienfaits) + statut Référencé

Revision ID: b2d3e4f5a6b7
Revises: a1c2d3e4f5a6
Create Date: 2026-07-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b2d3e4f5a6b7"
down_revision: str | None = "a1c2d3e4f5a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Nouveau statut de la file candidature (Postgres) ; sans effet sur SQLite
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE leadstatus ADD VALUE IF NOT EXISTS 'REFERENCE'")

    for column in ("benefits", "origin", "category", "moq", "image"):
        length = 500 if column == "image" else (100 if column in ("origin", "category") else 50)
        op_type = sa.Text() if column == "benefits" else sa.String(length=length)
        op.add_column("product_proposals", sa.Column(column, op_type, nullable=False, server_default=""))


def downgrade() -> None:
    for column in ("image", "moq", "category", "origin", "benefits"):
        op.drop_column("product_proposals", column)
