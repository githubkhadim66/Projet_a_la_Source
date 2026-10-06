"""traductions corrigées à la main par l'admin

Revision ID: d0f1a2b3c4d5
Revises: c9e0f1a2b3c4
Create Date: 2026-10-06

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d0f1a2b3c4d5"
down_revision: str | None = "c9e0f1a2b3c4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "translations",
        sa.Column("is_manual", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("translations", "is_manual")
