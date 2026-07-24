"""archivage réversible des produits (corbeille)

Revision ID: c3e4f5a6b7c8
Revises: b2d3e4f5a6b7
Create Date: 2026-07-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c3e4f5a6b7c8"
down_revision: str | None = "b2d3e4f5a6b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("archived_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "archived_at")
