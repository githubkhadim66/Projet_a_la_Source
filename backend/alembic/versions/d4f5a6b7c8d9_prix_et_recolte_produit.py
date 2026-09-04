"""prix (au kilo, en vrac) et période de récolte — produits & propositions

Champs commerciaux internes : jamais exposés au public (« Prix sur devis »).

Revision ID: d4f5a6b7c8d9
Revises: c3e4f5a6b7c8
Create Date: 2026-08-21

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d4f5a6b7c8d9"
down_revision: str | None = "c3e4f5a6b7c8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table in ("products", "product_proposals"):
        op.add_column(table, sa.Column("price_per_kg", sa.String(length=50), nullable=False, server_default=""))
        op.add_column(table, sa.Column("bulk_price", sa.String(length=50), nullable=False, server_default=""))
        op.add_column(table, sa.Column("harvest_period", sa.String(length=100), nullable=False, server_default=""))


def downgrade() -> None:
    for table in ("products", "product_proposals"):
        op.drop_column(table, "harvest_period")
        op.drop_column(table, "bulk_price")
        op.drop_column(table, "price_per_kg")
