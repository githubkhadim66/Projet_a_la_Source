"""conditionnement (packaging) distinct du MOQ — produits & propositions

Sépare le format d'emballage (« Sac de 25 kg ») de la quantité minimum de
commande (« 500 kg »). L'ancien champ `moq` allonge aussi sa longueur.

Revision ID: e5a6b7c8d9e0
Revises: d4f5a6b7c8d9
Create Date: 2026-09-04

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5a6b7c8d9e0"
down_revision: str | None = "d4f5a6b7c8d9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table in ("products", "product_proposals"):
        op.add_column(table, sa.Column("packaging", sa.String(length=100), nullable=False, server_default=""))
        op.alter_column(table, "moq", type_=sa.String(length=100), existing_type=sa.String(length=50))


def downgrade() -> None:
    for table in ("products", "product_proposals"):
        op.alter_column(table, "moq", type_=sa.String(length=50), existing_type=sa.String(length=100))
        op.drop_column(table, "packaging")
