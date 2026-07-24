"""suivi du téléchargement du catalogue (statut Téléchargé + horodatage)

Revision ID: a1c2d3e4f5a6
Revises: 363bead0aa96
Create Date: 2026-07-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1c2d3e4f5a6"
down_revision: str | None = "363bead0aa96"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Nouvelle valeur d'énumération (Postgres) — sans effet sur SQLite où l'enum est un VARCHAR
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE leadstatus ADD VALUE IF NOT EXISTS 'TELECHARGE'")

    op.add_column("leads", sa.Column("catalogue_downloaded_at", sa.DateTime(), nullable=True))
    op.add_column(
        "leads",
        sa.Column("catalogue_download_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("leads", "catalogue_download_count")
    op.drop_column("leads", "catalogue_downloaded_at")
    # La valeur d'énumération 'TELECHARGE' est conservée (Postgres ne sait pas retirer une valeur d'enum).
