"""langue du fournisseur (espace + e-mails)

Revision ID: c9e0f1a2b3c4
Revises: b8d9e0f1a2b3
Create Date: 2026-09-29

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c9e0f1a2b3c4"
down_revision: str | None = "b8d9e0f1a2b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Fournisseurs existants : français (valeur par défaut).
    op.add_column("suppliers", sa.Column("language", sa.String(length=5), nullable=False, server_default="fr"))


def downgrade() -> None:
    op.drop_column("suppliers", "language")
