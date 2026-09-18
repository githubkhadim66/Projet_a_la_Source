"""fenêtre de disponibilité produit (retrait automatique à l'échéance)

Revision ID: f6b7c8d9e0f1
Revises: e5a6b7c8d9e0
Create Date: 2026-09-17

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f6b7c8d9e0f1"
down_revision: str | None = "e5a6b7c8d9e0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("available_until", sa.DateTime(), nullable=True))
    op.add_column("products", sa.Column("expiry_alert_sent_at", sa.DateTime(), nullable=True))
    op.add_column("product_proposals", sa.Column("available_until", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("product_proposals", "available_until")
    op.drop_column("products", "expiry_alert_sent_at")
    op.drop_column("products", "available_until")
